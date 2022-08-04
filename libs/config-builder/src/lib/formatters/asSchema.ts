import { Formatter } from "../ConfigBuilderTypes"

export interface AsSchemaFormatterOptions<TValidatedType> {
	validator: (value: unknown) => TValidatedType
}

/**
 * Give a validator function will run the value through it and return the result. Useful when validating complex object results with schema libraries such as [Zod](https://zod.dev) [Joi](https://joi.dev).
 */
export const asSchema =
	<TValidatedType>({ validator }: AsSchemaFormatterOptions<TValidatedType>): Formatter<TValidatedType> =>
	(value) => {
		return validator(value)
	}
