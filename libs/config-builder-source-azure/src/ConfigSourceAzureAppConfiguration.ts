import type { ConfigSource } from "@radutils/config-builder"
import { DefaultAzureCredential, TokenCredential } from "@azure/identity"
import type { ConfigurationSetting } from "@azure/app-configuration"
import { AppConfigurationClient } from "@azure/app-configuration"
import { ContentTypeResolver } from "./ContentTypeResolver"
import { jsonResolver, jsonContentType, keyVaultReferenceContentType, keyVaultResolver } from "./contentTypeResolvers"
import { ConfigBuilderAzureSourceContentTypeResolverError } from "./errors"

export interface ConfigSourceAzureAppConfigurationOptions {
	/**
	 * The App Configuration client to use when resolving values
	 */
	client: AppConfigurationClient

	/**
	 * Specify which labels you want to load configuration values from in prioritized order. The first label that returns a defined setting will be used.
	 */
	labels?: string[]

	/**
	 * If none of the labels specified have a value for a specific key, fall back to the unlabelled version of a key if one exists.
	 * @default true
	 */
	fallbackToUnlabelled?: boolean

	/**
	 * Add custom content type resolvers that can convert config setting values based on their content type.
	 */
	contentTypeResolvers?: Map<string | RegExp, ContentTypeResolver<unknown>>
}

export interface ConfigSourceAzureAppConfigurationOptionsDefaultClient
	extends Omit<ConfigSourceAzureAppConfigurationOptions, "client"> {
	/**
	 * The endpoint of the App Configuration service to connect to.
	 */
	endpoint: string
	/**
	 * Specify the credentials to use. If not specified will use a new instance of `DefaultAzureCredential`
	 * @default DefaultAzureCredential
	 */
	credential?: TokenCredential

	/**
	 * Override the options used when creating a default credential instance. If this object is defined none of the default values are used.
	 */
	defaultCredentialOptions?: ConstructorParameters<typeof DefaultAzureCredential>[0]
}

export interface ResolvedConfigSetting<TValue = unknown> {
	configurationSetting: ConfigurationSetting
	resolvedValue?: TValue
}

const BLANK_LABEL = "%00" // same as labelFilter for blank value

export class ConfigSourceAzureAppConfiguration implements ConfigSource {
	protected options: Required<ConfigSourceAzureAppConfigurationOptions>
	/**
	 * Cache of resolved key/values. Indexed by key -> label
	 */
	protected valueCache = new Map<string, Map<string, ResolvedConfigSetting>>()
	protected isPreloaded = false

	public constructor(options: ConfigSourceAzureAppConfigurationOptions) {
		this.options = {
			fallbackToUnlabelled: true,
			contentTypeResolvers: new Map(),
			labels: [],
			...options
		}
	}

	protected async resolveContentType(configurationSetting: ConfigurationSetting): Promise<ResolvedConfigSetting> {
		try {
			for (const [contentTypeMatcher, resolver] of this.options.contentTypeResolvers.entries()) {
				const contentTypeToMatch = configurationSetting.contentType ?? ""
				if (typeof contentTypeMatcher === "string") {
					if (contentTypeToMatch === contentTypeMatcher) {
						const resolvedValue = await resolver(configurationSetting)
						return { configurationSetting, resolvedValue: resolvedValue }
					}
				}

				if (contentTypeMatcher instanceof RegExp) {
					if ((contentTypeMatcher as RegExp).test(configurationSetting.contentType ?? "")) {
						const resolvedValue = await resolver(configurationSetting)
						return { configurationSetting, resolvedValue: resolvedValue }
					}
				}
			}

			return { configurationSetting, resolvedValue: configurationSetting.value }
		} catch (error) {
			if (error instanceof ConfigBuilderAzureSourceContentTypeResolverError) {
				throw error
			}

			throw new ConfigBuilderAzureSourceContentTypeResolverError((error as Error)?.message, error as Error)
		}
	}
	protected async preloadConfigStore() {
		for await (const setting of this.options.client.listConfigurationSettings()) {
			const valueSet = this.valueCache.get(setting.key) ?? new Map<string, ResolvedConfigSetting>()
			const finalValue = await this.resolveContentType(setting)
			valueSet.set(setting.label ?? BLANK_LABEL, finalValue)
			this.valueCache.set(setting.key, valueSet)
		}
	}

	public async onBuildStart() {
		this.valueCache.clear()
		this.isPreloaded = false
	}

	public async get<TValue>(key: string) {
		if (!this.isPreloaded) {
			await this.preloadConfigStore()
			this.isPreloaded = true
		}

		const labelledValues = this.valueCache.get(key)
		if (!labelledValues) return undefined

		const labelsToCheck = this.options.fallbackToUnlabelled
			? [...this.options.labels, BLANK_LABEL]
			: this.options.labels

		for (const label of labelsToCheck) {
			const value = labelledValues.get(label)?.resolvedValue
			if (value) return value as TValue
		}
		return undefined
	}

	public clone() {
		return new ConfigSourceAzureAppConfiguration(this.options)
	}

	/**
	 * Creates an instance of this config source using the specified credentials or `DefaultAzureCredential` as well as both the json and key vault content type resolvers. The resulting client can resolve not only key vault values directly, but will also query key vaults for values when it encounters such a reference.
	 * @param options
	 */
	public static createDefault(options: ConfigSourceAzureAppConfigurationOptionsDefaultClient) {
		const { credential, endpoint, contentTypeResolvers, defaultCredentialOptions, ...rest } = options
		const finalCredential = credential ?? new DefaultAzureCredential(defaultCredentialOptions)

		const allContentTypeResolvers = new Map([
			[keyVaultReferenceContentType, keyVaultResolver({ credential: finalCredential })],
			[jsonContentType, jsonResolver()],
			...(contentTypeResolvers ? Array.from(contentTypeResolvers) : [])
		])

		return new ConfigSourceAzureAppConfiguration({
			client: new AppConfigurationClient(endpoint, finalCredential),
			contentTypeResolvers: allContentTypeResolvers,
			...rest
		})
	}
}
