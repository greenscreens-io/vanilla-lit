
export const partSymbol = Symbol('_$litPart$');
export const typeSymbol = Symbol('_$litType$');
export const directiveSymbol = Symbol('_$litDirective$');
export const notifySymbol = Symbol('_$notifyDirectiveConnectionChanged');

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
export const noChange = Symbol.for('vlit-noChange');

/**
 * A sentinel value that signals a ChildPart to fully clear its content.
 *
 * ```ts
 * const button = html`${
 *  user.isAdmin
 *    ? html`<button>DELETE</button>`
 *    : nothing
 * }`;
 * ```
 *
 * Prefer using `nothing` over other falsy values as it provides a consistent
 * behavior between various expression binding contexts.
 *
 * In child expressions, `undefined`, `null`, `''`, and `nothing` all behave the
 * same and render no nodes. In attribute expressions, `nothing` _removes_ the
 * attribute, while `undefined` and `null` will render an empty string. In
 * property expressions `nothing` becomes `undefined`.
 */
export const nothing = Symbol.for('vlit-nothing');