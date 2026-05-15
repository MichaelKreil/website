import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { checkImages } from './image.js';
import { resolveProject } from './utils.js';
import Handlebars from 'handlebars';
import { ResolvedEntry } from './types.js';

let entriesCache: { signature: string; entries: ResolvedEntry[] } | null = null;

export async function buildWebsite(opts: { dev?: boolean } = {}) {
	console.log('build website');
	const dev = opts.dev ?? false;
	const entries = await resolveEntries(dev);

	const template = await readFile(resolveProject('src/template/index.template.html'), 'utf8');

	const html = Handlebars.compile(template)({
		mainscript: await readFile(resolveProject('web/assets/main.js'), 'utf8'),
		entries,
		dev,
	});

	await writeFile(resolveProject('web/index.html'), html);
}

async function resolveEntries(dev: boolean): Promise<ResolvedEntry[]> {
	if (!dev) return loadEntries();

	const signature = await inputSignature();
	if (entriesCache?.signature === signature) return entriesCache.entries;

	const entries = await loadEntries();
	entriesCache = { signature, entries };
	return entries;
}

async function loadEntries(): Promise<ResolvedEntry[]> {
	const entries = await getEntries();
	await checkImages(entries);
	return entries;
}

// Signature changes when data.ts or any source image is added/removed/modified.
// On match, the cached entries (including resolved image filenames and base64
// icons) are reused, skipping checkImages.
async function inputSignature(): Promise<string> {
	const dataStat = await stat(resolveProject('src/data.ts'));
	const imageFiles = (await readdir(resolveProject('images'))).filter((n) => /\.png$/.test(n)).sort();
	const imageStats = await Promise.all(
		imageFiles.map(async (name) => {
			const s = await stat(resolveProject('images', name));
			return `${name}:${s.mtimeMs}`;
		}),
	);
	return `data:${dataStat.mtimeMs}|images:${imageStats.join(',')}`;
}

async function getEntries(): Promise<ResolvedEntry[]> {
	const data: typeof import('../data.ts') = await import('../data.js?time=' + Date.now());
	const slugSet = new Set();

	const entries: ResolvedEntry[] = data.entries.flatMap((entry) => {
		if (entry.ignore) return [];

		const date = parseDate(entry.start);

		const typeObj = data.types[entry.type];
		if (!typeObj) throw new Error('type unknown: ' + debug());
		if (typeObj.ignore) return [];

		const typeTitle = typeObj.title;

		entry.size ??= typeObj.size ?? 1;

		let topicObj;
		if (entry.topic) {
			const topic = data.topics[entry.topic];
			if (!topic) throw new Error('topic unknown: ' + debug());
			topicObj = topic;
		}

		if (!entry.title) throw new Error('missing title: ' + debug());

		const slugParts = [entry.start.replace(/[^0-9]+/g, ''), entry.type.toLowerCase()];
		if (entry.suffix) slugParts.push(entry.suffix);
		const slug = slugParts.join('-');

		if (slugSet.has(slug)) throw new Error('duplicated slug: ' + debug());
		slugSet.add(slug);

		const imageSrc = slug + '.png';

		return [
			{
				...entry,
				size: entry.size,
				date,
				typeTitle,
				topicObj,
				slug,
				imageSrc,
			},
		];

		function debug() {
			return JSON.stringify(entry, null, '   ');
		}
	});

	entries.sort((a, b) => b.date.getTime() - a.date.getTime());

	return entries;
}

export function parseDate(text: string): Date {
	let m;
	if ((m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)))
		return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
	if ((m = text.match(/^(\d{4})-(\d{2})$/))) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1);
	if ((m = text.match(/^(\d{4})$/))) return new Date(parseInt(m[1], 10), 0);
	throw new Error('unknown date');
}
