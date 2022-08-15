import { ConfigBuilderError } from "./ConfigBuilderError"

/**
 * Thrown if a formatter on a config value fails. See `innerError` on the instance for more information.
 */
export class ConfigBuilderFormatterError extends ConfigBuilderError {
	constructor(public readonly innerError: Error) {
		super(innerError.message)
		this.stack = innerError.stack
	}

	public static wrap<TResult>(fn: () => TResult) {
		try {
			return fn()
		} catch (err) {
			throw new ConfigBuilderFormatterError(err as Error)
		}
	}
}
