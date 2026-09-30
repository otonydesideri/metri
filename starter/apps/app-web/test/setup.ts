import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach } from 'vitest';
import { server } from './msw/server';

// At the top of the file, never in beforeAll: a client that resolves `fetch` at module evaluation would
// escape the double (frontend/testing, "O dublê de rede é um só").
server.listen({ onUnhandledRequest: 'error' });

afterEach(() => {
	cleanup();
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});
