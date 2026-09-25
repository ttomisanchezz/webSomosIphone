#!/usr/bin/env bash
# Convierte un video de Higgsfield en la secuencia de frames WebP que usa la escena de scroll.
# Uso: scripts/extraer-frames.sh <video.mp4> <nombre> <mobile|desktop>
# Salida: public/media/<nombre>-<variante>/0001.webp ...  (1 de cada 2 frames: ~61 frames)
set -euo pipefail
video="$1"; nombre="$2"; variante="$3"
out="public/media/${nombre}-${variante}"
if [ "$variante" = "mobile" ]; then escala="720:-2"; else escala="1600:-2"; fi
rm -rf "$out"; mkdir -p "$out"
ffmpeg -v error -i "$video" -vf "select='not(mod(n\,2))',scale=${escala}:flags=lanczos" -vsync vfr \
  -c:v libwebp -quality 72 -compression_level 6 "$out/%04d.webp"
echo "$out: $(ls "$out" | wc -l) frames, $(du -sh "$out" | cut -f1)"
