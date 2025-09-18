import { createCompanionAction } from "@aikyo/utils";
import { z } from "zod";

export class MotionDBFetcher {
	url: string;

	constructor(url: string) {
		this.url = new URL(url).href;
	}

	async fetch(prompt: string) {
		const res = await fetch(`${this.url}search?query=${prompt}`);
		const json = await res.json();
		return `${this.url}motions/${json.id}.fbx`;
	}
}

const fetcher = new MotionDBFetcher(
	process.env.MOTIONDB_URL || "http://localhost:3000/",
);

export const motionDBGestureAction = createCompanionAction({
	id: "motion-db-gesture",
	description:
		"MotionDBからあなたの表現したい動きにあったモーションを取得して再生します。",
	inputSchema: z.object({
		prompt: z.string().describe("promptは必ず英語1,2単語で記述してください。"),
	}),
	topic: "actions",
	publish: async ({ input, id }) => {
		const url = await fetcher.fetch(input.prompt);
		const data = {
			from: id,
			name: "gesture",
			params: { url },
		};
		return data;
	},
});
