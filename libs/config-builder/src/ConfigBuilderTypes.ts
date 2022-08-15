import { ConfigBuilderError } from "./errors"

export const LIFECYCLE_NAMES = ["onBuildStart", "onBuildSuccess", "onBuildError", "onBuildSettled"] as const
export type LifecycleNames = typeof LIFECYCLE_NAMES[number]

/**
 * Formatters convert values to other types.
 */
export type Formatter<TValueOut> = (value: unknown) => TValueOut

/**
 * A function that defines a configuration key that is required.
 */
export type RequiredConfig = <TValueOut = string>(key: string | string[], formatter?: Formatter<TValueOut>) => TValueOut

/**
 * A function that defines an optional configuration key. Optional keys may be undefined and will result in an undefined value unless a default value is also specified.
 */
export interface OptionalConfig {
	<TValueOut = unknown>(key: string | string[]): TValueOut | undefined
	<TValueOut>(key: string | string[], defaultValue: TValueOut): TValueOut
	<TValueOut = unknown>(key: string | string[], defaultValue: undefined, formatter: Formatter<TValueOut>):
		| TValueOut
		| undefined
	<TValueOut>(key: string | string[], defaultValue: unknown, formatter: Formatter<TValueOut>): TValueOut
}

/**
 * The build function describes a configuration object with required and optional configuration values. Static values are also supported. It receives two functions that can be used to reference config keys: `required` and `optional`.
 */
export type BuildFunction<TConfig> = (required: RequiredConfig, optional: OptionalConfig) => TConfig

/**
 * The build run context object is initialized for each build run and contains context information for the current build. It can be used by lifecycle functions to exchange information.
 */
export interface BuildRunContext {
	readonly buildFnRef: BuildFunction<unknown>
	readonly sharedData: Map<string, unknown>
}

/**
 * Describes the options provided as the only argument to the `onBuildStart` method on config sources.
 */
export interface OnBuildStartOptions {
	requiredKeys: ReadonlySet<string>
	optionalKeys: ReadonlySet<string>
	context: BuildRunContext
}

/**
 * Describes the options provided as the only argument to the `onBuildSuccess` method on config sources.
 */
export interface OnBuildSuccessOptions<TConfig = unknown> {
	config: TConfig
	keyValues: ReadonlyMap<string, unknown>
	context: BuildRunContext
}

/**
 * Describes the options provided as the only argument to the `onBuildError` method on config sources.
 */
export interface OnBuildErrorOptions {
	error: ConfigBuilderError
	context: BuildRunContext
}

/**
 * Defines a source of configuration values.
 */
export interface ConfigSource {
	/**
	 * Lifecycle function that is called before the configuration object is resolved. It receives the full set of all required and optional keys that is part of the configuration object defined in the build function.
	 */
	onBuildStart?: (options: OnBuildStartOptions) => void | Promise<void>
	/**
	 * Lifecycle function that is called after the configuration object has been resolved without errors. It receives the full configuration object with final values as well as a key-value store of every key and its final, resolved and formatted value.
	 */
	onBuildSuccess?: <TConfig = unknown>(options: OnBuildSuccessOptions<TConfig>) => void | Promise<void>
	/**
	 * Lifecycle function that is called if a fatal error occurs during the resolution of a configuration object.
	 */
	onBuildError?: (options: OnBuildErrorOptions) => void | Promise<void>

	/**
	 * Resolves the value of a configuration key if it is known by the source. If the key is NOT known the function returns `undefined`.
	 * @param key The current configuration key to resolve.
	 */
	get<TValue>(key: string): TValue | undefined | Promise<TValue | undefined>

	/**
	 * Creates a new identical instance of the config source. Is called before each build so that each run executes with their own, isolated instance of each config source in case they modify their internal state per build.
	 */
	clone: () => ConfigSource
}
