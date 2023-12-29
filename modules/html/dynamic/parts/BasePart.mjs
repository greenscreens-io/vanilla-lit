import { noChange, notifySymbol, directiveSymbol } from '../../symbols.mjs';
import { isPrimitive } from '../../shared.mjs';

export class BasePart {

    resolveDirective(part, value, parent = part, attributeIndex) {
    
        if (value === noChange) return value;
    
        let currentDirective = attributeIndex !== undefined
            ? parent.__directives?.[attributeIndex]
            : parent.__directive;
        
        const nextDirectiveConstructor = isPrimitive(value)
            ? undefined
            : value[directiveSymbol];
    
        if (currentDirective?.constructor !== nextDirectiveConstructor) {
            // This property needs to remain unminified.
            currentDirective?.[notifySymbol]?.(false);
    
            if (nextDirectiveConstructor === undefined) {
                currentDirective = undefined;
            } else {
                currentDirective = new nextDirectiveConstructor(part);
                currentDirective._$initialize(part, parent, attributeIndex);
            }
    
            if (attributeIndex !== undefined) {
                (parent.__directives ??= [])[attributeIndex] = currentDirective;
            } else {
                parent.__directive = currentDirective;
            }
        }
    
        if (currentDirective !== undefined) {
            value = this.resolveDirective(part, currentDirective._$resolve(part, value.values), currentDirective, attributeIndex);
        }
    
        return value;
    }

}