#!/bin/sh
set -eu
# Replit's Nix Python is externally managed. Keep dependencies inside the project.
if [ ! -x .venv-replit/bin/python ]; then
  uv venv .venv-replit
fi
uv pip install --python .venv-replit/bin/python -r requirements.txt
exec .venv-replit/bin/python -m uvicorn src.career.api:app --host 0.0.0.0 --port 8000 --workers 1
