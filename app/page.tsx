"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { VRButton } from "three/examples/jsm/Addons.js";
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

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let clock: THREE.Clock | null = null;
let engine: CompanionEngine | null = null;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleInit = async () => {
    if (!canvasRef.current || isInitialized) return;

    try {
      const { LookingGlassConfig, LookingGlassWebXRPolyfill } = await import(
        //@ts-expect-error
        "@lookingglass/webxr"
      );

      const canvas = canvasRef.current;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000,
      );
      renderer = new THREE.WebGLRenderer({ canvas });
      clock = new THREE.Clock();

      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x212121);
      renderer.xr.enabled = true;
      const lookingGlass = LookingGlassConfig;
      lookingGlass.targetY = 1.25;
      lookingGlass.targetZ = 0;
      lookingGlass.targetDiam = 0.7;
      lookingGlass.fovy = (14 * Math.PI) / 180;
      new LookingGlassWebXRPolyfill();
      document.body.appendChild(VRButton.createButton(renderer));

      camera.position.set(0, 1, 1);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(1, 1, 1).normalize();
      scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0x404040, 2);
      scene.add(ambientLight);

      const handleResize = () => {
        if (!canvas || !camera || !renderer) return;
        const { clientWidth, clientHeight } = canvas;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
      };
      window.addEventListener("resize", handleResize);

      handleResize();

      const config = new CompanionConfig({
        userName: process.env.NEXT_PUBLIC_USER_NAME || "yamada",
        modelName: process.env.NEXT_PUBLIC_MODEL_NAME || "kyoko.vrm",
        websocketUrl:
          process.env.NEXT_PUBLIC_FIREHOSE_URL || "ws://localhost:8080",
        companionId: process.env.NEXT_PUBLIC_COMPANION_ID || "companion_kyoko",
      });

      engine = new CompanionEngine(config);

      engine.setTTSProvider(
        new VOICEVOXProvider({
          baseUrl:
            process.env.NEXT_PUBLIC_VOICEVOX_URL || "http://127.0.0.1:50021",
          speaker: Number(process.env.NEXT_PUBLIC_VOICEVOX_SPEAKER) || 1,
        }),
      );
      engine.setSpeechProvider(new WebSpeechProvider());
      engine.setEmotionProvider(new VRMEmotionProvider());
      engine.setLipSyncProvider(new LipSyncProvider());
      engine.setAnimationProvider(new MixamoAnimationProvider());
      engine.addEventHandler(new MessageEventHandler());
      engine.addEventHandler(new GestureEventHandler());

      await engine.init();

      const modelPath = `/${process.env.NEXT_PUBLIC_MODEL_NAME || "kyoko.vrm"}`;
      const { gltf } = await loadVRM(modelPath);
      const vrm = gltf.userData.vrm;
      const mixer = new THREE.AnimationMixer(gltf.scene);
      scene.add(gltf.scene);
      engine.setVRM(vrm, mixer);

      const idleUrl = process.env.NEXT_PUBLIC_IDLE_ANIMATION_URL || "/idle.fbx";
      await engine.setIdleAnimation(idleUrl);
      await engine.playIdleAnimation();

      renderer.setAnimationLoop(() => {
        if (!engine || !renderer || !scene || !camera || !clock) return;
        const deltaTime = clock.getDelta();
        engine.update(deltaTime);
        renderer.render(scene, camera);
      });

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize companion:", error);
    }
  };

  const handleStartListening = () => {
    if (!engine) return;
    engine.startListening();
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <CompanionViewer canvasRef={canvasRef} />
      <CompanionControls
        onInit={handleInit}
        onStartListening={handleStartListening}
        isInitialized={isInitialized}
      />
    </div>
  );
}
