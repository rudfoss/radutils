// Import what we need to get started
import { ConfigBuilder } from "@radutils/config-builder"
import { EnvConfigSource } from "@radutils/config-builder/sources"
import { asList } from "@radutils/config-builder/formatters"

// Create an async function where we can build our configuration
const start = async () => {
	// Initialize source and builder
	const environmentVariableSource = new EnvConfigSource()
	const builder = new ConfigBuilder([environmentVariableSource])

	// Create our configuration using a build function passed to the builder
	const config = await builder.build((req, opt) => {
		return {
			// This value is required so we define it using "req". If the value is not found the builder will throw an error.
			nodeEnv: opt<string>("NODE_ENV"),

			//EnvConfigSource will normalize this name for us
			userName: req("userName"),
			domain: req("userdomain"),

			// Create any object structure you like
			environment: {
				// Paths is a long string of multiple values separated by ;
				// Use asList to split the string into a string array
				paths: req("PATH", asList()),

				// Specify an optional key, if it does not exist this config value will be undefined
				computerName: opt("computerName"),

				// Optional keys can specify a default which is used if no source returns a value for the key
				architecture: opt("PROCESSOR_ARCHITECTURE", "AMD64")
			}
		}
	})

	// If any of the required keys are not present the build call will throw an error and the code will not reach this point

	// Now we can read strongly typed config from our config object:
	console.log(config.nodeEnv) // nodeEnv is inferred to be a "string" (the default)
	console.log(config.environment.paths) // This would be a string array since we used asList above

	// We can use the same builder to create another config object if we want
	const frontEndConfig = await builder.build((req, opt) => {
		return {
			runtimeEnv: opt<string>("NODE_ENV"),
			currentUserName: req("USERNAME")
		}
	})

	// This config object is different, but compiled from the same sources as the first one.
	console.log(frontEndConfig.runtimeEnv)
	console.log(frontEndConfig.currentUserName)
}

start()
