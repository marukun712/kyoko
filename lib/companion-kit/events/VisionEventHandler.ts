import { type Query, QuerySchema } from "@aikyo/server";
import type { CompanionEngine } from "../CompanionEngine";
import { EventHandler } from "./EventHandler";

export class VisionEventHandler extends EventHandler {
	getName(): string {
		return "Vision Event Handler";
	}

	canHandle(event: unknown, engine: CompanionEngine): boolean {
		const parsed = QuerySchema.safeParse(event);
		return (
			parsed.success &&
			parsed.data.params.from === engine.config.companionId &&
			parsed.data.params.type === "vision"
		);
	}

	async handle(event: Query, engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
		const base64 = await engine.capture();
		engine.returnQuery(event.id, { image: base64 });
	}
}
