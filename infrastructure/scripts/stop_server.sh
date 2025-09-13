#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

SERVICE_NAME="kmate"         # kmate.service
APP_PORT="${APP_PORT:-3000}" # 앱 리슨 포트(필요시 환경변수로 변경 가능)
WAIT_SEC="${WAIT_SEC:-30}"   # 정지 대기 시간(초)

log(){ echo "[stop_server] $*"; }

# 0) 서비스 유닛 존재 여부 (없어도 실패하지 않음)
if [ ! -f "/etc/systemd/system/${SERVICE_NAME}.service" ]; then
  log "service unit not found: /etc/systemd/system/${SERVICE_NAME}.service (skip stop)"
else
  # 1) 서비스가 실행 중이면 정지
  if systemctl is-active --quiet "${SERVICE_NAME}"; then
    log "stopping ${SERVICE_NAME}.service ..."
    systemctl stop "${SERVICE_NAME}" || true
  else
    log "${SERVICE_NAME}.service is not active (skip stop)"
  fi

  # 2) 비활성 상태 대기
  for i in $(seq 1 "${WAIT_SEC}"); do
    if systemctl is-active --quiet "${SERVICE_NAME}"; then
      sleep 1
    else
      break
    fi
  done
  if systemctl is-active --quiet "${SERVICE_NAME}"; then
    log "WARNING: ${SERVICE_NAME}.service is still active after ${WAIT_SEC}s"
  else
    log "${SERVICE_NAME}.service is inactive"
  fi
fi

# 3) 포트 리슨 잔존 프로세스 정리 (있다면)
if ss -ltnp 2>/dev/null | grep -q ":${APP_PORT} "; then
  log "port ${APP_PORT} still in LISTEN. attempting graceful TERM"
  # PID 추출 → TERM → 대기 → 필요 시 KILL
  PIDS=$(ss -ltnp 2>/dev/null | awk -v p=":${APP_PORT} " '$0~p{print $NF}' | sed -E 's/.*pid=([0-9]+).*/\1/' | sort -u)
  if [ -n "${PIDS}" ]; then
    log "pids on :${APP_PORT} → ${PIDS}"
    for pid in ${PIDS}; do
      kill -TERM "${pid}" 2>/dev/null || true
    done
    # TERM 후 짧게 대기
    for i in $(seq 1 5); do
      if ss -ltnp 2>/dev/null | grep -q ":${APP_PORT} "; then
        sleep 1
      else
        break
      fi
    done
    # 여전히 리슨 중이면 KILL
    if ss -ltnp 2>/dev/null | grep -q ":${APP_PORT} "; then
      log "force killing remaining pids on :${APP_PORT}"
      for pid in ${PIDS}; do
        kill -KILL "${pid}" 2>/dev/null || true
      done
    fi
  fi
else
  log "no process is listening on :${APP_PORT}"
fi

log "done."
