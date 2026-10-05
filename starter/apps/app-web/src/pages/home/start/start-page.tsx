import { Button } from '@metri/ui/components/ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from '@metri/ui/components/ui/empty';
import { Skeleton } from '@metri/ui/components/ui/skeleton';
import { useHealth } from '@/hooks/health/use-health';
import { APP_NAME } from '@/shared/constants/app.constant';

/** SOURCE OF TRUTH: HomeStartPage.
 * WHAT: the page of `/`, in one centered column: the project name and the state of app-api and of its database, read by `useHealth` on the page's origin.
 * WHY: it proves the whole path, page to hook to generated function to `/api`, before the first UC exists, with the read states of frontend/components ("Estados de leitura").
 * WHERE: the index route of the `AppLayout` group; the first UC replaces it.
 */
export function HomeStartPage() {
	const { isPending, isError, data, refetch } = useHealth();
	const isDatabaseUp = data?.database === 'up';

	return (
		<div className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
			<div className="flex w-full max-w-xl flex-1 flex-col gap-12">
				<div className="flex flex-col gap-3">
					<h1 className="text-display-xl">{APP_NAME}</h1>
					<p className="text-body-lg text-muted-foreground">
						O projeto está rodando.
					</p>
				</div>

				<div className="flex flex-col gap-6">
					{isPending && (
						<div className="flex gap-4">
							<Skeleton className="h-5 w-36" />
							<Skeleton className="h-5 w-36" />
						</div>
					)}

					{isError && (
						<Empty className="items-start border border-border p-6 text-left">
							<EmptyHeader className="items-start text-left">
								<EmptyTitle>A API não respondeu</EmptyTitle>
								<EmptyDescription>
									Confira se o pnpm dev está rodando e tente de novo.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent className="items-start">
								<Button variant="outline" onClick={() => refetch()}>
									Tentar de novo
								</Button>
							</EmptyContent>
						</Empty>
					)}

					{data && (
						<ul className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-muted-foreground">
							<li className="flex items-center gap-2">
								<span className="size-2 rounded-full bg-foreground" />
								API respondendo
							</li>
							<li className="flex items-center gap-2">
								<span
									className={
										isDatabaseUp
											? 'size-2 rounded-full bg-foreground'
											: 'size-2 rounded-full bg-destructive'
									}
								/>
								{isDatabaseUp
									? 'Banco conectado'
									: 'Banco fora do ar: suba o Postgres do projeto e recarregue a página'}
							</li>
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
