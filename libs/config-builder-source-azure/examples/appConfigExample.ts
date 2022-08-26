import dotenv from "dotenv"
dotenv.config()

import { ConfigBuilder } from "@radutils/config-builder"
import { asBoolean } from "@radutils/config-builder/formatters"
import { EnvConfigSource, CacheConfigSource, NPMCache } from "@radutils/config-builder/sources"
import { ConfigSourceAzureAppConfiguration } from "@radutils/config-builder-source-azure"

/**
 * This example loads configurations from an associated Azure App Configuration instance with key vault references and caches them for re-use. Before running this example you must provision an App Configuration instance and optionally a Key Vault instance and
 */
const start = async () => {
	// Read endpoint from an environment variable.
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const endpoint = process.env["APPCONFIG_ENDPOINT"]!

	// Specify any labels to try in order, leave blank to use unlabelled value
	const labels: string[] = []

	// Instantiate the builder
	const builder = new ConfigBuilder([
		new CacheConfigSource({ cache: new NPMCache(), ttl: 1000 * 30 }), // Enable caching so that subsequent boot times are faster
		new EnvConfigSource(), // Allow overriding with env config if applicable
		ConfigSourceAzureAppConfiguration.createDefault({ endpoint, labels })
	])

	console.time("build")
	// Build config
	// Change keys to reflect your App Configuration settings
	const config = await builder.build((req, opt) => ({
		test: req("test-value"),
		overridden: opt("overridden", false, asBoolean())
	}))
	console.timeEnd("build")

	// Log the final configuration object
	console.log(config)
}

start()
