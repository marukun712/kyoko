import type { AudioSource } from "../../types";
import { TTSProvider } from "./TTSProvider";

class WebSpeechAudioSource implements AudioSource {
	private utterance: SpeechSynthesisUtterance;
	private isPlaying = false;
	onEnded?: () => void;

	constructor(text: string) {
		this.utterance = new SpeechSynthesisUtterance(text);
		this.utterance.lang = "ja-JP";
		this.utterance.addEventListener("end", () => {
			this.isPlaying = false;
			this.onEnded?.();
		});
	}

	async play(): Promise<void> {
		return new Promise((resolve) => {
			if (this.isPlaying) {
				resolve();
				return;
			}

			this.isPlaying = true;
			this.utterance.addEventListener("end", () => resolve(), { once: true });
			speechSynthesis.speak(this.utterance);
		});
	}

	pause(): void {
		speechSynthesis.pause();
	}

	stop(): void {
		speechSynthesis.cancel();
		this.isPlaying = false;
	}
}

export class WebSpeechTTSProvider extends TTSProvider {
	getName(): string {
		return "Web Speech API";
	}

	isAvailable(): boolean {
		return typeof speechSynthesis !== "undefined";
	}

	async synthesize(text: string): Promise<AudioSource> {
		this.validateText(text);

		if (!this.isAvailable()) {
			throw new Error("Web Speech API is not available in this browser");
		}

		return new WebSpeechAudioSource(text);
	}
}
