import { ContextRequestEvent } from './events/ContextRequestEvent.mjs';

/**
 * A ContextRoot can be used to gather unsatisfied context requests and
 * re-dispatch them when new providers which satisfy matching context keys are
 * available.
 *
 * This allows providers to be added to a DOM tree, or upgraded, after the
 * consumers.
 */
export class ContextRoot {

    #request;
    #provider;

    constructor() {
        const me = this;
        me.pendingContextRequests = new Map();
        me.#request = me.#onContextRequest.bind(me);
        me.#provider = me.#onContextProvider.bind(me);
    }

    /**
     * Attach the ContextRoot to a given element to intercept `context-request` and
     * `context-provider` events.
     *
     * @param element an element to add event listeners to
     */
    attach(element) {
        element.addEventListener('context-request', this.#request);
        element.addEventListener('context-provider', this.#provider);
    }

    /**
     * Removes the ContextRoot event listeners from a given element.
     *
     * @param element an element from which to remove event listeners
     */
    detach(element) {
        element.removeEventListener('context-request', this.#request);
        element.removeEventListener('context-provider', this.#provider);
    }

    #onContextProvider(event) {
        const me = this;
        const pendingRequestData = me.pendingContextRequests.get(event.context);
        if (pendingRequestData === undefined) {
            // No pending requests for this context at this time
            return;
        }

        // Clear our list. Any still unsatisfied requests will re-add themselves
        // when we dispatch the events below.
        me.pendingContextRequests.delete(event.context);

        // Loop over all pending requests and re-dispatch them from their source
        const { requests } = pendingRequestData;
        for (const { elementRef, callbackRef } of requests) {
            const element = elementRef.deref();
            const callback = callbackRef.deref();
            if (element === undefined || callback === undefined) {
                // The element was GC'ed. Do nothing.
            } else {
                // Re-dispatch if we still have the element and callback
                element.dispatchEvent(new ContextRequestEvent(event.context, callback, true));
            }
        }
    }

    #onContextRequest(event) {

        const me = this;

        // Events that are not subscribing should not be buffered
        if (event.subscribe !== true) {
            return;
        }

        // Note, it's important to use the initial target via composedPath()
        // since that's the requesting element and the event may be re-targeted
        // to an outer host element.
        const element = event.composedPath()[0];
        const callback = event.callback;

        let pendingContextRequests = me.pendingContextRequests.get(event.context);
        if (pendingContextRequests === undefined) {
            me.pendingContextRequests.set(event.context, (pendingContextRequests = {
                callbacks: new WeakMap(),
                requests: [],
            }));
        }

        let callbacks = pendingContextRequests.callbacks.get(element);
        if (callbacks === undefined) {
            pendingContextRequests.callbacks.set(element, (callbacks = new WeakSet()));
        }

        if (callbacks.has(callback)) {
            // We're already tracking this element/callback pair
            return;
        }

        callbacks.add(callback);
        pendingContextRequests.requests.push({
            elementRef: new WeakRef(element),
            callbackRef: new WeakRef(callback),
        });
    }

}
