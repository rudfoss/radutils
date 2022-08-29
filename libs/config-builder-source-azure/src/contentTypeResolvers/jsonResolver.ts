import { ContentTypeResolver } from "../ContentTypeResolver"

export const jsonContentType = "application/json"

/**
 * Parses a config setting JSON string to an object.
 */
export const jsonResolver = (): ContentTypeResolver<unknown> => (configSetting) => {
	const { value } = configSetting
	if (!value) return undefined
	return JSON.parse(value)
}
