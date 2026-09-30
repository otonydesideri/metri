#!/usr/bin/env bash
# `pnpm db:up` (node_modules/metri/architecture/infrastructure/runtime.md, "Banco de desenvolvimento"):
# idempotent, the only step before `pnpm dev`. Creates the root `.env` from `.env.example` when missing,
# checks the Postgres of its DATABASE_URL with `pg_isready` and fails in seconds
# when it does not answer, creates the project's database when it is missing and applies the @metri/db
# migrations to it. The Postgres is a project delegation: the one already running on the machine, or
# the project's container (`pnpm db:docker:up`). The client tools come from the host, or from the
# official image through Docker when the host has none.

set -euo pipefail
cd "$(dirname "$0")/.."

PG_IMAGE=postgres:17-alpine

if [ ! -f .env ]; then
	cp .env.example .env
	echo "criado: .env (de .env.example)"
fi

# the value as Node reads it: without a trailing CR and without the quotes around it
database_url="$(sed -n 's/^DATABASE_URL=//p' .env | tail -n 1 | tr -d '\r')"
database_url="${database_url#[\"\']}"
database_url="${database_url%[\"\']}"
if [ -z "$database_url" ]; then
	echo "erro: o .env não tem DATABASE_URL (modelo em .env.example)" >&2
	exit 1
fi

without_query="${database_url%%\?*}"
database="${without_query##*/}"
server_url="${without_query%/*}/postgres"
address="$(sed -E 's#^[a-z]+://([^@]*@)?([^/?]+).*#\2#' <<<"$database_url")"

pg() {
	if command -v "$1" >/dev/null 2>&1; then
		"$@"
	elif command -v docker >/dev/null 2>&1; then
		docker run --rm -i --network host "$PG_IMAGE" "$@"
	else
		echo "erro: sem $1 e sem Docker; instale o cliente do Postgres (pg_isready, psql) ou o Docker" >&2
		exit 1
	fi
}

if ! pg pg_isready -q -t 3 -d "$server_url"; then
	echo "erro: o Postgres do DATABASE_URL (.env) não responde em $address." >&2
	echo "Suba o Postgres que o projeto usa, ou o container dele com 'pnpm db:docker:up', e rode 'pnpm db:up' de novo." >&2
	exit 1
fi

# the name reaches the SQL as a psql variable, quoted by psql as a literal (:'db') and as an identifier (:"db")
if [ "$(pg psql "$server_url" -tA -v db="$database" <<<"SELECT 1 FROM pg_database WHERE datname = :'db'")" != "1" ]; then
	pg psql "$server_url" -q -v ON_ERROR_STOP=1 -v db="$database" <<<'CREATE DATABASE :"db"'
	echo "criado: banco $database em $address"
fi

DATABASE_URL="$database_url" PRISMA_HIDE_UPDATE_MESSAGE=1 pnpm --silent --filter @metri/db migrate:deploy
