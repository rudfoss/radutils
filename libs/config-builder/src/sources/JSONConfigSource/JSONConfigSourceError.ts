import { ConfigBuilderError } from "../../errors/ConfigBuilderError"

export class JSONConfigSourceError<TInnerError = unknown> extends ConfigBuilderError {
	public constructor(message: string, public innerError?: TInnerError) {
		super(innerError instanceof Error ? innerError.message : message)
		if (innerError instanceof Error) {
			this.stack = innerError.stack
		}
	}
}
