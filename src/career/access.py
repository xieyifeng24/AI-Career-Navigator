"""Anonymous sessions and bounded paid-inference quotas; no user passwords.

SQLite contains timestamps and keyed identifiers only, never profiles or reports.
The ledger survives process restarts on the same disk. It is NOT a provider bill cap
and is not shared between independent Replit instances or replacement deployments.
"""
import hashlib
import hmac
import math
import os
from pathlib import Path
import secrets
import sqlite3
import time
from contextlib import closing
from urllib.parse import urlsplit
from fastapi import HTTPException

COOKIE = 'career_session'
SESSION_SECONDS = 86400

def setting(name, default, ceiling):
    try: return max(1, min(int(os.getenv(name, str(default))), ceiling))
    except ValueError: return default

def is_local(host):
    try: return urlsplit('http://'+host).hostname in {'localhost','127.0.0.1','::1','testserver'}
    except ValueError: return False

def check_origin(request):
    # Browsers supply Origin for these POSTs. Do not trust arbitrary forwarded IPs.
    host = request.headers.get('host', '')
    expected = os.getenv('PUBLIC_APP_ORIGIN') or f"{'http' if is_local(host) else 'https'}://{host}"
    if request.headers.get('origin', '').rstrip('/') != expected.rstrip('/'):
        raise HTTPException(403, 'Open this app in its own browser tab and try again.')
    if request.headers.get('sec-fetch-site') not in {None, 'same-origin', 'none'}:
        raise HTTPException(403, 'Cross-site analysis requests are not allowed.')

class AccessPolicy:
    def __init__(self, directory):
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)
        configured = os.getenv('SESSION_SECRET', '').strip()
        if configured:
            self.key = hashlib.sha256(configured.encode()).digest()
        else:
            # Internal signing material, not a shared access code or human password.
            path = directory / 'session-signing.key'
            try:
                fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            except FileExistsError:
                self.key = path.read_bytes()
            else:
                self.key = secrets.token_bytes(32)
                with os.fdopen(fd, 'wb') as handle: handle.write(self.key)
        if len(self.key) < 32: raise RuntimeError('Invalid session signing configuration.')
        self.database = directory / 'inference-quota.sqlite3'
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS calls (at REAL NOT NULL, ip TEXT NOT NULL, session TEXT NOT NULL)')
            db.execute('CREATE INDEX IF NOT EXISTS calls_at ON calls(at)')
        os.chmod(self.database, 0o600)
        self.daily = setting('MAX_DAILY_ANALYSES', 20, 100)
        self.hourly = setting('MAX_HOURLY_ANALYSES', 10, 50)
        self.client_hourly = setting('MAX_CLIENT_HOURLY_ANALYSES', 3, 10)
        self.client_daily = setting('MAX_CLIENT_DAILY_ANALYSES', 6, 20)
        self.cooldown = setting('ANALYSIS_COOLDOWN_SECONDS', 60, 3600)

    def connect(self):
        return closing(sqlite3.connect(self.database, timeout=3, isolation_level=None))

    def digest(self, context, value):
        return hmac.new(self.key, (context + ':' + value).encode(), hashlib.sha256).hexdigest()

    def new_session(self):
        body = f'{int(time.time())}.{secrets.token_urlsafe(24)}'
        return body + '.' + self.digest('session', body)

    def valid_session(self, token):
        try:
            if len(token) > 200: return False
            timestamp, nonce, signature = token.split('.')
            age = time.time() - int(timestamp)
            return bool(nonce) and -60 <= age < SESSION_SECONDS and hmac.compare_digest(signature, self.digest('session', timestamp + '.' + nonce))
        except (ValueError, TypeError, AttributeError): return False

    def csrf(self, token): return self.digest('csrf', token)

    def require(self, request, mutating=False):
        token = request.cookies.get(COOKIE, '')
        if not self.valid_session(token):
            raise HTTPException(403, 'Your browser session expired. Please submit again.')
        if mutating:
            check_origin(request)
            if not hmac.compare_digest(request.headers.get('x-csrf-token', ''), self.csrf(token)):
                raise HTTPException(403, 'Refresh the page and submit again.')
        return self.digest('owner', token)

    def reserve(self, client_ip, owner, now=None):
        """Atomic reservation across both routes, charged even on upstream failure."""
        now = time.time() if now is None else now
        ip = self.digest('ip', client_ip)
        try:
            with self.connect() as db:
                db.execute('BEGIN IMMEDIATE')
                db.execute('DELETE FROM calls WHERE at <= ?', (now - SESSION_SECONDS,))
                rules = [('1=1', (), self.daily, SESSION_SECONDS, 'Today’s shared AI allowance is used up.'),
                         ('1=1', (), self.hourly, 3600, 'The shared hourly AI allowance is used up.')]
                for column, value in [('ip', ip), ('session', owner)]:
                    rules += [(f'{column}=?', (value,), self.client_hourly, 3600, 'Too many analyses from this browser or network this hour.'),
                              (f'{column}=?', (value,), self.client_daily, SESSION_SECONDS, 'The daily allowance for this browser or network is used up.'),
                              (f'{column}=?', (value,), 1, self.cooldown, 'Please wait before requesting another analysis.')]
                for condition, params, limit, window, message in rules:
                    count, earliest = db.execute(f'SELECT COUNT(*), MIN(at) FROM calls WHERE {condition} AND at > ?', (*params, now-window)).fetchone()
                    if count >= limit:
                        db.rollback()
                        retry = max(1, math.ceil(earliest + window - now))
                        raise HTTPException(429, message + ' Please try later.', headers={'Retry-After': str(retry)})
                db.execute('INSERT INTO calls VALUES (?,?,?)', (now, ip, owner))
                db.commit()
        except sqlite3.Error as exc:
            raise HTTPException(503, 'AI quota protection is temporarily unavailable. Please try later.') from exc
