#!/usr/bin/env bash
set -euo pipefail

URL="http://127.0.0.1/health"   # ✅ Nginx가 즉시 200 주는 엔드포인트로 변경
TRIES=36
SLEEP=5

for i in $(seq 1 $TRIES); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)
  echo "[validate] $i/$TRIES => $code ; retry in ${SLEEP}s"
  if [ "$code" = "200" ]; then
    echo "[validate] PASS"
    exit 0
  fi
  sleep "$SLEEP"
done

echo "[validate] FAIL"
exit 1
