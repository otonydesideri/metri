// Reading of .metri/MATRIX.md: titles, blocks (feature, slice) and list items (Fog, Gaps, Pattern proposals).
// Each ticket's content (UC or T) lives in its own file, .metri/tickets/<id>.md (ticket-lint.ts).
// It only reads; docs-lint decides what is valid. An unreadable line goes into problems.

export type Field = { key: string; value: string; line: number };
export type Kind = 'feature' | 'slice';
export type Block = {
  kind: Kind;
  id: string;
  line: number;
  fields: Field[];
  contract?: Field[];
};
export type Item = { section: string; text: string; line: number };
export type Matrix = {
  title?: { text: string; line: number };
  sections: { text: string; line: number }[];
  blocks: Block[];
  items: Item[];
  problems: { line: number; message: string }[];
};

// A field whose value is prose: the whole line, not split by " · ".
const PROSE_KEYS = ['outcome'];

const HEADING_IDS: Record<string, { kind: Kind; pattern: RegExp; section: string }> = {
  '###:Features': { kind: 'feature', pattern: /^(F\d+) · \S/, section: 'Features' },
  '###:Slices': { kind: 'slice', pattern: /^(S\d+) · \S/, section: 'Slices' },
};

export function parseMatrix(source: string): Matrix {
  const matrix: Matrix = { sections: [], blocks: [], items: [], problems: [] };
  let section = '';
  let block: Block | undefined;
  let isInContract = false;

  source.split('\n').forEach((text, index) => {
    const line = index + 1;
    const heading = /^(#{1,6}) (.+)$/.exec(text);
    if (heading) {
      const [, marks, title] = heading;
      isInContract = false;
      block = undefined;
      if (marks === '#') {
        matrix.title = { text: title, line };
        return;
      }
      if (marks === '##') {
        section = title;
        matrix.sections.push({ text: title, line });
        return;
      }
      const expected = HEADING_IDS[`${marks}:${section}`];
      const id = expected?.pattern.exec(title)?.[1];
      if (!expected || !id) {
        matrix.problems.push({ line, message: `título fora do formato: ${text}` });
        return;
      }
      block = { kind: expected.kind, id, line, fields: [] };
      matrix.blocks.push(block);
      return;
    }
    if (text.trim() === '') {
      return;
    }
    if (text.startsWith('- ')) {
      if (block) {
        matrix.problems.push({ line, message: `item de lista fora de Fog, Gaps ou Pattern proposals: ${text}` });
        return;
      }
      matrix.items.push({ section, text: text.slice(2).trim(), line });
      return;
    }
    const contractField = /^ {2}([a-z_]+):(?: (.*))?$/.exec(text);
    if (contractField && isInContract && block?.contract) {
      block.contract.push({ key: contractField[1], value: (contractField[2] ?? '').trim(), line });
      return;
    }
    isInContract = false;
    if (!block) {
      matrix.problems.push({ line, message: `linha fora de bloco: ${text}` });
      return;
    }
    const fields = fieldsOf(text, line);
    if (!fields) {
      matrix.problems.push({ line, message: `linha fora do formato <chave>: <valor>: ${text}` });
      return;
    }
    for (const field of fields) {
      if (field.key === 'contract') {
        block.contract = [];
        isInContract = true;
      }
      block.fields.push(field);
    }
  });
  return matrix;
}

function fieldsOf(text: string, line: number): Field[] | undefined {
  const prose = /^([a-z_]+): (.*)$/.exec(text);
  if (prose && PROSE_KEYS.includes(prose[1])) {
    return [{ key: prose[1], value: prose[2].trim(), line }];
  }
  const fields: Field[] = [];
  for (const part of text.split(' · ')) {
    const match = /^([a-z_]+):(?: (.*))?$/.exec(part);
    if (!match) {
      return undefined;
    }
    fields.push({ key: match[1], value: (match[2] ?? '').trim(), line });
  }
  return fields;
}

// "[a, `b, c`, d]" → ["a", "`b, c`", "d"]; undefined when the value is not a list.
export function listOf(value: string): string[] | undefined {
  const match = /^\[(.*)\]$/.exec(value);
  if (!match) {
    return undefined;
  }
  const items: string[] = [];
  let current = '';
  let isInTicks = false;
  for (const char of match[1]) {
    if (char === '`') {
      isInTicks = !isInTicks;
    }
    if (char === ',' && !isInTicks) {
      items.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  items.push(current.trim());
  return items.filter((item) => item !== '');
}

export function fieldOf(block: Block, key: string): Field | undefined {
  return block.fields.find((field) => field.key === key);
}
