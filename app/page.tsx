"use client";

import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import { CompanionControls } from "../components/CompanionControls";
import { CompanionViewer } from "../components/CompanionViewer";
import {
	CompanionConfig,
	CompanionEngine,
	GestureEventHandler,
	LipSyncProvider,
	MessageEventHandler,
	MixamoAnimationProvider,
	VOICEVOXProvider,
	VRMEmotionProvider,
	WebSpeechProvider,
} from "../lib/companion-kit";
import { loadVRM } from "../utils/vrm/loadVRM";

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

			const config = new CompanionConfig({
				userName: process.env.NEXT_PUBLIC_USER_NAME || "yamada",
				modelName: process.env.NEXT_PUBLIC_MODEL_NAME || "kyoko.vrm",
				websocketUrl:
					process.env.NEXT_PUBLIC_FIREHOSE_URL || "ws://localhost:8080",
				companionId: process.env.NEXT_PUBLIC_COMPANION_ID || "companion_kyoko",
			});

			const companionEngine = new CompanionEngine(config);

			companionEngine.setTTSProvider(
				new VOICEVOXProvider({
					baseUrl: process.env.VOICEVOX_URL || "http://127.0.0.1:50021",
					speaker: Number(process.env.VOICEVOX_SPEAKER) || 1,
				}),
			);
			companionEngine.setSpeechProvider(new WebSpeechProvider());
			companionEngine.setEmotionProvider(new VRMEmotionProvider());
			companionEngine.setLipSyncProvider(new LipSyncProvider());
			companionEngine.setAnimationProvider(new MixamoAnimationProvider());
			companionEngine.addEventHandler(new MessageEventHandler());
			companionEngine.addEventHandler(new GestureEventHandler());
			setEngine(companionEngine);
		},
		[],
	);

	const handleInit = useCallback(async () => {
		if (!engine || !sceneRef.current) return;
		try {
			await engine.init();

			const modelPath = `/models/${process.env.NEXT_PUBLIC_MODEL_NAME || "kyoko.vrm"}`;
			const { gltf } = await loadVRM(modelPath);
			const vrm = gltf.userData.vrm;
			const mixer = new THREE.AnimationMixer(gltf.scene);
			sceneRef.current.scene.add(gltf.scene);
			engine.setVRM(vrm, mixer);

			const components = sceneRef.current;
			const animate = () => {
				requestAnimationFrame(animate);
				const deltaTime = components.clock.getDelta();
				engine.update(deltaTime);
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
