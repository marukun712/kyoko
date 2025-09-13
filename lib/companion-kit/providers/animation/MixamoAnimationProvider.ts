import type { VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { mixamoVRMRigMap } from "../../../fbx/mixamoVRMRigMap";
import { AnimationProvider } from "./AnimationProvider";

export class MixamoAnimationProvider extends AnimationProvider {
	private loader = new FBXLoader();

	getName(): string {
		return "Mixamo";
	}

	async loadAnimation(
		url: string,
		vrm: VRM,
	): Promise<THREE.AnimationClip | undefined> {
		this.validateUrl(url);
		this.validateVRM(vrm);

		try {
			const asset = await this.loader.loadAsync(url);
			const clip = THREE.AnimationClip.findByName(
				asset.animations,
				"mixamo.com",
			);

			if (!clip || !asset) {
				console.warn(`No animation clip found in ${url}`);
				return undefined;
			}

			return this.convertMixamoAnimation(clip, asset, vrm);
		} catch (error) {
			console.error(`Failed to load Mixamo animation from ${url}:`, error);
			throw error;
		}
	}

	private convertMixamoAnimation(
		clip: THREE.AnimationClip,
		asset: THREE.Group,
		vrm: VRM,
	): THREE.AnimationClip {
		const tracks: THREE.QuaternionKeyframeTrack[] = [];
		const restRotationInverse = new THREE.Quaternion();
		const parentRestWorldRotation = new THREE.Quaternion();
		const _quatA = new THREE.Quaternion();
		const _vec3 = new THREE.Vector3();

		const hips = asset.getObjectByName("mixamorigHips");
		const vrmHips = vrm.humanoid.getNormalizedBoneNode("hips");

		if (!hips || !vrmHips) {
			console.warn("Could not find hips bones for animation conversion");
			return clip;
		}

		const motionHipsHeight = hips.position.y;
		const vrmHipsY = vrmHips.getWorldPosition(_vec3).y;
		const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
		const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
		const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

		for (const track of clip.tracks) {
			const trackSplitted = track.name.split(".");
			const mixamoRigName = trackSplitted[0];
			const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
			const vrmNodeName =
				vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
			const mixamoRigNode = asset.getObjectByName(mixamoRigName);

			if (!mixamoRigNode || !mixamoRigNode.parent || !vrmNodeName) {
				continue;
			}

			const propertyName = trackSplitted[1];
			mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
			mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

			if (track instanceof THREE.QuaternionKeyframeTrack) {
				for (let i = 0; i < track.values.length; i += 4) {
					const flatQuaternion = track.values.slice(i, i + 4);
					_quatA.fromArray(flatQuaternion);
					_quatA
						.premultiply(parentRestWorldRotation)
						.multiply(restRotationInverse);

					_quatA.toArray(flatQuaternion);
					for (let j = 0; j < flatQuaternion.length; j++) {
						track.values[i + j] = flatQuaternion[j];
					}
				}
				tracks.push(
					new THREE.QuaternionKeyframeTrack(
						`${vrmNodeName}.${propertyName}`,
						track.times,
						track.values.map((v, i) =>
							vrm.meta?.metaVersion === "0" && i % 2 === 0 ? -v : v,
						),
					),
				);
			} else if (track instanceof THREE.VectorKeyframeTrack) {
				const value = track.values.map(
					(v, i) =>
						(vrm.meta?.metaVersion === "0" && i % 3 !== 1 ? -v : v) *
						hipsPositionScale,
				);
				tracks.push(
					new THREE.VectorKeyframeTrack(
						`${vrmNodeName}.${propertyName}`,
						track.times,
						value,
					),
				);
			}
		}

		return new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
	}
}
