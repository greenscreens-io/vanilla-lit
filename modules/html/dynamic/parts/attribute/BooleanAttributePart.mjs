import { PartType } from '../../../types.mjs';
import { nothing } from '../../../symbols.mjs'
import { AttributePart } from './AttributePart.mjs';

export class BooleanAttributePart extends AttributePart {

    constructor() {
        super(...arguments);
        this.type = PartType.BOOLEAN;
    }

    /** @internal */
    _commitValue(value) {
        this.element.toggleAttribute(this.name, !!value && value !== nothing);
    }
}