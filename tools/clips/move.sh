#!/usr/bin/env bash
# Cuts a Google Flow clip (1280x720, 8 s) of a coach showing a warm-up or cool-down move into the app's format:
#   docs/media/coach/moves/<id>.mp4 (silent H.264, faststart) + <id>.jpg (first frame, the poster).
# Usage: tools/clips/move.sh <id> <square|wide|still> [x] [start] [length]
#   still:  a held stretch, picture only: the Flow picture (or a clip's first frame) scaled to 854x480 -> <id>.jpg.
#           Source: "AI personal trainers/new clips/moves/<id>.png|jpg|mp4" (or SRC=path).
#   square: a 720x720 crop (standing moves) at x (default: the middle, 280), scaled to 480x480.
#   wide:   the whole 16:9 frame (floor moves), scaled to 854x480.
#   start/length: seconds to keep (default: from 0, the whole clip).
# Source: "AI personal trainers/new clips/moves/<id>.mp4" (or set SRC=path).
# Then check the frames (tools/clips/check.sh or a contact sheet) and add <id> to MOVES_READY in docs/js/coach.js.
set -euo pipefail
id=$1; mode=$2; x=${3:-280}; ss=${4:-0}; len=${5:-}
root="$(cd "$(dirname "$0")/../.." && pwd)"
out="$root/docs/media/coach/moves"
mkdir -p "$out"
if [ "$mode" = still ]; then
  if [ -z "${SRC:-}" ]; then for e in png jpg jpeg webp mp4; do [ -f "$root/AI personal trainers/new clips/moves/$id.$e" ] && SRC="$root/AI personal trainers/new clips/moves/$id.$e" && break; done; fi
  ffmpeg -v error -y -i "$SRC" -frames:v 1 -vf "scale=854:480:force_original_aspect_ratio=increase,crop=854:480" -q:v 3 "$out/$id.jpg"
  ls -l "$out/$id.jpg"; exit 0
fi
src=${SRC:-"$root/AI personal trainers/new clips/moves/$id.mp4"}
if [ "$mode" = square ]; then vf="crop=720:720:$x:0,scale=480:480"; else vf="scale=854:480"; fi
dur=(); [ -n "$len" ] && dur=(-t "$len")
ffmpeg -v error -y -ss "$ss" "${dur[@]}" -i "$src" -an -vf "$vf,format=yuv420p" -c:v libx264 -crf 23 -preset slow -movflags +faststart "$out/$id.mp4"
ffmpeg -v error -y -i "$out/$id.mp4" -frames:v 1 -q:v 3 "$out/$id.jpg"
ls -l "$out/$id.mp4" "$out/$id.jpg"
