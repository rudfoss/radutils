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
		onBuildStart: new Set<LifecycleListener<Required<ConfigSource>["onBuildStart"]>>(),
		onBuildSuccess: new Set<LifecycleListener<Required<ConfigSource>["onBuildSuccess"]>>(),
		onBuildError: new Set<LifecycleListener<Required<ConfigSource>["onBuildError"]>>(),
		onBuildSettled: new Set<LifecycleListener<Required<ConfigSource>["onBuildSettled"]>>()
	}

	/**
	 * Create a new `ConfigBuilder` instance with at least one config source.
	 * @param sources
	 */
	constructor(protected readonly sources: readonly [ConfigSource, ...ConfigSource[]]) {
		if (sources.length === 0) {
			throw new ConfigBuilderError("Must provide at least one source")
		}

		this.sources = sources.slice(0) as [ConfigSource, ...ConfigSource[]]
		for (const source of sources) {
			if (source.onBuildStart) {
				this.lifecycleListeners.onBuildStart.add({ fn: source.onBuildStart, self: source })
			}
			if (source.onBuildSuccess) {
				this.lifecycleListeners.onBuildSuccess.add({ fn: source.onBuildSuccess, self: source })
			}
			if (source.onBuildError) {
				this.lifecycleListeners.onBuildError.add({ fn: source.onBuildError, self: source })
			}
			if (source.onBuildSettled) {
				this.lifecycleListeners.onBuildSettled.add({ fn: source.onBuildSettled, self: source })
			}
		}
	}

	protected async runOnBuildStart(requiredKeys: ReadonlySet<string>, optionalKeys: ReadonlySet<string>) {
		return ConfigBuilderLifecycleError.wrap(async () => {
			for (const { fn, self } of this.lifecycleListeners.onBuildStart) {
				await fn.call(self, requiredKeys, optionalKeys)
			}
		}, "onBuildStart")
	}
	protected async runOnBuildSuccess<TConfig>(config: TConfig) {
		return ConfigBuilderLifecycleError.wrap(async () => {
			for (const { fn, self } of this.lifecycleListeners.onBuildSuccess) {
				await fn.call(self, config)
			}
		}, "onBuildSuccess")
	}
	protected async runOnBuildError(error: ConfigBuilderError) {
		return ConfigBuilderLifecycleError.wrap(async () => {
			for (const { fn, self } of this.lifecycleListeners.onBuildError) {
				await fn.call(self, error)
			}
		}, "onBuildError")
	}
	protected async runOnBuildSettled<TConfig>(config?: TConfig, error?: ConfigBuilderError) {
		return ConfigBuilderLifecycleError.wrap(async () => {
			for (const { fn, self } of this.lifecycleListeners.onBuildSettled) {
				await fn.call(self, { config, error })
			}
		}, "onBuildSettled")
	}

	protected async resolveConfigKeyValues(keys: Iterable<string>) {
		const keyValues = new Map<string, unknown>()
		for (const key of keys) {
			for (let i = 0; i < this.sources.length; i++) {
				const source = this.sources[i]
				const value = await ConfigBuilderResolveValueError.wrap(() => source.get(key), key, i, source.constructor.name)
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
					setMerger(missingRequiredKeys)([value.keys[0]])
					continue
				}
				configObject[key] = ConfigBuilderFormatterError.wrap(() =>
					value.formatter ? value.formatter(configValue) : configValue
				)
				continue
			}

			// both actual objects AND arrays are of type "object". Therefore this will catch both.
			if (typeof value === "object") {
				configObject[key] = this.replaceConfigPlaceholders(value as any, keyValues, missingRequiredKeys)
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
		let finalConfig: TConfig | undefined = undefined
		let configBuilderError: ConfigBuilderError | undefined = undefined

		const requiredKeys = setMerger<string>()
		const optionalKeys = setMerger<string>()

		const required: RequiredConfig = (key, formatter) => {
			const keys = Array.isArray(key) ? key : [key]
			requiredKeys(keys)
			return Object.freeze({
				_configBuilderType: CONFIG_BUILDER_PLACEHOLDER_SYMBOL,
				keys,
				formatter,
				required: true
			} as ConfigBuilderPlaceholder) as any
		}
		const optional: OptionalConfig = (key: string | string[], defaultValue?: any, formatter?: Formatter<any>) => {
			const keys = Array.isArray(key) ? key : [key]
			optionalKeys(keys)
			return Object.freeze({
				_configBuilderType: CONFIG_BUILDER_PLACEHOLDER_SYMBOL,
				keys,
				defaultValue,
				formatter,
				required: false
			} as ConfigBuilderPlaceholder) as any
		}

		try {
			const configWithPlaceholders: Record<string, unknown> = (await ConfigBuilderBuildFunctionError.wrap(() =>
				buildFn(required, optional)
			)) as any
			await this.runOnBuildStart(requiredKeys.set, optionalKeys.set)

			const keyValues = await this.resolveConfigKeyValues(setMerger<string>()(requiredKeys.set)(optionalKeys.set).set)
			const missingRequiredKeys = new Set<string>()
			const config = this.replaceConfigPlaceholders(configWithPlaceholders, keyValues, missingRequiredKeys)
			finalConfig = config

			if (missingRequiredKeys.size > 0) {
				throw new ConfigBuilderMissingRequiredKeysError(Array.from(missingRequiredKeys))
			}
		} catch (err) {
			configBuilderError = err as any
			await this.runOnBuildError(err as any)
			throw err
		} finally {
			await this.runOnBuildSettled(finalConfig, configBuilderError)
		}

		await this.runOnBuildSuccess(finalConfig)

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return finalConfig!
	}
}
