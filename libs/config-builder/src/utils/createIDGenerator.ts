/**
 * Returns a new function that, when called generates a id-string. The string includes a counter that increments on each
 * call ensuring the string is unique. Two id generators with the same parameters will generate identical ids in order.
 *
 * Format: `"{prefix}{counter}{suffix}"`
 *
 * Note: Reloading the page will reset the generator.
 * @param prefix A prefix string to prepend to every id.
 * @returns
 */
export const createIDGenerator = (prefix = "") => {
	let incrementor = 0
	return (suffix = "") => {
		return `${prefix}${incrementor++}${suffix}`
	}
}
