import { Formatter } from "../ConfigBuilderTypes"

/**
 * Deserializes a JSON string value. If the value is not a string it is passed through untouched.
 */
export const asJson =
	<TDeserializedType>(): Formatter<TDeserializedType> =>
	(value) => {
		if (typeof value === "string") return JSON.parse(value)
		return value
	}
