import type { VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import type { CompanionConfig } from "./CompanionConfig";
import type { EventHandler } from "./events";
import type { AnimationProvider } from "./providers/animation";
import type { EmotionProvider, LipSyncProvider } from "./providers/emotion";
import type { SpeechRecognitionProvider } from "./providers/speech";
import type { TTSProvider } from "./providers/tts";
import type {
	CompanionContext,
	SpeechRecognitionResult,
	WebSocketEvent,
} from "./types";

export class CompanionEngine {
	private config: CompanionConfig;
	private context: CompanionContext = { vrm: null };

	private animationProvider?: AnimationProvider;
	private ttsProvider?: TTSProvider;
	private speechProvider?: SpeechRecognitionProvider;
	private emotionProvider?: EmotionProvider;
	private lipSyncProvider?: LipSyncProvider;
	private eventHandlers: EventHandler[] = [];

	private websocket?: WebSocket;

	private currentAction?: THREE.AnimationAction;

	constructor(config: CompanionConfig) {
		this.config = config;
	}

	setAnimationProvider(provider: AnimationProvider): void {
		this.animationProvider = provider;
	}

	setTTSProvider(provider: TTSProvider): void {
		this.ttsProvider = provider;
	}

	setSpeechProvider(provider: SpeechRecognitionProvider): void {
		if (this.speechProvider) {
			this.speechProvider.stopListening();
		}
		this.speechProvider = provider;
		this.setupSpeechRecognition();
	}

	setEmotionProvider(provider: EmotionProvider): void {
		this.emotionProvider = provider;
		if (this.context.vrm) {
			provider.setVRM(this.context.vrm);
		}
	}

	setLipSyncProvider(provider: LipSyncProvider): void {
		this.lipSyncProvider = provider;
		if (this.context.vrm) {
			provider.setVRM(this.context.vrm);
		}
		provider.initializeAudio();
	}

	addEventHandler(handler: EventHandler): void {
		this.eventHandlers.push(handler);
	}

	setVRM(vrm: VRM, mixer?: THREE.AnimationMixer): void {
		this.context.vrm = vrm;
		if (mixer) {
			this.context.mixer = mixer;
		}
		if (this.emotionProvider && vrm) {
			this.emotionProvider.setVRM(vrm);
		}
		if (this.config.enableLipSync && this.lipSyncProvider && vrm) {
			this.lipSyncProvider.setVRM(vrm);
		}
	}

	removeEventHandler(handler: EventHandler): void {
		const index = this.eventHandlers.indexOf(handler);
		if (index > -1) {
			this.eventHandlers.splice(index, 1);
		}
	}

	async init(): Promise<void> {
		try {
			this.config.validate();
			this.setupWebSocket();
		} catch (error) {
			console.error("Failed to initialize companion engine:", error);
			throw error;
		}
	}

	update(deltaTime: number): void {
		if (this.context.mixer) {
			this.context.mixer.update(deltaTime);
		}
		if (this.context.vrm) {
			this.context.vrm.update(deltaTime);
		}
		if (this.config.enableEmotions && this.emotionProvider?.update) {
			this.emotionProvider.update(deltaTime);
		}
		if (
			this.config.enableEmotions &&
			this.config.enableLipSync &&
			this.lipSyncProvider?.update
		) {
			this.lipSyncProvider.update(deltaTime);
		}
	}

	startListening(): void {
		if (!this.config.enableSpeechRecognition) {
			console.warn("SpeechRecognition is disabled.");
			return;
		}
		if (!this.speechProvider) {
			console.warn("No speech recognition provider set");
			return;
		}
		this.speechProvider.startListening();
	}

	stopListening(): void {
		if (!this.config.enableSpeechRecognition) {
			console.warn("SpeechRecognition is disabled.");
			return;
		}
		if (!this.speechProvider) {
			console.warn("No speech recognition provider set");
			return;
		}
		this.speechProvider.stopListening();
	}

	async playAnimation(url: string): Promise<void> {
		if (!this.config.enableAnimations) {
			console.warn("Animation is disabled.");
			return;
		}
		if (!this.animationProvider || !this.context.vrm || !this.context.mixer) {
			console.warn("Cannot play animation: missing required components");
			return;
		}
		try {
			const clip = await this.animationProvider.loadAnimation(
				url,
				this.context.vrm,
			);
			if (!clip) {
				console.warn(`Failed to load animation from ${url}`);
				return;
			}
			const action = this.context.mixer.clipAction(clip);
			action.setLoop(THREE.LoopOnce, 1);
			action.clampWhenFinished = true;
			if (this.currentAction) {
				this.currentAction.crossFadeTo(action, 0.2, false);
			}
			action.play();
			this.currentAction = action;
		} catch (error) {
			console.error("Failed to play animation:", error);
		}
	}

	async speak(text: string): Promise<void> {
		if (!this.config.enableVoice) {
			console.warn("Voice is disabled.");
			return;
		}
		if (!this.ttsProvider) {
			console.warn("No TTS provider set");
			return;
		}
		try {
			const audioSource = await this.ttsProvider.synthesize(text);

			if (this.lipSyncProvider && audioSource.getAudioNode) {
				const audioNode = audioSource.getAudioNode();
				if (audioNode) {
					this.lipSyncProvider.connectAudioSource(audioNode);
				}
			}

			await audioSource.play();
		} catch (error) {
			console.error("Failed to speak text:", error);
		}
	}

	setEmotion(emotion: string, intensity: number): void {
		if (!this.config.enableEmotions) {
			console.warn("Emotion is disabled.");
			return;
		}
		if (!this.emotionProvider) {
			console.warn("No emotion provider set");
			return;
		}
		this.emotionProvider.setEmotion(emotion, intensity);
	}

	private setupWebSocket(): void {
		try {
			this.websocket = new WebSocket(this.config.websocketUrl);
			this.websocket.onmessage = async (event) => {
				try {
					const data: WebSocketEvent = JSON.parse(event.data);
					await this.handleWebSocketEvent(data);
				} catch (error) {
					console.error("Failed to handle WebSocket event:", error);
				}
			};
			this.websocket.onopen = () => {
				console.log("WebSocket connected");
			};
			this.websocket.onclose = () => {
				console.log("WebSocket disconnected");
			};
			this.websocket.onerror = (error) => {
				console.error("WebSocket error:", error);
			};
		} catch (error) {
			console.error("Failed to setup WebSocket:", error);
		}
	}

	private async handleWebSocketEvent(event: WebSocketEvent): Promise<void> {
		if (event.from === this.config.companionId) {
			for (const handler of this.eventHandlers) {
				if (handler.canHandle(event)) {
					try {
						await handler.handle(event, this);
					} catch (error) {
						console.error(`Handler ${handler.getName()} failed:`, error);
					}
				}
			}
		}
	}

	private setupSpeechRecognition(): void {
		if (!this.config.enableSpeechRecognition) {
			console.warn("SpeechRecognition is disabled.");
			return;
		}
		if (!this.speechProvider) {
			console.warn("No speech provider set");
			return;
		}

		this.speechProvider.onResult((result: SpeechRecognitionResult) => {
			if (result.transcript.length >= 5) {
				this.handleSpeechResult(result.transcript);
			}
		});

		this.speechProvider.onError((error) => {
			console.error("Speech recognition error:", error);
		});
	}

	private async handleSpeechResult(transcript: string): Promise<void> {
		if (!this.websocket) return;
		this.websocket.send(
			JSON.stringify({
				id: crypto.randomUUID(),
				from: `user_${this.config.userName}`,
				to: [this.config.companionId],
				message: transcript,
			}),
		);
	}

	dispose(): void {
		this.websocket?.close();
		this.speechProvider?.stopListening();
	}
}
