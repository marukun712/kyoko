import type { VRM } from "@pixiv/three-vrm";
import type * as THREE from "three";

export interface CompanionConfig {
	modelName: string;
	modelPath?: string;
	websocketUrl?: string;
	companionId?: string;
	companionUrl?: string;
	canvas?: HTMLCanvasElement;
}

export interface CompanionContext {
	vrm?: VRM;
	scene?: THREE.Scene;
	mixer?: THREE.AnimationMixer;
	audioContext?: AudioContext;
	analyser?: AnalyserNode;
}

export interface AudioSource {
	play(): Promise<void>;
	pause(): void;
	stop(): void;
	onEnded?: () => void;
}

export interface SpeechRecognitionResult {
	transcript: string;
	confidence: number;
	isFinal: boolean;
}

export interface WebSocketEvent {
	type?: string;
	name?: string;
	from?: string;
	to?: string | string[];
	message?: string;
	metadata?: {
		emotion?: string;
		[key: string]: any;
	};
	params?: {
		url?: string;
		[key: string]: any;
	};
}
