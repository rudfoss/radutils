import { Formatter } from "../ConfigBuilderTypes"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultStringSerializer = (value: any) => {
	return typeof value === "string" ? value : value?.toString()
}

export interface AsStringFormatterOptions {
	/**
	 * By default `asString` will call `toString()` on the value to convert it to a string unless the value is `undefined` or `null`. If that is not what you want you can specify your own serializer function here.
	 */
	serializer?: (value: unknown) => string
}

/**
 * Converts a value that is not undefined or null to a string if it is not a string already by using `toString()` or a custom serializer.
 */
export const asString =
	({ serializer = defaultStringSerializer }: AsStringFormatterOptions = {}): Formatter<string> =>
	(value: unknown) => {
		return serializer(value)
	}
