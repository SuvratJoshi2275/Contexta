#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-contexta.txt
python -m pip install -e . 2>/dev/null || export PYTHONPATH="$PWD/src"
echo "Set CONTEXTA_DATA_ROOT to your Mac dataset directory before launching Jupyter."
