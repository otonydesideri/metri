import { setupServer } from 'msw/node';

// No default handler on purpose: each spec declares, with `server.use(...)`, the response its assertion
// depends on (frontend/testing, "O dublê de rede é um só").
export const server = setupServer();
