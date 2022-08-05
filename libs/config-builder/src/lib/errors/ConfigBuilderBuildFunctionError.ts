import { ConfigBuilderError } from "./ConfigBuilderError"

/**
 * Thrown if an error is thrown when calling the build function.
 */
export class ConfigBuilderBuildFunctionError extends ConfigBuilderError {
	constructor(public readonly innerError: Error) {
		super(innerError.message)
		this.stack = innerError.stack
	}

	public static async wrap<TResult>(fn: () => TResult) {
		try {
			return await fn()
		} catch (err) {
			throw new ConfigBuilderBuildFunctionError(err as Error)
		}
	}
}
