"use strict"

const fs = require('fs');
const {resolve} = require('path');
const {spawnSync} = require('child_process');
const hogan = require('hogan.js');

const uniqueImageSrc = new Set();

let data = require('../data/data.js');
let entries = checkEntries(data.entries);

let template = fs.readFileSync(resolve(__dirname, '../data/index.template.html'), 'utf8');
template = hogan.compile(template);

let importedFiles = {
	mainscript: fs.readFileSync(resolve(__dirname, '../web/assets/main.js'), 'utf8'),
	mainstyle: fs.readFileSync(resolve(__dirname, '../web/assets/style/main.css'), 'utf8'),
}

let html = template.render({
	import:importedFiles,
	entries:entries
});

fs.writeFileSync(resolve(__dirname, '../web/index.html'), html, 'utf8');

function checkEntries(entries) {

	entries = entries.filter(entry => {
		if (entry.ignore) return false;

		entry.date = parseDate(entry.start);

		let typeObj = data.types[entry.type];

		if (!typeObj) throw Error('type unknown: "'+entry.type+'"')

		if (typeObj.ignore) return false;
		if (typeObj.size && !entry.size) entry.size = typeObj.size;

		entry.typeTitle = typeObj.title;

		if (!entry.size) entry.size = 1;

		if (entry.topic) {
			let topic = data.topics[entry.topic];
			if (!topic) throw Error('topic unknown: "'+entry.topic+'"');
			if (!topic.date || (topic.date > entry.date)) topic.date = entry.date;
			entry.topic = topic;
		}

		if (!entry.title) throw Error('Missing title!!!');
		
		if (!entry.slug) entry.slug = (entry.start+'_'+entry.type).toLowerCase();
		entry.imageSrc = entry.slug+'.png';

		addImage(entry);

		if (!entry.image && (entry.size > 1)) console.log('   you might want to add an image "'+entry.imageSrc+'"');

		entry.sortDate = entry.topic ? entry.topic.date : entry.date;
		return true;
	})

	entries.sort((a,b) => {
		if (a.sortDate !== b.sortDate) return b.sortDate - a.sortDate;
		return b.date - a.date;
	});

	return entries;
}

function addImage(entry) {
	let filenameSrc = resolve(__dirname, '../images/'+entry.imageSrc);
	if (!fs.existsSync(filenameSrc)) return;

	if (uniqueImageSrc.has(entry.imageSrc)) throw Error('duplicated imageSrc file "'+entry.imageSrc+'"');
	uniqueImageSrc.add(entry.imageSrc)

	let filename = entry.slug+'.'+entry.size;
	let pixelSize = entry.size*192;
	let targetFile = resolve(__dirname, '../web/assets/images/'+filename);

	entry.image = getImage();

	if (!entry.image) return;
	
	entry.icon = getIcon();
	return;

	function getImage() {
		let filenamePng = targetFile+'.png';
		let filenameJpg = targetFile+'.jpg';

		if (!fs.existsSync(filenamePng)) generatePng();
		if (!fs.existsSync(filenameJpg)) generateJpg();

		let extension = (getFilesize(filenamePng) < getFilesize(filenameJpg)) ? '.png' : '.jpg';

		return filename + extension;

		function getFilesize(f) {
			return fs.statSync(f).size;
		}

		function generatePng() {
			let attr = [
				filenameSrc,
				'-strip',
				'-resize', pixelSize+'x'+pixelSize+'!',
				filenamePng
			];
			spawnSyncCheck('convert', attr);
			spawnSyncCheck('optipng', ['-o5', filenamePng]);
		}

		function generateJpg() {
			let attr = [
				filenameSrc,
				'-strip',
				'-resize', pixelSize+'x'+pixelSize+'!',
				'-quality','90',
				'-interlace','JPEG',
				filenameJpg
			];
			spawnSyncCheck('convert', attr);
		}
	}

	function getIcon() {
		let filename = resolve(__dirname, '../icons/', entry.slug+'.gif');

		if (!fs.existsSync(filename)) {
			let attr = [
				filenameSrc,
				'-strip',
				'-resize', '16x16!',
				'-dither', 'FloydSteinberg',
				'-colors', '16',
				filename
			];
			spawnSyncCheck('convert', attr);
		}
		
		return fs.readFileSync(filename).toString('base64');
	}

	function spawnSyncCheck(command, attr) {
		let res = spawnSync(command, attr);
		if (!res.status) return;

		console.log(res.error);
		console.log(res.stderr.toString());
	}
}

function parseDate(text) {
	var m;
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])-([0-3][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1, parseFloat(m[3]))
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1)
}

