
export class ContextProviderEvent extends Event {
    
    /**
     * @param context the context which this provider can provide
     */
    constructor(context) {
        super('context-provider', { bubbles: true, composed: true });
        this.context = context;
    }
}