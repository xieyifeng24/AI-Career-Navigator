import concurrent.futures
import os
import tempfile
import unittest
from unittest.mock import patch
from fastapi import HTTPException
from src.career.access import AccessPolicy

class QuotaProtection(unittest.TestCase):
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory()
        self.env=patch.dict(os.environ,{'SESSION_SECRET':'','MAX_DAILY_ANALYSES':'20','MAX_HOURLY_ANALYSES':'10','MAX_CLIENT_HOURLY_ANALYSES':'3','MAX_CLIENT_DAILY_ANALYSES':'6','ANALYSIS_COOLDOWN_SECONDS':'60'})
        self.env.start();self.policy=AccessPolicy(self.directory.name)
    def tearDown(self): self.env.stop();self.directory.cleanup()

    def test_cookie_tampering_expiry_and_persistent_signing(self):
        token=self.policy.new_session()
        self.assertTrue(self.policy.valid_session(token))
        self.assertFalse(self.policy.valid_session(token+'x'))
        self.assertTrue(AccessPolicy(self.directory.name).valid_session(token))
        with patch('src.career.access.time.time',return_value=0): self.assertFalse(self.policy.valid_session(token))

    def test_ip_limit_survives_new_sessions_and_process_restart(self):
        for index in range(3): self.policy.reserve('192.0.2.1',f'owner-{index}',now=1000+61*index)
        restarted=AccessPolicy(self.directory.name)
        with self.assertRaises(HTTPException) as error: restarted.reserve('192.0.2.1','another-browser',now=1200)
        self.assertEqual(error.exception.status_code,429)
        self.assertGreater(int(error.exception.headers['Retry-After']),0)
        restarted.reserve('192.0.2.1','another-browser',now=5000)

    def test_session_limit_survives_changing_ip_and_failed_requests_do_not_reset_it(self):
        self.policy.reserve('192.0.2.1','owner',now=1000)
        with self.assertRaises(HTTPException): self.policy.reserve('192.0.2.2','owner',now=1020)
        self.policy.reserve('192.0.2.2','owner',now=1061)
        self.policy.reserve('192.0.2.3','owner',now=1122)
        with self.assertRaises(HTTPException): self.policy.reserve('192.0.2.4','owner',now=1183)

    def test_daily_global_ceiling_is_atomic_and_survives_restart(self):
        self.policy.daily=2
        def attempt(index):
            try: self.policy.reserve(f'192.0.2.{index}',f'owner-{index}',now=1000);return True
            except HTTPException as error:
                self.assertEqual(error.status_code,429);return False
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            self.assertEqual(sum(pool.map(attempt,range(12))),2)
        restarted=AccessPolicy(self.directory.name);restarted.daily=2
        with self.assertRaises(HTTPException): restarted.reserve('new-ip','new-owner',now=5000)
        with restarted.connect() as db:
            rows=db.execute('SELECT * FROM calls').fetchall()
            self.assertEqual(len(rows),2)
            self.assertTrue(all(len(row[1])==64 for row in rows))
