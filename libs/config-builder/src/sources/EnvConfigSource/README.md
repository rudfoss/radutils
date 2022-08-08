# EnvConfigSource

This is a configuration source for the [ConfigBuilder](../../..). It adds support for reading configuration data from environment variables.

## Usage

```typescript
import { ConfigBuilder, configSources } from "@radutils/config-builder"

const start = async () => {
	// Create new instance of the source with default options
	const environmentVariableSource = new EnvConfigSource()

	// Alternatively specify custom options
	const environmentVariableSourceWithOptions = new EnvConfigSource({ cacheMode: "noCache" })

	// Create builder based on the source
	const builder = new ConfigBuilder([environmentVariableSource])

	// Build configuration
	const config = await builder.build(buildFn)
}

start()
```

## Options

[Link to the options interface](./EnvConfigSourceTypes.ts#L6)