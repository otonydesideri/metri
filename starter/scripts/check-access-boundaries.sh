#!/usr/bin/env bash
# The access-boundary check (node_modules/metri/architecture/backend/access-scope.md, "Declaração por
# controller"): every controller declares @Public() or the project's owner marker. The access guard is
# global and fail-closed, so an undeclared controller stays protected at runtime; the check fails anyway,
# so the omission never goes unnoticed. The owner marker is the first argument (`CustomerOwned` for
# @CustomerOwned()), added to the `access-boundaries` script when the project decides its authentication;
# without it, only @Public() is accepted. Run by the root `pnpm lint`, and through it by `pnpm verify`.

set -u
cd "$(dirname "$0")/.."

owner_marker="${1:-}"
markers="Public${owner_marker:+|$owner_marker}"
failed=0

while IFS= read -r file; do
	if ! grep -qE "@($markers)\(\)" "$file"; then
		echo "falha access-boundaries: controller sem @Public()${owner_marker:+ nem @$owner_marker()}: $file"
		failed=1
	fi
done < <(find apps/app-api/src -name '*.controller.ts' 2>/dev/null)

exit "$failed"
