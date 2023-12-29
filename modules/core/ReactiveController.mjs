/**
 * A Reactive Controller is an object that enables sub-component code
 * organization and reuse by aggregating the state, behavior, and lifecycle
 * hooks related to a single feature.
 *
 * Controllers are added to a host component, or other object that implements
 * the `ReactiveControllerHost` interface, via the `addController()` method.
 * They can hook their host components's lifecycle by implementing one or more
 * of the lifecycle callbacks, or initiate an update of the host component by
 * calling `requestUpdate()` on the host.
 */
export class ReactiveController {

    /**
    * Called when the host is connected to the component tree. For custom
    * element hosts, this corresponds to the `connectedCallback()` lifecycle,
    * which is only called when the component is connected to the document.
    */
    hostConnected() { }

    /**
     * Called when the host is disconnected from the component tree. For custom
     * element hosts, this corresponds to the `disconnectedCallback()` lifecycle,
     * which is called the host or an ancestor component is disconnected from the
     * document.
     */
    hostDisconnected() { }

    /**
     * Called during the client-side host update, just before the host calls
     * its own update.
     *
     * Code in `update()` can depend on the DOM as it is not called in
     * server-side rendering.
     */
    hostUpdate() { }

    /**
     * Called after a host update, just before the host calls firstUpdated and
     * updated. It is not called in server-side rendering.
     *
     */
    hostUpdated() { }
}