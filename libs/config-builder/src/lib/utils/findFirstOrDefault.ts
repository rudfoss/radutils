/**
 * Returns the first non-undefined value from the map or the default value if no values are found.
 * @param keys
 * @param inKeyValues
 * @param defaultValue
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findFirstOrDefault = (keys: Iterable<string>, inKeyValues: Map<string, unknown>, defaultValue?: any) => {
	for (const key of keys) {
		if (inKeyValues.has(key)) {
			const value = inKeyValues.get(key)
			if (value !== undefined) return value
		}
	}

	return defaultValue
}
