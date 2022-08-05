/**
 * The default key transformer handles some common cases where keys may differ from what is generally supported as environment variable names. It replaces spaces, dashes and slashes `\/` with underscores and converts keys to uppercase.
 * @param key
 * @returns
 */
export const defaultKeyTransformer = (key: string) => {
	const keyWithNormalizedSpaces = key.replace(/[-\s/\\/]/g, "_")
	return [key, key.toLocaleUpperCase(), keyWithNormalizedSpaces, keyWithNormalizedSpaces.toLocaleUpperCase()]
}
