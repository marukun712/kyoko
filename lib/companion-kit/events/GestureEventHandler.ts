import type { CompanionContext, WebSocketEvent } from "../types";
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

	async handle(
		event: WebSocketEvent,
		context: CompanionContext,
	): Promise<void> {
		this.validateEvent(event);
		this.validateContext(context);

		if (!event.params?.url || !context.mixer || !context.vrm) {
			console.warn("Cannot handle gesture event: missing required components");
			return;
		}

		try {
			await this.playGestureAnimation(event.params.url, context);
		} catch (error) {
			console.error("Failed to handle gesture event:", error);
		}
	}

	private async playGestureAnimation(
		url: string,
		context: CompanionContext,
	): Promise<void> {
		console.log("Animation would be loaded and played here for URL:", url);
	}
}
