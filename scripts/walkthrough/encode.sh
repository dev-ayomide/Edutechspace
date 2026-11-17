#!/usr/bin/env bash
# Turns walkthrough/raw/*.webm into shareable MP4s (phones, WhatsApp, email) and two films:
#   walkthrough/runtech-space-feedback-full.mp4      intro, public site, every role, outro
#   walkthrough/runtech-space-feedback-short.mp4     intro, public site, outro
set -euo pipefail
cd "$(dirname "$0")/../.."
RAW=walkthrough/raw; OUT=walkthrough
mkdir -p "$OUT/parts"
# every clip into the same 1440x900 frame (16:9 role clips get paper-coloured edges), 30 fps, H.264
FIT="scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=0xf3f6fc,fps=30,format=yuv420p"
for f in "$RAW"/*.webm; do
  name=$(basename "$f" .webm)
  [ "$name" = "10-safety-checks" ] && continue   # test-only part, not for sharing
  ffmpeg -loglevel error -y -ss 0.25 -i "$f" -vf "$FIT" -c:v libx264 -preset slow -crf 21 -movflags +faststart -an "$OUT/parts/$name.mp4"
  echo "made $OUT/parts/$name.mp4"
done
film() {
  local out=$1; shift
  : > "$OUT/.list"
  for n in "$@"; do echo "file 'parts/$n.mp4'" >> "$OUT/.list"; done
  ffmpeg -loglevel error -y -f concat -safe 0 -i "$OUT/.list" -c copy -movflags +faststart "$OUT/$out"
  rm "$OUT/.list"
  echo "made $OUT/$out"
}
all=$(ls "$OUT/parts" | sed 's/\.mp4$//' | sort)
film runtech-space-feedback-full.mp4 $all
film runtech-space-feedback-short.mp4 00-intro 00-public-site 99-outro
