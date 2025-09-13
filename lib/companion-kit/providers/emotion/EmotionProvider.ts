import type { VRM } from "@pixiv/three-vrm";

export interface EmotionState {
	emotion: string;
	intensity: number;
}

export abstract class EmotionProvider {
	protected vrm?: VRM;

	abstract setEmotion(emotion: string, intensity: number): void;
	abstract clearEmotions(): void;
	abstract getSupportedEmotions(): string[];
	abstract getName(): string;

	setVRM(vrm: VRM): void {
		this.vrm = vrm;
	}

	protected validateEmotion(emotion: string, intensity: number): void {
		if (!emotion || typeof emotion !== "string") {
			throw new Error("Valid emotion name is required");
		}
		if (typeof intensity !== "number" || intensity < 0 || intensity > 1) {
			throw new Error("Intensity must be a number between 0 and 1");
		}
	}

	protected validateVRM(): void {
		if (!this.vrm) {
			throw new Error("VRM model must be set before using emotion provider");
		}
	}
}
