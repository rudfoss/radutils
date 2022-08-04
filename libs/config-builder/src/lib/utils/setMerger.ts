/**
 * Merges a set with any interable of the same type. The source set is mutated.
 * The function returns a recursive adder that takes one iterable and adds it to
 * the original set.
 *
 * ```typescript
 * const mergedSet = setMerger(set)(["one", "two"])(["two", "three"]).set
 * ```
 *
 * To get a reference to the mutated set get the property `.set` on the returned adder function.
 * @param source
 */
export const setMerger = <TValue>(source: Set<TValue> = new Set<TValue>()) => {
	const adder = (additions: Iterable<TValue> = []) => {
		for (const addition of additions) {
			source.add(addition)
		}
		return adder
	}
	adder.set = source
	return adder
}
