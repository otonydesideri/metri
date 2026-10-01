/** SOURCE OF TRUTH: NEXT_STEPS, API_DOCS_URL.
 * WHAT: the next steps of the start page, one method command and one sentence each, and the address of the API docs.
 * WHY: the page shows the way from the starter to the first UC; the docs exist only outside production, so the link shows only in the dev build (infrastructure/runtime).
 * WHERE: read by `HomeStartPage`; the first UC takes it away with the page.
 */
export const NEXT_STEPS = [
	{
		command: '/shape',
		description:
			'Entrevista você sobre a ideia e escreve o produto, a linguagem do domínio e o design.',
	},
	{
		command: '/look-across',
		description:
			'Olha as funcionalidades juntas e divide o trabalho em fatias e tickets.',
	},
	{
		command: '/build',
		description:
			'Constrói um ticket por vez, até os testes e os checks passarem.',
	},
] as const;

export const API_DOCS_URL = import.meta.env.DEV ? '/api/docs' : undefined;
