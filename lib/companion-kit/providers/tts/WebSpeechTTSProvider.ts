import type { AudioSource } from "../../types";
import { TTSProvider } from "./TTSProvider";

export interface WebSpeechConfig {
	voiceName?: string;
	lang?: string;
	rate?: number;
	pitch?: number;
	volume?: number;
}

class WebSpeechAudioSource implements AudioSource {
	private utterance: SpeechSynthesisUtterance;
	private isPlaying = false;
	onEnded?: () => void;

	constructor(text: string, config: WebSpeechConfig) {
		this.utterance = new SpeechSynthesisUtterance(text);
		if (config.lang) this.utterance.lang = config.lang;
		if (config.rate) this.utterance.rate = config.rate;
		if (config.pitch) this.utterance.pitch = config.pitch;
		if (config.volume !== undefined) this.utterance.volume = config.volume;

		if (config.voiceName) {
			const voices = speechSynthesis.getVoices();
			const selected = voices.find((v) => v.name === config.voiceName);
			if (selected) this.utterance.voice = selected;
		}

		this.utterance.onend = () => {
			this.isPlaying = false;
			this.onEnded?.();
		};
	}

	async play(): Promise<void> {
		if (this.isPlaying) return;
		this.isPlaying = true;
		speechSynthesis.speak(this.utterance);
	}

	pause(): void {
		if (this.isPlaying) {
			speechSynthesis.pause();
		}
	}

	stop(): void {
		if (this.isPlaying) {
			speechSynthesis.cancel();
			this.isPlaying = false;
		}
	}

	getAudioNode(_: AudioContext): AudioNode | null {
		return null;
	}
}

export class WebSpeechTTSProvider extends TTSProvider {
	private config: WebSpeechConfig;

	constructor(config: WebSpeechConfig = {}) {
		super();
		this.config = config;
	}

	getName(): string {
		return "WebSpeechAPI";
	}

	isAvailable(): boolean {
		return typeof window !== "undefined" && "speechSynthesis" in window;
	}

	async synthesize(text: string): Promise<AudioSource> {
		this.validateText(text);
		if (!this.isAvailable()) {
			throw new Error("Web Speech API is not available in this environment");
		}
		return new WebSpeechAudioSource(text, this.config);
	}
}
