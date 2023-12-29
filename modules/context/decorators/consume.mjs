import { ContextConsumer } from '../controllers/ContextConsumer.mjs';

/**
 * A property decorator that adds a ContextConsumer controller to the component
 * which will try and retrieve a value for the property via the Context API.
 *
 * @param context A Context identifier value created via `createContext`
 * @param subscribe An optional boolean which when true allows the value to be updated
 *   multiple times.
 *
 * @example
 *
 * ```ts
 * import {consume} from '@lit/context';
 * import {loggerContext, Logger} from 'community-protocols/logger';
 *
 * class MyElement {
 *   @consume({context: loggerContext})
 *   logger?: Logger;
 *
 *   doThing() {
 *     this.logger!.log('thing was done');
 *   }
 * }
 * ```
 * @category Decorator
 */
export function consume({ context, subscribe, }) {
    return ((protoOrTarget, nameOrContext) => {
        if (typeof nameOrContext === 'object') {
            nameOrContext.addInitializer(function () {
                new ContextConsumer(this, {
                    context,
                    callback: (value) => {
                        this[nameOrContext.name] = value;
                    },
                    subscribe,
                });
            });
        } else {
            protoOrTarget.constructor.addInitializer((element) => {
                new ContextConsumer(element, {
                    context,
                    callback: (value) => {
                        element[nameOrContext] = value;
                    },
                    subscribe,
                });
            });
        }
    });
}