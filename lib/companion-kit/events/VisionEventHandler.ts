import type { CompanionEngine } from "../CompanionEngine";
import type { WebSocketEvent } from "../types";
import { EventHandler } from "./EventHandler";

export class VisionEventHandler extends EventHandler {
	getName(): string {
		return "Vision Event Handler";
	}

	canHandle(event: WebSocketEvent, engine: CompanionEngine): boolean {
		return !!(
			event.type &&
			typeof event.type === "string" &&
			event.type === "vision" &&
			event.from === engine.config.companionId &&
			event.id
		);
	}

	async handle(event: WebSocketEvent, engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
		const base64 = await engine.capture();
		engine.returnQuery(event.id, base64);
	}
}
