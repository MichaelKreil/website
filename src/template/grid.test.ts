import { describe, it, expect } from 'vitest';
import { findSlot, slotFree, markSlot } from './grid.js';

describe('slotFree', () => {
	it('is true for an empty grid', () => {
		expect(slotFree(new Set(), 0, 0, 2)).toBe(true);
	});

	it('is false when any covered cell is occupied', () => {
		const occupied = new Set(['1,1']);
		expect(slotFree(occupied, 0, 0, 2)).toBe(false);
		expect(slotFree(occupied, 2, 2, 1)).toBe(true);
	});
});

describe('markSlot', () => {
	it('occupies every cell of the block', () => {
		const occupied = new Set<string>();
		markSlot(occupied, 1, 1, 2);
		expect([...occupied].sort()).toEqual(['1,1', '1,2', '2,1', '2,2']);
	});
});

describe('findSlot', () => {
	it('returns the origin for an empty grid', () => {
		expect(findSlot(new Set(), 1, 4)).toEqual({ cx: 0, cy: 0 });
	});

	it('skips an occupied cell', () => {
		const occupied = new Set<string>();
		markSlot(occupied, 0, 0, 1);
		expect(findSlot(occupied, 1, 4)).toEqual({ cx: 1, cy: 0 });
	});

	it('wraps to the next row when a block does not fit the remaining width', () => {
		const occupied = new Set<string>();
		markSlot(occupied, 0, 0, 1);
		markSlot(occupied, 1, 0, 1);
		markSlot(occupied, 2, 0, 1);
		// A 2-wide block cannot start at column 3 of a 4-column grid.
		expect(findSlot(occupied, 2, 4)).toEqual({ cx: 0, cy: 1 });
	});

	it('packs a sequence of blocks without overlap', () => {
		const occupied = new Set<string>();
		for (const span of [2, 1, 1, 2, 1]) {
			const { cx, cy } = findSlot(occupied, span, 4);
			expect(slotFree(occupied, cx, cy, span)).toBe(true);
			markSlot(occupied, cx, cy, span);
		}
	});
});
