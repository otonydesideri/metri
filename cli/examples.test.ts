import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO } from './lib/testing.ts';

// The starter replicates the reference examples: each code block of an architecture/**/*.examples.md with a
// title path is the starter file at that path (skills/writing-for-agents/RULE-FORMAT.md, "Escrita da regra").
const ARCHITECTURE = join(REPO, 'architecture');
const STARTER = join(REPO, 'starter');
const TITLED_BLOCK = /^```\w+ title="([^"]+)"\n([\s\S]*?)\n```$/gm;

function examplesFiles(): string[] {
  return readdirSync(ARCHITECTURE, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.examples.md'))
    .map((path) => join(ARCHITECTURE, path));
}

const blocks = examplesFiles().flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(TITLED_BLOCK)].map(([, path, code]) => ({ file, path, code })),
);

describe('examples', () => {
  it('há blocos com o caminho do starter', () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it.each(blocks.map((block) => [block.path, block]))('%s é igual ao arquivo do starter', (_path, { path, code }) => {
    const starterFile = join(STARTER, path);
    expect(existsSync(starterFile), `${path} não existe no starter`).toBe(true);
    expect(readFileSync(starterFile, 'utf8').trimEnd()).toBe(code);
  });
});
