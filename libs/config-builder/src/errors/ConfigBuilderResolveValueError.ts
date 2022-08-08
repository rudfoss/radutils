import { ConfigBuilderError } from "./ConfigBuilderError"

export class ConfigBuilderResolveValueError extends ConfigBuilderError {
	constructor(
		public innerError: Error,
		public readonly key: string,
		public readonly sourceIndex: number,
		public readonly sourceName: string
	) {
		super(
			`Config source error for key "${key}" in source named "${sourceName}" at index ${sourceIndex}. See innerError for more information.`
		)
		this.stack = innerError.stack
	}

	public static async wrap<TResult>(fn: () => TResult, key: string, sourceIndex: number, sourceName: string) {
		try {
			return await fn()
		} catch (err) {
			throw new ConfigBuilderResolveValueError(err as Error, key, sourceIndex, sourceName)
		}
	}
}
