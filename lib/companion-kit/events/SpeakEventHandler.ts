import type { CompanionEngine } from "../CompanionEngine";
import { type Query, QuerySchema } from "../types";
import { EventHandler } from "./EventHandler";

export class VisionEventHandler extends EventHandler {
	getName(): string {
		return "Vision Event Handler";
	}

	canHandle(event: unknown, engine: CompanionEngine): boolean {
		const parsed = QuerySchema.safeParse(event);
		return (
			parsed.success && parsed.data.params.from === engine.config.companionId
		);
	}

	async handle(event: Query, engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
		if ("message" in event.params.body) engine.speak(event.params.body.message);
		if ("emotion" in event.params.body)
			engine.setEmotion(event.params.body.emotion, 1);
	}
}
