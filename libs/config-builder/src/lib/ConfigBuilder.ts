/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BuildFunction, ConfigSource, Formatter, OptionalConfig, RequiredConfig } from "./ConfigBuilderTypes"
import {
	ConfigBuilderBuildFunctionError,
	ConfigBuilderError,
	ConfigBuilderFormatterError,
	ConfigBuilderLifecycleError,
	ConfigBuilderMissingRequiredKeysError,
	ConfigBuilderResolveValueError
} from "./errors"
import { asString } from "./formatters"
import { findFirstOrDefault } from "./utils/findFirstOrDefault"
import { setMerger } from "./utils/setMerger"

const CONFIG_BUILDER_PLACEHOLDER_SYMBOL = Symbol("ConfigBuilderPlaceholder")
interface ConfigBuilderPlaceholder {
	_configBuilderType: typeof CONFIG_BUILDER_PLACEHOLDER_SYMBOL
	keys: string[]
	defaultValue?: unknown
	formatter?: Formatter<unknown>
	required: boolean
}
const isPlaceholder = (value: any): value is ConfigBuilderPlaceholder => {
	return typeof value === "object" && value._configBuilderType === CONFIG_BUILDER_PLACEHOLDER_SYMBOL
}

interface LifecycleListener<T> {
	fn: T
	self: object
}

/**
 * The `ConfigBuilder` class orchestrates the resolution of a config definition object defined in a build function into a proper configuration object. It does this by querying each config source in order and using the first non-undefined value that is returned. If a configuration key is required, but no source returns a value for it the builder will throw an error.
 */
export class ConfigBuilder {
	protected lifecycleListeners = {
		onBuildStart: new Set<LifecycleListener<ConfigSource["onBuildStart"]>>(),
		onBuildSuccess: new Set<LifecycleListener<ConfigSource["onBuildSuccess"]>>(),
		onBuildError: new Set<LifecycleListener<ConfigSource["onBuildError"]>>(),
		onBuildSettled: new Set<LifecycleListener<ConfigSource["onBuildSettled"]>>()
	}

	/**
	 * Create a new `ConfigBuilder` instance with at least one config source.
	 * @param sources
	 */
	constructor(protected readonly sources: [ConfigSource, ...ConfigSource[]]) {
		for (const source of sources) {
			if (source.onBeforeBuild) {
				this.lifecycleListeners.onBeforeBuild.add({ fn: source.onBeforeBuild, self: source })
			}
			if (source.onSuccess) {
				this.lifecycleListeners.onSuccess.add({ fn: source.onSuccess, self: source })
			}
			if (source.onError) {
				this.lifecycleListeners.onError.add({ fn: source.onError, self: source })
			}
			if (source.onSettled) {
				this.lifecycleListeners.onSettled.add({ fn: source.onSettled, self: source })
			}
		}
	}

	protected async runOnBuildStart(requiredKeys: ReadonlySet<string>, optionalKeys: ReadonlySet<string>) {
		return ConfigBuilderLifecycleError.wrap(async () => {
			for (const { fn, self } of this.lifecycleListeners.onBuildStart) {
				await fn?.call(self, requiredKeys, optionalKeys)
			}
		}, "onBuildStart")
	}
	protected async runOnBuildSuccess<TConfig>(config: TConfig) {
		return ConfigBuilderLifecycleError.wrap(async () => {
			for (const { fn, self } of this.lifecycleListeners.onBuildSuccess) {
				await fn?.call(self, config)
			}
		}, "onBuildSuccess")
	}
	protected async runOnBuildError(error: ConfigBuilderError) {
		return ConfigBuilderLifecycleError.wrap(async () => {
			for (const { fn, self } of this.lifecycleListeners.onBuildError) {
				await fn?.call(self, error)
			}
		}, "onBuildError")
	}
	protected async runOnBuildSettled<TConfig>(config?: TConfig, error?: ConfigBuilderError) {
		try {
			return error ? this.runOnBuildError(error) : this.runOnBuildSuccess(config)
		} catch (err) {
			throw new ConfigBuilderLifecycleError((err as ConfigBuilderLifecycleError).innerError, "onBuildSettled")
		}
	}

	protected async resolveConfigKeyValues(keys: Iterable<string>) {
		const keyValues = new Map<string, unknown>()
		for (const key of keys) {
			for (let i = 0; i < this.sources.length; i++) {
				const source = this.sources[i]
				const value = await ConfigBuilderResolveValueError.wrap(() => source.get(key), key, i, source.constructor?.name)
				if (value !== undefined) {
					keyValues.set(key, value)
					break // Do not look in other sources
				}
			}
		}
		return keyValues
	}

	protected replaceConfigPlaceholders(
		configWithPlaceholders: Record<string, any>,
		keyValues: Map<string, unknown>,
		missingRequiredKeys: Set<string>
	) {
		// Handle case where value is an array. Since property and index accessors work the same this also works.
		const configObject: any = Array.isArray(configWithPlaceholders) ? [] : {}
		for (const [key, value] of Object.entries(configWithPlaceholders)) {
			if (isPlaceholder(value)) {
				const configValue = findFirstOrDefault(value.keys, keyValues, value.defaultValue)
				if (configValue === undefined && value.required) {
					setMerger(missingRequiredKeys)(value.keys[0])
				}
				try {
					configObject[key] = value.formatter ? value.formatter(configValue) : configValue
				} catch (err) {
					throw new ConfigBuilderFormatterError(err as any)
				}
				continue
			}

			// both actual objects AND arrays are of type "object". Therefore this will catch both.
			if (typeof value === "object") {
				configObject[key] = this.replaceConfigPlaceholders(configObject[key] as any, keyValues, missingRequiredKeys)
				continue
			}

			configObject[key] = value
		}
		return configObject
	}

	/**
	 * Builds the configuration object defined by the `buildFn` provided.
	 * @param buildFn
	 */
	public async build<TConfig>(buildFn: BuildFunction<TConfig>): Promise<TConfig> {
		try {
			const requiredKeys = setMerger<string>()
			const optionalKeys = setMerger<string>()

			const required: RequiredConfig = (key, formatter) => {
				const keys = Array.isArray(key) ? key : [key]
				requiredKeys(keys)
				return Object.freeze({
					_configBuilderType: CONFIG_BUILDER_PLACEHOLDER_SYMBOL,
					keys,
					formatter: formatter ?? asString,
					required: true
				} as ConfigBuilderPlaceholder) as any
			}
			const optional: OptionalConfig = (key, defaultValue, formatter) => {
				const keys = Array.isArray(key) ? key : [key]
				optionalKeys(keys)
				return Object.freeze({
					_configBuilderType: CONFIG_BUILDER_PLACEHOLDER_SYMBOL,
					keys,
					defaultValue,
					formatter: formatter ?? asString,
					required: false
				} as ConfigBuilderPlaceholder) as any
			}

			const configWithPlaceholders: Record<string, unknown> = ConfigBuilderBuildFunctionError.wrap(() =>
				buildFn(required, optional)
			) as any
			await this.runOnBuildStart(requiredKeys.set, optionalKeys.set)

			const keyValues = await this.resolveConfigKeyValues(setMerger<string>()(requiredKeys.set)(optionalKeys.set).set)
			const missingRequiredKeys = new Set<string>()
			const configObject = this.replaceConfigPlaceholders(configWithPlaceholders, keyValues, missingRequiredKeys)

			if (missingRequiredKeys.size > 0) {
				throw new ConfigBuilderMissingRequiredKeysError(Array.from(missingRequiredKeys))
			}

			await this.runOnBuildSuccess(configObject)
			await this.runOnBuildSettled(configObject)

			return configObject as TConfig
		} catch (err) {
			await this.runOnBuildError(err as any)
			await this.runOnBuildSettled(undefined, err as any)
			throw err
		}
	}
}
