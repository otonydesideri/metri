import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnexpectedErrorFilter } from './unexpected-error.filter';

describe('UnexpectedErrorFilter', () => {
	let reply: {
		status: ReturnType<typeof vi.fn>;
		send: ReturnType<typeof vi.fn>;
	};
	let host: ArgumentsHost;
	let sut: UnexpectedErrorFilter;

	beforeEach(() => {
		reply = { status: vi.fn(), send: vi.fn() };
		reply.status.mockReturnValue(reply);
		host = {
			switchToHttp: () => ({ getResponse: () => reply }),
		} as unknown as ArgumentsHost;
		sut = new UnexpectedErrorFilter();
	});

	it('passa intacta a HttpException que já é o envelope', () => {
		const body = {
			code: 'INVALID_REQUEST_FORMAT',
			message: 'name: obrigatório',
			type: 'INVALID_REQUEST',
		};

		sut.catch(new HttpException(body, HttpStatus.BAD_REQUEST), host);

		expect(reply.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
		expect(reply.send).toHaveBeenCalledWith(body);
	});

	it('troca o corpo da HttpException nativa pelo envelope, com o mesmo status', () => {
		sut.catch(new NotFoundException('Cannot GET /api/nada'), host);

		expect(reply.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
		expect(reply.send).toHaveBeenCalledWith({
			code: 'NOT_FOUND',
			message: 'Requisição não atendida',
			type: 'REQUEST_REJECTED',
		});
	});

	it('responde 500 genérico a exceção que não é HttpException, sem vazar a mensagem', () => {
		sut.catch(new Error('conexão recusada em 10.0.0.1:5432'), host);

		expect(reply.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
		expect(reply.send).toHaveBeenCalledWith({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Erro interno inesperado',
			type: 'INTERNAL_ERROR',
		});
	});
});
