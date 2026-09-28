// Os links do projeto para o pacote: .claude/skills/<nome> → node_modules/metri/skills/<nome> e
// .claude/agents/<nome>.md → node_modules/metri/agents/<nome>.md. metri init cria; docs-lint confere.
import { existsSync, lstatSync, readdirSync, readlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGE_NAME, PACKAGE_ROOT } from './layout.ts';

export type PackageLink = { path: string; target: string };

// Pastas do projeto que levam os links, e o que o pacote tem para cada uma.
const KINDS = [
  { dir: '.claude/skills', source: 'skills', isEntry: (name: string) => statSync(join(PACKAGE_ROOT, 'skills', name)).isDirectory() },
  { dir: '.claude/agents', source: 'agents', isEntry: (name: string) => name.endsWith('.md') },
];

export function packageLinks(root = '.'): PackageLink[] {
  return KINDS.flatMap(({ dir, source, isEntry }) => {
    const from = join(PACKAGE_ROOT, source);
    if (!existsSync(from)) {
      return [];
    }
    return readdirSync(from)
      .sort()
      .filter(isEntry)
      .map((name) => ({ path: join(root, dir, name), target: `../../node_modules/${PACKAGE_NAME}/${source}/${name}` }));
  });
}

// Links do projeto que apontam para uma skill ou agent que o pacote não tem mais.
export function staleLinks(root = '.'): string[] {
  const wanted = new Set(packageLinks(root).map(({ path }) => path));
  return KINDS.flatMap(({ dir, source }) => {
    const linkDir = join(root, dir);
    if (!existsSync(linkDir)) {
      return [];
    }
    return readdirSync(linkDir)
      .map((name) => join(linkDir, name))
      .filter((path) => !wanted.has(path) && linkTargetOf(path)?.startsWith(`../../node_modules/${PACKAGE_NAME}/${source}/`));
  });
}

// Destino de um link simbólico; undefined quando o caminho não existe ou não é link.
export function linkTargetOf(path: string): string | undefined {
  try {
    return lstatSync(path).isSymbolicLink() ? readlinkSync(path) : undefined;
  } catch {
    return undefined;
  }
}
