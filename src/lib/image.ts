import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ResolvedEntry } from './types.js';
import { forEachAsync, ProgressBar } from 'work-faster';
import { existsSync, statSync } from 'node:fs';
import { checkedSpawn, checkedSpawnCapture, resolveProject } from './utils.js';

// Per-image average colors, keyed by source filename. Computing them shells out
// to ImageMagick, so results are cached on disk between builds.
const colorCachePath = resolveProject('colors.json');

export async function checkImages(entries: ResolvedEntry[]): Promise<void> {
	await mkdir(resolveProject('web/assets/images'), { recursive: true });

	const colorCache = await loadColorCache();

	const knownImages = new Set((await readdir(resolveProject('images'))).filter((n) => /^\d{4}.*\.png$/.test(n)));
	const uniqueImageSrc = new Set();

	const progress = new ProgressBar(entries.length);
	await forEachAsync(entries, async (entry) => {
		const filenameSrc = resolveProject('images', entry.imageSrc);
		if (existsSync(filenameSrc)) {
			if (uniqueImageSrc.has(entry.imageSrc)) throw new Error(`duplicated imageSrc file "${entry.imageSrc}"`);
			uniqueImageSrc.add(entry.imageSrc);
			knownImages.delete(entry.imageSrc);

			const basenameDst = resolveProject('web/assets/images/' + entry.slug + '.' + entry.size);
			const pixelSize = entry.size * 192;

			entry.image = await getImage(filenameSrc, basenameDst, pixelSize);
			entry.color = await getColor(filenameSrc, entry.imageSrc, colorCache);
		}
		progress.increment();
	});
	progress.close();

	await saveColorCache(colorCache);

	if (knownImages.size > 0) {
		console.log('The following images are not used:');
		for (const image of knownImages) console.log('   ' + image);
	}
}

async function loadColorCache(): Promise<Record<string, string>> {
	if (!existsSync(colorCachePath)) return {};
	return JSON.parse(await readFile(colorCachePath, 'utf8'));
}

async function saveColorCache(cache: Record<string, string>): Promise<void> {
	const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
	await writeFile(colorCachePath, JSON.stringify(sorted, null, '\t') + '\n');
}

async function getImage(filenameSrc: string, basenameDst: string, pixelSize: number) {
	const filenamePng = basenameDst + '.png';
	const filenameJpg = basenameDst + '.jpg';
	const filenameWebp = basenameDst + '.webp';

	if (!existsSync(filenamePng)) await generatePng(filenameSrc, filenamePng, pixelSize);
	if (!existsSync(filenameJpg)) await generateJpg(filenameSrc, filenameJpg, pixelSize);
	if (!existsSync(filenameWebp)) await generateWebp(filenameSrc, filenameWebp, pixelSize);

	let filename = filenamePng;
	if (getFilesize(filename) > getFilesize(filenameJpg)) filename = filenameJpg;
	if (getFilesize(filename) > getFilesize(filenameWebp)) filename = filenameWebp;

	return basename(filename);

	function getFilesize(f: string) {
		return statSync(f).size;
	}
}

async function generatePng(filenameSrc: string, filenameDst: string, pixelSize: number) {
	await checkedSpawn('magick', [
		filenameSrc,
		'-quiet',
		'-strip',
		'-resize',
		`${pixelSize}x${pixelSize}^`,
		'-gravity',
		'Center',
		'-crop',
		`${pixelSize}x${pixelSize}+0+0`,
		'+repage',
		filenameDst,
	]);
	await checkedSpawn('pngquant', ['--quality=95-100', '-f', '--ext', '.png', filenameDst]);
	await checkedSpawn('optipng', ['-quiet', '-o5', filenameDst]);
}

async function generateJpg(filenameSrc: string, filenameDst: string, pixelSize: number) {
	await checkedSpawn('magick', [
		filenameSrc,
		'-quiet',
		'-strip',
		'-resize',
		`${pixelSize}x${pixelSize}^`,
		'-gravity',
		'Center',
		'-crop',
		`${pixelSize}x${pixelSize}+0+0`,
		'+repage',
		'-quality',
		'90',
		'-interlace',
		'JPEG',
		filenameDst,
	]);
}

async function generateWebp(filenameSrc: string, filenameDst: string, pixelSize: number) {
	await checkedSpawn('magick', [
		filenameSrc,
		'-quiet',
		'-strip',
		'-resize',
		`${pixelSize}x${pixelSize}^`,
		'-gravity',
		'Center',
		'-crop',
		`${pixelSize}x${pixelSize}+0+0`,
		'+repage',
		'-quality',
		'90',
		filenameDst,
	]);
}

async function getColor(filenameSrc: string, key: string, cache: Record<string, string>): Promise<string> {
	if (!cache[key]) cache[key] = await computeAverageColor(filenameSrc);
	return cache[key];
}

// Averages the whole image down to a single pixel and reads back its hex value.
async function computeAverageColor(filenameSrc: string): Promise<string> {
	const txt = await checkedSpawnCapture('magick', [
		filenameSrc,
		'-quiet',
		'-background',
		'white',
		'-alpha',
		'remove',
		'-scale',
		'1x1',
		'-depth',
		'8',
		'txt:-',
	]);
	const match = txt.match(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/);
	if (!match) throw new Error(`could not determine average color of "${filenameSrc}": ${txt}`);
	return match[0].toLowerCase();
}
