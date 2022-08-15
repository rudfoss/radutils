# ConfigBuilder examples

This folder contains example implementations of the config builder.

To run these examples locally copy this folder to your local machine and run `npm i` to install dependencies. Then you can run each script either through the VSCode debugger or using node:

```bash
node -r ts-node/register/transpile-only [script]
node -r ts-node/register/transpile-only basics.ts
```

## Basics [[link](./basics.ts)]

Sets up a configuration builder with a single source that loads from local environment variables. Demonstrates structuring the configuration as well as formatters for transforming data.

The recommended way to structure your config builder function is presented in the **WithTypes** example below. This initial example is intended to show the bare necessities needed to set up and work with the configuration builder.

## WithTypes [[link](./withTypes.ts)]

For most bigger applications it is very useful to be able to reference the config object type directly. I.e. for inclusion in other types/interfaces. In these cases it is not sufficient to define the build function for the configration object inline.

This example demonstrates how to extract the build function and export it along with the resolved type for the config object. In this example the `Config` type describes the actual configuration object so that you can easily refer to it in other type declarations.

This is the recommended way to structure your configuration with this library.

## Multiple sources [[link](./multipleSources.ts)]

In most scenarios you'd probably want to specify more than one configuration source. This feature enables do things like combining environment variables with service variables or specifying fallbacks as defaults from a static file or object. The configuration builder function remains unchanged and type inferrence still works as expected.

## Explicitly typed [[link](./explicitlyTyped.ts)]

In some situations you may wish to define the type explicitly. Perhaps it is generated from some other build process, external library or service or maybe you are using a schema library (such a the excellent [Zod](https://zod.dev)). This example demonstrates how to conform the config object to an external type.