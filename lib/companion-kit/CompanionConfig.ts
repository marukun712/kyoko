export interface CompanionConfigOptions {
	userName: string;
	modelName: string;
	websocketUrl: string;
	companionId: string;

	features?: {
		enableVoice?: boolean;
		enableSpeechRecognition?: boolean;
		enableEmotions?: boolean;
		enableLipSync?: boolean;
		enableAnimations?: boolean;
		enableVision?: boolean;
	};
}

export class CompanionConfig {
	public readonly userName: string;
	public readonly modelName: string;
	public readonly websocketUrl: string;
	public readonly companionId: string;

	public readonly enableVoice: boolean = true;
	public readonly enableSpeechRecognition: boolean = true;
	public readonly enableEmotions: boolean = true;
	public readonly enableLipSync: boolean = true;
	public readonly enableAnimations: boolean = true;
	public readonly enableVision: boolean = true;

	constructor(options: CompanionConfigOptions) {
		this.userName = options.userName;
		this.modelName = options.modelName;
		this.websocketUrl = options.websocketUrl;
		this.companionId = options.companionId;

		if (options.features) {
			this.enableVoice = options.features.enableVoice || true;
			this.enableSpeechRecognition =
				options.features.enableSpeechRecognition || true;
			this.enableEmotions = options.features.enableEmotions || true;
			this.enableLipSync = options.features.enableLipSync || true;
			this.enableAnimations = options.features.enableAnimations || true;
			this.enableVision = options.features.enableVision || true;
		}
	}

	validate(): void {
		if (
			!this.userName ||
			!this.modelName ||
			!this.websocketUrl ||
			!this.companionId
		) {
			throw new Error("Validation failed.");
		}
	}
}
