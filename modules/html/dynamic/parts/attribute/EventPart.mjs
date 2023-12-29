import { nothing, noChange } from '../../../symbols.mjs'
import { PartType } from '../../../types.mjs';
import { AttributePart } from './AttributePart.mjs';

export class EventPart extends AttributePart {

    constructor(element, name, strings, parent, options) {
        super(element, name, strings, parent, options);
        this.type = PartType.EVENT;
    }

    _$setValue(newListener, directiveParent = this) {

        newListener = this.resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
        if (newListener === noChange) return;
        
        const oldListener = this._$committedValue;

        // If the new value is nothing or any options change we have to remove the
        // part as a listener.
        const shouldRemoveListener = (newListener === nothing && oldListener !== nothing) ||
            newListener.capture !==
            oldListener.capture ||
            newListener.once !==
            oldListener.once ||
            newListener.passive !==
            oldListener.passive;

            // If the new value is not nothing and we removed the listener, we have
        // to add the part as a listener.
        const shouldAddListener = newListener !== nothing &&
            (oldListener === nothing || shouldRemoveListener);
        
            if (shouldRemoveListener) {
            this.element.removeEventListener(this.name, this, oldListener);
        }
        
        if (shouldAddListener) {
            // Beware: IE11 and Chrome 41 don't like using the listener as the
            // options object. Figure out how to deal w/ this in IE11 - maybe
            // patch addEventListener?
            this.element.addEventListener(this.name, this, newListener);
        }
        
        this._$committedValue = newListener;
    }
    
    handleEvent(event) {
        if (typeof this._$committedValue === 'function') {
            this._$committedValue.call(this.options?.host ?? this.element, event);
        } else {
            this._$committedValue.handleEvent(event);
        }
    }
}