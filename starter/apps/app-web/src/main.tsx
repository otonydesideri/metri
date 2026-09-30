// The bundle entry, called by index.html: imports the @metri/ui theme (defaults/ui) and mounts the `App` of
// app/index.tsx in `#root`, in StrictMode. Providers and routes live in app/.

import '@metri/ui/styles/globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

const root = document.getElementById('root');
if (!root) {
	throw new Error('Elemento #root ausente no index.html');
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
