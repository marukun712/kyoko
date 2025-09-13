import type { CompanionEngine } from "../CompanionEngine";
import type { WebSocketEvent } from "../types";

export abstract class EventHandler {
	abstract canHandle(event: WebSocketEvent): boolean;
	abstract handle(
		event: WebSocketEvent,
		engine: CompanionEngine,
	): Promise<void>;
	abstract getName(): string;

	protected validateEvent(event: WebSocketEvent): void {
		if (!event || typeof event !== "object") {
			throw new Error("Valid event object is required");
		}
	}
}
