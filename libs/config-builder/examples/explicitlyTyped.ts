import { ConfigBuilder } from "@radutils/config-builder"
import { EnvConfigSource } from "@radutils/config-builder/sources"
import { asList } from "@radutils/config-builder/formatters"

interface StaticConfig {
	nodeEnvironment: string
	paths: string[]
	computerName?: string
}

const start = async () => {
	// Create our builder
	const configBuilder = new ConfigBuilder([new EnvConfigSource()])

	// Run our build function with our explicit interface.
	// Our config object must now conform to it instead of the other way around
	const config = await configBuilder.build<StaticConfig>((req, opt) => ({
		nodeEnvironment: req("NODE_ENV"),
		paths: req("PATH", asList()), // Make sure to use a formatter that gives you the value you expect
		computerName: opt("computerName", "f")
	}))

	// Use the config as normal
	console.log(config.paths)
}

start()
