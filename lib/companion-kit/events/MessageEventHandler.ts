import type { CompanionEngine } from "../CompanionEngine";
import { type Message, MessageSchema } from "../types/index";
import { EventHandler } from "./EventHandler";

export class MessageEventHandler extends EventHandler {
	getName(): string {
		return "Message Event Handler";
	}

	canHandle(event: unknown, engine: CompanionEngine): boolean {
		const parsed = MessageSchema.safeParse(event);
		return (
			parsed.success && parsed.data.params.from === engine.config.companionId
		);
	}

	async handle(event: Message, _engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
	}
}
