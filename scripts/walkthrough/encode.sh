#!/usr/bin/env bash
# Turns walkthrough/raw/*.webm into shareable MP4s (plays on phones, WhatsApp, LinkedIn) plus one full film.
set -euo pipefail
cd "$(dirname "$0")/../.."
RAW=walkthrough/raw; OUT=walkthrough
mkdir -p "$OUT/parts"
: > "$OUT/.list"
for f in "$RAW"/*.webm; do
  name=$(basename "$f" .webm)
  [ "$name" = "10-safety-checks" ] && continue   # test-only part, not for sharing
  ffmpeg -loglevel error -y -i "$f" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -r 30 -movflags +faststart -an "$OUT/parts/$name.mp4"
  echo "file 'parts/$name.mp4'" >> "$OUT/.list"
  echo "made $OUT/parts/$name.mp4"
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$OUT/.list" -c copy -movflags +faststart "$OUT/runtech-space-walkthrough.mp4"
rm "$OUT/.list"
echo "made $OUT/runtech-space-walkthrough.mp4"
