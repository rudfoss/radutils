# JSONConfigSource

This is a configuration source for the [ConfigBuilder](../../..). It adds support for reading configuration values from a static JSON object or using an asynchronous getter function that can return a resolved object on each build run.

## Usage

Usage with a static object:

```typescript
import { ConfigBuilder, configSources } from "@radutils/config-builder"
const { JSONConfigSource } = configSources

const start = async () => {
	const configSourceObj = {
		foo: "foo",
		deep: {
			object: {
				bar: "bar"
			}
		}
	}

	// Create new instance of the source with a static object
	const jsonConfigSource = new JSONConfigSource({ obj: configSourceObj })

	// Create builder based on the source
	const builder = new ConfigBuilder([jsonConfigSource])

	// Build configuration
	const config = await builder.build(buildFn)
}

start()
```

Usage with a getter that loads a file

```typescript
import * as fs from "fs"
import { ConfigBuilder, configSources } from "@radutils/config-builder"
const { JSONConfigSource } = configSources

// Define a function that reads a JSON file from disk.
const getJSONConfigFile = async () => {
	// fs does not use promises so we wrap it here. Alternatively you can use `utils.promisify` or a library like `fs-extra`
	return new Promise((resolve, reject) => {
		fs.readFile("path/to/file.json", "utf-8", (err, data) => {
			if (err) {
				reject(err)
			}
			resolve(JSON.parse(data))
		})
	})
}

const start = async () => {
	// Create new instance of the source with a getter
	const jsonConfigSource = new JSONConfigSource({ get: getJSONConfigFile })

	// Create builder based on the source
	const builder = new ConfigBuilder([jsonConfigSource])

	// Build configuration
	const config = await builder.build(buildFn)
}

start()
```

## Options

The options object consists of two mutually exclusive interfaces and a base interface. Read more about them [here](./EnvConfigSourceTypes.ts#L35).