#!/usr/bin/env bash
# 画面写真とフォントを public/ にコピーする（書き出しの直前に実行）
set -euo pipefail
SRC=/home/user/02/output/ozora-game/screenshots
DIR="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DIR/public/shots" "$DIR/public/fonts"
for f in 01_title s1_2_otehon s1_3_mondai1 s1_4_seikai1 s2_3_mondai1 s2_4_seikai1 \
         s3_3_mondai1 s3_4_seikai1 s2_2_otehon s1_6_clear s3_6_clear 99_furikaeri; do
  ffmpeg -loglevel error -y -i "$SRC/$f.png" -vf scale=2400:-1:flags=lanczos -q:v 2 "$DIR/public/shots/$f.jpg"
  echo "$f.png  $(date -r "$SRC/$f.png" '+%F %T')"
done
cp /root/.fonts/ZenMaruGothic-Bold.ttf /root/.fonts/BIZUDGothic-Bold.ttf /root/.fonts/BIZUDGothic-Regular.ttf "$DIR/public/fonts/"
