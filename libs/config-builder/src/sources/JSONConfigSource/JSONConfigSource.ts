import { ConfigSource } from "../../ConfigBuilderTypes"
import { defaultLookupFunction } from "./defaultLookupFunction"
import { JSONConfigSourceError } from "./JSONConfigSourceError"
import { JSONConfigSourceOptions } from "./JSONConfigSourceTypes"

/**
 * The JSONConfigSource provides a way for any JSON object to work as a configuration value source. It uses a lookup function to resolve keys as object properties and can handle deep objects. You can also provide getter function that can read the JSON object from an async source such as a file or remote service.
 */
export class JSONConfigSource implements ConfigSource {
	protected readonly options: Required<Pick<JSONConfigSourceOptions, "lookup">> & JSONConfigSourceOptions
	protected objRef?: Record<string, unknown>

	public constructor(options: JSONConfigSourceOptions) {
		this.options = {
			lookup: defaultLookupFunction,
			...options
		}
		this.objRef = this.options.obj

		if (options.get && options.obj) {
			console.warn(
				"JSONConfigSource: Specifying both options.get and options.obj is redundant as only the obj option will be used."
			)
		}
	}

	public async onBuildStart() {
		if (this.options.obj) return
		try {
			this.objRef = await this.options.get()
		} catch (error) {
			throw new JSONConfigSourceError(
				"An error occurred while attempting to call getter for JSON configuration. See innerError for more information.",
				error
			)
		}
	}

	public async get<TValue>(key: string) {
		if (!this.objRef) {
			throw new JSONConfigSourceError(
				'The source object for JSON configurations was not populated. Did you provide an "obj" or "get" option?'
			)
		}

		return this.options.lookup(this.objRef, key) as TValue
	}
}
