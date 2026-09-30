// The project's links to the package: .claude/skills/<name> → node_modules/metri/skills/<name> and
// .claude/agents/<name>.md → node_modules/metri/agents/<name>.md. metri init creates them; docs-lint checks them.
import { existsSync, lstatSync, readdirSync, readlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGE_NAME, PACKAGE_ROOT } from './layout.ts';

export type PackageLink = { path: string; target: string };

// Project folders that hold the links, and what the package has for each.
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

// Project links that point to a skill or agent the package no longer has.
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

// Target of a symbolic link; undefined when the path does not exist or is not a link.
export function linkTargetOf(path: string): string | undefined {
  try {
    return lstatSync(path).isSymbolicLink() ? readlinkSync(path) : undefined;
  } catch {
    return undefined;
  }
}
