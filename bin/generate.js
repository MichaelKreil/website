"use strict"

const fs = require('fs');
const resolve = require('path').resolve;
const spawnSync = require('child_process').spawnSync;
const hogan = require('hogan.js');

var entries = require('../data/entries.js');
entries = checkEntries(entries);

var template = fs.readFileSync(resolve(__dirname, '../data/index.template.html'), 'utf8');
template = hogan.compile(template);

var importedFiles = {
	mainscript: fs.readFileSync(resolve(__dirname, '../web/assets/main.js'), 'utf8'),
	mainstyle: fs.readFileSync(resolve(__dirname, '../web/assets/style/main.css'), 'utf8'),
}

var html = template.render({
	import:importedFiles,
	entries:entries
});

fs.writeFileSync(resolve(__dirname, '../web/index.html'), html, 'utf8');

function checkEntries(entries) {

	entries = entries.filter(entry => {
		if (entry.ignore) return false;

		var use = true;

		entry.date = parseDate(entry.start);

		switch (entry.type) {
			case 'project': // a project
				if (!entry.size) entry.size = 2;
			break;

			case 'press': break;
			case 'presentation': break;
			case 'award': break;
			case 'work': break;
			case 'school': use = false; break;
			default: console.error('Unknown type: "'+entry.type+'"');
		}

		if (!entry.size) entry.size = 1;
		if (entry.highlight) entry.size *= 2;

		return use;
	})

	entries.forEach(entry => {
		if (!entry.title) console.error('Missing title!!!');
		if (!entry.slug) entry.slug = entry.start+'_'+entry.type;

		entry.slug = getImage(entry);

		if (entry.slug) {
			entry.image = entry.slug+'.jpg';

			var icon = '../icons/'+entry.slug+'.gif';
			icon = resolve(__dirname, icon);
			icon = fs.readFileSync(icon);
			entry.icon = icon.toString('base64');
		}
	})

	entries.sort((a,b) => b.date - a.date);

	return entries;
}

function getImage(entry) {
	var filenameWeb = resolve(__dirname, '../web/assets/images/'+entry.slug+'.jpg');
	var filenameIco = resolve(__dirname, '../icons/'+entry.slug+'.gif');

	var png = resolve(__dirname, '../images/'+entry.slug+'.png');
	var jpg = resolve(__dirname, '../images/'+entry.slug+'.jpg');

	var filenameSrc = false;

	if (!filenameSrc && fs.existsSync(png)) filenameSrc = png;
	if (!filenameSrc && fs.existsSync(jpg)) filenameSrc = jpg;

	if (!filenameSrc) return false;

	var size = (entry.size*96-1)*2;

	if (!fs.existsSync(filenameWeb)) {
		var attr = [
			filenameSrc,
			'-resize', size+'x'+size+'!',
			'-quality','80',
			'-interlace','JPEG',
			filenameWeb
		];
		spawnSync('convert', attr)

		console.log('   generating: '+filenameWeb);
		console.log('      convert '+attr.join(' '));
	}

	if (!fs.existsSync(filenameIco)) {
		var attr = [
			filenameSrc,
			'-resize', '16x16!',
			'-dither', 'FloydSteinberg',
			'-colors', '16',
			filenameIco
		];
		spawnSync('convert', attr)

		console.log('   generating: '+filenameIco);
		console.log('      convert '+attr.join(' '));
	}
	
	return entry.slug;
}

function parseDate(text) {
	var m;
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])-([0-3][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1, parseFloat(m[3]))
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1)
}

