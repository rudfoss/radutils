# `@radutils` ConfigBuilder

```
npm install @radutils/config-builder
```

`@radutils` ConfigBuilder provides a type-safe way of compiling configuration options for your application. It separates the configuration definition from the source or sources allowing you to construct configuration objects declaratively and separated from where values come from and how they are retrieved. It also enables you to construct configuration objects for multiple scenarios based on the same sources.

## Usage

See the [examples folder](./examples)

## Motivation

Reading configuration information in your application should be a trivial matter and for some cases it usually is. But when your app resides in containers running in multiple environments or when building mono-repositories that want to share one or more sources for configuration it quickly becomes difficult to structure and manage. The problem grows even more complex if you wish to use services like Azure App Configuration and Azure Key Vault to store settings centrally. Maybe you even want to use both these types of services as well as environment variables and files to keep track of configurations.

The goal of this library is to simplify these kinds of scenarios by separating what your final configuration object should look like from where the values for your configuration are stored. It also allows you to strongly type your values so that typescript can help you when reading configuration data in your application.

## Concepts

## Configuration sources

There are several configuration sources available for the library already.

Name|Description
-|-
[EnvConfigSource](./src/sources/EnvConfigSource)|Loads configurations from environment variables.