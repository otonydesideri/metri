// The structure spec (frontend/testing, "Spec de estrutura"): asserts the file tree, not behavior. Each failure
// says whose piece it is and where it goes. A structural rule enters here only when its violation is silent.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = dirname(fileURLToPath(import.meta.url));
// src/api is generated (frontend/structure)
const GENERATED_DIRS = [join(SRC, 'api')];
const ENTRY_SUFFIXES = ['', '-page', '-layout'];
const RESOLVE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
const COMPONENT =
	/^(?:export\s+)?(?:default\s+)?(?:function\s+([A-Z]\w*)|const\s+([A-Z]\w*)\s*=\s*(?:\(|memo\(|forwardRef\())/gm;
const COMPOUND_EXPORT = /^export\s*\{[^}]*\bas\b[^}]*\}/m;
const IMPORT = /(?:from\s+|import\()\s*'([^']+)'/g;

const rel = (path: string) => relative(SRC, path);

function sourceFiles(dir = SRC): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			return GENERATED_DIRS.includes(path) ? [] : sourceFiles(path);
		}
		return /\.tsx?$/.test(name) ? [path] : [];
	});
}

// An owner folder is recognized by its entry file, named after it (frontend/structure, "A pasta do dono").
function entryOf(dir: string): string | undefined {
	return ENTRY_SUFFIXES.map((suffix) =>
		join(dir, `${basename(dir)}${suffix}.tsx`),
	).find(existsSync);
}

function resolveImport(
	importer: string,
	specifier: string,
): string | undefined {
	const base = specifier.startsWith('@/')
		? join(SRC, specifier.slice(2))
		: specifier.startsWith('.')
			? resolve(dirname(importer), specifier)
			: undefined;
	return base === undefined
		? undefined
		: RESOLVE_SUFFIXES.map((suffix) => `${base}${suffix}`).find(
				(path) => existsSync(path) && statSync(path).isFile(),
			);
}

describe('estrutura do app-web', () => {
	const files = sourceFiles();

	it('um arquivo .tsx declara um componente', () => {
		const problems = files
			.filter((file) => file.endsWith('.tsx') && !file.includes('.spec.'))
			.flatMap((file) => {
				const text = readFileSync(file, 'utf8');
				const names = [...text.matchAll(COMPONENT)].map(
					(match) => match[1] ?? match[2],
				);
				return names.length > 1 && !COMPOUND_EXPORT.test(text)
					? [
							`${rel(file)} declara ${names.join(', ')}: o segundo componente vira arquivo próprio, na casa que "se o dono some, isso some junto?" decide (frontend/components, "Um arquivo, um componente")`,
						]
					: [];
			});

		expect(problems).toEqual([]);
	});

	it('de fora da pasta do dono, só a entrada dela é importada', () => {
		const problems = files.flatMap((importer) =>
			[...readFileSync(importer, 'utf8').matchAll(IMPORT)].flatMap(
				([, specifier]) => {
					const target = resolveImport(importer, specifier);
					if (!target) {
						return [];
					}
					const found: string[] = [];
					for (
						let dir = dirname(target);
						dir.startsWith(`${SRC}/`);
						dir = dirname(dir)
					) {
						const entry = entryOf(dir);
						if (entry && target !== entry && !importer.startsWith(`${dir}/`)) {
							found.push(
								`${rel(importer)} importa ${rel(target)}, peça de ${rel(dir)}/: só ${basename(entry)} sai da pasta; a peça que outro usa sobe para a casa mais estreita que cobre os dois (frontend/structure, "A pasta do dono")`,
							);
						}
					}
					return found;
				},
			),
		);

		expect(problems).toEqual([]);
	});

	it('shared/rules e shared/utils não importam React', () => {
		const problems = files
			.filter((file) => /\/shared\/(rules|utils)\//.test(file))
			.filter((file) =>
				/from\s+'react(?:-dom)?(?:\/[^']*)?'/.test(readFileSync(file, 'utf8')),
			)
			.map(
				(file) =>
					`${rel(file)} importa React: a regra de UI e a função pura ficam sem React (frontend/helpers)`,
			);

		expect(problems).toEqual([]);
	});
});
