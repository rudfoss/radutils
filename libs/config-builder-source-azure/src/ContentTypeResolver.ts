import type { ConfigurationSetting } from "@azure/app-configuration"

/**
 * Describes a function that takes a config setting and resolves it to a specific value based on content type.
 */
export type ContentTypeResolver<TValue> = (configSetting: ConfigurationSetting) => Promise<TValue | undefined>
