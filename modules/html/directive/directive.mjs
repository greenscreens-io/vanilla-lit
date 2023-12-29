import { directiveSymbol } from '../symbols.mjs';

/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 */
export const directive = (c) => (...values) => ({
    // This property needs to remain unminified.
    [directiveSymbol]: c,
    values,
})

/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
export class Directive {
  
    constructor(_partInfo) { }
  
    get _$isConnected() {
        return this._$parent._$isConnected;
    }
    
    _$initialize(part, parent, attributeIndex) {
        this.__part = part;
        this._$parent = parent;
        this.__attributeIndex = attributeIndex;
    }
    
    _$resolve(part, props) {
        return this.update(part, props);
    }

    update(_part, props) {
        return this.render(...props);
    }
}
