import { ContextRequestEvent } from '../events/ContextRequestEvent.mjs';
import { ContextProviderEvent } from '../events/ContextProviderEvent.mjs';
import { ValueNotifier } from '../ValueNotifier.mjs';


/**
 * A ReactiveController which adds context provider behavior to a
 * custom element.
 *
 * This controller simply listens to the `context-request` event when
 * the host is connected to the DOM and registers the received callbacks
 * against its observable Context implementation.
 *
 * The controller may also be attached to any HTML element in which case it's
 * up to the user to call hostConnected() when attached to the DOM. This is
 * done automatically for any custom elements implementing
 * ReactiveControllerHost.
 */
export class ContextProvider extends ValueNotifier {

    constructor(host, contextOrOptions, initialValue) {
        super(contextOrOptions.context !== undefined
            ? contextOrOptions.initialValue
            : initialValue);

        const me = this;
        me.host = host;

        if (contextOrOptions.context !== undefined) {
            me.context = contextOrOptions.context;
        } else {
            me.context = contextOrOptions;
        }

        me.attachListeners();
        me.host.addController?.(me);
    }

    attachListeners() {
        const me = this;
        me.host.addEventListener('context-request', me.#onContextRequest.bind(me));
        me.host.addEventListener('context-provider', me.#onProviderRequest.bind(me));
    }

    hostConnected() {
        // emit an event to signal a provider is available for this context
        const me = this;
        me.host.dispatchEvent(new ContextProviderEvent(me.context, me.host));
    }

    #onContextRequest(ev) {
        const me = this;
        // Only call the callback if the context matches.
        if (ev.context !== me.context) return;

        // Also, in case an element is a consumer AND a provider
        // of the same context, we want to avoid the element to self-register.
        const consumerHost = ev.contextTarget ?? ev.composedPath()[0];
        if (consumerHost === me.host) return;

        ev.stopPropagation();
        me.addCallback(ev.callback, consumerHost, ev.subscribe);
    }

    /**
     * When we get a provider request event, that means a child of this element
     * has just woken up. If it's a provider of our context, then we may need to
     * re-parent our subscriptions, because is a more specific provider than us
     * for its subtree.
     */
    #onProviderRequest(ev) {
        const me = this;
        // Ignore events when the context doesn't match.
        if (ev.context !== me.context) return;

        // Also, in case an element is a consumer AND a provider
        // of the same context it shouldn't provide to itself.
        const childProviderHost = ev.contextTarget ?? ev.composedPath()[0];
        if (childProviderHost === me.host) return;

        // Re-parent all of our subscriptions in case this new child provider
        // should take them over.
        const seen = new Set();
        for (const [callback, { consumerHost }] of me.subscriptions) {
            // Prevent infinite loops in the case where a one host element
            // is providing the same context multiple times.
            //
            // While normally it's a no-op to attempt to re-parent a subscription
            // that already has its proper parent, in the case where there's more
            // than one ValueProvider for the same context on the same hostElement,
            // they will each call the consumer, and since they will each have their
            // own dispose function, a well behaved consumer will notice the change
            // in dispose function and call their old one.
            //
            // This will cause the subscriptions to thrash, but worse, without this
            // set check here, we can end up in an infinite loop, as we add and remove
            // the same subscriptions onto the end of the map over and over.
            if (seen.has(callback)) continue;
            seen.add(callback);
            consumerHost.dispatchEvent(new ContextRequestEvent(me.context, consumerHost, callback, true));
        }
        ev.stopPropagation();
    }
}