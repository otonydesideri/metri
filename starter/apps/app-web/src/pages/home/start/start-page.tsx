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
 * WHAT: the page of `/`: the project name and the state of the connection with app-api, read by `useHealth` on the page's origin.
 * WHY: it proves the whole path, page to hook to generated function to `/api`, before the first UC exists, with the read states of frontend/components ("Estados de leitura").
 * WHERE: the index route of the `AppLayout` group; the first UC replaces it.
 */
export function HomeStartPage() {
	const {
		isPending: isHealthPending,
		isError: hasLoadError,
		refetch,
	} = useHealth();
	const isLoading = isHealthPending;

	if (isLoading) {
		return (
			<div className="flex flex-col gap-2 p-6">
				<h1 className="text-display-lg">{APP_NAME}</h1>
				<Skeleton className="h-6 w-48" />
			</div>
		);
	}

	if (hasLoadError) {
		return (
			<div className="flex flex-col gap-2 p-6">
				<h1 className="text-display-lg">{APP_NAME}</h1>
				<Empty>
					<EmptyHeader>
						<EmptyTitle>Sem conexão com o servidor</EmptyTitle>
						<EmptyDescription>
							O app não alcançou a API. Confira se ela está no ar e tente de
							novo.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button onClick={() => refetch()}>Tentar de novo</Button>
					</EmptyContent>
				</Empty>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 p-6">
			<h1 className="text-display-lg">{APP_NAME}</h1>
			<p className="text-body-md text-muted-foreground">Servidor conectado.</p>
		</div>
	);
}
