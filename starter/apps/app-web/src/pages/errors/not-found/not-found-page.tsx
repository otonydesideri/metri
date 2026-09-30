import { Button } from '@metri/ui/components/ui/button';
import { Link } from 'react-router';

/** SOURCE OF TRUTH: NotFoundPage.
 * WHAT: the empty state of a route without a match, with the way back to the start.
 * WHY: a truncated address shows an exit instead of a blank screen (frontend/routing, "Grupo de rota e acesso").
 * WHERE: the element of the `*` route in `AppRoutes`.
 */
export function NotFoundPage() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background p-6 text-center text-foreground">
			<h1 className="text-display-md">Página não encontrada</h1>
			<p className="text-body-md text-muted-foreground">
				O endereço pode estar incompleto ou ter mudado.
			</p>
			<Button asChild variant="link">
				<Link to="/">Voltar ao início</Link>
			</Button>
		</main>
	);
}
