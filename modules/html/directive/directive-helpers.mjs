import { typeSymbol, directiveSymbol } from '../symbols.mjs';
import { ChildPart } from '../dynamic/parts/element/ChildPart.mjs';


/**
 * Tests if a value is a TemplateResult or a CompiledTemplateResult.
 */
export const isTemplateResult = (value, type) => type === undefined
    ? // This property needs to remain unminified.
        value?.[typeSymbol] !== undefined
    : value?.[typeSymbol] === type;

/**
 * Tests if a value is a CompiledTemplateResult.
 */
export const isCompiledTemplateResult = (value) => {
    return value?.[typeSymbol]?.h != null;
}

/**
 * Tests if a value is a DirectiveResult.
 */
export const isDirectiveResult = (value) => 

// This property needs to remain unminified.
value?.[directiveSymbol] !== undefined;

/**
 * Retrieves the Directive class for a DirectiveResult
 */
export const getDirectiveClass = (value) => 

// This property needs to remain unminified.
value?.[directiveSymbol];

/**
 * Tests whether a part has only a single-expression with no strings to
 * interpolate between.
 *
 * Only AttributePart and PropertyPart can have multiple expressions.
 * Multi-expression parts have a `strings` property and single-expression
 * parts do not.
 */
export const isSingleExpression = (part) => part.strings === undefined;
const createMarker = () => document.createComment('');

/**
 * Inserts a ChildPart into the given container ChildPart's DOM, either at the
 * end of the container ChildPart, or before the optional `refPart`.
 *
 * This does not add the part to the containerPart's committed value. That must
 * be done by callers.
 *
 * @param containerPart Part within which to add the new ChildPart
 * @param refPart Part before which to add the new ChildPart; when omitted the
 *     part added to the end of the `containerPart`
 * @param part Part to insert, or undefined to create a new part
 */
export const insertPart = (containerPart, refPart, part) => {
    const container = containerPart._$startNode.parentNode;
    const refNode = refPart === undefined ? containerPart._$endNode : refPart._$startNode;
    if (part === undefined) {
        const startNode = (container).insertBefore(createMarker(), refNode);
        const endNode = (container).insertBefore(createMarker(), refNode);
        part = new ChildPart(startNode, endNode, containerPart, containerPart.options);
    } else {
        const endNode = (part._$endNode).nextSibling;
        const oldParent = part._$parent;
        const parentChanged = oldParent !== containerPart;
        if (parentChanged) {
            part._$reparentDisconnectables?.(containerPart);
            // Note that although `_$reparentDisconnectables` updates the part's
            // `_$parent` reference after unlinking from its current parent, that
            // method only exists if Disconnectables are present, so we need to
            // unconditionally set it here
            part._$parent = containerPart;
            // Since the _$isConnected getter is somewhat costly, only
            // read it once we know the subtree has directives that need
            // to be notified
            let newConnectionState;
            if (part._$notifyConnectionChanged !== undefined &&
                (newConnectionState = containerPart._$isConnected) !==
                    oldParent._$isConnected) {
                part._$notifyConnectionChanged(newConnectionState);
            }
        }
        if (endNode !== refNode || parentChanged) {
            let start = part._$startNode;
            while (start !== endNode) {
                const n = (start).nextSibling;
                (container).insertBefore(start, refNode);
                start = n;
            }
        }
    }
    return part;
}

/**
 * Sets the value of a Part.
 *
 * Note that this should only be used to set/update the value of user-created
 * parts (i.e. those created using `insertPart`); it should not be used
 * by directives to set the value of the directive's container part. Directives
 * should return a value from `update`/`render` to update their part state.
 *
 * For directives that require setting their part value asynchronously, they
 * should extend `AsyncDirective` and call `this.setValue()`.
 *
 * @param part Part to set
 * @param value Value to set
 * @param index For `AttributePart`s, the index to set
 * @param directiveParent Used internally; should not be set by user
 */
export const setChildPartValue = (part, value, directiveParent = part) => {
    part._$setValue(value, directiveParent);
    return part;
}

// A sentinel value that can never appear as a part value except when set by
// live(). Used to force a dirty-check to fail and cause a re-render.
const RESET_VALUE = {};

/**
 * Sets the committed value of a ChildPart directly without triggering the
 * commit stage of the part.
 *
 * This is useful in cases where a directive needs to update the part such
 * that the next update detects a value change or not. When value is omitted,
 * the next update will be guaranteed to be detected as a change.
 *
 * @param part
 * @param value
 */
export const setCommittedValue = (part, value = RESET_VALUE) => (part._$committedValue = value);

/**
 * Returns the committed value of a ChildPart.
 *
 * The committed value is used for change detection and efficient updates of
 * the part. It can differ from the value set by the template or directive in
 * cases where the template value is transformed before being committed.
 *
 * - `TemplateResult`s are committed as a `TemplateInstance`
 * - Iterables are committed as `Array<ChildPart>`
 * - All other types are committed as the template value or value returned or
 *   set by a directive.
 *
 * @param part
 */
export const getCommittedValue = (part) => part._$committedValue;

/**
 * Removes a ChildPart from the DOM, including any of its content and markers.
 *
 * Note: The only difference between this and clearPart() is that this also
 * removes the part's start node. This means that the ChildPart must own its
 * start node, ie it must be a marker node specifically for this part and not an
 * anchor from surrounding content.
 *
 * @param part The Part to remove
 */
export const removePart = (part) => {
    /*
    part._$notifyConnectionChanged?.(false, true);
    let start = part._$startNode;
    const end = (part._$endNode).nextSibling;
    while (start !== end) {
        const n = (start).nextSibling;
        (start).remove();
        start = n;
    }
    */
    part._$clear();
    part._$startNode.remove();    
};

export const clearPart = (part) => {
    part._$clear();
}
