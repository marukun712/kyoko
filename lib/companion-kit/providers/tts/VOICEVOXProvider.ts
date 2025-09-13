import type { AudioSource } from "../../types";
import { TTSProvider } from "./TTSProvider";

export interface VOICEVOXConfig {
	baseUrl?: string;
	speaker?: number;
	apiKey?: string;
}

interface VOICEVOXAudioQuery {
	accent_phrases: Array<{
		moras: Array<{
			text: string;
			consonant?: string;
			consonant_length?: number;
			vowel: string;
			vowel_length: number;
			pitch: number;
		}>;
		accent: number;
		pause_mora?: {
			text: string;
			consonant?: string;
			consonant_length?: number;
			vowel: string;
			vowel_length: number;
			pitch: number;
		};
		is_interrogative?: boolean;
	}>;
	speedScale: number;
	pitchScale: number;
	intonationScale: number;
	volumeScale: number;
	prePhonemeLength: number;
	postPhonemeLength: number;
	outputSamplingRate: number;
	outputStereo: boolean;
	kana?: string;
}

class MockAudioSource implements AudioSource {
	private audio: HTMLAudioElement;
	onEnded?: () => void;

	constructor(audioData: Blob) {
		this.audio = new Audio(URL.createObjectURL(audioData));
		this.audio.addEventListener("ended", () => {
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
}

export class VOICEVOXProvider extends TTSProvider {
	private config: VOICEVOXConfig;

	constructor(config: VOICEVOXConfig = {}) {
		super();
		this.config = {
			baseUrl: "http://localhost:50021",
			speaker: 1,
			...config,
		};
	}

	getName(): string {
		return "VOICEVOX";
	}

	isAvailable(): boolean {
		return true;
	}

	async synthesize(text: string): Promise<AudioSource> {
		this.validateText(text);

		try {
			const audioQuery = await this.getAudioQuery(text);
			const audioData = await this.getSynthesis(audioQuery);
			return new MockAudioSource(audioData);
		} catch (error) {
			console.warn("VOICEVOX synthesis failed, using mock audio:", error);
			return this.createMockAudio(text);
		}
	}

	private async getAudioQuery(text: string): Promise<VOICEVOXAudioQuery> {
		const response = await fetch(
			`${this.config.baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${this.config.speaker}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Audio query failed: ${response.statusText}`);
		}

		return response.json();
	}

	private async getSynthesis(audioQuery: VOICEVOXAudioQuery): Promise<Blob> {
		const response = await fetch(
			`${this.config.baseUrl}/synthesis?speaker=${this.config.speaker}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(audioQuery),
			},
		);

		if (!response.ok) {
			throw new Error(`Synthesis failed: ${response.statusText}`);
		}

		return response.blob();
	}

	private createMockAudio(text: string): AudioSource {
		const duration = Math.max(1, text.length * 0.1);
		const sampleRate = 22050;
		const length = Math.floor(sampleRate * duration);
		const buffer = new Float32Array(length);

		for (let i = 0; i < length; i++) {
			buffer[i] = Math.random() * 0.1 * Math.sin(i * 0.01);
		}

		const audioContext = new AudioContext();
		const audioBuffer = audioContext.createBuffer(1, length, sampleRate);
		audioBuffer.copyToChannel(buffer, 0);

		return {
			async play(): Promise<void> {
				const source = audioContext.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(audioContext.destination);
				source.start();

				return new Promise((resolve) => {
					source.onended = () => resolve();
				});
			},
			pause(): void {
				console.log("Mock audio pause");
			},
			stop(): void {
				console.log("Mock audio stop");
			},
		};
	}
}
