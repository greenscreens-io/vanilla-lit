import { ReactiveController } from '../../core/ReactiveController.mjs';
import { ContextRequestEvent } from '../events/ContextRequestEvent.mjs';

/**
 * A ReactiveController which adds context consuming behavior to a custom
 * element by dispatching `context-request` events.
 *
 * When the host element is connected to the document it will emit a
 * `context-request` event with its context key. When the context request
 * is satisfied the controller will invoke the callback, if present, and
 * trigger a host update so it can respond to the new value.
 *
 * It will also call the dispose method given by the provider when the
 * host element is disconnected.
 */

export class ContextConsumer extends ReactiveController {

    host = undefined;
    context = undefined;
    callback = undefined;
    subscribe = undefined;
    unsubscribe = undefined;
    provided = undefined;

    constructor(host, contextOrOptions, callback, subscribe) {
        super();
        const me = this;
        me.subscribe = false;
        me.provided = false;
        me.value = undefined;
        me.host = host;

        // This is a potentially fragile duck-type. It means a context object can't
        // have a property name context and be used in positional argument form.
        if (contextOrOptions.context !== undefined) {
            const options = contextOrOptions;
            me.context = options.context;
            me.callback = options.callback;
            me.subscribe = options.subscribe ?? false;
        } else {
            me.context = contextOrOptions;
            me.callback = callback;
            me.subscribe = subscribe ?? false;
        }

        me.host.addController(this);
    }

    hostConnected() {
        this.dispatchRequest();
    }

    hostDisconnected() {
        const me = this;
        if (me.unsubscribe) {
            me.unsubscribe();
            me.unsubscribe = undefined;
        }
    }

    dispatchRequest() {
        const me = this;
        me.host.dispatchEvent(new ContextRequestEvent(me.context, me.#callback.bind(me), me.subscribe));
    }

    // This function must have stable identity to properly dedupe in ContextRoot
    // if this element connects multiple times.
    #callback(value, unsubscribe) {

        const me = this;

        // some providers will pass an unsubscribe function indicating they may provide future values
        if (me.unsubscribe) {
            // if the unsubscribe function changes this implies we have changed provider
            if (me.unsubscribe !== unsubscribe) {
                // cleanup the old provider
                me.provided = false;
                me.unsubscribe();
            }
            // if we don't support subscription, immediately unsubscribe
            if (!me.subscribe) {
                me.unsubscribe();
            }
        }
        // store the value so that it can be retrieved from the controller
        me.value = value;
        // schedule an update in case this value is used in a template
        me.host.requestUpdate();
        // only invoke callback if we are either expecting updates or have not yet
        // been provided a value
        if (!me.provided || this.subscribe) {
            me.provided = true;
            if (me.callback) {
                me.callback(value, unsubscribe);
            }
        }
        me.unsubscribe = unsubscribe;
    }
}
