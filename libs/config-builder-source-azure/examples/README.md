# ConfigBuilderSourceAzure examples

This folder contains example implementations of the Azure based config source.

To run these examples locally copy this folder to your local machine and run `npm i` to install dependencies. Then you can run each script either through the VSCode debugger or using node:

```bash
node -r ts-node/register/transpile-only [script]
node -r ts-node/register/transpile-only appConfigExample.ts
```

## AppConfigExample [[link](./appConfigExample.ts)]

This example demonstrates how to set up a config builder that supports Azure App Configuration based values with optional key vault references. It also allows overriding values from env configurations as needed and locally caching values for faster subsequent boots.