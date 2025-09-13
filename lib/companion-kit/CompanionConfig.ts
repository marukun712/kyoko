export interface CompanionConfigOptions {
	modelName?: string;
	modelPath?: string;
	websocketUrl?: string;
	companionId?: string;
	companionUrl?: string;

	enableVoice?: boolean;
	enableSpeechRecognition?: boolean;
	enableEmotions?: boolean;
	enableAnimations?: boolean;

	voiceVoxConfig?: {
		baseUrl?: string;
		speaker?: number;
		apiKey?: string;
	};

	webSpeechConfig?: {
		language?: string;
		continuous?: boolean;
		interimResults?: boolean;
	};
}

export class CompanionConfig {
	public readonly modelName: string;
	public readonly modelPath: string;
	public readonly websocketUrl?: string;
	public readonly companionId?: string;
	public readonly companionUrl?: string;

	public readonly enableVoice: boolean;
	public readonly enableSpeechRecognition: boolean;
	public readonly enableEmotions: boolean;
	public readonly enableAnimations: boolean;

	public readonly voiceVoxConfig: {
		baseUrl: string;
		speaker: number;
		apiKey?: string;
	};

	public readonly webSpeechConfig: {
		language: string;
		continuous: boolean;
		interimResults: boolean;
	};

	constructor(options: CompanionConfigOptions = {}) {
		this.modelName =
			options.modelName ||
			this.getFromEnv("NEXT_PUBLIC_MODEL_NAME", "kyoko.vrm");
		this.modelPath = options.modelPath || `/models/${this.modelName}`;
		this.websocketUrl =
			options.websocketUrl || this.getFromEnv("NEXT_PUBLIC_FIREHOSE_URL");
		this.companionId =
			options.companionId || this.getFromEnv("NEXT_PUBLIC_COMPANION_ID");
		this.companionUrl =
			options.companionUrl || this.getFromEnv("NEXT_PUBLIC_COMPANION_URL");

		this.enableVoice = options.enableVoice ?? true;
		this.enableSpeechRecognition = options.enableSpeechRecognition ?? true;
		this.enableEmotions = options.enableEmotions ?? true;
		this.enableAnimations = options.enableAnimations ?? true;

		this.voiceVoxConfig = {
			baseUrl: options.voiceVoxConfig?.baseUrl || "http://localhost:50021",
			speaker: options.voiceVoxConfig?.speaker || 1,
			apiKey: options.voiceVoxConfig?.apiKey,
		};

		this.webSpeechConfig = {
			language: options.webSpeechConfig?.language || "ja-JP",
			continuous: options.webSpeechConfig?.continuous ?? true,
			interimResults: options.webSpeechConfig?.interimResults ?? false,
		};
	}

	private getFromEnv(key: string, defaultValue?: string): string | undefined {
		if (process?.env) {
			return process.env[key] || defaultValue;
		}
		return defaultValue;
	}

	validate(): void {
		if (!this.modelName) {
			throw new Error("Model name is required");
		}

		if (this.enableVoice && !this.voiceVoxConfig.baseUrl) {
			throw new Error("VoiceVox base URL is required when voice is enabled");
		}
	}

	static fromEnvironment(): CompanionConfig {
		return new CompanionConfig();
	}

	copy(overrides: Partial<CompanionConfigOptions>): CompanionConfig {
		return new CompanionConfig({
			modelName: this.modelName,
			modelPath: this.modelPath,
			websocketUrl: this.websocketUrl,
			companionId: this.companionId,
			companionUrl: this.companionUrl,
			enableVoice: this.enableVoice,
			enableSpeechRecognition: this.enableSpeechRecognition,
			enableEmotions: this.enableEmotions,
			enableAnimations: this.enableAnimations,
			voiceVoxConfig: { ...this.voiceVoxConfig },
			webSpeechConfig: { ...this.webSpeechConfig },
			...overrides,
		});
	}
}
