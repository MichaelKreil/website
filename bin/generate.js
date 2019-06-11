"use strict"

const fs = require('fs');
const resolve = require('path').resolve;
const spawnSync = require('child_process').spawnSync;
const hogan = require('hogan.js');

var data = require('../data/data.js');
var topics = data.topics;
var images = scanImages();
var entries = checkEntries(data.entries);

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

		if (entry.topic) {
			var topic = topics[entry.topic];
			if (!topic) throw Error('topic unknown: "'+entry.topic+'"');
			if (!topic.date || (topic.date > entry.date)) topic.date = entry.date;
			entry.topic = topic;
		}

		return use;
	})

	entries.forEach(entry => {
		if (!entry.title) console.error('Missing title!!!');
		if (!entry.slug) entry.slug = entry.start+'_'+entry.type+'_'+entry.title;
		entry.slug = entry.slug.toLowerCase().replace(/[^a-z0-9\-]+/gi, '_').replace(/^_+|_+$/g, '');

		entry.slug = getImage(entry);

		if (entry.slug) {
			entry.image = entry.slug+'.'+entry.size+'.jpg';

			var icon = '../icons/'+entry.slug+'.gif';
			icon = resolve(__dirname, icon);
			icon = fs.readFileSync(icon);
			entry.icon = icon.toString('base64');
		}

		entry.sortDate = entry.topic ? entry.topic.date : entry.date;
	})

	entries.sort((a,b) => {
		if (a.sortDate !== b.sortDate) return b.sortDate - a.sortDate;
		return b.date - a.date;
	});

	var lastTopic = entries[0].topic;
	var group = 0;
	entries.forEach(entry => {
		if (entry.topic !== lastTopic) {
			lastTopic = entry.topic;
			group++;
		}
		entry.group = group;
	})

	return entries;
}

function scanImages() {
	var images = new Map();
	scan('../web/assets/images/', '.1.jpg', 'web1');
	scan('../web/assets/images/', '.2.jpg', 'web2');

	scan('../icons/', '.gif', 'icon');
	scan('../images/', '.jpg', 'src');
	scan('../images/', '.png', 'src');

	images = Array.from(images.values());

	images.forEach(image => {
		if (image.src) {
			if (!image.web1) image.web1 = generateWeb(1);
			if (!image.web2) image.web2 = generateWeb(2);
			if (!image.icon) image.icon = generateIcon();
		}

		function generateWeb(size) {
			var filename = resolve(__dirname, '../web/assets/images/', image.slug+'.'+size+'.jpg');
			var pixelSize = (size*96-1)*2;
			var attr = [
				image.src,
				'-strip',
				'-resize', pixelSize+'x'+pixelSize+'!',
				'-quality','80',
				'-interlace','JPEG',
				filename
			];
			spawnSync('convert', attr);

			console.log('generating: '+filename);
			//console.log('      convert '+attr.join(' '));
			return filename;
		}

		function generateIcon() {
			var filename = resolve(__dirname, '../icons/', image.slug+'.gif');
			var attr = [
				image.src,
				'-strip',
				'-resize', '16x16!',
				'-dither', 'FloydSteinberg',
				'-colors', '16',
				filename
			];
			spawnSync('convert', attr);

			console.log('generating: '+filename);
			//console.log('      convert '+attr.join(' '));
			return filename;
		}
	})

	return images;

	function scan(folder, suffix, key) {
		folder = resolve(__dirname, folder);
		fs.readdirSync(folder).forEach(f => {
			if (!f.endsWith(suffix)) return;
			var slug = f.split('.')[0];
			if (!images.has(slug)) images.set(slug, {slug:slug, used:0});
			images.get(slug)[key] = resolve(folder, f);
		})
	}
}

function getImage(entry) {
	if ([1,2].indexOf(entry.size) < 0) throw Error();

	var key = 'web'+entry.size;

	var result = images.filter(image => entry.slug.startsWith(image.slug));
	if (result.length === 0) return false;
	if (result.length > 1) throw Error();

	result = result[0];
	if (result.used > 0) throw Error();
	
	result.used++;
	return result.slug;
}

function parseDate(text) {
	var m;
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])-([0-3][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1, parseFloat(m[3]))
	if (m = text.match(/^([12][0189][0-9][0-9])-([01][0-9])$/)) return new Date(parseFloat(m[1]), parseFloat(m[2])-1)
}

