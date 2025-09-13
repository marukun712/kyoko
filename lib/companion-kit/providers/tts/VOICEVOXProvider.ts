import Client from "voicevox-client";
import type { AudioSource } from "../../types";
import { TTSProvider } from "./TTSProvider";

export interface VOICEVOXConfig {
	baseUrl: string;
	speaker: number;
}

class VOICEVOXAudioSource implements AudioSource {
	private audio: HTMLAudioElement;
	private audioNode?: MediaElementAudioSourceNode;
	onEnded?: () => void;

	constructor(audioBuffer: ArrayBuffer) {
		const blob = new Blob([audioBuffer], { type: "audio/wav" });
		const url = URL.createObjectURL(blob);
		this.audio = new Audio(url);

		this.audio.addEventListener("ended", () => {
			URL.revokeObjectURL(url);
			this.onEnded?.();
		});
	}

	async play(): Promise<void> {
		await this.audio.play();
	}

	pause(): void {
		this.audio.pause();
	}

	stop(): void {
		this.audio.pause();
		this.audio.currentTime = 0;
	}

	getAudioNode(audioContext: AudioContext): AudioNode | null {
		if (!this.audioNode) {
			try {
				this.audioNode = audioContext.createMediaElementSource(this.audio);
				this.audioNode.connect(audioContext.destination);
			} catch (error) {
				console.error("Failed to create audio node:", error);
				return null;
			}
		}
		return this.audioNode;
	}
}

export class VOICEVOXProvider extends TTSProvider {
	private client: Client;
	private config: VOICEVOXConfig;

	constructor(config: VOICEVOXConfig) {
		super();
		this.config = config;
		this.client = new Client(this.config.baseUrl);
	}

	getName(): string {
		return "VOICEVOX";
	}

	isAvailable(): boolean {
		return typeof window !== "undefined";
	}

	async synthesize(text: string): Promise<AudioSource> {
		this.validateText(text);
		if (!this.isAvailable()) {
			throw new Error("VOICEVOX provider is not available in this environment");
		}
		try {
			const query = await this.client.createAudioQuery(
				text,
				this.config.speaker,
			);
			const voice = await query.synthesis(this.config.speaker);
			return new VOICEVOXAudioSource(voice);
		} catch (error) {
			throw new Error(
				error instanceof Error ? error.message : "Voice generation failed.",
			);
		}
	}
}
