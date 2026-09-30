#!/usr/bin/env bash
# `pnpm api:drift` (node_modules/metri/architecture/backend/http-api.md, "Contrato de API: o backend é a fonte"):
# runs `pnpm api:generate` and fails when it changes the generated contract, apps/app-api/openapi.json or
# apps/app-web/src/api. It compares the files before and after, like the api:drift of `metri verify`, so a
# correct regeneration that is not committed yet passes.

set -euo pipefail
cd "$(dirname "$0")/.."

GENERATED=(apps/app-api/openapi.json apps/app-web/src/api)

snapshot() {
	find "${GENERATED[@]}" -type f -exec cksum {} + 2>/dev/null | sort -k3
}

before="$(snapshot)"
pnpm --silent api:generate >/dev/null
after="$(snapshot)"

if [ "$before" != "$after" ]; then
	echo "falha api:drift: o contrato gerado estava desatualizado; revise e comite o que o api:generate gerou" >&2
	diff <(echo "$before") <(echo "$after") | sed -n 's/^[<>] [0-9]* [0-9]* /  mudou: /p' | sort -u >&2
	exit 1
fi
