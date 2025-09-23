import type { CompanionEngine } from "../CompanionEngine";

export abstract class EventHandler {
	abstract canHandle(event: unknown, engine: CompanionEngine): boolean;
	abstract handle(event: unknown, engine: CompanionEngine): Promise<void>;
	abstract getName(): string;

	protected validateEvent(event: unknown): void {
		if (!event || typeof event !== "object") {
			throw new Error("Valid event object is required");
		}
	}
}
