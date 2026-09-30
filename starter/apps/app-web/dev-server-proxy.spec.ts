import {
	createServer as createHttpServer,
	type IncomingHttpHeaders,
	type IncomingMessage,
	request,
	type Server,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { createServer, type ProxyOptions, type ViteDevServer } from 'vite';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server as networkDouble } from './test/msw/server';
import { devServerProxy } from './vite.config';

// The Host of a page on the dev server: Vite accepts only allowed hosts (`server.allowedHosts`), and
// localhost is allowed by default.
const PAGE_HOST = 'localhost:5279';
const PAGE_DOMAIN = 'localhost';

let apiServer: Server;
let apiOrigin: string;
let receivedHeaders: IncomingHttpHeaders | undefined;
const openOrigins = new Set<string>();
const devServers: ViteDevServer[] = [];

function originOf(address: AddressInfo): string {
	return `http://127.0.0.1:${address.port}`;
}

async function startDevServer(
	override: Partial<ProxyOptions> = {},
): Promise<string> {
	const devServer = await createServer({
		configFile: false,
		logLevel: 'silent',
		server: {
			host: '127.0.0.1',
			port: 0,
			proxy: {
				'/api': { ...devServerProxy['/api'], target: apiOrigin, ...override },
			},
		},
	});
	await devServer.listen();
	devServers.push(devServer);
	const origin = originOf(devServer.httpServer?.address() as AddressInfo);
	openOrigins.add(origin);
	return origin;
}

function getThroughProxy(origin: string): Promise<IncomingMessage> {
	return new Promise((resolve, reject) => {
		const outgoing = request(`${origin}/api/health`, {
			headers: { host: PAGE_HOST },
		});
		outgoing.on('response', (response) => {
			response.resume();
			response.on('end', () => resolve(response));
		});
		outgoing.on('error', reject);
		outgoing.end();
	});
}

beforeAll(async () => {
	apiServer = createHttpServer((incoming, response) => {
		receivedHeaders = incoming.headers;
		response.setHeader(
			'set-cookie',
			`session=abc; Domain=${PAGE_DOMAIN}; Path=/`,
		);
		response.end('{"status":"ok"}');
	});
	await new Promise<void>((resolve) =>
		apiServer.listen(0, '127.0.0.1', resolve),
	);
	apiOrigin = originOf(apiServer.address() as AddressInfo);
	openOrigins.add(apiOrigin);

	networkDouble.listen({
		onUnhandledRequest(unhandled, print) {
			if (!openOrigins.has(new URL(unhandled.url).origin)) {
				print.error();
			}
		},
	});
});

afterEach(async () => {
	receivedHeaders = undefined;
	await Promise.all(devServers.splice(0).map((devServer) => devServer.close()));
});

afterAll(async () => {
	networkDouble.close();
	await new Promise((resolve) => apiServer.close(resolve));
});

describe('proxy de /api no dev server', () => {
	it('config real → o app-api recebe o Host da página', async () => {
		const origin = await startDevServer();

		await getThroughProxy(origin);

		expect(receivedHeaders?.host).toBe(PAGE_HOST);
	});

	it('changeOrigin ligado → o app-api recebe o host interno do alvo', async () => {
		const origin = await startDevServer({ changeOrigin: true });

		await getThroughProxy(origin);

		expect(receivedHeaders?.host).toBe(new URL(apiOrigin).host);
	});

	it('config real → o cookie volta com o domínio da página', async () => {
		const origin = await startDevServer();

		const response = await getThroughProxy(origin);

		expect(response.headers['set-cookie']).toEqual([
			`session=abc; Domain=${PAGE_DOMAIN}; Path=/`,
		]);
	});

	it('cookieDomainRewrite ligado → o cookie volta com outro domínio', async () => {
		const origin = await startDevServer({ cookieDomainRewrite: '127.0.0.1' });

		const response = await getThroughProxy(origin);

		expect(response.headers['set-cookie']).toEqual([
			'session=abc; Domain=127.0.0.1; Path=/',
		]);
	});
});
