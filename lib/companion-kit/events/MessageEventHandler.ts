import type { CompanionEngine } from "../CompanionEngine";
import { type Message, MessageSchema } from "../types";
import { EventHandler } from "./EventHandler";

export class MessageEventHandler extends EventHandler {
	getName(): string {
		return "Message Event Handler";
	}

	canHandle(event: unknown): boolean {
		const parsed = MessageSchema.safeParse(event);
		return parsed.success;
	}

	async handle(event: Message, _engine: CompanionEngine): Promise<void> {
		this.validateEvent(event);
	}
}
