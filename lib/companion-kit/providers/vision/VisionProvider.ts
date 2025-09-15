export abstract class VisionProvider {
	abstract Capture(): Promise<string>;
}
