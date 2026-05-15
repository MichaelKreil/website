import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parseDate, getEntries, buildFilters, buildWebsite } from './website.js';
import { resolveProject } from './utils.js';
import type { ResolvedEntry, Type } from './types.js';

describe('parseDate', () => {
	it('should parse YYYY-MM-DD format', () => {
		const date = parseDate('2024-12-27');
		expect(date.getFullYear()).toBe(2024);
		expect(date.getMonth()).toBe(11); // December is month 11
		expect(date.getDate()).toBe(27);
	});

	it('should parse YYYY-MM format', () => {
		const date = parseDate('2023-03');
		expect(date.getFullYear()).toBe(2023);
		expect(date.getMonth()).toBe(2); // March is month 2
	});

	it('should parse YYYY format', () => {
		const date = parseDate('2024');
		expect(date.getFullYear()).toBe(2024);
		expect(date.getMonth()).toBe(0);
	});

	it('should throw on invalid format', () => {
		expect(() => parseDate('invalid')).toThrow('unknown date');
		expect(() => parseDate('2024-1-1')).toThrow('unknown date');
		expect(() => parseDate('24-01-01')).toThrow('unknown date');
	});

	it('should handle edge cases', () => {
		const jan = parseDate('2024-01-01');
		expect(jan.getMonth()).toBe(0); // January is month 0

		const dec = parseDate('2024-12');
		expect(dec.getMonth()).toBe(11); // December is month 11
	});
});

describe('getEntries', () => {
	it('resolves every entry in data.ts without error', async () => {
		const entries = await getEntries();
		expect(entries.length).toBeGreaterThan(0);
	});

	it('assigns a unique slug to every entry', async () => {
		const slugs = (await getEntries()).map((e) => e.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('sorts entries newest first', async () => {
		const entries = await getEntries();
		for (let i = 1; i < entries.length; i++) {
			expect(entries[i - 1].date.getTime()).toBeGreaterThanOrEqual(entries[i].date.getTime());
		}
	});

	it('resolves type metadata and an image source for every entry', async () => {
		for (const entry of await getEntries()) {
			expect(entry.typeObj).toBeDefined();
			expect(entry.typeTitle).toBeTruthy();
			expect(entry.imageSrc).toBe(`${entry.slug}.png`);
		}
	});
});

describe('buildFilters', () => {
	const makeType = (over: Partial<Type>): Type => ({ title: 'T', titlePlural: 'Ts', ...over });
	const makeEntry = (type: string, typeObj: Type): ResolvedEntry =>
		({ type, typeTitle: typeObj.title, typeObj }) as unknown as ResolvedEntry;

	it('sorts buttons by the type order field', () => {
		const filters = buildFilters([makeEntry('b', makeType({ order: 2 })), makeEntry('a', makeType({ order: 1 }))]);
		expect(filters.map((f) => f.type)).toEqual(['a', 'b']);
	});

	it('omits types flagged hideFilter', () => {
		const filters = buildFilters([
			makeEntry('shown', makeType({ order: 1 })),
			makeEntry('hidden', makeType({ order: 2, hideFilter: true })),
		]);
		expect(filters.map((f) => f.type)).toEqual(['shown']);
	});

	it('lists each type once and labels it with the plural title', () => {
		const filters = buildFilters([
			makeEntry('a', makeType({ titlePlural: 'Alphas', order: 1 })),
			makeEntry('a', makeType({ titlePlural: 'Alphas', order: 1 })),
		]);
		expect(filters).toEqual([{ type: 'a', title: 'Alphas' }]);
	});
});

describe('buildWebsite', () => {
	// Slow: shells out to ImageMagick for any images not already generated.
	it('renders a complete index.html', async () => {
		await buildWebsite();
		const html = await readFile(resolveProject('web/index.html'), 'utf8');
		expect(html).toContain('<html');
		expect(html).toContain('class="entry');
		expect(html).toContain('class="filter"');
		expect(html).not.toContain('{{'); // no unrendered Handlebars
	}, 180_000);
});
