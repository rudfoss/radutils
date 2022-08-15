# `@radutils` ConfigBuilder

```
npm install @radutils/config-builder@beta
```

`@radutils` ConfigBuilder provides a type-safe way of compiling configuration options from multiple sources for your application. It separates the configuration definition from the source or sources allowing you to construct configuration objects declaratively and separated from where values come from and how they are retrieved. It also enables you to construct different configuration objects for multiple scenarios based on the same sources in a thread-safe way.

## Usage

```typescript
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
			nodeEnv: req("NODE_ENV"),

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
	const frontEndConfig = await builder.build((req) => {
		return {
			runtimeEnv: req("NODE_ENV"),
			currentUserName: req("USERNAME")
		}
	})

	// This config object is different, but compiled from the same sources as the first one.
	console.log(frontEndConfig.runtimeEnv)
	console.log(frontEndConfig.currentUserName)
}

start()
```

The [basic example](./examples//basics.ts) describes how to set up a very simple configuration loader. More examples can be found in the [examples folder](./examples).

## Concepts

The two core concepts you need to grok when working with this library are **config builder function** and **config sources**. They are connected together through an instance of the `ConfigBuilder` class that serves as a bootrsapper for the **config builder function**

### Config Builder Function

The **config builder function** is a plain javascript function that describes how you want your configuration object to look. It specifies where configuration values are supposed to be placed and what type they should be and returns the object for the `ConfigBuilder` to populate using data from the **config sources**. It does this by using either of the two function arguments it is provided by the `ConfigurationBuilder` class instance.

```typescript
const config = await builder.build((required, optional) => {
  return {
    foo: required("foo"),
    bar: {
      baz: optional("bar", "hey")
    }
  }
})
```

### Config sources

The `ConfigBuilder` class uses **config sources** to resolve configuration keys defined in the **config builder functon**. When you create a new instance you also specify which sources the builder should look for values in and the order they should be used. The first one in order that returns a value for a key will "win" and that value will be placed in the config object.

```typescript
const builder = new ConfigBuilder([source1, source2, source3, source4])
```

## Configuration sources

The library comes with a few configuration sources and some other first party ones are provided as separate packages. Below is a list of known ones.

Name|Description
-|-
[EnvConfigSource](./src/sources/EnvConfigSource)|Loads configurations from environment variables.
[JSONConfigSource](./src/sources/JSONConfigSource)|Loads configurations from a static json object or using an asynchronous getter function.
[CacheConfigSource](./src/sources/CacheConfigSource/)|This source caches resolved values and returns them on the next run.

## Error handling

All errors that occur within the lifecycle of building configurations will inherit from the `ConfigBuilderError` base error class. Some of them indicate directly what happened, but others (such as `ConfigBuilderResolveValueError`) may wrap a generic error.

To handle errors during build you can wrap the `build()` call in a `try/catch` block. For most situations the error will be an instance of `ConfigBuilderError` which can be further narrowed to one of the error classes defined [here](./src/errors).