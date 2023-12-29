import { typeSymbol } from '../../symbols.mjs';
import { PartType, ResultType } from '../../types.mjs';
import { boundAttributeSuffix, createMarker, marker, markerMatch, walker } from '../../shared.mjs';
import { AttributePart, EventPart, PropertyPart, BooleanAttributePart } from '../parts/attribute/index.mjs';

import { getTemplateHtml, rawTextElement } from './TemplateRenderer.mjs';

export class Template {

    static createElement(html, _options) {
        const el = document.createElement('template');
        el.innerHTML = html;
        return el;
    }

    #nodeIndex = 0;
    #attrNameIndex = 0;

    constructor({ strings, [typeSymbol]: type }, options) {

        const partCount = strings.length - 1;
        
        // Create template element
        const [html, attrNames] = getTemplateHtml(strings, type);
        
        const me = this;
        me.parts = [];
        me.el = Template.createElement(html, options);
        
        me.#handleSVG(type);
        me.#handleTemplate(partCount, attrNames);
    }

    #handleSVG(type) {
        // Re-parent SVG nodes into template root
        if (type === ResultType.SVG) {
            const svgElement = this.el.content.firstChild;
            svgElement.replaceWith(...svgElement.childNodes);
        }
    }

    // Walk the template to find binding markers and create TemplateParts
    #handleTemplate(partCount, attrNames) {
        
        const me = this;
        const parts = me.parts;
        let node;
        
        me.#nodeIndex = 0;
        me.#attrNameIndex = 0;
        walker.currentNode = me.el.content;

        while ((node = walker.nextNode()) !== null && parts.length < partCount) {
            if (node.nodeType === 1) {
                me.#handleElement(node, attrNames);
            } else if (node.nodeType === 8) {
                me.#handleComment(node);
            }
            me.#nodeIndex++;
        }        
    }

    #handleElement(node, attrNames) {

        const me = this;

        // TODO (justinfagnani): for attempted dynamic tag names, we don't
        // increment the bindingIndex, and it'll be off by 1 in the element
        // and off by two after it.
        if (node.hasAttributes()) {
            me.#handleAttributes(node, attrNames);
        }

        if (rawTextElement.test(node.tagName)) {
            me.#handleText(node);
        }

    }

    #handleAttributes(node, attrNames) {
        
        const me = this;
        const parts = me.parts;

        for (const name of node.getAttributeNames()) {
            if (name.endsWith(boundAttributeSuffix)) {
                const realName = attrNames[me.#attrNameIndex++];
                const value = node.getAttribute(name);
                const statics = value.split(marker);
                const m = /([.?@])?(.*)/.exec(realName);
                parts.push({
                    type: PartType.ATTRIBUTE,
                    index: me.#nodeIndex,
                    name: m[2],
                    strings: statics,
                    ctor: m[1] === '.'
                        ? PropertyPart
                        : m[1] === '?'
                            ? BooleanAttributePart
                            : m[1] === '@'
                                ? EventPart
                                : AttributePart,
                });
                node.removeAttribute(name);
            } else if (name.startsWith(marker)) {
                parts.push({
                    type: PartType.ELEMENT,
                    index: me.#nodeIndex,
                });
                node.removeAttribute(name);
            }
        }
    }

    #handleText(node) {

        const me = this;
        const parts = me.parts;
        const strings = node.textContent.split(marker);
        const lastIndex = strings.length - 1;

        if (lastIndex > 0) {
            node.textContent = trustedTypes
                ? trustedTypes.emptyScript
                : '';

            for (let i = 0; i < lastIndex; i++) {
                node.append(strings[i], createMarker());
                // Walk past the marker node we just added
                walker.nextNode();
                parts.push({ type: PartType.CHILD, index: ++me.#nodeIndex });
            }
            node.append(strings[lastIndex], createMarker());
        }
    }

    #handleComment(node) {
        const me = this;
        const parts = me.parts;
        const data = node.data;
        if (data === markerMatch) {
            parts.push({ type: PartType.CHILD, index: me.#nodeIndex });
        } else {
            let i = -1;
            while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                parts.push({ type: PartType.COMMENT, index: me.#nodeIndex });
                i += marker.length - 1;
            }
        }
    }
}