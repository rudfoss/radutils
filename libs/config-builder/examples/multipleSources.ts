import { ConfigBuilder } from "@radutils/config-builder"
import { EnvConfigSource, JSONConfigSource } from "@radutils/config-builder/sources"
import fs from "fs"

const start = async () => {
	// Configure a json config source that reads a json file from disk
	const jsonConfigSource = new JSONConfigSource({
		get: () =>
			new Promise((resolve, reject) => {
				fs.readFile("jsonConfig.json", "utf-8", (err, data) => {
					if (err) {
						reject(err)
						return
					}

					resolve(JSON.parse(data))
				})
			})
	})

	// Create our config sources in prioritized order. For each key if env source returns undefined try json config source
	// This allows us to "override" configurations with environment variables or fall back to json as default
	const configBuilder = new ConfigBuilder([new EnvConfigSource(), jsonConfigSource])

	// building works the same way as allways and will use the value from the first source that returns something
	const config = await configBuilder.build((req) => ({
		nodeEnv: req("NODE_ENV"),
		computerName: req("computerName")
	}))

	console.log(config.computerName)
}

start()
