#!/usr/bin/env bash
# `pnpm db:docker:up` and `pnpm db:docker:down`: the Docker path of the development database
# (node_modules/metri/architecture/infrastructure/runtime.md, "Banco de desenvolvimento"). One container
# per project, named after it, shared by every worktree, with the user, password and port of the
# DATABASE_URL in the root .env. `up` starts it (creating it the first time), waits for it and runs
# `pnpm db:up`; `down` removes the container and its data.

set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER=__PROJECT__-postgres
PG_IMAGE=postgres:17-alpine

[ -f .env ] || cp .env.example .env
# the value as Node reads it: without a trailing CR and without the quotes around it
database_url="$(sed -n 's/^DATABASE_URL=//p' .env | tail -n 1 | tr -d '\r')"
database_url="${database_url#[\"\']}"
database_url="${database_url%[\"\']}"
rest="${database_url#*://}"
credentials="${rest%%@*}"
user="${credentials%%:*}"
password="${credentials#*:}"
address="${rest#*@}"
address="${address%%[/?]*}"
port=5432
if [[ "$address" == *:* ]]; then
	port="${address##*:}"
fi

case "${1:-}" in
up)
	if docker container inspect "$CONTAINER" >/dev/null 2>&1; then
		docker start "$CONTAINER" >/dev/null
	elif ! docker run -d --name "$CONTAINER" -e POSTGRES_USER="$user" -e POSTGRES_PASSWORD="$password" \
		-p "$port:5432" "$PG_IMAGE" >/dev/null; then
		docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
		echo "erro: o container $CONTAINER não subiu na porta $port; com a porta ocupada, troque-a no DATABASE_URL do .env e do .env.test" >&2
		exit 1
	fi
	for _ in $(seq 30); do
		docker exec "$CONTAINER" pg_isready -q -h 127.0.0.1 -U "$user" && break
		sleep 1
	done
	bash scripts/db-up.sh
	;;
down)
	docker rm -f -v "$CONTAINER" >/dev/null 2>&1 && echo "removido: container $CONTAINER" || echo "sem container $CONTAINER"
	;;
*)
	echo "uso: bash scripts/db-docker.sh up|down" >&2
	exit 1
	;;
esac
