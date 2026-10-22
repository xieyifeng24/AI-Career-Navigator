"""The strict asset allowlist must serve presentation assets in the real app."""
import unittest
from fastapi.testclient import TestClient
from src.career.api import app


class CinematicAssetTests(unittest.TestCase):
    def test_entry_serves_same_origin_intro_assets(self):
        with TestClient(app) as client:
            page = client.get('/')
            self.assertEqual(page.status_code, 200)
            self.assertIn('./intro.css', page.text)
            for filename, content_type in [('intro.js', 'javascript'), ('intro.css', 'text/css')]:
                response = client.get('/' + filename)
                self.assertEqual(response.status_code, 200)
                self.assertIn(content_type, response.headers['content-type'])
                self.assertIn("script-src 'self'", response.headers['content-security-policy'])
            self.assertEqual(client.get('/unknown-intro-secret.js').status_code, 404)
