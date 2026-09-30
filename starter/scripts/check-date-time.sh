#!/usr/bin/env bash
# The check of node_modules/metri/architecture/general/date-time.md ("Verificação"): bars the
# multi-argument `Date` constructor (`new Date(year, month, day, ...)`) in apps/app-api and in the
# packages, which always builds the date in the process time zone, never in the explicit zone the rule
# requires. `Date.UTC(...)` inside it passes. apps/app-web stays out: it only formats in the viewer's
# zone (frontend/helpers.md). Run by the root `pnpm lint`, and through it by `pnpm verify`.

set -u
cd "$(dirname "$0")/.."

failed=0

while IFS=: read -r file line _; do
	echo "falha date-time: new Date(...) com componentes soltos, sem fuso explícito (use TZDate, de @date-fns/tz, ou um instante ISO com offset ou Z): $file:$line"
	failed=1
done < <(grep -rsnP 'new Date\((?!Date\.UTC\()[^)]*,' apps/app-api/src apps/app-api/test packages/*/src --include='*.ts')

exit "$failed"
