/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { noChange } from '../../symbols.mjs';
import { PartType } from '../../types.mjs';
import { directive, Directive } from '../directive.mjs';

const important = 'important';

// The leading space is important
const importantFlag = ' !' + important;

// How many characters to remove from a value, as a negative number
const flagTrim = 0 - importantFlag.length;

class StyleMapDirective extends Directive {

    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ATTRIBUTE ||
            partInfo.name !== 'style' ||
            partInfo.strings?.length > 2) {
            throw new Error('The `styleMap` directive must be used in the `style` attribute ' +
                'and must be the only part in the attribute.');
        }
    }

    render(styleInfo) {
        return Object.keys(styleInfo).reduce((style, prop) => {
            const value = styleInfo[prop];
            if (value == null) {
                return style;
            }
            // Convert property names from camel-case to dash-case, i.e.:
            //  `backgroundColor` -> `background-color`
            // Vendor-prefixed names need an extra `-` appended to front:
            //  `webkitAppearance` -> `-webkit-appearance`
            // Exception is any property name containing a dash, including
            // custom properties; we assume these are already dash-cased i.e.:
            //  `--my-button-color` --> `--my-button-color`
            prop = prop.includes('-')
                ? prop
                : prop
                    .replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, '-$&')
                    .toLowerCase();
            return style + `${prop}:${value};`;
        }, '');
    }

    update(part, [styleInfo]) {

        const { style } = part.element;

        if (this._previousStyleProperties === undefined) {
            this._previousStyleProperties = new Set(Object.keys(styleInfo));
            return this.render(styleInfo);
        }

        // Remove old properties that no longer exist in styleInfo
        for (const name of this._previousStyleProperties) {
            // If the name isn't in styleInfo or it's null/undefined
            if (styleInfo[name] == null) {
                this._previousStyleProperties.delete(name);
                if (name.includes('-')) {
                    style.removeProperty(name);
                } else {
                    style[name] = null;
                }
            }
        }

        // Add or update properties
        for (const name in styleInfo) {

            const value = styleInfo[name];

            if (value != null) {
                this._previousStyleProperties.add(name);
                const isImportant = typeof value === 'string' && value.endsWith(importantFlag);
                if (name.includes('-') || isImportant) {
                    style.setProperty(name, isImportant
                        ? value.slice(0, flagTrim)
                        : value, isImportant ? important : '');
                } else {
                    style[name] = value;
                }
            }
        }

        return noChange;
    }
}

/**
 * A directive that applies CSS properties to an element.
 *
 * `styleMap` can only be used in the `style` attribute and must be the only
 * expression in the attribute. It takes the property names in the
 * {@link StyleInfo styleInfo} object and adds the properties to the inline
 * style of the element.
 *
 * Property names with dashes (`-`) are assumed to be valid CSS
 * property names and set on the element's style object using `setProperty()`.
 * Names without dashes are assumed to be camelCased JavaScript property names
 * and set on the element's style object using property assignment, allowing the
 * style object to translate JavaScript-style names to CSS property names.
 *
 * For example `styleMap({backgroundColor: 'red', 'border-top': '5px', '--size':
 * '0'})` sets the `background-color`, `border-top` and `--size` properties.
 *
 * @param styleInfo
 * @see {@link https://lit.dev/docs/templates/directives/#stylemap styleMap code samples on Lit.dev}
 */
export const styleMap = directive(StyleMapDirective);
