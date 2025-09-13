"use client";

import type { VRM } from "@pixiv/three-vrm";
import { useRef } from "react";
import * as THREE from "three";
import { loadMixamoAnimation } from "../lib/fbx/loadMixamoAnimation";
import { loadVRM } from "../lib/vrm/loadVRM";

let companionId: string;
if (!process.env.NEXT_PUBLIC_COMPANION_ID) {
	throw new Error("NEXT_PUBLIC_COMPANION_ID is required");
} else {
	companionId = process.env.NEXT_PUBLIC_COMPANION_ID;
}
let companionUrl: URL;
if (!process.env.NEXT_PUBLIC_COMPANION_URL) {
	throw new Error("NEXT_PUBLIC_COMPANION_URL is required");
} else {
	companionUrl = new URL(process.env.NEXT_PUBLIC_COMPANION_URL);
}
let modelName: string;
if (!process.env.NEXT_PUBLIC_MODEL_NAME) {
	throw new Error("NEXT_PUBLIC_MODEL_NAME is required");
} else {
	modelName = process.env.NEXT_PUBLIC_MODEL_NAME;
}
let firehoseUrl: string;
if (!process.env.NEXT_PUBLIC_FIREHOSE_URL) {
	throw new Error("NEXT_PUBLIC_FIREHOSE_URL is required");
} else {
	firehoseUrl = process.env.NEXT_PUBLIC_FIREHOSE_URL;
}

export default function Home() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const captureCanvasRef = useRef<HTMLCanvasElement>(null);

	let vrm: VRM;
	let mixer: THREE.AnimationMixer;
	let prevAnim: THREE.AnimationAction;
	const clock = new THREE.Clock();

	let audio: HTMLAudioElement;
	let recognition: SpeechRecognition;

	let audioCtx: AudioContext;
	let analyser: AnalyserNode;
	const timeDomainData = new Float32Array(2048);

	const talk = () => {
		recognition.start();
	};

	const init = async () => {
		if (!canvasRef.current || !captureCanvasRef.current) return;

		// --- WebSocket ---
		const ws = new WebSocket(firehoseUrl);
		ws.onmessage = async (evt) => {
			const json = JSON.parse(evt.data);
			if (
				"name" in json &&
				json.name === "gesture" &&
				json.from === companionId
			) {
				playMotion(json.params.url);
			}
			if ("message" in json && json.from === companionId) {
				["happy", "sad", "angry", "neutral"].forEach((value) => {
					value === json.metadata.emotion
						? vrm.expressionManager?.setValue(value, 1)
						: vrm.expressionManager?.setValue(value, 0);
				});

				const response = await fetch("/api/tts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text: json.message }),
				});

				if (!audioCtx) audioCtx = new AudioContext();
				if (!analyser) analyser = audioCtx.createAnalyser();

				const mediaSource = new MediaSource();
				if (audio) {
					audio.pause();
				}
				audio = new Audio();
				audio.src = URL.createObjectURL(mediaSource);
				audio.play();

				mediaSource.addEventListener("sourceopen", async () => {
					const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
					if (!response.body) return null;
					const reader = response.body.getReader();

					const pump = async () => {
						const { done, value } = await reader.read();
						if (done) {
							mediaSource.endOfStream();
							return;
						}
						sourceBuffer.appendBuffer(value);
						await new Promise((resolve) => {
							sourceBuffer.addEventListener("updateend", resolve, {
								once: true,
							});
						});
						pump();
					};
					pump();
				});

				const sourceNode = audioCtx.createMediaElementSource(audio);
				sourceNode.connect(audioCtx.destination);
				sourceNode.connect(analyser);
			}
		};

		// --- Three.js ---
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x212121);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
		directionalLight.position.set(1, 1, 1).normalize();
		scene.add(directionalLight);

		const ambientLight = new THREE.AmbientLight(0x404040, 2);
		scene.add(ambientLight);

		camera.position.set(0, 1, 1);

		// --- モーション ---
		const fadeToAction = (newAnim: THREE.AnimationAction, duration = 0.5) => {
			newAnim.play();
			if (prevAnim) prevAnim.crossFadeTo(newAnim, duration, false);
			prevAnim = newAnim;
		};

		const playIdle = async () => {
			const idleAnim = await loadMixamoAnimation("/models/Idle.fbx", vrm);
			if (!idleAnim) return;
			const newAnim = mixer.clipAction(idleAnim);
			newAnim.setLoop(THREE.LoopRepeat, Infinity);
			fadeToAction(newAnim, 0.5);
		};

		const playMotion = async (path: string) => {
			const anim = await loadMixamoAnimation(path, vrm);
			if (!anim) return;
			const newAnim = mixer.clipAction(anim);
			newAnim.setLoop(THREE.LoopOnce, 1);
			newAnim.clampWhenFinished = true;
			fadeToAction(newAnim, 0.2);
			mixer.addEventListener("finished", (e) => {
				if (e.action === newAnim) {
					playIdle();
				}
			});
		};

		const loadModel = async () => {
			const { gltf } = await loadVRM(`/models/${modelName}`);
			vrm = gltf.userData.vrm;
			scene.add(gltf.scene);
			mixer = new THREE.AnimationMixer(gltf.scene);
			playIdle();
		};

		const animate = () => {
			requestAnimationFrame(animate);
			const deltaTime = clock.getDelta();
			if (mixer) mixer.update(deltaTime);
			if (vrm) vrm.update(deltaTime);
			if (analyser && vrm.expressionManager) {
				analyser.getFloatTimeDomainData(timeDomainData);
				let volume = 0;
				for (let i = 0; i < timeDomainData.length; i++) {
					volume = Math.max(volume, Math.abs(timeDomainData[i]));
				}
				volume = 1 / (1 + Math.exp(-45 * volume + 5));
				if (volume < 0.1) volume = 0;
				vrm.expressionManager.setValue("aa", volume);
			}
			renderer.render(scene, camera);
		};

		window.addEventListener("resize", () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});

		// --- 発話認識 ---
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		recognition = new SpeechRecognition();
		recognition.lang = "ja-JP";
		recognition.continuous = true;
		recognition.interimResults = false;
		recognition.onresult = async (event: SpeechRecognitionEvent) => {
			const transcript = event.results[event.results.length - 1][0].transcript;
			if (transcript.length < 5) return;
			console.log(transcript);
			recognition.stop();
			await fetch(`${companionUrl.href}generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ from: "user", message: transcript }),
			});
		};

		await loadModel();
		animate();
	};

	return (
		<div style={{ position: "relative", width: "100vw", height: "100vh" }}>
			<canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
			<button
				onClick={init}
				type="button"
				style={{
					position: "absolute",
					top: "20px",
					left: "20px",
					zIndex: 10,
					padding: "10px 20px",
					fontSize: "16px",
					borderRadius: "8px",
					backgroundColor: "#ff69b4",
					color: "#fff",
					border: "none",
					cursor: "pointer",
				}}
			>
				Start
			</button>
			<button
				onClick={talk}
				type="button"
				style={{
					position: "absolute",
					top: "20px",
					left: "120px",
					zIndex: 10,
					padding: "10px 20px",
					fontSize: "16px",
					borderRadius: "8px",
					backgroundColor: "#ff69b4",
					color: "#fff",
					border: "none",
					cursor: "pointer",
				}}
			>
				Talk
			</button>
			<canvas ref={captureCanvasRef} style={{ display: "none" }} />
		</div>
	);
}
