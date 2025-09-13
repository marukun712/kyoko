import type { SpeechRecognitionResult } from "../../types";
import { SpeechRecognitionProvider } from "./SpeechRecognitionProvider";

export class WebSpeechProvider extends SpeechRecognitionProvider {
	private recognition?: SpeechRecognition;

	constructor() {
		super();
		this.initializeRecognition();
	}

	getName(): string {
		return "Web Speech API";
	}

	isAvailable(): boolean {
		return (
			typeof window !== "undefined" &&
			(window.SpeechRecognition || window.webkitSpeechRecognition) !== undefined
		);
	}

	startListening(): void {
		if (!this.isAvailable()) {
			this.fireError(new Error("Speech recognition is not available"));
			return;
		}

		if (this.isListening) {
			return;
		}

		try {
			this.recognition?.start();
			this.isListening = true;
		} catch (error) {
			this.fireError(error instanceof Error ? error : new Error(String(error)));
		}
	}

	stopListening(): void {
		if (!this.isListening) {
			return;
		}

		try {
			this.recognition?.stop();
			this.isListening = false;
		} catch (error) {
			this.fireError(error instanceof Error ? error : new Error(String(error)));
		}
	}

	private initializeRecognition(): void {
		if (!this.isAvailable()) {
			return;
		}

		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		this.recognition = new SpeechRecognition();

		this.recognition.lang = "ja-JP";
		this.recognition.continuous = true;
		this.recognition.interimResults = false;

		this.recognition.onresult = (event: SpeechRecognitionEvent) => {
			const lastResult = event.results[event.results.length - 1];
			if (lastResult) {
				const result: SpeechRecognitionResult = {
					transcript: lastResult[0].transcript,
					confidence: lastResult[0].confidence,
					isFinal: lastResult.isFinal,
				};
				this.fireResult(result);
			}
		};

		this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			this.isListening = false;
			this.fireError(new Error(`Speech recognition error: ${event.error}`));
		};

		this.recognition.onend = () => {
			this.isListening = false;
		};
	}
}
