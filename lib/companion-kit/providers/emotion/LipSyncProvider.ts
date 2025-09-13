import { EmotionProvider } from "./EmotionProvider";

export class LipSyncProvider extends EmotionProvider {
	private audioContext?: AudioContext;
	private analyser?: AnalyserNode;
	private timeDomainData?: Float32Array<ArrayBuffer>;

	getName(): string {
		return "Lip Sync Provider";
	}

	getSupportedEmotions(): string[] {
		return ["aa"];
	}

	setEmotion(emotion: string, intensity: number): void {
		this.validateEmotion(emotion, intensity);
		this.validateVRM();

		if (!this.vrm?.expressionManager) {
			console.warn("VRM model does not have an expression manager");
			return;
		}

		if (emotion !== "aa") {
			console.warn(`LipSyncProvider only supports "aa" emotion`);
			return;
		}

		try {
			this.vrm.expressionManager.setValue(emotion, intensity);
		} catch (error) {
			console.error(`Failed to set lip sync intensity:`, error);
		}
	}

	clearEmotions(): void {
		this.validateVRM();
		if (!this.vrm?.expressionManager) {
			return;
		}
		try {
			this.vrm.expressionManager.setValue("aa", 0);
		} catch (error) {
			console.error("Failed to clear lip sync:", error);
		}
	}

	initializeAudio(): void {
		try {
			this.audioContext = new AudioContext();
			this.analyser = this.audioContext.createAnalyser();
			this.timeDomainData = new Float32Array(2048);
		} catch (error) {
			console.error("Failed to initialize audio for lip sync:", error);
		}
	}

	connectAudioSource(source: AudioNode): void {
		if (!this.analyser) {
			console.warn("Audio not initialized. Call initializeAudio() first.");
			return;
		}
		try {
			source.connect(this.analyser);
		} catch (error) {
			console.error("Failed to connect audio source:", error);
		}
	}

	update(_deltaTime: number): void {
		if (this.analyser && this.timeDomainData) {
			this.updateLipSync();
		}
	}

	private updateLipSync(): void {
		if (
			!this.vrm?.expressionManager ||
			!this.analyser ||
			!this.timeDomainData
		) {
			return;
		}

		this.analyser.getFloatTimeDomainData(this.timeDomainData);
		let volume = 0;
		for (let i = 0; i < this.timeDomainData.length; i++) {
			volume = Math.max(volume, Math.abs(this.timeDomainData[i]));
		}
		volume = 1 / (1 + Math.exp(-45 * volume + 5));
		if (volume < 0.1) volume = 0;

		this.setEmotion("aa", volume);
	}

	dispose(): void {
		this.audioContext?.close();
	}
}
