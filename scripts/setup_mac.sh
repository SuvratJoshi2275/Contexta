#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-ml.txt
(cd frontend && npm install)
echo "Set SENSEFORGE_DATA_ROOT to your dataset root, then run scripts/validate_datasets.sh"
