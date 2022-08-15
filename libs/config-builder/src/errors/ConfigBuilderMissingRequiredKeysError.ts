import { ConfigBuilderError } from "./ConfigBuilderError"

/**
 * Thrown if no config source returned a value for a configuration key that is required.
 */
export class ConfigBuilderMissingRequiredKeysError extends ConfigBuilderError {
	constructor(public keys: string[]) {
		super(`Missing required configuration keys: "${keys.join(", ")}"`)
	}
}
