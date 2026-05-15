import { topics, types } from '../data.js';

export interface Topic {
	title: string;
	size?: number;
	ignore?: boolean;
}

export interface Type {
	title: string;
	size?: number;
	ignore?: boolean;
	hideFilter?: boolean;
	// Filter-button position, parsed from the "// N" comment in data.ts.
	order?: number;
}

export interface Entry {
	ignore?: boolean;
	size?: number;
	start: string;
	end?: string;
	title: string;
	suffix?: string;
	link?: string;
	topic?: keyof typeof topics;
	type: keyof typeof types;
}

export interface ResolvedEntry extends Entry {
	date: Date;
	imageSrc: string;
	size: number;
	slug: string;
	typeTitle: string;
	topicObj?: Topic;
	typeObj: Type;
	color?: string;
	image?: string;
}
