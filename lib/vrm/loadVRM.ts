import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import * as THREE from "three";
import {
	type GLTF,
	GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js";

export function loadVRM(
	path: string,
): Promise<{ gltf: GLTF; helperRoot: THREE.Group }> {
	const loader = new GLTFLoader();
	loader.crossOrigin = "anonymous";

	//debug用のhelperRootを作成
	const helperRoot = new THREE.Group();
	helperRoot.renderOrder = 10000;

	loader.register((parser) => {
		return new VRMLoaderPlugin(parser, {
			helperRoot: helperRoot,
			autoUpdateHumanBones: true,
		});
	});

	return new Promise((resolve, reject) => {
		loader.load(
			path,
			(gltf: GLTF) => {
				if (gltf.userData.gltfExtensions?.VRM) {
					//VRM-0.xのモデルかどうかチェックする
					reject(
						"モデルのバージョンに互換性がありません。VRM-1.xのモデルを使用してください。",
					);
				}

				resolve({ gltf, helperRoot });
			},
			(progress: { loaded: number; total: number }) =>
				console.log(
					"Loading model...",
					100.0 * (progress.loaded / progress.total),
					"%",
				),
			(error) => {
				reject(error);
			},
		);
	});
}
