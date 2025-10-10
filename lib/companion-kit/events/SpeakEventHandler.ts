import type { CompanionEngine } from "../CompanionEngine";
import { type Query, QuerySchema } from "../types/index";
import { EventHandler } from "./EventHandler";

export class SpeakEventHandler extends EventHandler {
	getName(): string {
		return "Vision Event Handler";
	}

	canHandle(event: unknown, engine: CompanionEngine): boolean {
		const parsed = QuerySchema.safeParse(event);
		return (
			parsed.success &&
			parsed.data.params.from === engine.config.companionId &&
			parsed.data.params.type === "speak"
		);
	}

	async handle(event: Query, engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
		if (event.params.body) {
			if ("message" in event.params.body)
				engine.speak(event.id, event.params.body.message);
			if ("emotion" in event.params.body)
				engine.setEmotion(event.params.body.emotion, 1);
		}
	}
}
