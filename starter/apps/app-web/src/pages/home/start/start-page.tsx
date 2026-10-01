import { Button } from '@metri/ui/components/ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from '@metri/ui/components/ui/empty';
import { Skeleton } from '@metri/ui/components/ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { useHealth } from '@/hooks/health/use-health';
import { APP_NAME } from '@/shared/constants/app.constant';
import { API_DOCS_URL, NEXT_STEPS } from './start-content';
import { StartFooter } from './start-footer';

/** SOURCE OF TRUTH: HomeStartPage.
 * WHAT: the page of `/`, in one centered column: the project name, the next steps, the API docs as the main action, the state of app-api and of its database read by `useHealth` on the page's origin, and the metri version.
 * WHY: it proves the whole path, page to hook to generated function to `/api`, before the first UC exists, with the read states of frontend/components ("Estados de leitura"); the API off keeps the rest of the page.
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
						O projeto está rodando. Os próximos passos são no Claude Code.
					</p>
				</div>

				<ol className="flex flex-col gap-6">
					{NEXT_STEPS.map((step, index) => (
						<li key={step.command} className="flex gap-4">
							<span className="text-body-sm font-mono text-muted-foreground">
								{index + 1}.
							</span>
							<div className="flex flex-col gap-1">
								<code className="self-start rounded-md bg-muted px-2 py-0.5 font-mono text-code">
									{step.command}
								</code>
								<p className="text-body-md text-muted-foreground">
									{step.description}
								</p>
							</div>
						</li>
					))}
				</ol>

				<div className="flex flex-col gap-6">
					{API_DOCS_URL && (
						<Button asChild size="lg" className="self-start">
							<a href={API_DOCS_URL}>
								Documentação da API
								<ArrowUpRight />
							</a>
						</Button>
					)}

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

				<div className="mt-auto">
					<StartFooter />
				</div>
			</div>
		</div>
	);
}
