/**
 * The base error type for ConfigBuilder errors.
 */
export class ConfigBuilderError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = this.constructor.name
	}
}
