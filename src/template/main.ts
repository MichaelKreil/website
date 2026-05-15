import { findSlot, markSlot } from './grid.js';

interface Entry {
	size: number;
	type: string;
	node: HTMLElement;
}

document.addEventListener('DOMContentLoaded', () => {
	const MIN_WIDTH = 400;
	const MIN_SIZE = 96;
	const MAX_SIZE = 192;
	const MIN_COLS = 2;
	const MAX_COLS = 8;

	const wrapper = document.getElementById('wrapper');
	const container = document.getElementById('container');
	if (!wrapper || !container) return;

	const entries: Entry[] = [...document.querySelectorAll<HTMLElement>('.entry')].map((node) => ({
		size: parseInt(node.dataset.size ?? '', 10) || 1,
		type: node.dataset.type ?? '',
		node,
	}));

	// Currently selected type; '' shows every entry.
	let activeType = '';

	let cellPx = MIN_SIZE;
	let cols = 0;
	let lastState = '';

	const layout = () => {
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

		const state = `${cellPx},${cols},${activeType}`;
		if (state === lastState) return;
		lastState = state;

		const isVisible = (entry: Entry) => activeType === '' || entry.type === activeType;

		for (const entry of entries) {
			entry.node.style.display = isVisible(entry) ? '' : 'none';
		}

		const occupied = new Set<string>();
		let bottomPx = 0;

		for (const entry of entries) {
			if (!isVisible(entry)) continue;
			const span = Math.min(cols, entry.size);
			const { cx, cy } = findSlot(occupied, span, cols);
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
	};

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

	// The filter buttons act as radio buttons: selecting one shows only that
	// type, or every entry for the 'Alle' button (which has an empty type).
	const filterButtons = [...document.querySelectorAll<HTMLElement>('.filter')];
	for (const button of filterButtons) {
		const type = button.dataset.type ?? '';
		button.classList.toggle('active', type === activeType);
		button.addEventListener('click', () => {
			activeType = type;
			for (const other of filterButtons) {
				other.classList.toggle('active', (other.dataset.type ?? '') === activeType);
			}
			layout();
		});
	}
});
