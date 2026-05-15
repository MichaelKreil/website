import { describe, it, expect } from 'vitest';
import { entries, types, topics } from './data.js';

describe('data integrity', () => {
	it('should have valid types for all entries', () => {
		for (const entry of entries) {
			if (entry.ignore) continue;
			expect(types[entry.type], `Unknown type "${entry.type}" in entry: ${entry.title}`).toBeDefined();
		}
	});

	it('should have valid topics for all entries with topics', () => {
		for (const entry of entries) {
			if (entry.ignore || !entry.topic) continue;
			expect(topics[entry.topic], `Unknown topic "${entry.topic}" in entry: ${entry.title}`).toBeDefined();
		}
	});

	it('should have valid date formats for all entries', () => {
		const dateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
		for (const entry of entries) {
			expect(entry.start, `Invalid date format in entry: ${entry.title}`).toMatch(dateRegex);
		}
	});

	it('should have required fields for all non-ignored entries', () => {
		for (const entry of entries) {
			if (entry.ignore) continue;
			expect(entry.title, 'Entry missing title').toBeTruthy();
			expect(entry.start, 'Entry missing start date').toBeTruthy();
			expect(entry.type, 'Entry missing type').toBeTruthy();
		}
	});

	// Slug uniqueness is exercised by the getEntries() tests in website.test.ts,
	// which resolve the real data and throw on a duplicate.
});
