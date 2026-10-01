import { Button } from '@metri/ui/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

/** SOURCE OF TRUTH: ErrorsNotFoundPage.
 * WHAT: the empty state of a route without a match, in the start page's centered column, with the way back to the start as the main action.
 * WHY: a truncated address shows an exit instead of a blank screen (frontend/routing, "Grupo de rota e acesso").
 * WHERE: the element of the `*` route in `AppRoutes`.
 */
export function ErrorsNotFoundPage() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
			<div className="flex w-full max-w-xl flex-col gap-8">
				<div className="flex flex-col gap-3">
					<p className="font-mono text-code text-muted-foreground">404</p>
					<h1 className="text-display-xl">Página não encontrada</h1>
					<p className="text-body-lg text-muted-foreground">
						O endereço pode estar incompleto ou ter mudado.
					</p>
				</div>
				<Button asChild size="lg" className="self-start">
					<Link to="/">
						<ArrowLeft />
						Voltar ao início
					</Link>
				</Button>
			</div>
		</main>
	);
}
