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
}

export interface Entry {
	ignore?: boolean;
	size?: number;
	start: string;
	end?: string;
	title: string;
	suffix?: string;
	link: string;
	topic?: keyof typeof topics;
	type: keyof typeof types;
}

export interface EntryChecked1 extends Entry {
	date: Date;
	imageSrc: string;
	size: number;
	slug: string;
	typeTitle: string;
	topicObj?: Topic;
	icon?: string;
	image?: string;
}
