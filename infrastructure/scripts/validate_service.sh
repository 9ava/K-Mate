#!/usr/bin/env bash
set -euo pipefail

# ── 설정(환경변수로 덮어쓰기 가능) ─────────────────────────────────────────────
# Nginx → 앱(3000) 프록시 경유 헬스 체크 (앱이 살아있어야 200)
URL="${HEALTH_URL:-http://127.0.0.1/app-health}"
TRIES="${TRIES:-36}"     # 총 대기 시간 = TRIES * SLEEP (기본 36*5=180초)
SLEEP="${SLEEP:-5}"
SERVICE_NAME="${SERVICE_NAME:-kmate}"  # systemd 서비스명
# (옵션) 외부 도메인 헬스 추가 확인: ex) export DOMAIN=v0.k-mate.org
DOMAIN="${DOMAIN:-}"

log(){ echo "[validate] $*"; }

log "checking URL=${URL} (tries=${TRIES}, sleep=${SLEEP}s)"

pass=false
for i in $(seq 1 "${TRIES}"); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "${URL}" || true)
  log "${i}/${TRIES} => ${code} ; retry in ${SLEEP}s"
  if [ "${code}" = "200" ]; then
    pass=true
    break
  fi
  sleep "${SLEEP}"
done

# (옵션) 외부 도메인도 확인하고 싶으면 DOMAIN 환경변수 설정
if [ "${pass}" = "true" ] && [ -n "${DOMAIN}" ]; then
  ext_url="https://${DOMAIN}/app-health"
  log "checking external ${ext_url}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "${ext_url}" || true)
  log "external => ${code}"
  # 외부 검증은 참고용이므로 실패해도 전체 실패로 간주하지 않음
fi

if [ "${pass}" = "true" ]; then
  log "PASS"
  exit 0
fi

# 실패 시 진단 정보 제공 → CodeDeploy가 롤백 판단하기 쉽도록
log "FAIL: app-health did not return 200 within timeout."
log "===== systemctl status ${SERVICE_NAME}.service ====="
systemctl status "${SERVICE_NAME}.service" --no-pager || true

log "===== recent journal for ${SERVICE_NAME}.service ====="
journalctl -u "${SERVICE_NAME}.service" -n 200 --no-pager -o cat || true

exit 1
