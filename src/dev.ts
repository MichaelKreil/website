import { watch } from 'node:fs'
import express from 'express'
import { resolveProject } from './lib/utils.js'
import { buildWebsite } from './lib/website.js'

let isRunning = false,
	isRunPlaned = false
const mainPath = resolveProject('')

watch(mainPath, { recursive: true }, (eventType, filename) => {
	if (filename == null) return
	if (filename.startsWith('web/assets/images')) return
	if (filename.startsWith('web/index')) return
	if (filename.startsWith('.')) return
	runUpdate()
})

runUpdate()
startServer()

async function runUpdate() {
	if (isRunning) {
		isRunPlaned = true
		return
	}

	isRunning = true
	await buildWebsite()
	isRunning = false

	if (isRunPlaned) {
		isRunPlaned = false
		runUpdate()
	}
}

function startServer() {
	const app = express()
	app.use(express.static('web'))
	app.listen(8080, () => {
		console.log('Server running on http://localhost:8080')
	})
}
