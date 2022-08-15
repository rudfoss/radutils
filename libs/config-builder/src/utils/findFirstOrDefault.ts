/**
 * Returns the first non-undefined value from the map or the default value if no values are found as well as the key for that value.
 * @param keys
 * @param inKeyValues
 * @param defaultValue
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findFirstOrDefault = <TValue = unknown>(
	keys: Iterable<string>,
	inKeyValues: Map<string, TValue> | Record<string, TValue>,
	defaultValue?: TValue
): { value: TValue | undefined; key?: string } => {
	if (inKeyValues instanceof Map) {
		for (const key of keys) {
			if (inKeyValues.has(key)) {
				const value = inKeyValues.get(key)
				if (value !== undefined) return { value, key }
			}
		}
	}

	// TODO: Make type inferrence work in this case so that instanceof can be removed.
	if (!(inKeyValues instanceof Map)) {
		for (const key of keys) {
			if (Object.hasOwn(inKeyValues, key)) {
				const value = inKeyValues[key]
				if (value !== undefined) return { value, key }
			}
		}
	}

	return { value: defaultValue }
}
