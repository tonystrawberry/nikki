#!/usr/bin/env bash
#
# Generate downloadable résumé PDFs from the /[locale]/resume pages.
#
# Renders each locale with headless Google Chrome's --print-to-pdf, which
# applies the @media print stylesheet in globals.css. Output goes to
# public/resume/, which is served at /resume/*.pdf and linked from the page.
#
# Usage:  npm run resume:pdf
#         BASE_URL=http://localhost:3000 npm run resume:pdf   # reuse a server
#
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_URL="${BASE_URL:-http://localhost:3000}"
OUT_DIR="public/resume"
LOCALES=("en" "fr" "ja")
PROFILE_DIR="$(mktemp -d)"

if [ ! -x "$CHROME" ]; then
  echo "❌ Google Chrome not found at: $CHROME" >&2
  echo "   Install Chrome, or set CHROME=/path/to/chrome and edit this script." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Start a dev server only if BASE_URL isn't already serving the page.
STARTED_SERVER=0
SERVER_PID=""
if ! curl -sSf "$BASE_URL/en/resume" >/dev/null 2>&1; then
  echo "▶ Starting dev server…"
  npm run dev >/tmp/resume-pdf-server.log 2>&1 &
  SERVER_PID=$!
  STARTED_SERVER=1
  for _ in $(seq 1 90); do
    if curl -sSf "$BASE_URL/en/resume" >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi

cleanup() {
  if [ "$STARTED_SERVER" = "1" ] && [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  rm -rf "$PROFILE_DIR"
}
trap cleanup EXIT

for L in "${LOCALES[@]}"; do
  URL="$BASE_URL/$L/resume"
  echo "🖨  Rendering $L → $OUT_DIR/tony-duong-resume-$L.pdf"
  # Warm the route so the dev server has compiled it before we print.
  curl -sSf "$URL" >/dev/null 2>&1 || true
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --no-pdf-header-footer \
    --user-data-dir="$PROFILE_DIR" \
    --virtual-time-budget=20000 \
    --print-to-pdf="$OUT_DIR/tony-duong-resume-$L.pdf" \
    "$URL" 2>/dev/null
done

echo "✅ Done → $OUT_DIR"
