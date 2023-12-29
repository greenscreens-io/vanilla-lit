import { nothing, typeSymbol } from '../../symbols.mjs';
import { DynamicHTML } from '../../dynamic/dynamic.mjs';

import { directive, Directive, } from '../directive.mjs';
import { clearPart, getCommittedValue, insertPart, isCompiledTemplateResult, isTemplateResult, setCommittedValue, } from '../directive-helpers.mjs';

/**
 * The template strings array contents are not compatible between the two
 * template result types as the compiled template contains a prepared string;
 * only use the returned template strings array as a cache key.
 */
const getStringsFromTemplateResult = (result) => isCompiledTemplateResult(result) ? result[typeSymbol].h : result.strings;

class CacheDirective extends Directive {

    #templateCache = new WeakMap();
    #value;

    constructor(partInfo) {
        super(partInfo);
    }

    render(v) {
        // Return an array of the value to induce dynamic to create a ChildPart
        // for the value that we can move into the cache.
        return [v];
    }

    update(containerPart, [v]) {

        const me = this;
        const valueKey = me.#key;
        const vKey = isTemplateResult(v) ? getStringsFromTemplateResult(v) : null;

        me.#store(containerPart, vKey, valueKey);
        me.#restore(containerPart, vKey, valueKey);

        return me.render(v);
    }

    // If the previous value is a TemplateResult and the new value is not,
    // or is a different Template as the previous value, move the child part
    // into the cache.
    #store(containerPart, vKey) {

        const me = this;
        const valueKey = me.#key;

        if (valueKey !== null && (vKey === null || valueKey !== vKey)) {
            
            // This is always an array because we return [v] in render()
            const partValue = getCommittedValue(containerPart);
            const childPart = partValue.pop();

            let cachedContainerPart = me.#templateCache.get(valueKey);
            if (cachedContainerPart === undefined) {
                const fragment = document.createDocumentFragment();
                cachedContainerPart = DynamicHTML.render(nothing, fragment);
                cachedContainerPart.setConnected(false);
                me.#templateCache.set(valueKey, cachedContainerPart);
            }
            
            // Move into cache
            setCommittedValue(cachedContainerPart, [childPart]);
            insertPart(cachedContainerPart, undefined, childPart);
        }

    }

    // If the new value is a TemplateResult and the previous value is not,
    // or is a different Template as the previous value, restore the child
    // part from the cache.
    #restore(containerPart, vKey, valueKey) {
        const me = this;
        if (vKey !== null) {
            if (valueKey === null || valueKey !== vKey) {
                const cachedContainerPart = me.#templateCache.get(vKey);
                if (cachedContainerPart !== undefined) {
                    // Move the cached part back into the container part value
                    const partValue = getCommittedValue(cachedContainerPart);
                    const cachedPart = partValue.pop();
                    // Move cached part back into DOM
                    clearPart(containerPart);
                    insertPart(containerPart, undefined, cachedPart);
                    setCommittedValue(containerPart, [cachedPart]);
                }
            }
            // Because vKey is non null, v must be a TemplateResult.
            me.#value = v;
        } else {
            me.#value = undefined;
        }        
    }

    get #key() {
        const me = this;
        return isTemplateResult(me.#value)
            ? getStringsFromTemplateResult(me.#value)
            : null;        
    }
}

/**
 * Enables fast switching between multiple templates by caching the DOM nodes
 * and TemplateInstances produced by the templates.
 *
 * Example:
 *
 * ```js
 * let checked = false;
 *
 * html`
 *   ${cache(checked ? html`input is checked` : html`input is not checked`)}
 * `
 * ```
 */
export const cache = directive(CacheDirective);
