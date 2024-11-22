import { resolveProject } from './lib/utils.js';
import { buildWebsite } from './lib/website.js';

if (resolveProject('') == resolveProject(process.argv[1])) {
	await buildWebsite()
}

