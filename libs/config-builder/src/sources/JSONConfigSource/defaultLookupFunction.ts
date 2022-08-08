// TODO: Fix this import (it compiles to a complete lodash import which is no bueno)
import { get } from "lodash"

/**
 * The default lookup function for `JSONConfigSource`. It will check if the object contains the specific key by directly passing it to lodash.get. Additionaly it will also try replacing `-` and `_` with `.` to handle those common configuration key formats.
 *
 * @see https://lodash.com/docs#get
 * @param obj The object to search
 * @param key The key to search for
 * @return The value found or undefined
 */
export const defaultLookupFunction = (obj: Record<string, unknown>, key: string) => {
	const keysToTry = [key, key.replace(/[-]/g, "."), key.replace(/[_]/g, "."), key.replace(/[-_]/g, ".")]
	for (const aKey of keysToTry) {
		const value = get(obj, aKey)
		if (value !== undefined) return value
	}
	return undefined
}
