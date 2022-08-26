# Azure config source

```
npm install @radutils/config-builder-source-azure@beta
```

This library contains config sources for Azure App Configuration and Azure Key Vault compatible with `@radutils/config-builder`.


## Usage

The [app](./examples/appConfigExample.ts) describes how to set up a production ready source and config builder. More examples can be found in the [examples folder](./examples).

## Azure App Configuration

The `ConfigSourceAzureAppConfiguration` provides a way to load configuration values from an associated App Configuration instance. It can also resolve refererred values such as Key Vault references automatically.

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

The library will use `@azure/identity` [`DefaultAzureCredentials`](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/README.md#defaultazurecredential) for authorization. This is a multi-credential class that should work well for most situations including hosting the application in Azure. To use your own account you can log in through the Azure CLI or Azure PowerShell and your credentials should be recognised.

Optionally you can override the `credential` option or the entire `client` in the options when creating an instance of the source to provide your own authorization mechanism.