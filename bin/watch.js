"use strict"

const fs = require('fs');
const resolve = require('path').resolve;
const spawnSync = require('child_process').spawnSync;

var runUpdate = true;

spawnSync('node', [resolve(__dirname, 'generate.js')]);

fs.watch(
	resolve(__dirname, '../../'),
	{recursive:true},
	(eventType, filename) => {
		if (filename === 'website/web/index.html') return
		console.log(['', eventType, filename].join('\t'));
		runUpdate = true;
	}
)

setInterval(() => {
	if (!runUpdate) return;
	runUpdate = false;
	console.log('update')
	spawnSync('node', [resolve(__dirname, 'generate.js')]);
}, 250)


