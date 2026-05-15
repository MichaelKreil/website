// Square-packing helpers for the entry grid. Kept separate from main.ts so the
// algorithm can be unit-tested without a DOM.

export interface Slot {
	cx: number;
	cy: number;
}

// Finds the top-left cell of the first free span×span block, scanning left to
// right, top to bottom in a `cols`-wide grid.
export function findSlot(occupied: Set<string>, span: number, cols: number): Slot {
	for (let pos = 0; ; pos++) {
		const cx = pos % cols;
		const cy = Math.floor(pos / cols);
		if (cx + span > cols) continue;
		if (slotFree(occupied, cx, cy, span)) return { cx, cy };
	}
}

// True when every cell of the span×span block at (cx, cy) is unoccupied.
export function slotFree(occupied: Set<string>, cx: number, cy: number, span: number): boolean {
	for (let dx = 0; dx < span; dx++) {
		for (let dy = 0; dy < span; dy++) {
			if (occupied.has(`${cx + dx},${cy + dy}`)) return false;
		}
	}
	return true;
}

// Marks every cell of the span×span block at (cx, cy) as occupied.
export function markSlot(occupied: Set<string>, cx: number, cy: number, span: number): void {
	for (let dx = 0; dx < span; dx++) {
		for (let dy = 0; dy < span; dy++) {
			occupied.add(`${cx + dx},${cy + dy}`);
		}
	}
}
