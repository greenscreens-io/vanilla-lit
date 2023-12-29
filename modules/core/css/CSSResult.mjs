import { supportsAdoptingStyleSheets, constructionToken, symbolResult } from './shared.mjs';

/**
 * A container for a string of CSS text, that may be used to create a CSSStyleSheet.
*
* CSSResult is the return value of `css`-tagged template literals and
* `unsafeCSS()`. In order to ensure that CSSResults are only created via the
* `css` tag and `unsafeCSS()`, CSSResult cannot be constructed directly.
*/
export class CSSResult {

    static #cssTagCache = new WeakMap();
    #styleSheet;
    #strings;

    constructor(cssText, strings, safeToken) {
        const me = this;
        me[symbolResult] = true;
        if (safeToken !== constructionToken) throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
        me.cssText = cssText;
        me.#strings = strings;
    }

    // This is a getter so that it's lazy. In practice, this means stylesheets
    // are not created until the first element instance is made.
    get styleSheet() {

        const me = this;

        // If `supportsAdoptingStyleSheets` is true then we assume CSSStyleSheet is
        // constructable.
        let styleSheet = me.#styleSheet;
        const strings = me.#strings;

        if (supportsAdoptingStyleSheets && styleSheet === undefined) {

            const cacheable = me.#cacheable;
            if (cacheable) styleSheet = CSSResult.#read(strings);

            if (styleSheet === undefined) {
                (this.#styleSheet = styleSheet = new CSSStyleSheet()).replaceSync(me.cssText);
                if (cacheable) CSSResult.#write(strings, styleSheet);
            }
        }

        return styleSheet;
    }

    toString() {
        return this.cssText;
    }

    get #cacheable() {
        return this.#strings !== undefined && this.#strings.length === 1;
    }

    static #read(key) {
        return CSSResult.#cssTagCache.get(key);
    }

    static #write(key, value) {
        CSSResult.#cssTagCache.set(key, value);
    }
}
