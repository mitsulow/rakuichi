#!/bin/bash
# Generate an image with OpenAI gpt-image-1 and save it to public/.
#
# Usage:
#   scripts/gen-image.sh <output-relative-path> "<prompt>" [size] [quality]
#
# Examples:
#   scripts/gen-image.sh public/icons/leaf.png "A young leaf sprout in soft watercolor"
#   scripts/gen-image.sh public/icons/torii.png "Vermilion torii gate, minimalist line art" 1024x1024 medium
#
# Pricing (approx):
#   low    $0.04/image    1024x1024
#   medium $0.07/image
#   high   $0.19/image
set -euo pipefail

ENV_FILE="$HOME/.rakuichi-env"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found" >&2; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"

[ -n "${OPENAI_API_KEY:-}" ] || { echo "ERROR: OPENAI_API_KEY missing" >&2; exit 1; }

OUTPUT="${1:?usage: scripts/gen-image.sh <output-path> <prompt> [size] [quality]}"
PROMPT="${2:?prompt required}"
SIZE="${3:-1024x1024}"
QUALITY="${4:-low}"

mkdir -p "$(dirname "$OUTPUT")"

PAYLOAD=$(python -c "
import json, sys
print(json.dumps({
    'model': 'gpt-image-1',
    'prompt': sys.argv[1],
    'n': 1,
    'size': sys.argv[2],
    'quality': sys.argv[3],
    'background': 'transparent',
    'output_format': 'png',
}))
" "$PROMPT" "$SIZE" "$QUALITY")

echo "→ Generating: $OUTPUT  (size=$SIZE quality=$QUALITY)"

RESP=$(curl -sS -X POST "https://api.openai.com/v1/images/generations" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Decode base64 image to file (gpt-image-1 returns b64_json by default)
B64=$(python -c "
import json, sys
d = json.loads(sys.stdin.read())
if 'error' in d:
    print('ERROR:', d['error'].get('message', d['error']), file=sys.stderr)
    sys.exit(1)
print(d['data'][0]['b64_json'])
" <<< "$RESP")

python -c "
import base64, sys
with open(sys.argv[1], 'wb') as f:
    f.write(base64.b64decode(sys.stdin.read()))
" "$OUTPUT" <<< "$B64"

echo "✓ Saved: $OUTPUT ($(wc -c < "$OUTPUT") bytes)"
