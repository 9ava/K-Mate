#!/bin/bash
set -euo pipefail

# ===== 설정(필요 시 조정) =====
REGION="${REGION:-ap-northeast-2}"     # 기본 리전
PREFIX="${PREFIX:-/kmate/stage}"       # 파라미터 경로 프리픽스
ENV_PATH="/srv/k-mate/shared/k-mate.env"

# 반드시 필요한 키(없으면 배포 실패 처리)
REQ_KEYS=(
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "GOOGLE_CALLBACK_URL"
)

# 선택 키(있으면 기록, 없어도 계속 진행)
OPT_KEYS=(
  "BASE_URL"
  "PORT"
  "ENABLE_DB"
  "DB_HOST" "DB_PORT" "DB_USER" "DB_PASSWORD" "DB_NAME"
  "JWT_SECRET"
)

# ===== 함수 =====
get_param () {
  local name="$1"
  aws ssm get-parameter \
    --with-decryption \
    --name "${PREFIX}/${name}" \
    --query 'Parameter.Value' \
    --output text \
    --region "${REGION}" 2>/dev/null || true
}

# ===== 실행 =====
echo "[render_env] region=${REGION}, prefix=${PREFIX}"
install -o ec2-user -g ec2-user -m 600 -D /dev/null "${ENV_PATH}"

# 필수 키 확인 및 기록
for key in "${REQ_KEYS[@]}"; do
  val="$(get_param "${key}")"
  if [[ -z "${val}" || "${val}" == "None" ]]; then
    echo "[render_env][ERROR] missing required SSM parameter: ${PREFIX}/${key}" >&2
    exit 1
  fi
  printf '%s=%s\n' "${key}" "${val}" >> "${ENV_PATH}"
done

# 선택 키 기록(있을 때만)
for key in "${OPT_KEYS[@]}"; do
  val="$(get_param "${key}")"
  if [[ -n "${val}" && "${val}" != "None" ]]; then
    printf '%s=%s\n' "${key}" "${val}" >> "${ENV_PATH}"
  fi
done

chown ec2-user:ec2-user "${ENV_PATH}"

echo "[render_env] wrote $(wc -l < "${ENV_PATH}") lines to ${ENV_PATH}"
