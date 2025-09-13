import type { VRM } from "@pixiv/three-vrm";
import type * as THREE from "three";

export abstract class AnimationProvider {
	abstract loadAnimation(
		url: string,
		vrm: VRM,
	): Promise<THREE.AnimationClip | undefined>;

	abstract getName(): string;

	protected validateVRM(vrm: VRM): void {
		if (!vrm) {
			throw new Error("VRM model is required for animation loading");
		}
	}

	protected validateUrl(url: string): void {
		if (!url || typeof url !== "string") {
			throw new Error("Valid animation URL is required");
		}
	}
}
