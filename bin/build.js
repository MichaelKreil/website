#!/usr/bin/env node
'use strict'

import { existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import handlebars from 'handlebars';
import { } from 'work-faster';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

export function resolve(path) {
	return (new URL(path, import.meta.url)).pathname;
}

export async function buildWebsite() {
	let data = (await import('../src/data.js?time=' + Date.now())).default;
	let entries = checkEntries(data);
	
	await checkImages(entries);

	let template = await readFile(resolve('../src/index.template.html'), 'utf8');
	template = handlebars.compile(template);

	let html = template({
		mainscript: await readFile(resolve('../web/assets/main.js'), 'utf8'),
		mainstyle: await readFile(resolve('../web/assets/style/main.css'), 'utf8'),
		entries: entries
	});

	await writeFile(resolve('../web/index.html'), html);
}

function checkEntries(data) {
	const slugSet = new Set();

	data.entries = data.entries.filter(entry => {
		if (entry.ignore) return false;

		entry.date = parseDate(entry.start);

		let typeObj = data.types[entry.type];
		if (!typeObj) throw new Error('type unknown: ' + debug());
		if (typeObj.ignore) return false;

		entry.typeTitle = typeObj.title;

		entry.size ??= typeObj.size || 1;

		if (entry.topic) {
			let topic = data.topics[entry.topic];
			if (!topic) throw new Error('topic unknown: ' + debug());
			if (!topic.date || (topic.date > entry.date)) topic.date = entry.date;
			entry.topic = topic;
		}

		if (!entry.title) throw new Error('missing title: ' + debug());

		if (entry.slug) throw new Error('use suffix instead of slug: ' + debug());

		entry.slug = [
			entry.start.replace(/[^0-9]+/g, ''),
			entry.type.toLowerCase()
		]
		if (entry.suffix) entry.slug.push(entry.suffix);
		entry.slug = entry.slug.join('-');

		if (slugSet.has(entry.slug)) throw new Error('duplicated slug: ' + debug());
		slugSet.add(entry.slug)

		entry.imageSrc = entry.slug + '.png';

		//if (!entry.image && (entry.size > 1)) console.log('   you might want to add an image "' + entry.imageSrc + '"');

		entry.sortDate = entry.topic ? entry.topic.date : entry.date;

		return true;

		function debug() {
			return JSON.stringify(entry, null, '   ');
		}
	})

	data.entries.sort((a, b) => (b.sortDate - a.sortDate) || (b.date - a.date));

	return data.entries;

	function parseDate(text) {
		let m;
		if (m = text.match(/^(\d\d\d\d)-(\d\d)-(\d\d)$/)) return new Date(parseFloat(m[1]), parseFloat(m[2]) - 1, parseFloat(m[3]))
		if (m = text.match(/^(\d\d\d\d)-(\d\d)$/)) return new Date(parseFloat(m[1]), parseFloat(m[2]) - 1)
	}
}

async function checkImages(entries) {
	await mkdir(resolve('../web/assets/images'), { recursive: true });
	await mkdir(resolve('../icons'), { recursive: true });

	const knownImages = new Set(
		(await readdir(resolve('../images')))
			.filter(n => /^\d{4}.*\.png$/.test(n))
	)
	const uniqueImageSrc = new Set();

	let count = 0;
	await entries.forEachAsync(async entry => {
		let filenameSrc = resolve('../images/' + entry.imageSrc);
		if (existsSync(filenameSrc)) {
			if (uniqueImageSrc.has(entry.imageSrc)) throw new Error(`duplicated imageSrc file "${entry.imageSrc}"`);
			uniqueImageSrc.add(entry.imageSrc);
			knownImages.delete(entry.imageSrc);

			let basenameDst = resolve('../web/assets/images/' + entry.slug + '.' + entry.size);
			let pixelSize = entry.size * 192;

			entry.image = await getImage(filenameSrc, basenameDst, pixelSize);

			if (entry.image) entry.icon = await getIcon(filenameSrc, entry.slug);
		}
		count++;
		process.stderr.write(`\rcheck images: ${(100 * count / entries.length).toFixed(1)}%`);
	});
	process.stderr.write(`\n`);

	if (knownImages.size > 0) {
		console.log('The following images are not used:');
		for (let image of knownImages) console.log('   ' + image);
	}
}


async function getImage(filenameSrc, basenameDst, pixelSize) {
	let filenamePng = basenameDst + '.png';
	let filenameJpg = basenameDst + '.jpg';

	if (!existsSync(filenamePng)) await generatePng(filenameSrc, filenamePng, pixelSize);
	if (!existsSync(filenameJpg)) await generateJpg(filenameSrc, filenameJpg, pixelSize);

	return `${basename(basenameDst)}.${(getFilesize(filenamePng) < getFilesize(filenameJpg) ? 'pn' : 'jp')}g`;

	function getFilesize(f) {
		return statSync(f).size;
	}
}


async function generatePng(filenameSrc, filenameDst, pixelSize) {
	//console.log(`generate PNG "${basename(filenameSrc)}"`);
	await checkedSpawn('convert', [
		filenameSrc,
		'-quiet',
		'-strip',
		'-resize', pixelSize + 'x' + pixelSize,
		filenameDst
	]);
	await checkedSpawn('pngquant', ['--quality=95-100', '-f', '--ext', '.png', filenameDst]);
	await checkedSpawn('optipng', ['-quiet', '-o5', filenameDst]);
}

async function generateJpg(filenameSrc, filenameDst, pixelSize) {
	//console.log(`generate JPEG "${basename(filenameSrc)}"`);
	await checkedSpawn('convert', [
		filenameSrc,
		'-quiet',
		'-strip',
		'-resize', pixelSize + 'x' + pixelSize,
		'-quality', '90',
		'-interlace', 'JPEG',
		filenameDst
	]);
}

async function getIcon(filenameSrc, slug) {
	let filename = resolve('../icons/' + slug + '.gif');

	if (!existsSync(filename)) {
		await checkedSpawn('convert', [
			filenameSrc,
			'-quiet',
			'-strip',
			'-resize', '16x16',
			'-dither', 'FloydSteinberg',
			'-colors', '16',
			filename
		])
	}

	return (await readFile(filename)).toString('base64');
}

function checkedSpawn(command, attr) {
	return new Promise((res, rej) => {
		spawn(command, attr, { stdio: 'inherit' })
			.on('error', error => {
				console.log(error);
				throw error;
			})
			.on('close', (code, signal) => {
				switch (code) {
					case 0:
					case 99:
						return res();
					default:
						console.log({ command, attr });
						throw new Error(`unknown code: ${code}`);
				}
			})
	})
}

if (resolve('') == resolve(process.argv[1])) {
	await buildWebsite()
}

