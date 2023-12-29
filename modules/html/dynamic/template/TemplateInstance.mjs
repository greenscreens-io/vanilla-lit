import { PartType } from '../../types.mjs';
import { walker } from '../../shared.mjs';
import { ChildPart } from '../parts/element/ChildPart.mjs';
import { ElementPart } from '../parts/element/ElementPart.mjs';

/**
 * An updateable instance of a Template. Holds references to the Parts used to
 * update the template instance.
 */
export class TemplateInstance {

    constructor(template, parent) {
        this._$parts = [];
        /** @internal */
        this._$disconnectableChildren = undefined;
        this._$template = template;
        this._$parent = parent;
    }

    // Called by ChildPart parentNode getter
    get parentNode() {
        return this._$parent.parentNode;
    }

    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }

    _clone(options) {

        const { el: { content }, parts: parts, } = this._$template;
        const fragment = (options?.creationScope ?? document).importNode(content, true);

        walker.currentNode = fragment;

        let node = walker.nextNode();
        let nodeIndex = 0;
        let partIndex = 0;
        let templatePart = parts[0];

        while (templatePart !== undefined) {

            if (nodeIndex === templatePart.index) {
                let part;
                if (templatePart.type === PartType.CHILD) {
                    part = new ChildPart(node, node.nextSibling, this, options);
                } else if (templatePart.type === PartType.ATTRIBUTE) {
                    part = new templatePart.ctor(node, templatePart.name, templatePart.strings, this, options);
                } else if (templatePart.type === PartType.ELEMENT) {
                    part = new ElementPart(node, this, options);
                }
                this._$parts.push(part);
                templatePart = parts[++partIndex];
            }

            if (nodeIndex !== templatePart?.index) {
                node = walker.nextNode();
                nodeIndex++;
            }
        }

        walker.currentNode = document;
        return fragment;
    }

    _update(values) {
        let i = 0;
        for (const part of this._$parts) {
            if (part !== undefined) {
                if (part.strings !== undefined) {
                    part._$setValue(values, part, i);
                    i += part.strings.length - 2;
                } else {
                    part._$setValue(values[i]);
                }
            }
            i++;
        }
    }
}