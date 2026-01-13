import { describe, it, expect } from 'vitest'
import { resolveProject } from './utils.js'

describe('resolveProject', () => {
	it('should return an absolute path', () => {
		const result = resolveProject('src')
		expect(result).toMatch(/^\//)
	})

	it('should contain the project directory', () => {
		const result = resolveProject()
		expect(result).toContain('michael-kreil.de')
	})

	it('should handle multiple path segments', () => {
		const result = resolveProject('src', 'lib', 'utils.ts')
		expect(result).toMatch(/src\/lib\/utils\.ts$/)
	})
})
