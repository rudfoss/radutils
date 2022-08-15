/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigBuilder } from "./ConfigBuilder"
import { BuildRunContext, ConfigSource, OptionalConfig, RequiredConfig } from "./ConfigBuilderTypes"
import {
	ConfigBuilderBuildFunctionError,
	ConfigBuilderError,
	ConfigBuilderFormatterError,
	ConfigBuilderLifecycleError,
	ConfigBuilderMissingRequiredKeysError,
	ConfigBuilderResolveValueError
} from "./errors"
import { asJson } from "./formatters"

class MockConfigSource implements ConfigSource {
	public onBuildStart?:
		| ((options: {
				requiredKeys: ReadonlySet<string>
				optionalKeys: ReadonlySet<string>
				context: BuildRunContext
		  }) => void | Promise<void>)
		| undefined
	public onBuildSuccess?:
		| (<TConfig = unknown>(result: {
				config: TConfig
				keyValues: ReadonlyMap<string, unknown>
				context: BuildRunContext
		  }) => void | Promise<void>)
		| undefined
	public onBuildError?:
		| ((options: { error: ConfigBuilderError; context: BuildRunContext }) => void | Promise<void>)
		| undefined

	constructor(public data: Record<string, unknown>) {
		this.onBuildStart = jest.fn()
		this.onBuildSuccess = jest.fn()
		this.onBuildError = jest.fn()
		this.get = jest.fn(this.get.bind(this)) as any
	}

	public async get<TValue>(key: string) {
		return this.data[key] as TValue
	}

	public clone() {
		const inst = new MockConfigSource(this.data)

		// Keep mocks when cloning so that references are where they are expected.
		inst.onBuildStart = this.onBuildStart
		inst.onBuildSuccess = this.onBuildSuccess
		inst.onBuildError = this.onBuildError
		inst.get = this.get

		return inst
	}

	public static readonly configData = {
		foo: "foo",
		bar: "bar",
		numeric: 42,
		bool: true,
		stringBool: "true",
		stringBoolFalse: "false",
		numBool: "1",
		numBoolFalse: "0",
		json: JSON.stringify({ foo: true, bar: false }),
		object: { foo: true, bar: false },
		arr: ["a", "b", 3, "c"]
	}
	public static fromTestData() {
		return new MockConfigSource(MockConfigSource.configData)
	}
}

describe("ConfigBuilder", () => {
	let mockSource: MockConfigSource
	let builder: ConfigBuilder

	beforeEach(() => {
		mockSource = MockConfigSource.fromTestData()
		builder = new ConfigBuilder([mockSource])
	})

	it("is defined", () => {
		expect(ConfigBuilder).toBeDefined()
		expect(ConfigBuilder.name).toBe("ConfigBuilder")
	})

	it("clones constructor arguments internally", () => {
		// This is done to prevent unsupported tampering
		const sources = [mockSource] as const
		builder = new ConfigBuilder(sources)
		expect(builder["sources"]).not.toBe(sources)
	})
	it("throws if constructor is called with empty array of sources", () => {
		expect(() => new ConfigBuilder([] as any)).toThrow(new ConfigBuilderError("Must provide at least one source"))
	})

	it("resolves config keys", async () => {
		const config = await builder.build((req) => ({
			foo: req("foo"),
			bar: req("bar"),
			numeric: req("numeric"),
			bool: req("bool"),
			stringBool: req("stringBool"),
			stringBoolFalse: req("stringBoolFalse"),
			numBool: req("numBool"),
			numBoolFalse: req("numBoolFalse"),
			json: req("json"),
			object: req("object"),
			arr: req("arr")
		}))

		expect(config).toEqual(MockConfigSource.configData)
	})

	it("supports defining complex object structures", async () => {
		await expect(
			builder.build((req) => ({
				foo: req("foo"),
				arr: [req("bar"), req("bool"), req("numeric")],
				deep: {
					struct: {
						with: {
							stuff: {
								bool: req("bool"),
								arr: req("arr")
							},
							list: [req("numBool")]
						}
					}
				}
			}))
		).resolves.toEqual({
			foo: "foo",
			arr: ["bar", true, 42],
			deep: {
				struct: {
					with: {
						stuff: {
							bool: true,
							arr: ["a", "b", 3, "c"]
						},
						list: ["1"]
					}
				}
			}
		})
	})

	it("calls getter for each key in order", async () => {
		await builder.build((req) => ({
			hello: req("foo"),
			world: req("bar"),
			sub: {
				object: req<{ foo: boolean; bar: boolean }>("object"),
				json: req("json", asJson<{ foo: boolean; bar: boolean }>())
			}
		}))

		const mockGet: jest.Mock = mockSource["get"] as any
		expect(mockGet.mock.calls.length).toBe(4)
		expect(mockGet.mock.calls[0][0]).toBe("foo")
		expect(mockGet.mock.calls[1][0]).toBe("bar")
		expect(mockGet.mock.calls[2][0]).toBe("object")
		expect(mockGet.mock.calls[3][0]).toBe("json")
	})

	it("resolves optional and required keys", async () => {
		const config = await builder.build((req, opt) => ({
			required: req("foo"),
			optional: opt("foo2")
		}))

		expect(config).toEqual({
			required: "foo",
			optional: undefined
		})
	})
	it("resolves both keys and constants", async () => {
		const config = await builder.build((req, opt) => ({
			required: req("foo"),
			optional: opt("foo2"),
			constant: 42,
			deepConstant: {
				sub: true,
				hi: "hello there",
				value: opt<number>("numeric"),
				otherValue: req<string>("numBool")
			}
		}))

		expect(config).toEqual({
			required: "foo",
			optional: undefined,
			constant: 42,
			deepConstant: {
				sub: true,
				hi: "hello there",
				value: 42,
				otherValue: "1"
			}
		})
	})
	it("uses the first defined key when many are specified", async () => {
		const config = await builder.build((req, opt) => ({
			fooFirst: req(["foo", "foo2"]),
			fooLast: req(["foo2", "foo3", "foo"]),
			fooOptFirst: opt<string>(["foo", "foo2"]),
			fooOptLast: opt<string>(["foo2", "foobar", "foo"])
		}))

		expect(config).toEqual({
			fooFirst: "foo",
			fooLast: "foo",
			fooOptFirst: "foo",
			fooOptLast: "foo"
		})
	})

	it("throws if required keys are missing", async () => {
		await expect(() =>
			builder.build((req) => ({
				hello: req("foo2"),
				sub: {
					world: req("bar2")
				}
			}))
		).rejects.toThrow(new ConfigBuilderMissingRequiredKeysError(["foo2", "bar2"]))
	})
	it("throws with the first not found key if a set is specified", async () => {
		await expect(() =>
			builder.build((req) => ({
				test: req(["foo2", "bar2"])
			}))
		).rejects.toThrow(new ConfigBuilderMissingRequiredKeysError(["foo2"]))
	})

	it("does not call functions events until build runs", () => {
		expect(mockSource["onBuildStart"]).not.toHaveBeenCalled()
		expect(mockSource["onBuildSuccess"]).not.toHaveBeenCalled()
		expect(mockSource["onBuildError"]).not.toHaveBeenCalled()
		expect(mockSource["get"]).not.toHaveBeenCalled()
	})

	it("throws buildFunction error if build function throws", async () => {
		await expect(() =>
			builder.build(() => {
				throw new Error("build function error")
			})
		).rejects.toThrow(new ConfigBuilderBuildFunctionError(new Error("build function error")))
	})

	it("supports non-class config sources", async () => {
		const mockGet: jest.Mock = jest.fn(async () => "hey")
		const mockObjSource: ConfigSource = {
			get: mockGet as any,
			clone: () => ({ ...mockObjSource })
		}
		builder = new ConfigBuilder([mockObjSource])

		await builder.build((req) => ({ test: req("boink") }))

		expect(mockGet).toHaveBeenCalled()
		expect(mockGet.mock.calls[0][0]).toBe("boink")
	})
	it("properly wraps errors from getters in non-class config sources", async () => {
		const mockGet = jest.fn(async () => {
			throw new Error("test resolve error")
		})
		const mockObjSource: ConfigSource = {
			get: mockGet as any,
			clone: () => ({ ...mockObjSource })
		}
		builder = new ConfigBuilder([mockObjSource])

		await expect(() => builder.build((req) => ({ test: req("boink") }))).rejects.toThrow(
			new ConfigBuilderResolveValueError(new Error("test resolve error"), "boink", 0, "Object")
		)
	})

	describe("Lifecycle.onBuildStart", () => {
		it("is called with expected keys", async () => {
			const buildFn = (req: RequiredConfig, opt: OptionalConfig) => ({
				foo: req("foo"),
				bar: req("bar"),
				test: opt("numeric"),
				alsoTest: opt("arr")
			})
			await builder.build(buildFn)

			const mockOnBuildStart: jest.Mock = mockSource["onBuildStart"] as any
			expect(mockOnBuildStart.mock.calls.length).toBe(1)
			expect(mockOnBuildStart.mock.calls[0][0].requiredKeys).toEqual(new Set(["foo", "bar"]))
			expect(mockOnBuildStart.mock.calls[0][0].optionalKeys).toEqual(new Set(["numeric", "arr"]))
			expect(mockOnBuildStart.mock.calls[0][0].context.buildFnRef).toBe(buildFn)
			expect(mockOnBuildStart.mock.calls[0][0].context).toEqual({
				buildFnRef: buildFn,
				sharedData: new Map()
			})
		})
		it("waits to resolve keys until onBuildStart has succeeded", async () => {
			mockSource.onBuildStart = jest.fn(() => {
				throw new Error("oops")
			})
			builder = new ConfigBuilder([mockSource])

			const thrownError = new ConfigBuilderLifecycleError(new Error("oops"), "onBuildStart")
			await expect(() =>
				builder.build((req, opt) => ({
					foo: req("foo"),
					bar: req("bar"),
					test: opt("numeric"),
					alsoTest: opt("arr")
				}))
			).rejects.toThrow(thrownError)

			expect(mockSource.onBuildStart).toHaveBeenCalled()
			expect(mockSource.get).not.toHaveBeenCalled()
		})
		it("shares context object with build fn call", async () => {
			const ctx = new Map<string, unknown>([["foo", true]])

			const buildFn = (req: RequiredConfig, opt: OptionalConfig) => ({
				foo: req("foo"),
				bar: req("bar"),
				test: opt("numeric"),
				alsoTest: opt("arr")
			})
			await builder.build(buildFn, ctx)

			const mockOnBuildStart: jest.Mock = mockSource["onBuildStart"] as any
			expect(mockOnBuildStart.mock.calls[0][0].context.sharedData).toBe(ctx)
		})
		it("supports raw objects as context object", async () => {
			const ctx = { foo: true }

			const buildFn = (req: RequiredConfig, opt: OptionalConfig) => ({
				foo: req("foo"),
				bar: req("bar"),
				test: opt("numeric"),
				alsoTest: opt("arr")
			})
			await builder.build(buildFn, ctx)

			const mockOnBuildStart: jest.Mock = mockSource["onBuildStart"] as any
			expect(mockOnBuildStart.mock.calls[0][0].context.sharedData).toEqual(new Map(Object.entries(ctx)))
		})
		it("throws lifecycle error if function throws", async () => {
			mockSource.onBuildStart = jest.fn(() => {
				throw new Error("onBuildStart")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() => builder.build((req) => ({ test: req("foo") }))).rejects.toThrow(
				new ConfigBuilderLifecycleError(new Error("onBuildStart"), "onBuildStart")
			)
		})
	})

	describe("Lifecycle.onBuildSuccess", () => {
		it("is called once with the final config object", async () => {
			const config = await builder.build((req, opt) => ({
				foo: req("foo"),
				bar: req("bar"),
				test: opt("numeric"),
				alsoTest: opt("arr")
			}))

			const mockOnBuildSuccess: jest.Mock = mockSource.onBuildSuccess as any
			expect(mockOnBuildSuccess).toHaveBeenCalled()
			expect(mockOnBuildSuccess.mock.calls.length).toBe(1)
			expect(mockOnBuildSuccess.mock.calls[0][0].config).toBe(config)
		})
		it("is not called if an error occurs before success", async () => {
			mockSource.onBuildStart = jest.fn(() => {
				throw new Error("oops")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() =>
				builder.build((req) => ({
					test: req("foo")
				}))
			).rejects.toThrow()

			const mockOnBuildSuccess: jest.Mock = mockSource.onBuildSuccess as any
			expect(mockOnBuildSuccess).not.toHaveBeenCalled()
		})
		it("shares context object with build fn call", async () => {
			const ctx = new Map<string, unknown>([["foo", true]])

			const buildFn = (req: RequiredConfig, opt: OptionalConfig) => ({
				foo: req("foo"),
				bar: req("bar"),
				test: opt("numeric"),
				alsoTest: opt("arr")
			})
			await builder.build(buildFn, ctx)

			const mockOnBuildSuccess: jest.Mock = mockSource.onBuildSuccess as any
			expect(mockOnBuildSuccess.mock.calls[0][0].context.sharedData).toBe(ctx)
		})
		it("throws lifecycle error if function throws", async () => {
			mockSource.onBuildSuccess = jest.fn(() => {
				throw new Error("onBuildSuccess")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() => builder.build((req) => ({ test: req("foo") }))).rejects.toThrow(
				new ConfigBuilderLifecycleError(new Error("onBuildSuccess"), "onBuildSuccess")
			)
		})
		it("recieves a complete set of all resolved keys and their values", async () => {
			expect(mockSource.onBuildSuccess).not.toHaveBeenCalled()

			await builder.build((req, opt) => ({
				foo: req("foo"),
				bar: req("bar"),
				test: opt("numeric"),
				alsoTest: opt("arr")
			}))
			const expectedMap = new Map<string, unknown>()
			expectedMap.set("foo", MockConfigSource.configData.foo)
			expectedMap.set("bar", MockConfigSource.configData.bar)
			expectedMap.set("numeric", MockConfigSource.configData.numeric)
			expectedMap.set("arr", MockConfigSource.configData.arr)

			const mockOnBuildSuccess: jest.Mock = mockSource.onBuildSuccess as any
			expect(mockOnBuildSuccess).toHaveBeenCalled()
			expect(mockOnBuildSuccess.mock.calls.length).toBe(1)
			expect(mockOnBuildSuccess.mock.calls[0][0].keyValues).toBeDefined()

			const keyValues = mockOnBuildSuccess.mock.calls[0][0].keyValues
			expect(keyValues).toEqual(expectedMap)
		})
	})

	describe("Lifecycle.onBuildError", () => {
		it("is called if build start function throws", async () => {
			mockSource.onBuildStart = jest.fn(() => {
				throw new Error("oops")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() =>
				builder.build((req) => ({
					test: req("foo")
				}))
			).rejects.toThrow()

			const mockOnBuildError: jest.Mock = mockSource.onBuildError as any
			expect(mockSource.onBuildStart).toHaveBeenCalled()
			expect(mockOnBuildError).toHaveBeenCalled()
			expect(mockOnBuildError.mock.calls[0][0].error).toEqual(
				new ConfigBuilderLifecycleError(
					new ConfigBuilderLifecycleError(new Error("oops"), "onBuildStart"),
					"onBuildError"
				)
			)
		})
		it("shares context object with build fn call", async () => {
			const ctx = new Map<string, unknown>([["foo", true]])

			mockSource.onBuildStart = jest.fn(() => {
				throw new Error("oops")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() =>
				builder.build(
					(req) => ({
						test: req("foo")
					}),
					ctx
				)
			).rejects.toThrow()

			const mockOnBuildError: jest.Mock = mockSource.onBuildError as any
			expect(mockOnBuildError).toHaveBeenCalled()
			expect(mockOnBuildError.mock.calls[0][0].context.sharedData).toBe(ctx)
		})
		it("is called if getter throws", async () => {
			mockSource.get = jest.fn(() => {
				throw new Error("oops")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() =>
				builder.build((req) => ({
					test: req("foo")
				}))
			).rejects.toThrow()

			const mockOnBuildError: jest.Mock = mockSource.onBuildError as any
			expect(mockSource.get).toHaveBeenCalled()
			expect(mockOnBuildError).toHaveBeenCalled()
			expect(mockOnBuildError.mock.calls[0][0].error).toEqual(
				new ConfigBuilderLifecycleError(
					new ConfigBuilderResolveValueError(new Error("oops"), "foo", 0, "MockConfigSource"),
					"onBuildError"
				)
			)
		})
		it("is called if missing required keys", async () => {
			await expect(() =>
				builder.build((req) => ({
					test: req("foo2")
				}))
			).rejects.toThrow()

			const mockOnBuildError: jest.Mock = mockSource.onBuildError as any
			expect(mockOnBuildError).toHaveBeenCalled()
			expect(mockOnBuildError.mock.calls[0][0].error).toEqual(
				new ConfigBuilderLifecycleError(new ConfigBuilderMissingRequiredKeysError(["foo2"]), "onBuildError")
			)
		})
		it("is called if formatters throw", async () => {
			const expectedError = new ConfigBuilderFormatterError(new Error("formatter"))
			await expect(() =>
				builder.build((req) => ({
					test: req("foo", () => {
						throw new Error("formatter")
					})
				}))
			).rejects.toThrow(expectedError)

			const mockOnBuildError: jest.Mock = mockSource.onBuildError as any
			expect(mockOnBuildError).toHaveBeenCalled()
			expect(mockOnBuildError.mock.calls[0][0].error).toEqual(expectedError)
		})
		it("is NOT called if onBuildSuccess throws", async () => {
			mockSource.onBuildSuccess = jest.fn(() => {
				throw new Error("oops")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() =>
				builder.build((req) => ({
					test: req("foo")
				}))
			).rejects.toThrow()

			expect(mockSource.onBuildError).not.toHaveBeenCalled()
		})
		it("throws lifecycle error if function throws", async () => {
			mockSource.get = jest.fn(() => {
				throw new Error("mockGet")
			})
			mockSource.onBuildError = jest.fn(() => {
				throw new Error("onBuildError")
			})
			builder = new ConfigBuilder([mockSource])

			await expect(() => builder.build((req) => ({ test: req("foo") }))).rejects.toThrow(
				new ConfigBuilderLifecycleError(new Error("onBuildError"), "onBuildError")
			)

			const mockOnBuildError = mockSource.onBuildError as any
			expect(mockOnBuildError).toHaveBeenCalled()
			expect(mockOnBuildError.mock.calls[0][0].error).toEqual(
				new ConfigBuilderResolveValueError(new Error("mockGet"), "foo", 0, "MockConfigSource")
			)
		})
	})
})
