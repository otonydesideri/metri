#!/usr/bin/env bash
# The access-boundary check (node_modules/metri/architecture/backend/access-scope.md, "Declaração por
# controller"): every controller class, any file with `@Controller(` outside the specs, carries @Public() or
# the project's owner marker as a class decorator, on its own line at column 0. The access guard is global and
# fail-closed, so an undeclared controller stays protected at runtime; the check fails anyway, so the omission
# never goes unnoticed. The owner marker is the first argument (`CustomerOwned` for @CustomerOwned()), added to
# the `access-boundaries` script when the project resolves the "Identidade do dono" delegation; without it,
# only @Public() is accepted. Run by the root `pnpm lint`, and through it by `pnpm verify`.

set -u
cd "$(dirname "$0")/.."

owner_marker="${1:-}"
markers="Public${owner_marker:+|$owner_marker}"
failed=0

while IFS= read -r file; do
	if ! grep -qE "^@($markers)\(\)\s*$" "$file"; then
		echo "falha access-boundaries: controller sem @Public()${owner_marker:+ nem @$owner_marker()} na classe: $file"
		failed=1
	fi
done < <(grep -rlE --include='*.ts' --exclude='*.spec.ts' --exclude='*.e2e-spec.ts' '@Controller\(' apps/app-api/src 2>/dev/null)

exit "$failed"
