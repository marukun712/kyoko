import type { CompanionEngine } from "../CompanionEngine";
import { type Action, ActionSchema } from "../types";
import { EventHandler } from "./EventHandler";

export class GestureEventHandler extends EventHandler {
	getName(): string {
		return "Gesture Event Handler";
	}

	canHandle(event: unknown, engine: CompanionEngine): boolean {
		const parsed = ActionSchema.safeParse(event);
		return (
			parsed.success && parsed.data.params.from === engine.config.companionId
		);
	}

	async handle(event: Action, engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
		try {
			await this.playGestureAnimation(event.params.params.url, engine);
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
