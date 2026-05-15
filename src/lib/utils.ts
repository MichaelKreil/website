import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const PROJECT_DIR = resolve(import.meta.dirname, '../../');

export function resolveProject(...paths: string[]) {
	return resolve(PROJECT_DIR, ...paths);
}

export function checkedSpawn(command: string, attr: string[]): Promise<void> {
	return new Promise<void>((res, rej) => {
		spawn(command, attr, { stdio: 'inherit' })
			.on('error', rej)
			.on('close', (code) => {
				if (code === 0 || code === 99) return res();
				rej(new Error(`${command} exited with code ${code}: ${attr.join(' ')}`));
			});
	});
}
