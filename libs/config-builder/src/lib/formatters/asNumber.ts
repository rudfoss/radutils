import { Formatter } from "../ConfigBuilderTypes"

export interface AsNumberFormatterOptions {
	/**
	 * If set will fix the number to the specified number of decimals.
	 */
	decimalDigits?: number
}

/**
 * Converts the value to a number. If the value cannot be converted returns `NaN`.
 */
export const asNumber =
	({ decimalDigits }: AsNumberFormatterOptions): Formatter<number> =>
	(value) => {
		let numValue = NaN
		if (typeof value === "string") {
			numValue = parseFloat(value)
		}
		if (typeof value === "number") {
			numValue = value
		}

		if (decimalDigits !== undefined) {
			numValue = parseFloat(numValue.toFixed(decimalDigits))
		}

		return numValue
	}

/**
 * Converts the number to an integer.
 * @alias `asNumber({ decimalDigits: 0 })`
 */
export const asInt = () => asNumber({ decimalDigits: 0 })
