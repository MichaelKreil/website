import { readFile, writeFile } from 'node:fs/promises';
import { checkImages } from './image.js';
import { resolveProject } from './utils.js';
import Handlebars from 'handlebars';
import { EntryChecked1 } from './types.js';

export async function buildWebsite() {
	console.log('build website');
	let entries = await getEntries();

	await checkImages(entries);

	const template = await readFile(resolveProject('src/template/index.template.html'), 'utf8');

	let html = Handlebars.compile(template)({
		mainscript: await readFile(resolveProject('web/assets/main.js'), 'utf8'),
		mainstyle: await readFile(resolveProject('web/assets/style/main.css'), 'utf8'),
		entries
	});

	await writeFile(resolveProject('web/index.html'), html);
}

async function getEntries(): Promise<EntryChecked1[]> {
	const data: typeof import('../data.ts') = (await import('../data.js?time=' + Date.now()));
	const slugSet = new Set();

	const entries: EntryChecked1[] = data.entries.flatMap(entry => {
		if (entry.ignore) return [];

		const date = parseDate(entry.start);

		let typeObj = data.types[entry.type];
		if (!typeObj) throw new Error('type unknown: ' + debug());
		if (typeObj.ignore) return [];

		const typeTitle = typeObj.title;

		entry.size ??= typeObj.size || 1;

		let topicObj;
		if (entry.topic) {
			let topic = data.topics[entry.topic];
			if (!topic) throw new Error('topic unknown: ' + debug());
			topicObj = topic;
		}

		if (!entry.title) throw new Error('missing title: ' + debug());

		const slugParts = [
			entry.start.replace(/[^0-9]+/g, ''),
			entry.type.toLowerCase()
		]
		if (entry.suffix) slugParts.push(entry.suffix);
		const slug = slugParts.join('-');

		if (slugSet.has(slug)) throw new Error('duplicated slug: ' + debug());
		slugSet.add(slug)

		const imageSrc = slug + '.png';

		return [
			{
				...entry,
				size: entry.size ?? 1,
				date,
				typeTitle,
				topicObj,
				slug,
				imageSrc
			}
		];

		function debug() {
			return JSON.stringify(entry, null, '   ');
		}
	})

	entries.sort((a, b) => b.date.getTime() - a.date.getTime());

	return entries;

	function parseDate(text: string): Date {
		let m;
		if (m = text.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)) return new Date(parseFloat(m[1]), parseFloat(m[2]) - 1, parseFloat(m[3]));
		if (m = text.match(/^(\d\d\d\d)-(\d\d)$/)) return new Date(parseFloat(m[1]), parseFloat(m[2]) - 1);
		throw Error('unknown date')
	}
}