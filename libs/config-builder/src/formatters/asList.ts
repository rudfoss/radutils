import { Formatter } from "../ConfigBuilderTypes"

export interface AsListFormatterOptions {
	/**
	 * Specify the substring or regex to split on.
	 * @default /[;,]/
	 */
	separator?: string | RegExp
	/**
	 * A value that limits the number of elements returned in the array.
	 */
	limit?: number
}

/**
 * Splits a string into separate elements using `String.prototype.split`. If the value os not a string it will simply be returned as is.
 * @returns
 */
export const asList =
	({ separator = /[;,]/, limit }: AsListFormatterOptions = {}): Formatter<string[]> =>
	(value) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (typeof value !== "string") return value as any
		return value.split(separator, limit)
	}
