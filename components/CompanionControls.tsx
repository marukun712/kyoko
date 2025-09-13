"use client";

interface CompanionControlsProps {
	onInit?: () => void;
	onStartListening?: () => void;
	onStopListening?: () => void;
	isListening?: boolean;
	isInitialized?: boolean;
	style?: React.CSSProperties;
	className?: string;
}

const defaultButtonStyle: React.CSSProperties = {
	position: "absolute",
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
	onStopListening,
	isListening = false,
	isInitialized = false,
	style,
	className,
}: CompanionControlsProps) {
	return (
		<div style={style} className={className}>
			{!isInitialized && (
				<button
					onClick={onInit}
					type="button"
					style={{
						...defaultButtonStyle,
						left: "20px",
					}}
				>
					Start
				</button>
			)}

			{isInitialized && (
				<button
					onClick={isListening ? onStopListening : onStartListening}
					type="button"
					style={{
						...defaultButtonStyle,
						left: isInitialized ? "20px" : "120px",
						backgroundColor: isListening ? "#dc3545" : "#ff69b4",
					}}
				>
					{isListening ? "Stop" : "Talk"}
				</button>
			)}
		</div>
	);
}
