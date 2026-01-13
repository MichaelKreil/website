import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const PROJECT_DIR = resolve(import.meta.dirname, '../../')

export function resolveProject(...paths: string[]) {
	return resolve(PROJECT_DIR, ...paths)
}

export function checkedSpawn(command: string, attr: string[]): Promise<void> {
	return new Promise<void>((res, rej) => {
		spawn(command, attr, { stdio: 'inherit' })
			.on('error', (error) => {
				console.log(error)
				rej(error)
			})
			.on('close', (code) => {
				switch (code) {
					case 0:
					case 99:
						return res()
					default:
						console.log({ command, attr })
						throw new Error(`unknown code: ${code}`)
				}
			})
	})
}
