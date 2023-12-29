/**
 * An object that can host Reactive Controllers and call their lifecycle
 * callbacks.
 */
export class ReactiveControllerHost {

    /**
     * Adds a controller to the host, which sets up the controller's lifecycle
     * methods to be called with the host's lifecycle.
     * @param {ReactiveController} controller
     */
    addController(controller) { }

    /**
     * Removes a controller from the host.
     * @param {ReactiveController} controller
     */
    removeController(controller) { }

    /**
     * Requests a host update which is processed asynchronously. The update can
     * be waited on via the `updateComplete` property.
     */
    requestUpdate() { }

    /**
     * Returns a Promise that resolves when the host has completed updating.
     * The Promise value is a boolean that is `true` if the element completed the
     * update without triggering another update. The Promise result is `false` if
     * a property was set inside `updated()`. If the Promise is rejected, an
     * exception was thrown during the update.
     *
     * @return A promise of a boolean that indicates if the update resolved
     *     without triggering another update.
     */
    async updateComplete() { };
}