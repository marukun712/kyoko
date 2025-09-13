import type { AudioSource } from "../../types";

export abstract class TTSProvider {
	abstract synthesize(text: string): Promise<AudioSource>;

	abstract getName(): string;

	abstract isAvailable(): boolean;

	protected validateText(text: string): void {
		if (!text || typeof text !== "string" || text.trim().length === 0) {
			throw new Error("Valid text is required for speech synthesis");
		}
	}
}
