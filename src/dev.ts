import { watch } from 'node:fs';
import express, { type Response } from 'express';
import { resolveProject } from './lib/utils.js';
import { buildWebsite } from './lib/website.js';

const PORT = Number(process.env.PORT ?? 8080);
const DEBOUNCE_MS = 150;

// Allowlist of build inputs. Watching the project root pulled in node_modules/,
// coverage/, .git/, and the build's own outputs — each generating rebuild
// storms. 'src' (watched recursively) already covers the browser entry point
// at src/template/main.ts.
const watchPaths = ['src', 'images'].map((p) => resolveProject(p));

const reloadClients = new Set<Response>();
let isRunning = false;
let isRunPlanned = false;
let debounceTimer: NodeJS.Timeout | null = null;

await runUpdate();
startServer();

for (const path of watchPaths) {
	watch(path, { recursive: true }, scheduleUpdate);
}

function scheduleUpdate() {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		debounceTimer = null;
		runUpdate();
	}, DEBOUNCE_MS);
}

async function runUpdate() {
	if (isRunning) {
		isRunPlanned = true;
		return;
	}

	isRunning = true;
	try {
		await buildWebsite({ dev: true });
		broadcastReload();
	} catch (err) {
		console.error('build failed:', err);
	}
	isRunning = false;

	if (isRunPlanned) {
		isRunPlanned = false;
		void runUpdate();
	}
}

function broadcastReload() {
	for (const res of reloadClients) res.write('data: reload\n\n');
}

function startServer() {
	const app = express();

	app.get('/__livereload', (req, res) => {
		res.set({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-store',
			Connection: 'keep-alive',
		});
		res.flushHeaders();
		reloadClients.add(res);
		req.on('close', () => reloadClients.delete(res));
	});

	app.use(
		express.static('web', {
			setHeaders: (res) => res.set('Cache-Control', 'no-store'),
		}),
	);

	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
}
