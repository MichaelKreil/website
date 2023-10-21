#!/usr/bin/env node
'use strict'

import { watch } from 'node:fs';
import { buildWebsite, resolve } from './build.js';

let isRunning = false, isRunPlaned = false;
let mainPath = resolve('../');

watch(
	mainPath,
	{ recursive: true },
	(eventType, filename) => {
		if (filename.startsWith('web/assets/images')) return
		if (filename.startsWith('web/index')) return
		if (filename.startsWith('.')) return
		console.log(['', eventType, filename].join('\t'));
		runUpdate();
	}
)

runUpdate();

async function runUpdate() {
	if (isRunning) {
		isRunPlaned = true;
		return;
	}

	isRunning = true;
	console.log('update');
	await buildWebsite();
	isRunning = false;

	if (isRunPlaned) {
		isRunPlaned = false;
		runUpdate();
	}
}
