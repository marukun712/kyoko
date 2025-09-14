"use client";

interface CompanionControlsProps {
	onInit?: () => void;
	onStartListening?: () => void;
	isInitialized?: boolean;
	style?: React.CSSProperties;
	className?: string;
}

const defaultButtonStyle: React.CSSProperties = {
	position: "absolute",
	left: "20px",
	top: "20px",
	zIndex: 10,
	padding: "10px 20px",
	fontSize: "16px",
	borderRadius: "8px",
	backgroundColor: "#ff69b4",
	color: "#fff",
	border: "none",
	cursor: "pointer",
};

export function CompanionControls({
	onInit,
	onStartListening,
	isInitialized = false,
	style,
	className,
}: CompanionControlsProps) {
	return (
		<div style={style} className={className}>
			{!isInitialized && (
				<button onClick={onInit} type="button" style={defaultButtonStyle}>
					Start
				</button>
			)}

			{isInitialized && (
				<button
					onClick={onStartListening}
					type="button"
					style={defaultButtonStyle}
				>
					Talk
				</button>
			)}
		</div>
	);
}
