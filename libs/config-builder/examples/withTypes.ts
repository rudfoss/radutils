import { ConfigBuilder } from "@radutils/config-builder"
import { EnvConfigSource } from "@radutils/config-builder/sources"
import { asList } from "@radutils/config-builder/formatters"

// Define the builder function separately (preferrably in a separate file)
// Since it returns an async result it does not need to be declared async.
export const buildConfig = (builder: ConfigBuilder) => {
	return builder.build((req, opt) => {
		return {
			nodeEnv: req("NODE_ENV"),
			userName: req("userName"),
			domain: req("userdomain"),
			environment: {
				paths: req("PATH", asList()),
				computerName: opt("computerName"),
				architecture: opt("PROCESSOR_ARCHITECTURE", "AMD64")
			}
		}
	})
}

// Create an exportable type for the config object and use this
// This should be placed in the same file as the buildConfig function
export type Config = Awaited<ReturnType<typeof buildConfig>>

// A shorter version of the buildConfig function using auto-returning function expressions:
export const buildConfigShort = (builder: ConfigBuilder) =>
	builder.build((req, opt) => ({
		nodeEnv: req("NODE_ENV"),
		userName: req("userName"),
		domain: req("userdomain"),
		environment: {
			paths: req("PATH", asList()),
			computerName: opt("computerName"),
			architecture: opt("PROCESSOR_ARCHITECTURE", "AMD64")
		}
	}))

// We can now use the Config object within other interfaces
interface AppContext {
	config: Config
	configBuilder: ConfigBuilder
	nodeEnv: string
}

const start = async () => {
	// now we set up the builder...
	const configBuilder = new ConfigBuilder([new EnvConfigSource()])

	// ...and run the builder.
	const config = await buildConfig(configBuilder)

	// Populate an object matching our AppContext interface
	const context: AppContext = {
		config,
		configBuilder,
		nodeEnv: config.nodeEnv
	}

	// It is fully typed and can be passed to other functions as needed
	console.log(context.config.domain)
}

start()
