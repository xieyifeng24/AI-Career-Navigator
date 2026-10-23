"""Compare reviewed local public assets with a deployed site's public assets.

This is a provenance check, not proof of the deployed Git commit. It makes no
inference requests and never reads local or remote credentials.
"""

import argparse
import hashlib
from pathlib import Path
from urllib.parse import urlsplit

import httpx


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ASSETS = {
    "combined/results.js": ROOT / "prototype/combined/results.js",
    "combined/app.js": ROOT / "prototype/combined/app.js",
    "explorer-engine.js": ROOT / "prototype/explorer-engine.js",
    "intro.js": ROOT / "prototype/intro.js",
    "data/knowledge/current.json": ROOT / "data/knowledge/current.json",
}
MAX_BYTES = 4_000_000


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="HTTPS origin of the reviewed deployment")
    args = parser.parse_args()
    parsed = urlsplit(args.url)
    if parsed.scheme != "https" or not parsed.netloc or parsed.path not in ("", "/") or parsed.username or parsed.password or parsed.query or parsed.fragment:
        parser.error("--url must be a plain HTTPS site origin without credentials, query, or fragment")
    origin = args.url.rstrip("/")
    mismatches = 0
    with httpx.Client(timeout=20, follow_redirects=False) as client:
        for route, path in PUBLIC_ASSETS.items():
            expected = digest(path.read_bytes())
            try:
                with client.stream("GET", f"{origin}/{route}") as response:
                    response.raise_for_status()
                    body = bytearray()
                    for chunk in response.iter_bytes():
                        body.extend(chunk)
                        if len(body) > MAX_BYTES:
                            raise ValueError("asset exceeds comparison limit")
                actual = digest(body)
                if actual == expected:
                    print(f"MATCH {route} sha256={expected}")
                else:
                    mismatches += 1
                    print(f"DIFFERENT {route} local={expected} deployed={actual}")
            except (httpx.HTTPError, ValueError) as exc:
                mismatches += 1
                print(f"UNVERIFIED {route}: {type(exc).__name__}")
    print(f"Compared {len(PUBLIC_ASSETS)} public files; {mismatches} mismatch or unverified.")
    return 1 if mismatches else 0


if __name__ == "__main__":
    raise SystemExit(main())
