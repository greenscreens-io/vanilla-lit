/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { noChange } from '../../symbols.mjs';
import { PartType } from '../../types.mjs';
import { directive, Directive } from '../directive.mjs';

class TemplateContentDirective extends Directive {

    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.CHILD) {
            throw new Error('templateContent can only be used in child bindings');
        }
    }

    render(template) {
        if (this._previousTemplate === template) {
            return noChange;
        }
        this._previousTemplate = template;
        return document.importNode(template.content, true);
    }
}

/**
 * Renders the content of a template element as HTML.
 *
 * Note, the template should be developer controlled and not user controlled.
 * Rendering a user-controlled template with this directive
 * could lead to cross-site-scripting vulnerabilities.
 */
export const templateContent = directive(TemplateContentDirective);
