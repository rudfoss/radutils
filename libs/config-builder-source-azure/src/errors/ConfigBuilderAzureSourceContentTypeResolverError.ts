import { ConfigBuilderAzureSourceError } from "./ConfigBuilderAzureSourceError"

/**
 * Thrown if a content type resolver throws an error. See innerError for more information
 */
export class ConfigBuilderAzureSourceContentTypeResolverError extends ConfigBuilderAzureSourceError {
	public constructor(message?: string, public innerError?: Error) {
		super(message)
		if (innerError) {
			this.stack = innerError.stack
		}
	}
}
