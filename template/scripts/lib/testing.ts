// Apoio aos testes dos scripts: roda um script como CLI e monta cópias da fixture de projeto.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCRIPTS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = resolve(SCRIPTS, '../..');
export const FIXTURE = join(SCRIPTS, '__fixtures__/project');
const TSX = join(REPO, 'node_modules/.bin/tsx');

const copies: string[] = [];

export function run(script: string, args: string[]): { status: number | null; lines: string[] } {
  const result = spawnSync(TSX, [join(SCRIPTS, script), ...args], { cwd: REPO, encoding: 'utf8' });
  return { status: result.status, lines: `${result.stdout}${result.stderr}`.split('\n').filter(Boolean) };
}

// Cópia da fixture numa pasta temporária, com .metri/architecture apontando para o architecture/ deste repositório.
export function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'metri-fixture-'));
  cpSync(FIXTURE, dir, { recursive: true, filter: (source) => !source.includes('/.metri') });
  mkdirSync(join(dir, '.metri'));
  symlinkSync(join(REPO, 'architecture'), join(dir, '.metri/architecture'));
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
