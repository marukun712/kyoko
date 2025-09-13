"use client";

import { useCallback, useRef, useState } from "react";
import type * as THREE from "three";
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

	const sceneRef = useRef<{
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		clock: THREE.Clock;
	} | null>(null);

	const handleSceneReady = useCallback(
		(components: {
			scene: THREE.Scene;
			camera: THREE.PerspectiveCamera;
			renderer: THREE.WebGLRenderer;
			clock: THREE.Clock;
		}) => {
			sceneRef.current = components;

			// CompanionEngine初期化
			const config = new CompanionConfig({
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

			// レンダーループは後で開始
		},
		[],
	);

	const handleInit = useCallback(async () => {
		if (!engine || !sceneRef.current) return;

		try {
			await engine.init();

			// キャラクター読み込み
			const _gltf = await engine.loadCharacter();

			// シーンにアタッチ
			engine.attachToScene(sceneRef.current.scene);

			// レンダーループ開始
			const components = sceneRef.current;
			const animate = () => {
				requestAnimationFrame(animate);

				const deltaTime = components.clock.getDelta();

				// CompanionEngineのキャラクター更新
				engine.update(deltaTime);

				// レンダリング
				components.renderer.render(components.scene, components.camera);
			};

			animate();

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
			<CompanionViewer onSceneReady={handleSceneReady} />
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
