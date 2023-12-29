import { PartType } from '../../../types.mjs';
import { isPrimitive } from '../../../shared.mjs';
import { nothing, noChange } from '../../../symbols.mjs'
import { ENABLE_EXTRA_SECURITY_HOOKS, sanityze } from '../../sanitizer.mjs';

import { BasePart } from '../BasePart.mjs';

export class AttributePart extends BasePart {

    get tagName() {
        return this.element.tagName;
    }

    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }

    constructor(element, name, strings, parent, options) {
        super(element, name, strings, parent, options);
        this.type = PartType.ATTRIBUTE;
        /** @internal */
        this._$committedValue = nothing;
        /** @internal */
        this._$disconnectableChildren = undefined;
        this.element = element;
        this.name = name;
        this._$parent = parent;
        this.options = options;

        if (strings.length > 2 || strings[0] !== '' || strings[1] !== '') {
            this._$committedValue = new Array(strings.length - 1).fill(new String());
            this.strings = strings;
        } else {
            this._$committedValue = nothing;
        }

        if (ENABLE_EXTRA_SECURITY_HOOKS) {
            this._sanitizer = undefined;
        }
    }

    _$setValue(value, directiveParent = this, valueIndex, noCommit) {

        const strings = this.strings;

        // Whether any of the values has changed, for dirty-checking
        let change = false;
        if (strings === undefined) {
            // Single-value binding case
            value = this.resolveDirective(this, value, directiveParent, 0);
            change = !isPrimitive(value) || (value !== this._$committedValue && value !== noChange);
            if (change) this._$committedValue = value;
        } else {
            // Interpolation case
            const values = value;
            value = strings[0];
            let i, v;
            for (i = 0; i < strings.length - 1; i++) {
                v = this.resolveDirective(this, values[valueIndex + i], directiveParent, i);
                // If the user-provided value is `noChange`, use the previous value
                if (v === noChange) v = this._$committedValue[i];
                change ||= !isPrimitive(v) || v !== this._$committedValue[i];
                if (v === nothing) {
                    value = nothing;
                } else if (value !== nothing) {
                    value += (v ?? '') + strings[i + 1];
                }
                // We always record each value, even if one is `nothing`, for future
                // change detection.
                this._$committedValue[i] = v;
            }
        }

        if (change && !noCommit) {
            this._commitValue(value);
        }
    }

    /** @internal */
    _commitValue(value) {
        if (value === nothing) {
            this.element.removeAttribute(this.name);
        } else {
            if (ENABLE_EXTRA_SECURITY_HOOKS) {
                if (this._sanitizer === undefined) {
                    this._sanitizer = sanityze(this.element, this.name, 'attribute');
                }
                value = this._sanitizer(value ?? '');
            }
            this.element.setAttribute(this.name, (value ?? ''));
        }
    }
}
