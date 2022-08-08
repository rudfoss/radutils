import { Formatter } from "../ConfigBuilderTypes"

export interface AsNumberFormatterOptions {
	/**
	 * If set will fix the number to the specified number of decimals using `Number.prototype.toFixed`.
	 */
	toFixed?: number
}

/**
 * Converts the value to a number. If the value cannot be converted returns `NaN`.
 */
export const asNumber =
	({ toFixed }: AsNumberFormatterOptions = {}): Formatter<number> =>
	(value) => {
		let numValue = NaN
		if (typeof value === "string") {
			if (value.startsWith("0x")) {
				numValue = parseInt(value)
			} else {
				numValue = parseFloat(value)
			}
		}
		if (typeof value === "number") {
			numValue = value
		}

		if (toFixed !== undefined) {
			numValue = parseFloat(numValue.toFixed(toFixed))
		}

		return numValue
	}

/**
 * Converts the number to an integer using rounding to 0 decimals with `toFixed`.
 * @alias `asNumber({ toFixed: 0 })`
 */
export const asInt = () => asNumber({ toFixed: 0 })
