"use client";

import { useEffect, useRef } from "react";

interface CompanionViewerProps {
	onCanvasReady?: (canvas: HTMLCanvasElement) => void;
	style?: React.CSSProperties;
	className?: string;
}

export function CompanionViewer({
	onCanvasReady,
	style = { width: "100%", height: "100%" },
	className,
}: CompanionViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasRef.current && onCanvasReady) {
			onCanvasReady(canvasRef.current);
		}
	}, [onCanvasReady]);

	return <canvas ref={canvasRef} style={style} className={className} />;
}
