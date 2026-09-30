#!/usr/bin/env bash
# `pnpm db:up` (node_modules/metri/architecture/infrastructure/runtime.md, "Banco de desenvolvimento"):
# idempotent, the only step before `pnpm dev`. Creates each missing `.env` from its `.env.example`,
# checks the Postgres of the DATABASE_URL in apps/app-api/.env with `pg_isready` and fails in seconds
# when it does not answer, creates the project's database when it is missing and applies the @metri/db
# migrations to it. The Postgres is a project delegation: the one already running on the machine, or
# the project's container (`pnpm db:docker:up`). The client tools come from the host, or from the
# official image through Docker when the host has none.

set -euo pipefail
cd "$(dirname "$0")/.."

PG_IMAGE=postgres:17-alpine
ENV_FILES=(apps/app-api/.env packages/db/.env)

for env_file in "${ENV_FILES[@]}"; do
	if [ ! -f "$env_file" ]; then
		cp "$env_file.example" "$env_file"
		echo "criado: $env_file (de $env_file.example)"
	fi
done

url_of() {
	sed -n 's/^DATABASE_URL=//p' "$1" | tail -n 1 | tr -d '"'
}

database_url="$(url_of apps/app-api/.env)"
if [ -z "$database_url" ]; then
	echo "erro: apps/app-api/.env não tem DATABASE_URL (modelo em apps/app-api/.env.example)" >&2
	exit 1
fi
if [ "$(url_of packages/db/.env)" != "$database_url" ]; then
	echo "aviso: o DATABASE_URL de packages/db/.env difere do de apps/app-api/.env; o db:up usa o do app-api" >&2
fi

without_query="${database_url%%\?*}"
database="${without_query##*/}"
server_url="${without_query%/*}/postgres"
address="$(sed -E 's#^[a-z]+://([^@]*@)?([^/?]+).*#\2#' <<<"$database_url")"

pg() {
	if command -v "$1" >/dev/null 2>&1; then
		"$@"
	elif command -v docker >/dev/null 2>&1; then
		docker run --rm --network host "$PG_IMAGE" "$@"
	else
		echo "erro: sem $1 e sem Docker; instale o cliente do Postgres (pg_isready, psql) ou o Docker" >&2
		exit 1
	fi
}

if ! pg pg_isready -q -t 3 -d "$server_url"; then
	echo "erro: o Postgres do DATABASE_URL (apps/app-api/.env) não responde em $address." >&2
	echo "Suba o Postgres que o projeto usa, ou o container dele com 'pnpm db:docker:up', e rode 'pnpm db:up' de novo." >&2
	exit 1
fi

if [ "$(pg psql "$server_url" -tAc "SELECT 1 FROM pg_database WHERE datname = '$database'")" != "1" ]; then
	pg psql "$server_url" -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$database\""
	echo "criado: banco $database em $address"
fi

DATABASE_URL="$database_url" PRISMA_HIDE_UPDATE_MESSAGE=1 pnpm --silent --filter @metri/db migrate:deploy
