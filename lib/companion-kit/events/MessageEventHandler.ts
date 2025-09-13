import type { CompanionEngine } from "../CompanionEngine";
import type { WebSocketEvent } from "../types";
import { EventHandler } from "./EventHandler";

export class MessageEventHandler extends EventHandler {
	getName(): string {
		return "Message Event Handler";
	}

	canHandle(event: WebSocketEvent): boolean {
		return !!(
			event.message &&
			typeof event.message === "string" &&
			event.metadata.emotion &&
			typeof event.metadata.emotion === "string"
		);
	}

	async handle(event: WebSocketEvent, engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
		engine.speak(event.message);
		engine.setEmotion(event.metadata.emotion, 1);
	}
}
