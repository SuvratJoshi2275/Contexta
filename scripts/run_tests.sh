#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
PYTHONPATH="$PWD/src" pytest -q tests
