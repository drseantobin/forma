#!/usr/bin/env bash
# Build the assembled manuscripts from the source files.
# Run from inside the jesus-with-me/ folder:  bash build.sh
set -euo pipefail
cd "$(dirname "$0")"

# KDP print interior: front matter + chapters (in order) + back matter,
# with \newpage page breaks already baked into each source file.
{
  cat front-matter.md
  for f in chapters/*.md; do
    printf '\n\n'
    cat "$f"
  done
  cat back-matter.md
} > jesus-with-me-KDP.md

# Plain reading copy (same content; handy for sharing / proofreading).
cp jesus-with-me-KDP.md jesus-with-me-FULL.md

echo "Built jesus-with-me-KDP.md and jesus-with-me-FULL.md"
wc -w chapters/*.md | tail -1
