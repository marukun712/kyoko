import type { SpeechRecognitionResult } from "../../types";

export abstract class SpeechRecognitionProvider {
	protected onResultCallback?: (result: SpeechRecognitionResult) => void;
	protected onErrorCallback?: (error: Error) => void;
	protected isListening = false;

	abstract startListening(): void;
	abstract stopListening(): void;
	abstract getName(): string;
	abstract isAvailable(): boolean;

	onResult(callback: (result: SpeechRecognitionResult) => void): void {
		this.onResultCallback = callback;
	}

	onError(callback: (error: Error) => void): void {
		this.onErrorCallback = callback;
	}

	getIsListening(): boolean {
		return this.isListening;
	}

	protected fireResult(result: SpeechRecognitionResult): void {
		this.onResultCallback?.(result);
	}

	protected fireError(error: Error): void {
		this.onErrorCallback?.(error);
	}
}
