import { ConfigBuilderError } from "./errors"

export const LIFECYCLE_NAMES = ["onBuildStart", "onBuildSuccess", "onBuildError", "onBuildSettled"] as const
export type LifecycleNames = typeof LIFECYCLE_NAMES[number]

/**
 * Defines a source of configuration values.
 */
export interface ConfigSource {
	/**
	 * Lifecycle function that is called before the configuration object is resolved. It receives the full set of all required and optional keys that is part of the configuration object defined in the build function.
	 */
	onBuildStart?: (requiredKeys: ReadonlySet<string>, optionalKeys: ReadonlySet<string>) => void | Promise<void>
	/**
	 * Lifecycle function that is called after the configuration object has been resolved without errors. It receives the full configuration object with final values.
	 */
	onBuildSuccess?: <TConfig = unknown>(config: TConfig) => void | Promise<void>
	/**
	 * Lifecycle function that is called if a fatal error occurs during the resolution of a configuration object.
	 */
	onBuildError?: (error: ConfigBuilderError) => void | Promise<void>
	/**
	 * Lifecycle function that is called after the configuration object has been resolved or if the resolution fails. The result will contain the error or the final configuration object.
	 */
	onBuildSettled?: <TConfig = unknown>(result: { error?: ConfigBuilderError; config?: TConfig }) => void | Promise<void>

	/**
	 * Resolves the value of a configuration key if it is known by the source. If the key is NOT known the function returns `undefined`.
	 * @param key The current configuration key to resolve.
	 */
	get<TValue>(key: string): TValue | undefined | Promise<TValue | undefined>
}

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
export type OptionalConfig = <TValueOut = undefined>(
	key: string | string[],
	defaultValue?: TValueOut,
	formatter?: Formatter<TValueOut>
) => TValueOut

/**
 * The build function describes a configuration object with required and optional configuration values. Static values are also supported. It receives two functions that can be used to reference config keys: `required` and `optional`.
 */
export type BuildFunction<TConfig> = (required: RequiredConfig, optional: OptionalConfig) => TConfig
