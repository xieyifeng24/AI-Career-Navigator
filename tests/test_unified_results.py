"""The integrated report's browser assets remain public without exposing server configuration."""
import unittest
from fastapi.testclient import TestClient
from src.career.api import app

class UnifiedResultAssets(unittest.TestCase):
    def test_complete_shared_asset_chain(self):
        with TestClient(app) as client:
            for path in ['/combined/results.js','/combined/ui.js','/combined/copy.js','/star-map.js','/career-explorer.js','/explorer-catalog.json','/data/knowledge/current.json']:
                response=client.get(path)
                self.assertEqual(response.status_code,200,path)
                self.assertIn("script-src 'self'",response.headers['content-security-policy'])
    def test_private_files_are_not_exposed(self):
        with TestClient(app) as client:
            for path in ['/combined/.env','/combined/source-manifest.json','/.env']:
                self.assertEqual(client.get(path).status_code,404,path)
