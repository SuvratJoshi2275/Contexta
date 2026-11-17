#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export PYTHONPATH="$PWD/src"
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
