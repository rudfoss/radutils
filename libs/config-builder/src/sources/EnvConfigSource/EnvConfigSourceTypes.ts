/**
 * Transforms a key into one or more variants. The first variant that matches a defined environment variable is then returned by the getter.
 */
export type KeyTransform = (key: string) => string | string[]

export interface EnvConfigSourceOptions {
	/**
	 * Specify an optional key transform function to handle keys that may not directly map to environment variables.
	 * @default defaultKeyTransformer
	 */
	keyTransform?: KeyTransform

	/**
	 * Specify how to cache environment variables:
	 * - `none` Variables are not cached. Each lookup is done directly on `process.env` which may impact performance.
	 * - `perBuild` Variables are cached each time the `ConfigBuilder.build` function runs.
	 * - `perInstance` Variables are cached once per instance. Runtime changes in environment variables will not be reflected.
	 * @default perBuild
	 */
	cacheMode?: "noCache" | "perBuild" | "perInstance"
}
