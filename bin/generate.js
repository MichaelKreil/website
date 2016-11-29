"use strict"

const fs = require('fs');
const path = require('path');
const hogan = require('hogan.js');
const tsv = require('tsv')

var entries = fs.readFileSync(path.resolve(__dirname, '../data/entries.tsv'), 'utf8');
entries = tsv.parse(entries);

entries = cleanupEntries(entries);

var template = fs.readFileSync(path.resolve(__dirname, '../data/index.template.html'), 'utf8');
template = hogan.compile(template);

var html = template.render({entries:entries});

fs.writeFileSync(path.resolve(__dirname, '../web/index.html'), html, 'utf8');





function cleanupEntries(entries) {
	entries.forEach(entry => {
		entry.from = parseDate(entry.from);
		entry.to = parseDate(entry.to);
		entry.time = entry.from + (entry.to ? ' - '+entry.to : '');
		
		entry.link = (entry.link === '') ? false : {url:entry.link, short:shortenUrl(entry.link)};
		
		switch (entry.type) {
			case 'award': entry.symbol = 'trophy'; break;
			case 'link': entry.symbol = 'external-link'; break;
			case 'press': entry.symbol = 'newspaper-o'; break;
			case 'project': entry.symbol = 'check-square-o'; break;
			case 'school': entry.symbol = 'graduation-cap'; break;
			case 'work': entry.symbol = 'building'; break;
			default: throw Error('Unknown type "'+entry.type+'"');
		}
	})

	return entries;

	function parseDate(text) {
		text = text.trim();

		if (text === '') return false;
		if (text === 'now') return '…';

		let parts = text.split('-');
		switch (parts.length) {
			case 2: if (text.length ===  7) return text; break;
			case 3: if (text.length === 10) return text; break;
		}
		console.error('"'+text+'"');
		throw Error(text);
	}

	function shortenUrl(url) {
		url = url.split('/');
		if (url[0].startsWith('http')) return url[2];
		return url[0];
	}
}
