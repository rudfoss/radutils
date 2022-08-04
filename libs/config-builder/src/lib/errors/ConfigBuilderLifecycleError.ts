import { LifecycleNames } from "../ConfigBuilderTypes"
import { ConfigBuilderError } from "./ConfigBuilderError"

/**
 * Thrown if an error occurs during execution of a lifecycle function.
 */
export class ConfigBuilderLifecycleError extends ConfigBuilderError {
	constructor(public innerError: Error, public readonly lifecycle: LifecycleNames) {
		super(innerError.message)
		this.stack = innerError.stack
	}

	public static wrap<TResult>(fn: () => TResult, lifecycle: LifecycleNames): TResult {
		try {
			return fn()
		} catch (err) {
			throw new ConfigBuilderLifecycleError(err as Error, lifecycle)
		}
	}
}
