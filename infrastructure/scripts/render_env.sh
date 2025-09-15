#!/bin/bash
set -euo pipefail

# ===== 기본 설정 =====
REGION="${REGION:-ap-northeast-2}"
PREFIX="${PREFIX:-/kmate/stage}"
ENV_PATH="/srv/k-mate/shared/k-mate.env"

# 번들 시크릿(Secrets Manager) 이름/ARN: 둘 중 하나 지정 가능
# 기본값으로 'team01' 사용 (질문에서 주신 시크릿 이름)
BUNDLE_SECRET_ID="${BUNDLE_SECRET_ID:-team01}"

# (선택) 파이프라인/아티팩트에서 환경 주입 파일을 제공하면 읽어 반영
if [ -f /srv/k-mate/shared/deploy.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /srv/k-mate/shared/deploy.env
  set +a
  REGION="${REGION:-ap-northeast-2}"
  PREFIX="${PREFIX:-/kmate/${ENV:-stage}}"
  BUNDLE_SECRET_ID="${BUNDLE_SECRET_ID:-team01}"
fi

# ===== 반드시 필요한 키(없으면 배포 실패) =====
REQ_KEYS=(
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "GOOGLE_CALLBACK_URL"
  "JWT_SECRET"
)

# ===== 선택 키(있으면 기록, 없어도 계속 진행) =====
OPT_KEYS=(
  "BASE_URL"
  "FRONTEND_URL"
  "PORT"
  "ENABLE_DB"
  "DB_HOST" "DB_PORT" "DB_USER" "DB_PASSWORD" "DB_NAME"
  "GOOGLE_MAPS_API_KEY"
  "JWT_EXPIRES_IN"
)

# ===== 도구 확인: jq 필요(번들 JSON 파싱용) =====
ensure_jq () {
  if command -v jq >/dev/null 2>&1; then return 0; fi
  echo "[render_env] installing jq..."
  if command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y jq
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y jq
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y jq
  else
    echo "[render_env][WARN] package manager not found; jq is required for bundle parsing." >&2
  fi
}

# ===== 조회 함수(SSM / Secrets / 번들) =====
get_from_ssm () {
  local name="$1"
  aws ssm get-parameter \
    --with-decryption \
    --name "${PREFIX}/${name}" \
    --query 'Parameter.Value' \
    --output text \
    --region "${REGION}" 2>/dev/null || true
}

# 개별 키를 시크릿 1개로 두었을 때: secret-id = ${PREFIX}/${KEY}
get_from_secrets_single () {
  local name="$1"
  aws secretsmanager get-secret-value \
    --secret-id "${PREFIX}/${name}" \
    --query 'SecretString' \
    --output text \
    --region "${REGION}" 2>/dev/null || true
}

# 번들(JSON) 시크릿에서 여러 키를 뽑아오는 방식
_BUNDLE_JSON=""
load_bundle_once () {
  # SecretString이 JSON이라고 가정. (JSON이 아니면 jq에서 실패 → 무시)
  _BUNDLE_JSON="$(aws secretsmanager get-secret-value \
      --secret-id "${BUNDLE_SECRET_ID}" \
      --query 'SecretString' \
      --output text \
      --region "${REGION}" 2>/dev/null || true)"
}
get_from_bundle () {
  local key="$1"
  if [ -z "${BUNDLE_SECRET_ID}" ]; then return 0; fi
  if [ -z "${_BUNDLE_JSON}" ] || [ "${_BUNDLE_JSON}" = "None" ]; then
    load_bundle_once
  fi
  if [ -z "${_BUNDLE_JSON}" ] || [ "${_BUNDLE_JSON}" = "None" ]; then
    echo -n ""
    return 0
  fi
  if ! command -v jq >/dev/null 2>&1; then
    ensure_jq
  fi
  if command -v jq >/dev/null 2>&1; then
    # 키가 최상위 필드라고 가정: {"JWT_SECRET":"...","GOOGLE_CLIENT_ID":"..."}
    printf '%s' "${_BUNDLE_JSON}" | jq -re --arg k "${key}" '.[$k]' 2>/dev/null || true
  else
    echo -n ""
  fi
}

# SSM → 개별 Secret → 번들 Secret 순으로 조회
get_param () {
  local name="$1" v=""
  v="$(get_from_ssm "${name}")"
  if [ -z "${v}" ] || [ "${v}" = "None" ]; then
    v="$(get_from_secrets_single "${name}")"
  fi
  if [ -z "${v}" ] || [ "${v}" = "None" ]; then
    v="$(get_from_bundle "${name}")"
  fi
  echo -n "${v}"
}

# 값에 줄바꿈이 있으면 .env가 깨지므로 \n 로 이스케이프
escape_multiline () {
  sed ':a;N;$!ba;s/\\/\\\\/g; s/\n/\\n/g'
}
write_kv () {
  local k="$1" v="$2"
  printf '%s=%s\n' "$k" "$(printf '%s' "$v" | escape_multiline)" >> "${ENV_PATH}"
}

# ===== 실행 =====
echo "[render_env] region=${REGION}, prefix=${PREFIX}, bundle=${BUNDLE_SECRET_ID}"
install -o ec2-user -g ec2-user -m 600 -D /dev/null "${ENV_PATH}"

# 필수 키
for key in "${REQ_KEYS[@]}"; do
  val="$(get_param "${key}")"
  if [[ -z "${val}" || "${val}" == "None" ]]; then
    echo "[render_env][ERROR] missing required parameter: ${key} (SSM/Secrets/bundle 모두 실패)" >&2
    exit 1
  fi
  write_kv "${key}" "${val}"
done

# 선택 키
for key in "${OPT_KEYS[@]}"; do
  val="$(get_param "${key}")"
  if [[ -n "${val}" && "${val}" != "None" ]]; then
    write_kv "${key}" "${val}"
  fi
done

chown ec2-user:ec2-user "${ENV_PATH}"
echo "[render_env] wrote $(wc -l < "${ENV_PATH}") lines to ${ENV_PATH}"
