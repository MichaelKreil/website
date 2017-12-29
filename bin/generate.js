"use strict"

const fs = require('fs');
const resolve = require('path').resolve;
const spawnSync = require('child_process').spawnSync;
const hogan = require('hogan.js');

var entries = require('../data/entries.js');
entries = checkEntries(entries);

var template = fs.readFileSync(resolve(__dirname, '../data/index.template.html'), 'utf8');
template = hogan.compile(template);

var html = template.render({entries:entries});

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

		entry.image = getImage(entry);
	})

	entries.sort((a,b) => b.date - a.date);

	entries.forEach((entry, index) => entry.tabindex = index+1)

	return entries;
}

function getImage(entry) {
	var dst = entry.slug+'.jpg';
	var filenameDst = resolve(__dirname, '../web/assets/images/'+dst);

	if (fs.existsSync(filenameDst)) return dst;

	var png = resolve(__dirname, '../images/'+entry.slug+'.png');
	var jpg = resolve(__dirname, '../images/'+entry.slug+'.jpg');

	var filenameSrc = false;

	if (!filenameSrc && fs.existsSync(png)) filenameSrc = png;
	if (!filenameSrc && fs.existsSync(jpg)) filenameSrc = jpg;

	if (!filenameSrc) return false;

	var size = entry.size*96*3;

	spawnSync('convert', [
		filenameSrc,
		'-resize', size+'x'+size+'!',
		'-quality','80',
		'-interlace','JPEG',
		filenameDst
	])
	
	return dst;
}

function parseDate(text) {
	var m;
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])-([0-3][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1, parseFloat(m[3]))
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1)
}

