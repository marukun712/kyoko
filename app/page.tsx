"use client";

import { useCallback, useState } from "react";
import { CompanionControls } from "../components/CompanionControls";
import { CompanionViewer } from "../components/CompanionViewer";
import {
	CompanionConfig,
	CompanionEngine,
	GestureEventHandler,
	MessageEventHandler,
	MixamoAnimationProvider,
	VOICEVOXProvider,
	VRMEmotionProvider,
	WebSpeechProvider,
} from "../lib/companion-kit";

export default function Home() {
	const [engine, setEngine] = useState<CompanionEngine | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [isListening, setIsListening] = useState(false);

	const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
		const config = new CompanionConfig({
			canvas,
			modelName: process.env.NEXT_PUBLIC_MODEL_NAME || "kyoko.vrm",
			websocketUrl: process.env.NEXT_PUBLIC_FIREHOSE_URL,
			companionId: process.env.NEXT_PUBLIC_COMPANION_ID,
			companionUrl: process.env.NEXT_PUBLIC_COMPANION_URL,
		});

		const companionEngine = new CompanionEngine(config);

		companionEngine.setTTSProvider(new VOICEVOXProvider());
		companionEngine.setSpeechProvider(new WebSpeechProvider());
		companionEngine.setEmotionProvider(new VRMEmotionProvider());
		companionEngine.setAnimationProvider(new MixamoAnimationProvider());

		companionEngine.addEventHandler(new MessageEventHandler());
		companionEngine.addEventHandler(new GestureEventHandler());

		setEngine(companionEngine);
	}, []);

	const handleInit = useCallback(async () => {
		if (!engine) return;

		try {
			await engine.init();
			setIsInitialized(true);
		} catch (error) {
			console.error("Failed to initialize companion:", error);
		}
	}, [engine]);

	const handleStartListening = useCallback(() => {
		if (!engine) return;
		engine.startListening();
		setIsListening(true);
	}, [engine]);

	const handleStopListening = useCallback(() => {
		if (!engine) return;
		engine.stopListening();
		setIsListening(false);
	}, [engine]);

	return (
		<div style={{ position: "relative", width: "100vw", height: "100vh" }}>
			<CompanionViewer onCanvasReady={handleCanvasReady} />
			<CompanionControls
				onInit={handleInit}
				onStartListening={handleStartListening}
				onStopListening={handleStopListening}
				isListening={isListening}
				isInitialized={isInitialized}
			/>
		</div>
	);
}
