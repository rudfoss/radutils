import { XOR } from "ts-xor"

/**
 * Configuration options when an object is defined directly.
 */
interface JSONConfigSourceOptionsObject {
	/**
	 * An object that serves as the source for configuration data.
	 */
	obj: Record<string, unknown>
}

/**
 * Configuration options when a getter function is used as JSON source.
 */
interface JSONConfigSourceOptionsGetter {
	/**
	 * A function that returns the JSON object to serve as a source for configuration data.
	 */
	get: () => Record<string, unknown> | Promise<Record<string, unknown>>
}

interface JSONConfigSourceOptionsBase {
	/**
	 * Override the default lookup function with your own when you want to resolve keys differently.
	 * @obj The source JSON object to search.
	 * @key The key to search for.
	 * @return The function must return a value or undefined if no value is found
	 */
	lookup?: (obj: Record<string, unknown>, key: string) => unknown | undefined
}

/**
 * The configuration object for `JSONConfigSource`. It supports either a static object or a getter function for fetching a dynamic object. The fetch will occur on `onBuildStart`.
 */
export type JSONConfigSourceOptions = XOR<JSONConfigSourceOptionsObject, JSONConfigSourceOptionsGetter> &
	JSONConfigSourceOptionsBase
