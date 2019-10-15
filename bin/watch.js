"use strict"

const fs = require('fs');
const resolve = require('path').resolve;
const spawnSync = require('child_process').spawnSync;

fs.watch(
	resolve(__dirname, '../../'),
	{recursive:true},
	(eventType, filename) => {
		var response = 'update';
		if (filename === 'website/web/index.html') response = 'ignore';

		if (response !== 'update') return;

		console.log([eventType, response, filename].join('\t'));
		spawnSync('node', [resolve(__dirname, 'generate.js')]);
	}
)