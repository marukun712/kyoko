import type { VRM } from "@pixiv/three-vrm";
import type * as THREE from "three";
import z from "zod";

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

export const StateBodySchema = z
	.object({
		from: z.string(),
		messageId: z.string().describe("このstateが対応する元のメッセージのID"),
		state: z
			.enum(["speak", "listen"])
			.describe("次に発言をしたいか、聞く姿勢に入りたいか"),
		importance: z
			.number()
			.min(0)
			.max(10)
			.describe("会話の文脈におけるあなたが次にしたい発言の重要度"),
		selected: z
			.boolean()
			.describe("前回の発言者の発言で、あなたに発言を求められているかどうか"),
		closing: z
			.enum(["none", "pre-closing", "closing", "terminal"])
			.default("none")
			.describe("会話の収束段階:なし/事前クロージング/クロージング/終端"),
	})
	.strict();
export type StateBody = z.infer<typeof StateBodySchema>;

export const StateSchema = z
	.object({
		jsonrpc: z.literal("2.0"),
		method: z.literal("state.send"),
		params: StateBodySchema,
	})
	.strict();
export type State = z.infer<typeof StateSchema>;

export const MessageSchema = z
	.object({
		jsonrpc: z.literal("2.0"),
		method: z.literal("message.send"),
		params: z.object({
			id: z.string(),
			from: z.string(),
			to: z.array(z.string()),
			message: z.string(),
			metadata: z.record(z.string(), z.any()).optional(),
		}),
	})
	.strict();
export type Message = z.infer<typeof MessageSchema>;

export const ActionSchema = z
	.object({
		jsonrpc: z.literal("2.0"),
		method: z.literal("action.send"),
		params: z.object({
			metadata: z.record(z.string(), z.any()).optional(),
			from: z.string(),
			name: z.string(),
			params: z.record(z.string(), z.any()),
		}),
	})
	.strict();
export type Action = z.infer<typeof ActionSchema>;

export const QuerySchema = z
	.object({
		jsonrpc: z.literal("2.0"),
		method: z.literal("query.send"),
		id: z.string(),
		params: z.object({
			from: z.string(),
			type: z.string(),
			body: z.record(z.string(), z.any()).optional(),
		}),
	})
	.strict();
export type Query = z.infer<typeof QuerySchema>;

export const QueryResultSchema = z
	.object({
		jsonrpc: z.literal("2.0"),
		id: z.string(),
		result: z
			.object({
				success: z.boolean(),
				body: z.record(z.string(), z.any()),
			})
			.optional(),
		error: z.string().optional().describe("エラーメッセージ"),
	})
	.strict();
export type QueryResult = z.infer<typeof QueryResultSchema>;
