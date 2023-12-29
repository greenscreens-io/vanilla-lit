import { DynamicHTML } from './dynamic/dynamic.mjs';

export class StaticHTML {

    /**
     * Prevents JSON injection attacks.
     *
     * The goals of this brand:
     *   1) fast to check
     *   2) code is small on the wire
     *   3) multiple versions of Lit in a single page will all produce mutually
     *      interoperable StaticValues
     *   4) normal JSON.parse (without an unusual reviver) can not produce a
     *      StaticValue
     *
     * Symbols satisfy (1), (2), and (4). We use Symbol.for to satisfy (3), but
     * we don't care about the key, so we break ties via (2) and use the empty
     * string.
     */
    static #brand = Symbol.for('');
    static #propertySymbol = Symbol('_$static$');

    static #stringsCache = new Map();

    /** Safely extracts the string part of a StaticValue. */
    static #unwrapStaticValue = (value) => {
        if (value?.r !== StaticHTML.#brand) {
            return undefined;
        }
        return value?.[StaticHTML.#propertySymbol];
    }

    static #textFromStatic = (value) => {
        if (value[StaticHTML.#propertySymbol] !== undefined) {
            return value[StaticHTML.#propertySymbol];
        } else {
            throw new Error(`Value passed to 'literal' function must be a 'literal' result: ${value}. Use 'unsafeStatic' to pass non-literal values, but take care to ensure page security.`);
        }
    }
    
    /**
     * Wraps a string so that it behaves like part of the static template
     * strings instead of a dynamic value.
     *
     * Users must take care to ensure that adding the static string to the template
     * results in well-formed HTML, or else templates may break unexpectedly.
     *
     * Note that this function is unsafe to use on untrusted content, as it will be
     * directly parsed into HTML. Do not pass user input to this function
     * without sanitizing it.
     *
     * Static values can be changed, but they will cause a complete re-render
     * since they effectively create a new template.
     */
    static unsafeStatic = (value) => ({
        [StaticHTML.#propertySymbol]: value,
        r: StaticHTML.#brand,
    })

    /**
     * Tags a string literal so that it behaves like part of the static template
     * strings instead of a dynamic value.
     *
     * The only values that may be used in template expressions are other tagged
     * `literal` results or `unsafeStatic` values (note that untrusted content
     * should never be passed to `unsafeStatic`).
     *
     * Users must take care to ensure that adding the static string to the template
     * results in well-formed HTML, or else templates may break unexpectedly.
     *
     * Static values can be changed, but they will cause a complete re-render since
     * they effectively create a new template.
     */
    static literal = (strings, ...values) => ({
        [StaticHTML.#propertySymbol]: values.reduce((acc, v, idx) => acc + StaticHTML.#textFromStatic(v) + strings[idx + 1], strings[0]),
        r: StaticHTML.#brand,
    })

    /**
     * Wraps a dynamic template tag (`html` or `svg`) to add static value support.
     */
    static withStatic = (coreTag) => (strings, ...values) => {

        const staticStrings = [];
        const dynamicValues = [];

        const l = values.length;

        let staticValue;
        let dynamicValue;
        let hasStatics = false;
        let i = 0;
        let s;

        while (i < l) {
            s = strings[i];
            // Collect any unsafeStatic values, and their following template strings
            // so that we treat a run of template strings and unsafe static values as
            // a single template string.
            while (i < l &&
                ((dynamicValue = values[i]),
                    (staticValue =  StaticHTML.#unwrapStaticValue(dynamicValue))) !== undefined) {
                s += staticValue + strings[++i];
                hasStatics = true;
            }
            // If the last value is static, we don't need to push it.
            if (i !== l) {
                dynamicValues.push(dynamicValue);
            }
            staticStrings.push(s);
            i++;
        }

        // If the last value isn't static (which would have consumed the last
        // string), then we need to add the last string.
        if (i === l) {
            staticStrings.push(strings[l]);
        }

        if (hasStatics) {
            const key = staticStrings.join('$$vlit$$');
            strings = StaticHTML.#stringsCache.get(key);

            if (strings === undefined) {
                // Beware: in general this pattern is unsafe, and doing so may bypass
                // lit's security checks and allow an attacker to execute arbitrary
                // code and inject arbitrary content.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                staticStrings.raw = staticStrings;
                StaticHTML.#stringsCache.set(key, (strings = staticStrings));
            }
            values = dynamicValues;
        }

        return coreTag(strings, ...values);
    }


    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     *
     * Includes static value support from `dynamic/static.js`.
     */
    static html = StaticHTML.withStatic(DynamicHTML.html);

    /**
     * Interprets a template literal as an SVG template that can efficiently
     * render to and update a container.
     *
     * Includes static value support from `dynamic/static.js`.
     */
    static svg = StaticHTML.withStatic(DynamicHTML.svg);

}

// for compatibility with Lit 3.0
export const unsafeStatic = StaticHTML.unsafeStatic
export const withStatic = StaticHTML.withStatic;
export const literal = StaticHTML.literal;
export const staticHtml = StaticHTML.html;
export const staticSvg = StaticHTML.svg;
