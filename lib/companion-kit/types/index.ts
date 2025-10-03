import type { VRM } from "@pixiv/three-vrm";
import type * as THREE from "three";

export interface CompanionConfig {
	userName: string;
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
	getAudioNode?(audioContext: AudioContext): AudioNode | null;
}

export interface SpeechRecognitionResult {
	transcript: string;
}
