import { partSymbol, typeSymbol } from '../symbols.mjs';
import { ResultType } from '../types.mjs';
import { createMarker } from '../shared.mjs';
import { ChildPart } from './parts/element/ChildPart.mjs';
import { ENABLE_EXTRA_SECURITY_HOOKS, setSanitizer, createSanitizer } from './sanitizer.mjs';

export class DynamicHTML {

    /**
     * Generates a template literal tag function that returns a TemplateResult with
     * the given result type.
     */
    static #tag = (type) => (strings, ...values) => {
        return {
            [typeSymbol]: type,
            strings,
            values,
        };
    }

    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     *
     * ```ts
     * const header = (title: string) => html`<h1>${title}</h1>`;
     * ```
     *
     * The `html` tag returns a description of the DOM to render as a value. It is
     * lazy, meaning no work is done until the template is rendered. When rendering,
     * if a template comes from the same expression as a previously rendered result,
     * it's efficiently updated instead of replaced.
     */
    static html = DynamicHTML.#tag(ResultType.HTML);

    /**
     * Interprets a template literal as an SVG fragment that can efficiently
     * render to and update a container.
     *
     * ```ts
     * const rect = svg`<rect width="10" height="10"></rect>`;
     *
     * const myImage = html`
     *   <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
     *     ${rect}
     *   </svg>`;
     * ```
     *
     * The `svg` *tag function* should only be used for SVG fragments, or elements
     * that would be contained **inside** an `<svg>` HTML element. A common error is
     * placing an `<svg>` *element* in a template tagged with the `svg` tag
     * function. The `<svg>` element is an HTML element and should be used within a
     * template tagged with the {@linkcode html} tag function.
     *
     * In LitElement usage, it's invalid to return an SVG fragment from the
     * `render()` method, as the SVG fragment will be contained within the element's
     * shadow root and thus cannot be used within an `<svg>` HTML element.
     */
    static svg = DynamicHTML.#tag(ResultType.SVG);


    /**
     * Renders a value, usually a dynamic TemplateResult, to the container.
     *
     * This example renders the text "Hello, Zoe!" inside a paragraph tag, appending
     * it to the container `document.body`.
     *
     * ```js
     * import {html, render} from 'lit';
     *
     * const name = "Zoe";
     * render(html`<p>Hello, ${name}!</p>`, document.body);
     * ```
     *
     * @param value Any [renderable
     *   value](https://lit.dev/docs/templates/expressions/#child-expressions),
     *   typically a {@linkcode TemplateResult} created by evaluating a template tag
     *   like {@linkcode html} or {@linkcode svg}.
     * @param container A DOM container to render to. The first render will append
     *   the rendered value to the container, and subsequent renders will
     *   efficiently update the rendered value if the same result type was
     *   previously rendered there.
     * @param options See {@linkcode RenderOptions} for options documentation.
     */
    static render(value, container, options) {
        const partOwnerNode = options?.renderBefore ?? container;
        let part = partOwnerNode[partSymbol];
        if (part === undefined) {
            const endNode = options?.renderBefore ?? null;
            partOwnerNode[partSymbol] = part = new ChildPart(container.insertBefore(createMarker(), endNode), endNode, undefined, options ?? {});
        }
        part._$setValue(value);
        return part;
    }

    static {
        if (ENABLE_EXTRA_SECURITY_HOOKS) {
            DynamicHTML.render.setSanitizer = setSanitizer;
            DynamicHTML.render.createSanitizer = createSanitizer;
        }
    }
}


// for compatibility with Lit 3.0
export const html = DynamicHTML.html;
export const svg = DynamicHTML.svg;
export const render = DynamicHTML.render;