
export const supportsAdoptingStyleSheets =
    typeof globalThis.ShadowRoot !== 'undefined' &&
    typeof Document !== 'undefined' &&
    typeof CSSStyleSheet !== 'undefined' &&
    'adoptedStyleSheets' in Document.prototype &&
    'replace' in CSSStyleSheet.prototype;
export const constructionToken = Symbol();
export const symbolResult = Symbol('_$cssResult$');
