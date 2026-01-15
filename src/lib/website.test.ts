import { describe, it, expect } from 'vitest';
import { parseDate } from './website.js';

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

	it('should throw on invalid format', () => {
		expect(() => parseDate('invalid')).toThrow('unknown date');
		expect(() => parseDate('2024')).toThrow('unknown date');
		expect(() => parseDate('2024-1-1')).toThrow('unknown date');
	});

	it('should handle edge cases', () => {
		const jan = parseDate('2024-01-01');
		expect(jan.getMonth()).toBe(0); // January is month 0

		const dec = parseDate('2024-12');
		expect(dec.getMonth()).toBe(11); // December is month 11
	});
});
