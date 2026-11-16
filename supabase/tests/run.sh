#!/usr/bin/env bash
# Runs the migrations and RLS tests against a throwaway local Postgres (no Docker, no Supabase CLI needed).
set -euo pipefail
if locale -a 2>/dev/null | grep -qi '^en_US.utf-\?8$'; then LOC=en_US.UTF-8; else LOC=C.UTF-8; fi
export LC_ALL=$LOC LANG=$LOC
cd "$(dirname "$0")/.."

PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb || echo /opt/homebrew/opt/postgresql@16/bin/initdb)")}"
DIR="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
cleanup() { "$PG_BIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT

"$PG_BIN/initdb" -D "$DIR/data" -U postgres --auth=trust --locale=C --encoding=UTF8 >/dev/null
"$PG_BIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -w -l "$DIR/log" start >/dev/null || { cat "$DIR/log"; exit 1; }
PSQL=("$PG_BIN/psql" -h "$DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q -X)

BASE=("$PG_BIN/psql" -h "$DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q -X)

# Every test file gets its own fresh database, so tests never depend on each other's data.
n=0
for t in tests/*.test.sql; do
  n=$((n + 1)); db="app$n"
  "${BASE[@]}" -c "create database $db" >/dev/null
  PSQL=("${BASE[@]}" -d "$db")
  "${PSQL[@]}" -f tests/stub.sql >/dev/null
  for f in migrations/*.sql; do "${PSQL[@]}" -f "$f" >/dev/null; done
  # Query output is discarded; assertion failures go to stderr and fail the run.
  "${PSQL[@]}" -f "$t" >/dev/null
  echo "pass: $t"
done
echo "All database tests passed."
