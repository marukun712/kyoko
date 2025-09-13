import type { VRM } from "@pixiv/three-vrm";
import type * as THREE from "three";

export interface CompanionConfig {
	userName: string;
	modelName: string;
	modelPath: string;
	websocketUrl: string;
	companionId: string;
	canvas: HTMLCanvasElement;
}

export interface CompanionContext {
	vrm: VRM | null;
	mixer?: THREE.AnimationMixer;
}

export interface AudioSource {
	play(): Promise<void>;
	pause(): void;
	stop(): void;
	onEnded?: () => void;
	getAudioNode?(): AudioNode | null;
}

export interface SpeechRecognitionResult {
	transcript: string;
}

export interface WebSocketEvent {
	type: string;
	name: string;
	from: string;
	to: string | string[];
	message: string;
	//biome-ignore lint: suspicious/noExplicitAny
	metadata: Record<string, any>;
	//biome-ignore lint: suspicious/noExplicitAny
	params: Record<string, any>;
}
