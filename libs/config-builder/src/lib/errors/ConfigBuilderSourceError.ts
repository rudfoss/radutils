import { ConfigBuilderError } from "./ConfigBuilderError"

/**
 * Wraps errors that occur within Config Sources. The message and stack of the inner error is copied to the `ConfigBuilderSourceError` instance.
 */
export class ConfigBuilderSourceError extends ConfigBuilderError {
	constructor(public innerError: Error) {
		super(innerError.message)
		this.stack = innerError.stack
	}

	public static wrap<TResult>(fn: () => TResult): TResult {
		try {
			return fn()
		} catch (err) {
			throw new ConfigBuilderSourceError(err as Error)
		}
	}
}
