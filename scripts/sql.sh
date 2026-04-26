#!/bin/bash
# Run SQL against the Supabase project via Management API.
# Reads token from ~/.rakuichi-env (NOT committed to git).
#
# Usage:
#   scripts/sql.sh "SELECT count(*) FROM profiles"          # one-liner
#   scripts/sql.sh -f supabase/migrations/011_my_skills.sql # from file
set -euo pipefail

ENV_FILE="$HOME/.rakuichi-env"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Create it with SUPABASE_ACCESS_TOKEN=..." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] || [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set" >&2
  exit 1
fi

# Read the SQL
if [ "${1:-}" = "-f" ] && [ -n "${2:-}" ]; then
  SQL=$(cat "$2")
elif [ -n "${1:-}" ]; then
  SQL="$1"
else
  echo "Usage: $0 <SQL> | -f <file.sql>" >&2
  exit 1
fi

# JSON-encode the query string safely (use python — jq not installed on Win)
JSON_PAYLOAD=$(python -c "import json,sys; print(json.dumps({'query': sys.stdin.read()}))" <<< "$SQL")

curl -sS -f \
  -X POST \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query"
echo
