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

// Like checkedSpawn, but captures and resolves with the command's stdout.
export function checkedSpawnCapture(command: string, attr: string[]): Promise<string> {
	return new Promise<string>((res, rej) => {
		const child = spawn(command, attr, { stdio: ['ignore', 'pipe', 'inherit'] });
		let stdout = '';
		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (chunk) => (stdout += chunk));
		child.on('error', rej);
		child.on('close', (code) => {
			if (code === 0 || code === 99) return res(stdout);
			rej(new Error(`${command} exited with code ${code}: ${attr.join(' ')}`));
		});
	});
}
