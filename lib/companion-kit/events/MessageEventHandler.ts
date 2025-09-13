import type { CompanionContext, WebSocketEvent } from "../types";
import { EventHandler } from "./EventHandler";

export class MessageEventHandler extends EventHandler {
	getName(): string {
		return "Message Event Handler";
	}

	canHandle(event: WebSocketEvent): boolean {
		return !!(event.message && typeof event.message === "string");
	}

	async handle(
		event: WebSocketEvent,
		context: CompanionContext,
	): Promise<void> {
		this.validateEvent(event);
		this.validateContext(context);

		if (!event.message) {
			return;
		}

		try {
			await this.handleEmotionChange(event, context);
			await this.handleTextToSpeech(event, context);
		} catch (error) {
			console.error("Failed to handle message event:", error);
		}
	}

	private async handleEmotionChange(
		event: WebSocketEvent,
		context: CompanionContext,
	): Promise<void> {
		if (!event.metadata?.emotion || !context.vrm?.expressionManager) {
			return;
		}

		const emotion = event.metadata.emotion;
		const supportedEmotions = ["happy", "sad", "angry", "neutral"];

		for (const supportedEmotion of supportedEmotions) {
			const intensity = supportedEmotion === emotion ? 1 : 0;
			context.vrm.expressionManager.setValue(supportedEmotion, intensity);
		}
	}

	private async handleTextToSpeech(
		event: WebSocketEvent,
		_context: CompanionContext,
	): Promise<void> {
		if (!event.message) {
			return;
		}

		console.log("TTS would be handled here for message:", event.message);
	}
}
