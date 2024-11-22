import { mkdir, readdir, readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { EntryChecked1 } from './types.js';
import { forEachAsync, ProgressBar } from 'work-faster';
import { existsSync, statSync } from 'node:fs';
import { checkedSpawn, resolveProject } from './utils.js';


export async function checkImages(entries: EntryChecked1[]): Promise<void> {
	await mkdir(resolve('../web/assets/images'), { recursive: true });
	await mkdir(resolve('../icons'), { recursive: true });

	const knownImages = new Set(
		(await readdir(resolveProject('images')))
			.filter(n => /^\d{4}.*\.png$/.test(n))
	)
	const uniqueImageSrc = new Set();

	const progress = new ProgressBar(entries.length);
	await forEachAsync(entries, async entry => {
		let filenameSrc = resolveProject('images', entry.imageSrc);
		if (existsSync(filenameSrc)) {
			if (uniqueImageSrc.has(entry.imageSrc)) throw new Error(`duplicated imageSrc file "${entry.imageSrc}"`);
			uniqueImageSrc.add(entry.imageSrc);
			knownImages.delete(entry.imageSrc);

			let basenameDst = resolve('../web/assets/images/' + entry.slug + '.' + entry.size);
			let pixelSize = entry.size * 192;

			entry.image = await getImage(filenameSrc, basenameDst, pixelSize);
			entry.icon = await getIcon(filenameSrc, entry.slug);
		}
		progress.increment();
	});
	progress.close();

	if (knownImages.size > 0) {
		console.log('The following images are not used:');
		for (let image of knownImages) console.log('   ' + image);
	}
}


async function getImage(filenameSrc: string, basenameDst: string, pixelSize: number) {
	let filenamePng = basenameDst + '.png';
	let filenameJpg = basenameDst + '.jpg';

	if (!existsSync(filenamePng)) await generatePng(filenameSrc, filenamePng, pixelSize);
	if (!existsSync(filenameJpg)) await generateJpg(filenameSrc, filenameJpg, pixelSize);

	return `${basename(basenameDst)}.${(getFilesize(filenamePng) < getFilesize(filenameJpg) ? 'pn' : 'jp')}g`;

	function getFilesize(f: string) {
		return statSync(f).size;
	}
}


async function generatePng(filenameSrc: string, filenameDst: string, pixelSize: number) {
	//console.log(`generate PNG "${basename(filenameSrc)}"`);
	await checkedSpawn('convert', [
		filenameSrc,
		'-quiet',
		'-strip',
		'-resize', `${pixelSize}x${pixelSize}^`,
		'-gravity', 'Center',
		'-crop', `${pixelSize}x${pixelSize}+0+0`,
		'+repage',
		filenameDst
	]);
	await checkedSpawn('pngquant', ['--quality=95-100', '-f', '--ext', '.png', filenameDst]);
	await checkedSpawn('optipng', ['-quiet', '-o5', filenameDst]);
}

async function generateJpg(filenameSrc: string, filenameDst: string, pixelSize: number) {
	//console.log(`generate JPEG "${basename(filenameSrc)}"`);
	await checkedSpawn('convert', [
		filenameSrc,
		'-quiet',
		'-strip',
		'-resize', `${pixelSize}x${pixelSize}^`,
		'-gravity', 'Center',
		'-crop', `${pixelSize}x${pixelSize}+0+0`,
		'+repage',
		'-quality', '90',
		'-interlace', 'JPEG',
		filenameDst
	]);
}

async function getIcon(filenameSrc: string, slug: string) {
	let filename = resolveProject('icons', slug + '.gif');

	if (!existsSync(filename)) {
		await checkedSpawn('convert', [
			filenameSrc,
			'-quiet',
			'-strip',
			'-resize', '16x16^',
			'-gravity', 'Center',
			'-crop', '16x16+0+0',
			'+repage',
			'-dither', 'FloydSteinberg',
			'-colors', '16',
			filename
		])
	}

	return (await readFile(filename)).toString('base64');
}