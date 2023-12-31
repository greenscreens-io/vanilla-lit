/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { desc } from './base.js';

/**
 * A property decorator that converts a class property into a getter that
 * executes a querySelector on the element's renderRoot.
 *
 * @param selector A DOMString containing one or more selectors to match.
 * @param cache An optional boolean which when true performs the DOM query only
 *     once and caches the result.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
 *
 * ```ts
 * class MyElement {
 *   @query('#first')
 *   first: HTMLDivElement;
 *
 *   render() {
 *     return html`
 *       <div id="first"></div>
 *       <div id="second"></div>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function query(selector, cache) {
    return ((protoOrTarget, nameOrContext, descriptor) => {

        const doQuery = (el) => {
            const result = (el.renderRoot?.querySelector(selector) ?? null);
            // TODO: if we want to allow users to assert that the query will never
            // return null, we need a new option and to throw here if the result
            // is null.
            return result;
        }

        if (cache) {
            // Accessors to wrap from either:
            //   1. The decorator target, in the case of standard decorators
            //   2. The property descriptor, in the case of experimental decorators
            //      on auto-accessors.
            //   3. Functions that access our own cache-key property on the instance,
            //      in the case of experimental decorators on fields.
            const { get, set } = typeof nameOrContext === 'object'
                ? protoOrTarget
                : descriptor ??
                    (() => {
                        const key = Symbol();
                        return {
                            get() {
                                return this[key];
                            },
                            set(v) {
                                this[key] = v;
                            },
                        };
                    })();
            return desc(protoOrTarget, nameOrContext, {
                get() {
                    let result = get.call(this);
                    if (result === undefined) {
                        result = doQuery(this);
                        if (result !== null || this.hasUpdated) {
                            set.call(this, result);
                        }
                    }
                    return result;
                },
            });
        } else {
            // This object works as the return type for both standard and
            // experimental decorators.
            return desc(protoOrTarget, nameOrContext, {
                get() {
                    return doQuery(this);
                },
            });
        }
    });
}
