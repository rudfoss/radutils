import { ConfigBuilderError } from "@radutils/config-builder"

export class ConfigBuilderAzureSourceError extends ConfigBuilderError {
	public constructor(message?: string) {
		super(message)
	}
}
