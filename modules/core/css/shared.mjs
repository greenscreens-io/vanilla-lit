
export const supportsAdoptingStyleSheets = globalThis.ShadowRoot && 'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;
export const constructionToken = Symbol();
export const symbolResult = Symbol('_$cssResult$');
