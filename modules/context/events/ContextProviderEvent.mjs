
export class ContextProviderEvent extends Event {
    
    context = undefined;
    contextTarget = undefined;

    /**
     * @param context the context which this provider can provide
     */
    constructor(context, contextTarget) {
        super('context-provider', { bubbles: true, composed: true });
        this.context = context;
        this.contextTarget = contextTarget;
    }
}