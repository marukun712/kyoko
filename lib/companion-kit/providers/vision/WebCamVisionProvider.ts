import { VisionProvider } from "./VisionProvider";

export class WebCamVisionProvider extends VisionProvider {
	private videoElement?: HTMLVideoElement;
	private canvasElement?: HTMLCanvasElement;
	private stream?: MediaStream;

	async initialize(): Promise<void> {
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: true,
			});

			this.videoElement = document.createElement("video");
			this.videoElement.srcObject = this.stream;
			this.videoElement.autoplay = true;
			this.videoElement.muted = true;

			this.canvasElement = document.createElement("canvas");

			return new Promise((resolve) => {
				if (this.videoElement) {
					this.videoElement.onloadedmetadata = async () => {
						await this.videoElement?.play();
						resolve();
					};
				}
			});
		} catch (error) {
			throw new Error(`Failed to initialize camera: ${error}`);
		}
	}

	async Capture(): Promise<string> {
		if (!this.videoElement || !this.canvasElement) {
			throw new Error("WebCam not initialized. Call initialize() first.");
		}

		const video = this.videoElement;
		const canvas = this.canvasElement;
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Failed to get canvas context");
		}

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		const base64 = canvas.toDataURL("image/png");
		return base64;
	}
}
