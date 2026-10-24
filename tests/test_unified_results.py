"""The integrated report's browser assets remain public without exposing server configuration."""
import unittest
from fastapi.testclient import TestClient
from src.career.api import app

class UnifiedResultAssets(unittest.TestCase):
    def test_complete_shared_asset_chain(self):
        with TestClient(app) as client:
            for path in ['/combined/v2-report.js','/combined/current-analysis.js','/combined/results.js','/combined/ui.js','/combined/copy.js','/combined/page-map.js','/combined/report-model.js','/combined/pages/shared.js','/combined/pages/profile.js','/combined/pages/capability.js','/combined/pages/galaxy.js','/combined/pages/what-if.js','/combined/pages/impact.js','/star-map.js','/career-explorer.js','/explorer-catalog.json','/data/knowledge/current.json']:
                response=client.get(path)
                self.assertEqual(response.status_code,200,path)
                self.assertIn("script-src 'self'",response.headers['content-security-policy'])
    def test_private_files_are_not_exposed(self):
        with TestClient(app) as client:
            for path in ['/combined/.env','/combined/source-manifest.json','/combined/pages/.env','/combined/pages/unknown.js','/.env']:
                self.assertEqual(client.get(path).status_code,404,path)
