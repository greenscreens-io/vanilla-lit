import { CSSResult } from "./CSSResult.mjs";
import { supportsAdoptingStyleSheets, constructionToken, symbolResult } from './shared.mjs';

export class CSS {

    static #textFromCSSResult(value) {
        // This property needs to remain unminified.
        if (value[symbolResult] === true) {
            return value.cssText;
        } else if (typeof value === 'number') {
            return value;
        } else {
            throw new Error(`Value passed to 'css' function must be a 'css' function result: ` +
                `${value}. Use 'unsafeCSS' to pass non-literal values, but take care ` +
                `to ensure page security.`);
        }
    }

    static #cssResultFromStyleSheet = (sheet) => {
        let cssText = '';
        for (const rule of sheet.cssRules) {
            cssText += rule.cssText;
        }
        return CSS.unsafeCSS(cssText);
    }

    static #toString(value) {
        return typeof value === 'string' ? value : String(value);
    }

    static #createStyle(value) {
        const style = document.createElement('style');
        const nonce = globalThis['vlitNonce'];
        if (nonce !== undefined) style.setAttribute('nonce', nonce);
        style.textContent = value;
        return style;
    }

    /**
     * Wrap a value for interpolation in a css tagged template literal.
     *
     * This is unsafe because untrusted CSS text can be used to phone home
     * or exfiltrate data to an attacker controlled site. Take care to only use
     * this with trusted input.
     */
    static unsafeCSS(value) {
        return new CSSResult(CSS.#toString(value), undefined, constructionToken);
    }

    /**
     * A template literal tag which can be used with LitElement's
     * {@linkcode ReactiveElement.styles} property to set element styles.
     *
     * For security reasons, only literal string values and number may be used in
     * embedded expressions. To incorporate non-literal values {@linkcode unsafeCSS}
     * may be used inside an expression.
     */
    static css(strings, ...values) {
        const cssText = strings.length === 1
            ? strings[0]
            : values.reduce((acc, v, idx) => acc + CSS.#textFromCSSResult(v) + strings[idx + 1], strings[0]);
        return new CSSResult(cssText, strings, constructionToken);
    }

    /**
     * Applies the given styles to a `shadowRoot`. When Shadow DOM is
     * available but `adoptedStyleSheets` is not, styles are appended to the
     * `shadowRoot` to [mimic spec behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
     * Note, when shimming is used, any styles that are subsequently placed into
     * the shadowRoot should be placed *before* any shimmed adopted styles. This
     * will match spec behavior that gives adopted sheets precedence over styles in
     * shadowRoot.
     */
    static adoptStyles(renderRoot, styles) {
        if (supportsAdoptingStyleSheets) {
            renderRoot.adoptedStyleSheets = styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
        } else {
            styles.map((s) => CSS.#createStyle(s.cssText)).forEach(style => renderRoot.appendChild(style));
        }
    }

    static getCompatibleStyle(s) {
        if (supportsAdoptingStyleSheets) return s;
        return s instanceof CSSStyleSheet ? CSS.#cssResultFromStyleSheet(s) : s
    }

}

// for Lit 3.0 compatibility
export const css =  CSS.css;
export const unsafeCSS = CSS.unsafeCSS;
export const adoptStyles = CSS.adoptStyles;