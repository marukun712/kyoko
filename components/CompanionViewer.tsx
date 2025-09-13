"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface CompanionViewerProps {
	onSceneReady?: (components: {
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		clock: THREE.Clock;
	}) => void;
	style?: React.CSSProperties;
	className?: string;
}

export function CompanionViewer({
	onSceneReady,
	style = { width: "100%", height: "100%" },
	className,
}: CompanionViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current || !onSceneReady) return;

		const canvas = canvasRef.current;

		// Three.jsシーン初期化
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			75,
			canvas.clientWidth / canvas.clientHeight,
			0.1,
			1000,
		);
		const renderer = new THREE.WebGLRenderer({ canvas });
		const clock = new THREE.Clock();

		// 基本設定
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setClearColor(0x212121);
		camera.position.set(0, 1, 1);

		// ライティング設定
		const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
		directionalLight.position.set(1, 1, 1).normalize();
		scene.add(directionalLight);

		const ambientLight = new THREE.AmbientLight(0x404040, 2);
		scene.add(ambientLight);

		// リサイズ処理
		const handleResize = () => {
			const { clientWidth, clientHeight } = canvas;
			camera.aspect = clientWidth / clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(clientWidth, clientHeight);
		};

		window.addEventListener("resize", handleResize);

		// コンポーネントを親に渡す
		onSceneReady({ scene, camera, renderer, clock });

		return () => {
			window.removeEventListener("resize", handleResize);
			renderer.dispose();
		};
	}, [onSceneReady]);

	return <canvas ref={canvasRef} style={style} className={className} />;
}
