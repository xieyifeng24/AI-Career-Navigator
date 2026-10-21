"""Dependency-free local server for the interactive prototype."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

ROOT = Path(__file__).resolve().parent

class PrototypeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Serve AI Career Navigator V0.1 locally')
    parser.add_argument('--port', type=int, default=4173)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), PrototypeHandler)
    print(f'Open http://127.0.0.1:{args.port}', flush=True)
    server.serve_forever()
