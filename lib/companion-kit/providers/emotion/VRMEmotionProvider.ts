import { EmotionProvider } from "./EmotionProvider";

export class VRMEmotionProvider extends EmotionProvider {
	private readonly supportedEmotions = [
		"happy",
		"sad",
		"angry",
		"neutral",
		"aa",
	];
	private currentEmotions = new Map<string, number>();

	getName(): string {
		return "VRM Expression Manager";
	}

	getSupportedEmotions(): string[] {
		return [...this.supportedEmotions];
	}

	setEmotion(emotion: string, intensity: number): void {
		this.validateEmotion(emotion, intensity);
		this.validateVRM();

		if (!this.vrm?.expressionManager) {
			console.warn("VRM model does not have an expression manager");
			return;
		}

		if (!this.supportedEmotions.includes(emotion)) {
			console.warn(
				`Emotion "${emotion}" is not supported. Supported emotions: ${this.supportedEmotions.join(", ")}`,
			);
			return;
		}

		try {
			this.vrm.expressionManager.setValue(emotion, intensity);
			this.currentEmotions.set(emotion, intensity);
		} catch (error) {
			console.error(`Failed to set emotion "${emotion}":`, error);
		}
	}

	clearEmotions(): void {
		this.validateVRM();

		if (!this.vrm?.expressionManager) {
			return;
		}

		for (const emotion of this.supportedEmotions) {
			try {
				this.vrm.expressionManager.setValue(emotion, 0);
			} catch (error) {
				console.error(`Failed to clear emotion "${emotion}":`, error);
			}
		}

		this.currentEmotions.clear();
	}

	setEmotionState(
		emotions: Array<{ emotion: string; intensity: number }>,
	): void {
		this.validateVRM();

		if (!this.vrm?.expressionManager) {
			return;
		}

		this.clearEmotions();

		for (const { emotion, intensity } of emotions) {
			this.setEmotion(emotion, intensity);
		}
	}

	getCurrentEmotions(): Map<string, number> {
		return new Map(this.currentEmotions);
	}

	setLipSyncIntensity(intensity: number): void {
		this.setEmotion("aa", intensity);
	}
}
