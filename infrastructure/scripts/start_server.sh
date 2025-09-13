#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

APP_DIR="/var/www/k-mate"
SERVICE_NAME="kmate"                       # systemd 서비스명 (kmate.service)
HEALTH_LOCAL_URL="http://127.0.0.1/app-health"  # Nginx -> 앱 프록시 헬스 (권장)
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-90}"

log(){ echo "[start_server] $*"; }

# 0) 선행 점검: systemd 유닛 존재
if [ ! -f "/etc/systemd/system/${SERVICE_NAME}.service" ]; then
  log "ERROR: /etc/systemd/system/${SERVICE_NAME}.service 가 없습니다 (appspec의 files 섹션 확인)."
  exit 1
fi

# 1) systemd 리로드 & 서비스 enable
systemctl daemon-reload || true
systemctl enable "${SERVICE_NAME}" || true

# 2) Nginx 설치(없으면)
if ! command -v nginx >/dev/null 2>&1; then
  log "nginx not found. installing..."
  if command -v dnf >/dev/null 2>&1; then
    dnf -y install nginx
  elif command -v amazon-linux-extras >/dev/null 2>&1; then
    amazon-linux-extras enable nginx1 || true
    yum clean metadata || true
    yum -y install nginx
  elif command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get -y install nginx
  else
    log "ERROR: Unsupported OS. Install nginx manually."
    exit 1
  fi
fi

# (중복 제거) Nginx conf는 appspec.yml의 files로 이미 배치됨
# if [ -f "${APP_DIR}/infrastructure/nginx/k-mate.conf" ]; then
#   cp -f "${APP_DIR}/infrastructure/nginx/k-mate.conf" /etc/nginx/conf.d/k-mate.conf
# fi

# 3) Nginx 설정 검사 후 적용
nginx -t
if systemctl is-active --quiet nginx; then
  log "reloading nginx"
  systemctl reload nginx
else
  log "starting nginx"
  systemctl start nginx
fi
systemctl enable nginx || true

# 4) 앱 서비스 재시작
log "restarting ${SERVICE_NAME}.service"
systemctl restart "${SERVICE_NAME}"

# 5) 앱 헬스 대기 (Nginx -> 앱 프록시 경유 /app-health)
log "waiting for ${HEALTH_LOCAL_URL} to return 200 (timeout=${HEALTH_TIMEOUT_SEC}s)"
ok=false
for i in $(seq 1 "${HEALTH_TIMEOUT_SEC}"); do
  code="$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_LOCAL_URL}" || true)"
  if [ "${code}" = "200" ]; then
    ok=true
    break
  fi
  sleep 1
done

if [ "${ok}" != "true" ]; then
  log "ERROR: app did not become healthy in time. last_code=${code}"
  log "===== systemctl status ${SERVICE_NAME} ====="
  systemctl status "${SERVICE_NAME}" --no-pager || true
  log "===== journal (tail) ====="
  journalctl -u "${SERVICE_NAME}.service" -n 200 --no-pager -o cat || true
  exit 1
fi

log "app is healthy. DONE."
