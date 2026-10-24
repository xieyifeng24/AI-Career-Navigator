import unittest
from pathlib import Path
from unittest.mock import patch
from tempfile import TemporaryDirectory
from fastapi.testclient import TestClient
from src.career.api import app

class MalaysiaRoutes(unittest.TestCase):
 def test_public_bundle_and_adapter_are_served_without_arbitrary_repository_access(self):
  with TestClient(app) as client:
   response=client.get('/data/malaysia_intelligence/current.json')
   self.assertEqual(response.status_code,200)
   self.assertEqual(len(response.json()['tables']['Career Catalog 24']),24)
   self.assertEqual(client.get('/combined/malaysia-intelligence.js').status_code,200)
   self.assertEqual(client.get('/data/malaysia_intelligence/research-notes.json').status_code,404)
   self.assertEqual(client.get('/combined/secrets.json').status_code,404)
 def test_missing_bundle_returns_explicit_unavailable(self):
  with TemporaryDirectory() as directory,TestClient(app) as client:
   with patch('src.career.api.ROOT',Path(directory)):
    response=client.get('/data/malaysia_intelligence/current.json')
   self.assertEqual(response.status_code,503)
   self.assertEqual(response.json(),{'status':'unavailable'})

if __name__=='__main__':unittest.main()
