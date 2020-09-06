document.addEventListener('DOMContentLoaded', function(event) {
	let size = 96;
	let lastState = '';

	let wrapper = document.getElementById('wrapper');
	let container = document.getElementById('container');
	container.className = 'interactive';

	let layoutTimeout = 200;
	let layoutHandler = false;

	let entries = document.getElementsByClassName('entry');
	entries = [].slice.call(entries);
	entries = entries.map(function (node) {
		return {
			size: parseFloat(node.getAttribute('entry_size')),
			type: node.getAttribute('entry_type'),
			node: node,
		}
	});

	window.addEventListener('resize', tryResize, false);
	resize();
	setTimeout(function () {
		container.className = 'interactive transition'}, 1000);

	function tryResize() {
		if (layoutHandler) clearTimeout(layoutHandler);
		layoutHandler = setTimeout(function () {
			layoutHandler = false;
			resize();
		}, layoutTimeout)
	}

	function resize() {
		let width = wrapper.clientWidth;
		let minWidth = 400;
		let minSize = 96;
		let maxSize = 192;

		if (width < minWidth) {
			cols = Math.floor(width/minSize);
		} else {
			width = (width-minWidth)*0.6+minWidth;
			cols = Math.floor(minWidth/minSize + Math.sqrt(width-minWidth)/8);
		}
		
		if (cols < 2) cols = 2;
		if (cols > 8) cols = 8;

		size = Math.floor(width/cols);
		if (size > maxSize) size = maxSize;

		let state = [size, cols].join(',');
		if (state === lastState) return;
		lastState = state;

		layoutEntries();

		redrawEntries();
	}

	function redrawEntries() {
		let height = 0;

		entries.forEach(function (entry) {
			let s = entry.s;
			let x = entry.x;
			let y = entry.y;

			if (y > height) height = y;

			entry.node.style.width = s+'px';
			entry.node.style.height = s+'px';
			entry.node.style.left = x+'px';
			entry.node.style.top = y+'px';
		})

		container.style.height = (height + size)+'px';
		container.style.width = (cols*size)+'px';
	}

	function layoutEntries() {
		let layout = [];
		entries.forEach(function (entry) {
			let entrySize = Math.min(cols, entry.size);
			let pos0 = 0;

			do {} while (check());

			function check() {
				let x0 = pos0 % cols;
				let y0 = Math.floor(pos0/cols);
				pos0++;

				if (x0+entrySize > cols) return true;

				for (let x = 0; x < entrySize; x++) {
					for (let y = 0; y < entrySize; y++) {
						let pos = (y+y0)*cols + (x+x0);
						if (layout[pos]) return true;
					}
				}

				entry.s = entrySize*size;
				entry.x = x0*size;
				entry.y = y0*size;// + entry.group*size/8;

				for (let x = 0; x < entrySize; x++) {
					for (let y = 0; y < entrySize; y++) {
						let pos = (y+y0)*cols + (x+x0);
						layout[pos] = true;
					}
				}

				return false;
			}
		})
	}
})