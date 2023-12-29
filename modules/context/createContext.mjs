
/**
 * Creates a typed Context.
 *
 * Contexts are compared with with strict equality.
 *
 * If you want two separate `createContext()` calls to referer to the same
 * context, then use a key that will by equal under strict equality like a
 * string for `Symbol.for()`:
 *
 * ```js
 * // true
 * createContext('my-context') === createContext('my-context')
 * // true
 * createContext(Symbol.for('my-context')) === createContext(Symbol.for('my-context'))
 * ```
 *
 * @param key a context key value
 * @template ValueType the type of value that can be provided by this context.
 * @returns the context key value cast to `Context<K, ValueType>`
 */
export function createContext(key) {
    return key;
}
