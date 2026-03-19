#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_DIR="${ROOT_DIR}/backend"

POSTGRES_CONTAINER="mcd-test-postgres"
POSTGRES_PORT="${POSTGRES_PORT:-55432}"
POSTGRES_DB="superheroes"
POSTGRES_USER="superhero"
POSTGRES_PASSWORD="superhero"

cleanup() {
    if docker ps -a --format '{{.Names}}' | grep -Fxq "${POSTGRES_CONTAINER}"; then
        docker rm -f "${POSTGRES_CONTAINER}" >/dev/null 2>&1 || true
    fi
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 1
    fi
}

wait_for_postgres() {
    local attempt=0
    local max_attempts=30

    until docker exec "${POSTGRES_CONTAINER}" pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ "${attempt}" -ge "${max_attempts}" ]; then
            echo "Postgres did not become ready in time." >&2
            exit 1
        fi
        sleep 2
    done
}

trap cleanup EXIT

require_command docker
require_command node
require_command npm

echo "Starting disposable Postgres test dependency on port ${POSTGRES_PORT}..."
cleanup
docker run -d \
    --name "${POSTGRES_CONTAINER}" \
    -e POSTGRES_DB="${POSTGRES_DB}" \
    -e POSTGRES_USER="${POSTGRES_USER}" \
    -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
    -p "${POSTGRES_PORT}:5432" \
    postgres:16-alpine >/dev/null
wait_for_postgres

echo "Installing frontend dependencies..."
(cd "${FRONTEND_DIR}" && npm ci)

echo "Running frontend tests..."
(cd "${FRONTEND_DIR}" && npm test)

echo "Running backend tests against Postgres..."
(
    cd "${BACKEND_DIR}" && \
    SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:${POSTGRES_PORT}/${POSTGRES_DB}" \
    SPRING_DATASOURCE_USERNAME="${POSTGRES_USER}" \
    SPRING_DATASOURCE_PASSWORD="${POSTGRES_PASSWORD}" \
    SPRING_DATASOURCE_DRIVER_CLASS_NAME="org.postgresql.Driver" \
    ./gradlew test
)

echo "All tests passed."
