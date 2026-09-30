import { describe, expect, it } from 'vitest';
import { WatchedList } from './watched-list';

class LetterList extends WatchedList<string> {
	compareItems(a: string, b: string): boolean {
		return a === b;
	}
}

describe('WatchedList', () => {
	it('nasce com os itens iniciais, sem novo nem removido', () => {
		const list = new LetterList(['a', 'b']);

		expect(list.getItems()).toEqual(['a', 'b']);
		expect(list.getNewItems()).toEqual([]);
		expect(list.getRemovedItems()).toEqual([]);
	});

	it('add() inclui um item novo e o marca em getNewItems()', () => {
		const list = new LetterList(['a']);

		list.add('b');

		expect(list.getItems()).toEqual(['a', 'b']);
		expect(list.getNewItems()).toEqual(['b']);
	});

	it('add() de um item já corrente não duplica nem marca como novo', () => {
		const list = new LetterList(['a']);

		list.add('a');

		expect(list.getItems()).toEqual(['a']);
		expect(list.getNewItems()).toEqual([]);
	});

	it('remove() de um item inicial o marca em getRemovedItems()', () => {
		const list = new LetterList(['a', 'b']);

		list.remove('a');

		expect(list.getItems()).toEqual(['b']);
		expect(list.getRemovedItems()).toEqual(['a']);
	});

	it('remove() de um item recém-adicionado só o descarta de getNewItems(), sem virar removido', () => {
		const list = new LetterList(['a']);

		list.add('b');
		list.remove('b');

		expect(list.getItems()).toEqual(['a']);
		expect(list.getNewItems()).toEqual([]);
		expect(list.getRemovedItems()).toEqual([]);
	});

	it('readicionar um item removido cancela a remoção', () => {
		const list = new LetterList(['a']);

		list.remove('a');
		list.add('a');

		expect(list.getItems()).toEqual(['a']);
		expect(list.getRemovedItems()).toEqual([]);
	});

	it('adicionar, remover e readicionar um item novo → continua novo', () => {
		const list = new LetterList(['a']);

		list.add('b');
		list.remove('b');
		list.add('b');

		expect(list.getItems()).toEqual(['a', 'b']);
		expect(list.getNewItems()).toEqual(['b']);
	});

	it('não muta o array recebido', () => {
		const initialItems = ['a'];
		const list = new LetterList(initialItems);

		list.add('b');

		expect(initialItems).toEqual(['a']);
	});

	it('update() recalcula o delta contra o conjunto final completo', () => {
		const list = new LetterList(['a', 'b']);

		list.update(['b', 'c']);

		expect(list.getItems()).toEqual(['b', 'c']);
		expect(list.getNewItems()).toEqual(['c']);
		expect(list.getRemovedItems()).toEqual(['a']);
	});

	it('update() com o mesmo conjunto não gera delta nenhum', () => {
		const list = new LetterList(['a', 'b']);

		list.update(['a', 'b']);

		expect(list.getNewItems()).toEqual([]);
		expect(list.getRemovedItems()).toEqual([]);
	});

	it('exists() usa compareItems, não igualdade de referência', () => {
		const list = new LetterList(['a']);

		expect(list.exists('a')).toBe(true);
		expect(list.exists('z')).toBe(false);
	});
});
