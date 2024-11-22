import { watch } from 'node:fs';
import { resolveProject } from './lib/utils.js';
import { buildWebsite } from './lib/website.js';

let isRunning = false, isRunPlaned = false;
let mainPath = resolveProject('');

watch(
	mainPath,
	{ recursive: true },
	(eventType, filename) => {
		if (filename == null) return;
		if (filename.startsWith('web/assets/images')) return;
		if (filename.startsWith('web/index')) return;
		if (filename.startsWith('.')) return;
		runUpdate();
	}
)

runUpdate();

async function runUpdate() {
	if (isRunning) {
		isRunPlaned = true;
		return;
	}

	isRunning = true;
	await buildWebsite();
	isRunning = false;

	if (isRunPlaned) {
		isRunPlaned = false;
		runUpdate();
	}
}
