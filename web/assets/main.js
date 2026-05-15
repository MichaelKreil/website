'use strict';

document.addEventListener('DOMContentLoaded', () => {
	const MIN_WIDTH = 400;
	const MIN_SIZE = 96;
	const MAX_SIZE = 192;
	const MIN_COLS = 2;
	const MAX_COLS = 8;

	const wrapper = document.getElementById('wrapper');
	const container = document.getElementById('container');

	const entries = [...document.querySelectorAll('.entry')].map((node) => ({
		size: parseInt(node.dataset.size, 10) || 1,
		node,
	}));

	let cellPx = MIN_SIZE;
	let cols = 0;
	let lastState = '';

	container.className = 'interactive';
	layout();
	// Activate slide transitions after the initial placement paints,
	// so first-load entries snap into position without animating from (0,0).
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			container.className = 'interactive transition';
		}),
	);

	new ResizeObserver(layout).observe(wrapper);

	function layout() {
		let width = wrapper.clientWidth;

		if (width < MIN_WIDTH) {
			cols = Math.floor(width / MIN_SIZE);
		} else {
			// Above MIN_WIDTH, compress further growth so cell count grows
			// roughly with sqrt(viewport) — wider screens add columns slowly.
			width = (width - MIN_WIDTH) * 0.6 + MIN_WIDTH;
			cols = Math.floor(MIN_WIDTH / MIN_SIZE + Math.sqrt(width - MIN_WIDTH) / 8);
		}
		cols = Math.max(MIN_COLS, Math.min(MAX_COLS, cols));
		cellPx = Math.min(MAX_SIZE, Math.floor(width / cols));

		const state = `${cellPx},${cols}`;
		if (state === lastState) return;
		lastState = state;

		const occupied = new Set();
		let bottomPx = 0;

		for (const entry of entries) {
			const span = Math.min(cols, entry.size);
			const { cx, cy } = findSlot(occupied, span);
			markSlot(occupied, cx, cy, span);

			const left = cx * cellPx;
			const top = cy * cellPx;
			const side = span * cellPx;

			entry.node.style.left = `${left}px`;
			entry.node.style.top = `${top}px`;
			entry.node.style.width = `${side}px`;
			entry.node.style.height = `${side}px`;

			if (top + side > bottomPx) bottomPx = top + side;
		}

		container.style.width = `${cols * cellPx}px`;
		container.style.height = `${bottomPx}px`;
	}

	function findSlot(occupied, span) {
		for (let pos = 0; ; pos++) {
			const cx = pos % cols;
			const cy = Math.floor(pos / cols);
			if (cx + span > cols) continue;
			if (slotFree(occupied, cx, cy, span)) return { cx, cy };
		}
	}

	function slotFree(occupied, cx, cy, span) {
		for (let dx = 0; dx < span; dx++) {
			for (let dy = 0; dy < span; dy++) {
				if (occupied.has(`${cx + dx},${cy + dy}`)) return false;
			}
		}
		return true;
	}

	function markSlot(occupied, cx, cy, span) {
		for (let dx = 0; dx < span; dx++) {
			for (let dy = 0; dy < span; dy++) {
				occupied.add(`${cx + dx},${cy + dy}`);
			}
		}
	}
});
