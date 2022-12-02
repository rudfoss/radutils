# Azure config source

```
npm install @radutils/config-builder-source-azure@beta
```

This library contains config sources for Azure App Configuration and Azure Key Vault compatible with `@radutils/config-builder`.

## Usage

The [app](./examples/appConfigExample.ts) describes how to set up a production ready source and config builder. More examples can be found in the [examples folder](./examples).

## Azure App Configuration

The `ConfigSourceAzureAppConfiguration` provides a way to load configuration values from an associated App Configuration instance. It can also resolve referred values such as Key Vault references automatically.

There are two main ways to initialize this source. Through the static method `createDefault` (recommended) or directly as a `new` instance. CreateDefault works as long as you are logged in to an account in Azure CLI or PowerShell that has access to the App Configuration instance you wish to read from first.

```typescript
// Read endpoint from an environment variable.
const endpoint = process.env["APPCONFIG_ENDPOINT"]

// Specify any labels to try in order, leave blank to use unlabelled value
const labels: string[] = []

// createDefault is recommended and should work for most scenarios.
ConfigSourceAzureAppConfiguration.createDefault({ endpoint, labels })
```

```typescript
// Create a separate app configuration client directly.
const connectionString = "..."
const appConfigClient = new AppConfigurationClient(connectionString)

// Create a new direct instance where you must provide the client yourself.
new ConfigSourceAzureAppConfiguration({ client: appConfigClient })
```

## Authorization

The library will use `@azure/identity` [`DefaultAzureCredentials`](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md#defaultazurecredential) for authorization. This is a multi-credential class that should work well for most situations including hosting the application in Azure. To use your own account you can log in through the Azure CLI or Azure PowerShell and your credentials should be recognized.

Optionally you can override the `credential` option or the entire `client` in the options when creating an instance of the source to provide your own authorization mechanism.

**Note on usage with Azure User Assigned Managed Identity**: When using user assigned managed identities you are required to specify the client id of the identity you want as an option for `ManagedIdentityCredential` and `DefaultAzureCredential`. You can specify this as an option to the `DefaultAzureCredential` constructor, but it should also be picked up automatically if you define it as an environment variable named `AZURE_CLIENT_ID`.

## `getFixedDefaultAzureCredential`

A utility function that addresses a specific issue with the `DefaultAzureCredential`:

This function addresses a problem with the `DefaultAzureCredential` where a timeout value carries over from some older request causing a long delay when looking up key vault secrets. This is NOT intended as a permanent fix, but a workaround until there is a more "official" way to solve the problem. Ref: [https://github.com/Azure/azure-sdk-for-js/issues/23017](https://github.com/Azure/azure-sdk-for-js/issues/23017)

This "fixed" credential is used in place of the `DefaultAzureCredential` when calling `ConfigSourceAzureAppConfiguration.createDefault`

# Changelog

Version|Description
-|-
`v0.1.2`|Updated dependencies and removed workaround for edge case now fixed by the Azure team.<br/>Added support for specifying options to pass to `DefaultAzureCredentials`.
`v0.1.1`|Inital release