"use client";

import type { RefObject } from "react";

interface CompanionViewerProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	style?: React.CSSProperties;
	className?: string;
}

export function CompanionViewer({
	canvasRef,
	style = { width: "100%", height: "100%" },
	className,
}: CompanionViewerProps) {
	return <canvas ref={canvasRef} style={style} className={className} />;
}
