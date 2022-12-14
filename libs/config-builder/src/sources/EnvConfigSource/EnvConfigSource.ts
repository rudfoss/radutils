import { ConfigSource } from "../../ConfigBuilderTypes"
import { findFirstOrDefault } from "../../utils/findFirstOrDefault"
import { defaultKeyTransformer } from "./defaultKeyTransformer"
import { EnvConfigSourceOptions } from "./EnvConfigSourceTypes"

/**
 * Source adapter for reading configuration values from environment variables. It can rewrite configuration keys before they are resolved in order to support a wider set of keys than what native environment variables support. You can also provide your own key transform function if needed.
 *
 * This source will look up values in the `process.env` object and may not be compatible with browsers unless a build system handles such cases.
 */
export class EnvConfigSource implements ConfigSource {
	protected readonly options: Required<EnvConfigSourceOptions>
	protected envCache?: Record<string, unknown>

	public constructor(options: EnvConfigSourceOptions = {}) {
		this.options = {
			keyTransform: defaultKeyTransformer,
			cacheMode: "perBuild",
			...options
		}

		if (this.options.cacheMode === "perInstance") {
			this.envCache = this.normalizedEnv
		}
	}

	protected get normalizedEnv() {
		const env: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(process.env)) {
			env[key.toUpperCase()] = value
		}
		return env
	}

	public onBuildStart() {
		if (this.options.cacheMode === "perBuild") {
			this.envCache = this.normalizedEnv
		}
	}

	public get<TValue>(key: string) {
		const keysToTry = this.options.keyTransform(key)

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const env: Record<string, TValue> = (this.envCache ?? this.normalizedEnv) as any

		return findFirstOrDefault<TValue>(Array.isArray(keysToTry) ? keysToTry : [keysToTry], env).value
	}

	public clone() {
		const newInstance = new EnvConfigSource(this.options)
		if (this.options.cacheMode === "perInstance") {
			newInstance.envCache = this.envCache
		}

		return newInstance
	}
}
