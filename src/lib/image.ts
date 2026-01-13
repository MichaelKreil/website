import { mkdir, readdir, readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { EntryChecked1 } from './types.js'
import { forEachAsync, ProgressBar } from 'work-faster'
import { existsSync, statSync } from 'node:fs'
import { checkedSpawn, resolveProject } from './utils.js'

export async function checkImages(entries: EntryChecked1[]): Promise<void> {
	await mkdir(resolveProject('web/assets/images'), { recursive: true })
	await mkdir(resolveProject('icons'), { recursive: true })

	const knownImages = new Set((await readdir(resolveProject('images'))).filter((n) => /^\d{4}.*\.png$/.test(n)))
	const uniqueImageSrc = new Set()

	const progress = new ProgressBar(entries.length)
	await forEachAsync(entries, async (entry) => {
		const filenameSrc = resolveProject('images', entry.imageSrc)
		if (existsSync(filenameSrc)) {
			if (uniqueImageSrc.has(entry.imageSrc)) throw new Error(`duplicated imageSrc file "${entry.imageSrc}"`)
			uniqueImageSrc.add(entry.imageSrc)
			knownImages.delete(entry.imageSrc)

			const basenameDst = resolveProject('web/assets/images/' + entry.slug + '.' + entry.size)
			const pixelSize = entry.size * 192

			entry.image = await getImage(filenameSrc, basenameDst, pixelSize)
			entry.icon = await getIcon(filenameSrc, entry.slug)
		}
		progress.increment()
	})
	progress.close()

	if (knownImages.size > 0) {
		console.log('The following images are not used:')
		for (const image of knownImages) console.log('   ' + image)
	}
}

async function getImage(filenameSrc: string, basenameDst: string, pixelSize: number) {
	const filenamePng = basenameDst + '.png'
	const filenameJpg = basenameDst + '.jpg'
	const filenameWebp = basenameDst + '.webp'

	if (!existsSync(filenamePng)) await generatePng(filenameSrc, filenamePng, pixelSize)
	if (!existsSync(filenameJpg)) await generateJpg(filenameSrc, filenameJpg, pixelSize)
	if (!existsSync(filenameWebp)) await generateWebp(filenameSrc, filenameWebp, pixelSize)

	let filename = filenamePng
	if (getFilesize(filename) > getFilesize(filenameJpg)) filename = filenameJpg
	if (getFilesize(filename) > getFilesize(filenameWebp)) filename = filenameWebp

	return basename(filename)

	function getFilesize(f: string) {
		return statSync(f).size
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
	])
	await checkedSpawn('pngquant', ['--quality=95-100', '-f', '--ext', '.png', filenameDst])
	await checkedSpawn('optipng', ['-quiet', '-o5', filenameDst])
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
	])
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
	])
}

async function getIcon(filenameSrc: string, slug: string) {
	const filename = resolveProject('icons', slug + '.gif')

	if (!existsSync(filename)) {
		await checkedSpawn('magick', [
			filenameSrc,
			'-quiet',
			'-strip',
			'-resize',
			'16x16^',
			'-gravity',
			'Center',
			'-crop',
			'16x16+0+0',
			'+repage',
			'-dither',
			'FloydSteinberg',
			'-colors',
			'16',
			filename,
		])
	}

	return (await readFile(filename)).toString('base64')
}
