import { PartType } from '../../../types.mjs';
import { BasePart } from '../BasePart.mjs';

export class ElementPart extends BasePart {

    constructor(element, parent, options) {
        super(element, parent, options);
        this.element = element;
        this.type = PartType.ELEMENT;
        /** @internal */
        this._$disconnectableChildren = undefined;
        this._$parent = parent;
        this.options = options;
    }

    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }

    _$setValue(value) {
        this.resolveDirective(this, value);
    }
}
