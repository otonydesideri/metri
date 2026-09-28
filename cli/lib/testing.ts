// Apoio aos testes da CLI: roda um comando pelo bin e monta cópias da fixture de projeto e do source.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageLinks } from './links.ts';

export const CLI = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = resolve(CLI, '..');
export const FIXTURE = join(CLI, '__fixtures__/project');
const BIN = join(CLI, 'metri.mjs');

const copies: string[] = [];

export function run(command: string, args: string[]): { status: number | null; lines: string[] } {
  const result = spawnSync(process.execPath, [BIN, command, ...args], { cwd: REPO, encoding: 'utf8' });
  return { status: result.status, lines: `${result.stdout}${result.stderr}`.split('\n').filter(Boolean) };
}

// Pasta temporária com o pacote instalado: node_modules/metri aponta para este repositório.
export function emptyProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'metri-project-'));
  mkdirSync(join(dir, 'node_modules'));
  symlinkSync(REPO, join(dir, 'node_modules/metri'));
  copies.push(dir);
  return dir;
}

// Cópia da fixture com o pacote instalado e os links de .claude/ que o metri init cria.
export function copyFixture(): string {
  const dir = emptyProject();
  cpSync(FIXTURE, dir, { recursive: true });
  for (const { path, target } of packageLinks(dir)) {
    mkdirSync(dirname(path), { recursive: true });
    symlinkSync(target, path);
  }
  return dir;
}

// Cópia deste repositório (modo source) numa pasta temporária, sem node_modules, .git e a fixture de projeto.
export function copySource(): string {
  const dir = mkdtempSync(join(tmpdir(), 'metri-source-'));
  const isSkipped = (source: string) => /(^|\/)(node_modules|\.git|__fixtures__)(\/|$)/.test(relative(REPO, source));
  cpSync(REPO, dir, { recursive: true, filter: (source) => !isSkipped(source) });
  copies.push(dir);
  return dir;
}

export function write(dir: string, path: string, content: string): void {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), content);
}

export function edit(dir: string, path: string, change: (source: string) => string): void {
  const source = readFileSync(join(dir, path), 'utf8');
  const changed = change(source);
  if (changed === source) {
    throw new Error(`edit: nada mudou em ${path}`);
  }
  writeFileSync(join(dir, path), changed);
}

export function removeCopies(): void {
  for (const dir of copies.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
