import type { QueryStatus } from '@tanstack/react-query';
import { useHealth } from '@/hooks/health/use-health';
import { APP_NAME } from '@/shared/constants/app.constant';

const CONNECTION_MESSAGES: Record<QueryStatus, string> = {
	pending: 'Verificando a conexão com o servidor…',
	error: 'Sem conexão com o servidor. Tente novamente em instantes.',
	success: 'Servidor conectado.',
};

/** SOURCE OF TRUTH: HomeStartPage.
 * WHAT: the page of `/`: the project name and the state of the connection with app-api, read by `useHealth` on the page's origin.
 * WHY: it proves the whole path, page to hook to generated function to `/api`, before the first UC exists.
 * WHERE: the index route of the `AppLayout` group; the first UC replaces it.
 */
export function HomeStartPage() {
	const { status } = useHealth();

	return (
		<div className="flex flex-col gap-2 p-6">
			<h1 className="text-display-lg">{APP_NAME}</h1>
			<p className="text-body-md text-muted-foreground">
				{CONNECTION_MESSAGES[status]}
			</p>
		</div>
	);
}
