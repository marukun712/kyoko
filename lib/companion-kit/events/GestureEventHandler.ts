import type { CompanionEngine } from "../CompanionEngine";
import type { WebSocketEvent } from "../types";
import { EventHandler } from "./EventHandler";

export class GestureEventHandler extends EventHandler {
	getName(): string {
		return "Gesture Event Handler";
	}

	canHandle(event: WebSocketEvent): boolean {
		return !!(
			event.name === "gesture" &&
			event.params?.url &&
			typeof event.params.url === "string"
		);
	}

	async handle(event: WebSocketEvent, engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
		try {
			await this.playGestureAnimation(event.params.url, engine);
		} catch (error) {
			console.error("Failed to handle gesture event:", error);
		}
	}

	private async playGestureAnimation(
		url: string,
		engine: CompanionEngine,
	): Promise<void> {
		engine.playAnimation(url);
	}
}
