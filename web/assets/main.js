document.addEventListener('DOMContentLoaded', function(event) {
	var size = 80;
	var lastState = '';

	var wrapper = document.getElementById('wrapper');
	var container = document.getElementById('container');
	container.className = 'interactive';

	var layoutTimeout = 200;
	var layoutHandler = false;

	var entries = document.getElementsByClassName('entry');
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
		var width = wrapper.clientWidth;
		var minWidth = 400;
		var minSize = 96;
		var maxSize = 256;

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

		var state = [size, cols].join(',');
		if (state === lastState) return;
		lastState = state;

		layoutEntries();

		redrawEntries();
	}

	function redrawEntries() {
		var height = 0;

		entries.forEach(function (entry) {
			var s = entry.s;
			var x = entry.x;
			var y = entry.y;

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
		var layout = [];
		entries.forEach(function (entry) {
			var entrySize = Math.min(cols, entry.size);
			var pos0 = 0;

			do {} while (check());

			function check() {
				var x0 = pos0 % cols;
				var y0 = Math.floor(pos0/cols);
				pos0++;

				if (x0+entrySize > cols) return true;

				for (var x = 0; x < entrySize; x++) {
					for (var y = 0; y < entrySize; y++) {
						var pos = (y+y0)*cols + (x+x0);
						if (layout[pos]) return true;
					}
				}

				entry.s = entrySize*size;
				entry.x = x0*size;
				entry.y = y0*size;// + entry.group*size/8;

				for (var x = 0; x < entrySize; x++) {
					for (var y = 0; y < entrySize; y++) {
						var pos = (y+y0)*cols + (x+x0);
						layout[pos] = true;
					}
				}

				return false;
			}
		})
	}
})