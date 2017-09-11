$(function () {
	var size = 80;
	var cols = 0;

	var wrapper = $('#wrapper');
	var container = $('#container');

	var layoutTimeout = 500;
	var layoutHandler = false;

	var entries = $('.entry').map(function () {
		var node = $(this);
		return {
			size:parseFloat(node.attr('entry_size')),
			type:node.attr('entry_type'),
			node:node,
		}
	}).get();

	$(window).resize(tryResize);
	resize();

	function tryResize() {
		if (layoutHandler) clearTimeout(layoutHandler);
		layoutHandler = setTimeout(function () {
			resize();
			layoutHandler = false;
		}, layoutTimeout)
	}

	function resize() {
		var width = wrapper.width();
		width = (width < 320) ? width : (width-320)*0.8+320;
		size = (width < 480) ? 80 : 96;

		var newCols = Math.floor(width/size);
		
		if (newCols < 2) newCols = 2;
		if (newCols > 8) newCols = 8;

		if (cols === newCols) return;
		cols = newCols;

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

			entry.node.css({
				width:  (s-1)+'px',
				height: (s-1)+'px',
				left:   x+'px',
				top:    y+'px',
				display:'block'
			})
		})

		container.css({
			height:(height + size)+'px',
			width: (cols*size)+'px',
		})
	}

	function layoutEntries() {
		var layout = [];
		entries.forEach(entry => {
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
				entry.y = y0*size;

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