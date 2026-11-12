#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
echo 'Open http://127.0.0.1:8765 in your browser. Keep this terminal open.'
exec python3 app.py
