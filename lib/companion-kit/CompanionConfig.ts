export interface CompanionConfigOptions {
	userName: string;
	modelName: string;
	modelPath?: string;
	websocketUrl: string;
	companionId: string;

	features?: {
		enableVoice?: boolean;
		enableSpeechRecognition?: boolean;
		enableEmotions?: boolean;
		enableLipSync?: boolean;
		enableAnimations?: boolean;
	};
}

export class CompanionConfig {
	public readonly userName: string;
	public readonly modelName: string;
	public readonly modelPath: string;
	public readonly websocketUrl: string;
	public readonly companionId: string;

	public readonly enableVoice: boolean = true;
	public readonly enableSpeechRecognition: boolean = true;
	public readonly enableEmotions: boolean = true;
	public readonly enableLipSync: boolean = true;
	public readonly enableAnimations: boolean = true;

	constructor(options: CompanionConfigOptions) {
		this.userName = options.modelName;
		this.modelName = options.modelName;
		this.modelPath = options.modelPath || `/models/${this.modelName}`;
		this.websocketUrl = options.websocketUrl;
		this.companionId = options.companionId;

		if (options.features) {
			this.enableVoice = options.features.enableVoice || true;
			this.enableSpeechRecognition =
				options.features.enableSpeechRecognition || true;
			this.enableEmotions = options.features.enableEmotions || true;
			this.enableLipSync = options.features.enableLipSync || true;
			this.enableAnimations = options.features.enableAnimations || true;
		}
	}

	validate(): void {
		if (
			!this.userName ||
			!this.modelName ||
			!this.modelPath ||
			!this.websocketUrl ||
			!this.companionId
		) {
			throw new Error("Validation failed.");
		}
	}
}
