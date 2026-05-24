#!/usr/bin/env bash
# starts a static dev server. livereload.js handles auto-reload.
cd "$(dirname "$0")"
PORT="${1:-8765}"
echo "→ http://localhost:$PORT"
python3 -m http.server "$PORT"
