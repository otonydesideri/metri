#!/usr/bin/env bash
# The dependency-graph check of node_modules/metri/architecture/backend/boundaries.md ("O grafo permitido") and
# of the production/test boundary of frontend/testing.md: one command per boundary, run from the root, and any
# output is a violation. This script is the home of the commands: a new boundary adds its command here, and a
# project ADR that allows a pure-calculation library in the domain adds it to the allowlist ("fora da
# allowlist"). Run by the root `pnpm lint`, and through it by `pnpm verify`.

set -u
cd "$(dirname "$0")/.."

failed=0

check() {
	local label="$1"
	local command="$2"
	local output
	output="$(bash -c "$command" 2>&1)"
	if [ -n "$output" ]; then
		echo "falha boundaries: $label"
		echo "  comando: $command"
		echo "$output" | sed 's/^/  /'
		failed=1
	fi
}

check "domain importando db, Zod ou nestjs-pino" \
	"grep -rslP \"from '(@metri/db|zod|nestjs-zod|nestjs-pino)\" apps/app-api/src/domain --include='*.ts' --exclude='*.spec.ts'"

check "domain importando NestJS além de @nestjs/common" \
	"grep -rslP \"from '@nestjs/(?!common')\" apps/app-api/src/domain --include='*.ts' --exclude='*.spec.ts'"

check "enterprise importando NestJS" \
	"grep -rslP \"from '@nestjs/\" apps/app-api/src/domain/enterprise --include='*.ts' --exclude='*.spec.ts'"

check "domain importando src/infra" \
	"grep -rslP \"from '[^']*/infra/\" apps/app-api/src/domain --include='*.ts' --exclude='*.spec.ts'"

check "domain importando pacote externo fora da allowlist" \
	"grep -rshoP \"from '(?!\\.|node:|@metri/(core|utils)(/|')|@nestjs/common'|date-fns(/|')|@date-fns/tz')[^']*'\" apps/app-api/src/domain --include='*.ts' --exclude='*.spec.ts'"

check "domain usando de @nestjs/common algo além de Injectable" \
	"grep -rshoP \"import \\{[^}]*\\} from '@nestjs/common'\" apps/app-api/src/domain --include='*.ts' --exclude='*.spec.ts' | grep -v '^import { Injectable }'"

check "@metri/db fora de infra/persistence/prisma e do setup do e2e" \
	"grep -rslP \"from '@metri/db\" apps/app-api/src apps/app-api/test --include='*.ts' | grep -v 'infra/persistence/prisma' | grep -vx 'apps/app-api/test/setup-e2e.ts'"

check "core com dependência externa" \
	"grep -rshoP \"from '[^'.][^']*'\" packages/core/src --include='*.ts' --exclude='*.spec.ts' | grep -v 'node:'"

check "utils com dependência externa, inclusive o core" \
	"grep -rshoP \"from '[^'.][^']*'\" packages/utils/src --include='*.ts' --exclude='*.spec.ts' | grep -v 'node:'"

check "produção do app-api importando test/" \
	"grep -rslP \"from '[^']*/test/\" apps/app-api/src --include='*.ts' --exclude='*.spec.ts' --exclude='*.e2e-spec.ts'"

check "produção do app-web importando test/" \
	"grep -rslP \"from '[^']*/test/|from '@/test\" apps/app-web/src --include='*.ts' --include='*.tsx' --exclude='*.spec.ts' --exclude='*.spec.tsx'"

exit "$failed"
