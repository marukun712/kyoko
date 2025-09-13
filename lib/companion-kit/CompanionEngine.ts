import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { loadVRM } from "../vrm/loadVRM";
import type { CompanionConfig } from "./CompanionConfig";
import type { EventHandler } from "./events";
import type { AnimationProvider } from "./providers/animation";
import type { EmotionProvider } from "./providers/emotion";
import type { SpeechRecognitionProvider } from "./providers/speech";
import type { TTSProvider } from "./providers/tts";
import type {
	CompanionContext,
	SpeechRecognitionResult,
	WebSocketEvent,
} from "./types";

export class CompanionEngine {
	private config: CompanionConfig;
	private context: CompanionContext = {};

	private animationProvider?: AnimationProvider;
	private ttsProvider?: TTSProvider;
	private speechProvider?: SpeechRecognitionProvider;
	private emotionProvider?: EmotionProvider;
	private eventHandlers: EventHandler[] = [];

	private websocket?: WebSocket;

	private currentAction?: THREE.AnimationAction;
	private timeDomainData = new Float32Array(2048);

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

	addEventHandler(handler: EventHandler): void {
		this.eventHandlers.push(handler);
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
			this.setupAudioContext();
		} catch (error) {
			console.error("Failed to initialize companion engine:", error);
			throw error;
		}
	}

	async loadCharacter(): Promise<{ gltf: GLTF; helperRoot: THREE.Group }> {
		try {
			const result = await loadVRM(this.config.modelPath);
			this.context.vrm = result.gltf.userData.vrm;
			this.context.mixer = new THREE.AnimationMixer(result.gltf.scene);

			if (this.emotionProvider && this.context.vrm) {
				this.emotionProvider.setVRM(this.context.vrm);
			}

			return result;
		} catch (error) {
			console.error("Failed to load VRM model:", error);
			throw error;
		}
	}

	attachToScene(scene: THREE.Scene, mixer?: THREE.AnimationMixer): void {
		if (this.context.vrm) {
			scene.add(this.context.vrm.scene);
		}
		if (mixer) {
			this.context.mixer = mixer;
		}
	}

	update(deltaTime: number): void {
		if (this.context.mixer) {
			this.context.mixer.update(deltaTime);
		}

		if (this.context.vrm) {
			this.context.vrm.update(deltaTime);
			this.updateLipSync();
		}
	}

	startListening(): void {
		if (!this.speechProvider) {
			console.warn("No speech recognition provider set");
			return;
		}
		this.speechProvider.startListening();
	}

	stopListening(): void {
		this.speechProvider?.stopListening();
	}

	async playAnimation(url: string): Promise<void> {
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
		if (!this.ttsProvider) {
			console.warn("No TTS provider set");
			return;
		}

		try {
			const audioSource = await this.ttsProvider.synthesize(text);
			await audioSource.play();
		} catch (error) {
			console.error("Failed to speak text:", error);
		}
	}

	setEmotion(emotion: string, intensity: number): void {
		this.emotionProvider?.setEmotion(emotion, intensity);
	}

	private setupWebSocket(): void {
		if (!this.config.websocketUrl) {
			console.warn("No WebSocket URL configured");
			return;
		}

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
						await handler.handle(event, this.context);
					} catch (error) {
						console.error(`Handler ${handler.getName()} failed:`, error);
					}
				}
			}
		}
	}

	private setupSpeechRecognition(): void {
		if (!this.speechProvider) return;

		this.speechProvider.onResult((result: SpeechRecognitionResult) => {
			if (result.isFinal && result.transcript.length >= 5) {
				this.handleSpeechResult(result.transcript);
			}
		});

		this.speechProvider.onError((error) => {
			console.error("Speech recognition error:", error);
		});
	}

	private async handleSpeechResult(transcript: string): Promise<void> {
		console.log("Speech recognized:", transcript);

		if (!this.config.companionUrl) {
			return;
		}

		try {
			await fetch(`${this.config.companionUrl}/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ from: "user", message: transcript }),
			});
		} catch (error) {
			console.error("Failed to send speech to companion:", error);
		}
	}

	private setupAudioContext(): void {
		if (!this.config.enableVoice) return;

		try {
			this.context.audioContext = new AudioContext();
			this.context.analyser = this.context.audioContext.createAnalyser();
		} catch (error) {
			console.error("Failed to setup audio context:", error);
		}
	}

	private updateLipSync(): void {
		if (!this.context.analyser || !this.context.vrm?.expressionManager) {
			return;
		}

		this.context.analyser.getFloatTimeDomainData(this.timeDomainData);

		let volume = 0;
		for (let i = 0; i < this.timeDomainData.length; i++) {
			volume = Math.max(volume, Math.abs(this.timeDomainData[i]));
		}

		volume = 1 / (1 + Math.exp(-45 * volume + 5));
		if (volume < 0.1) volume = 0;

		this.context.vrm.expressionManager.setValue("aa", volume);
	}

	dispose(): void {
		this.websocket?.close();
		this.speechProvider?.stopListening();
		this.context.audioContext?.close();
	}
}
