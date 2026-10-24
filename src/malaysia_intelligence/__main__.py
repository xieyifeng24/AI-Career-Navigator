import argparse
import json
from pathlib import Path
from .engine import Intelligence

p = argparse.ArgumentParser(description='Local evidence analysis; no personal fit or outlook scoring')
p.add_argument('occupation_id')
p.add_argument('--profile', type=Path)
p.add_argument('--assumptions', type=Path)
a = p.parse_args()
def read(path):
    return json.loads(path.read_text(encoding='utf-8')) if path else {}
print(json.dumps(Intelligence().assess(a.occupation_id, read(a.profile), read(a.assumptions)), ensure_ascii=False, indent=2))
