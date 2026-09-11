"""Verify the archived 2026-09-12 experiment assets after cloning."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'docs/handoff/2026-09-12/assets-manifest.json').read_text(encoding='utf-8'))
failures = []
for entry in manifest['files']:
    path = root / entry['path']
    if not path.is_file():
        failures.append(entry['path'] + ': missing')
    elif hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
        failures.append(entry['path'] + ': changed since snapshot')
if failures:
    raise SystemExit('\n'.join(failures))
print(f"Verified {len(manifest['files'])} archived assets/sources.")
