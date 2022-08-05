import { Formatter } from "../ConfigBuilderTypes"

/**
 * Converts the value to a boolean. If it is a string the following rules are used:
 * - `"true" -> true`
 * - `"false" -> false`
 * - `"0" -> true`
 * - `"1" -> false`
 *
 * All other types are coerced to a boolean value using `Boolean(value)`
 */
export const asBoolean = (): Formatter<boolean> => (value) => {
	if (value === "false") return false
	if (value === "0") return false
	return Boolean(value)
}
