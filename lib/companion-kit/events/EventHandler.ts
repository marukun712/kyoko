import type { CompanionContext, WebSocketEvent } from "../types";

export abstract class EventHandler {
	abstract canHandle(event: WebSocketEvent): boolean;
	abstract handle(
		event: WebSocketEvent,
		context: CompanionContext,
	): Promise<void>;
	abstract getName(): string;

	protected validateEvent(event: WebSocketEvent): void {
		if (!event || typeof event !== "object") {
			throw new Error("Valid event object is required");
		}
	}

	protected validateContext(context: CompanionContext): void {
		if (!context || typeof context !== "object") {
			throw new Error("Valid companion context is required");
		}
	}
}
