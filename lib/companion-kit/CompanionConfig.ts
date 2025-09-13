export interface CompanionConfigOptions {
	userName: string;
	modelName: string;
	modelPath?: string;
	websocketUrl: string;
	companionId: string;

	enableVoice?: boolean;
	enableSpeechRecognition?: boolean;
	enableEmotions?: boolean;
	enableAnimations?: boolean;
}

export class CompanionConfig {
	public readonly userName: string;
	public readonly modelName: string;
	public readonly modelPath: string;
	public readonly websocketUrl: string;
	public readonly companionId: string;

	public readonly enableVoice?: boolean;
	public readonly enableSpeechRecognition?: boolean;
	public readonly enableEmotions?: boolean;
	public readonly enableAnimations?: boolean;

	constructor(options: CompanionConfigOptions) {
		this.userName = options.modelName;
		this.modelName = options.modelName;
		this.modelPath = options.modelPath || `/models/${this.modelName}`;
		this.websocketUrl = options.websocketUrl;
		this.companionId = options.companionId;

		this.enableVoice = options.enableVoice;
		this.enableSpeechRecognition = options.enableSpeechRecognition;
		this.enableEmotions = options.enableEmotions;
		this.enableAnimations = options.enableAnimations;
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
