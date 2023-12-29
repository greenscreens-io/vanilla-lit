import { nothing } from '../../../symbols.mjs'
import { PartType } from '../../../types.mjs';
import { ENABLE_EXTRA_SECURITY_HOOKS, sanityze } from '../../sanitizer.mjs';

import { AttributePart } from './AttributePart.mjs';

export class PropertyPart extends AttributePart {

    constructor() {
        super(...arguments);
        this.type = PartType.PROPERTY;
    }

    /** @internal */
    _commitValue(value) {
        if (ENABLE_EXTRA_SECURITY_HOOKS) {
            if (this._sanitizer === undefined) {
                this._sanitizer = sanityze(this.element, this.name, 'property');
            }
            value = this._sanitizer(value);
        }
        this.element[this.name] = value === nothing ? undefined : value;
    }
}