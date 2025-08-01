
// import { ReactiveController } from './ReactiveController.mjs';
import { AttributeConverter } from './AttributeConverter.mjs';
import { CSS } from './css/index.mjs';

const defaultConverter = new AttributeConverter();
export const notEqual = (val, old) => !Object.is(val, old);

const defaultPropertyDeclaration = {
    attribute: true,
    reflect: false,
    useDefault: false,
    type: String,
    converter: defaultConverter,
    hasChanged: notEqual,
}

const attributeToPropertyMap = Symbol();
const prepare = Symbol();
const elementProperties = Symbol();
const elementStyles = Symbol();
const initializers = Symbol();
const finalize = Symbol();
const finalized = Symbol();

const prepareFn = function () {
    const me = this;
    //if (Object.hasOwn(me, elementProperties)) return;
    if (Object.getOwnPropertySymbols(me).includes(elementProperties)) return;
    const superCtor = Object.getPrototypeOf(me);
    if (typeof superCtor[finalize] === 'function') superCtor[finalize]();
    me[elementProperties] = new Map(superCtor[elementProperties]);
}

const attributeNameForProperty = (name, options) => {
    const attribute = options.attribute;
    return attribute === false
        ? undefined
        : typeof attribute === 'string'
            ? attribute
            : typeof name === 'string'
                ? name.toLowerCase()
                : undefined;
}

globalThis.ReactivePropertyMetadata ??= new WeakMap();

/**
 * Reactive WebComponent based on Google ltd. Lit ReactiveElement
 */
export class ReactiveElement extends HTMLElement {

    static shadowRootOptions = { mode: 'open' };

    // static initializers = undefined;
    // static elementProperties = undefined;
    // static elementStyles = [];
    static [elementStyles] = [];

    // user defiend 
    static properties = {};
    static styles = undefined;

    static [finalized] = false;

    #reflectingProperties = undefined;
    #instanceProperties = undefined;

    #controllers = undefined;
    #updatePromise = undefined;
    #changedProperties = undefined;
    #defaultValues = undefined;
    #reflectingProperty = undefined;
    #renderRoot = undefined;

    #hasUpdated = false;
    #isUpdatePending = false;

    /**
     * Returns a list of attributes corresponding to the registered properties.
    */
    static get observedAttributes() {
        Object.defineProperty(ReactiveElement.__proto__, prepare, { value: prepareFn });
        const me = this;
        me[finalize]();
        return me[attributeToPropertyMap] && [...me[attributeToPropertyMap].keys()];
    }

    static addInitializer(initializer) {
        const me = this;
        me[prepare]();
        me.initializers ??= [].push(initializer);
    }

    static [finalize]() {
        const me = this;
        //if (Object.hasOwn(me, 'finalized')) return;
        if (me[finalized] === true) return;
        me[finalized] = true;
        me[prepare]();

        if (Object.hasOwn(me, 'properties')) {
            const props = me.properties;
            const propKeys = [
                ...Object.getOwnPropertyNames(props),
                ...Object.getOwnPropertySymbols(props),
            ];
            for (const p of propKeys) {
                me.createProperty(p, props[p]);
            }
        }

        const metadata = me[Symbol.for('metadata')];
        if (metadata !== null) {
            const properties = ReactivePropertyMetadata.get(metadata);
            if (properties !== undefined) {
                for (const [p, options] of properties) {
                    me[elementProperties].set(p, options);
                }
            }
        }


        // Create the attribute-to-property map
        me[attributeToPropertyMap] = new Map();
        for (const [p, options] of me[elementProperties]) {
            const attr = attributeNameForProperty(p, options);
            if (attr !== undefined) {
                me[attributeToPropertyMap].set(attr, p);
            }
        }

        me[initializers] = me.finalizeStyles(me.styles);
    }

    static finalizeStyles(styles) {
        const elementStyles = [];
        if (Array.isArray(styles)) {
            const set = new Set(styles.flat(Infinity).reverse());
            set.forEach(s => elementStyles.unshift(CSS.getCompatibleStyle(s)));
        } else if (styles !== undefined) {
            elementStyles.push(CSS.getCompatibleStyle(styles));
        }
        return elementStyles;
    }

    static createProperty(name, options) {
        const me = this;
        if (options.state) options.attribute = false;
        me[prepare]();
        // Whether this property is wrapping accessors.
        // Helps control the initial value change and reflection logic.
        if (me.prototype.hasOwnProperty(name)) {
            options = Object.create(options);
            options.wrapped = true;
        }
        me[elementProperties].set(name, options);
        if (!options.noAccessor) {
            const key = Symbol();
            const descriptor = me.getPropertyDescriptor(name, key, options);
            if (descriptor !== undefined) {
                Object.defineProperty(me.prototype, name, descriptor);
            }
        }
    }

    static getPropertyDescriptor(name, key, options) {
        const { get, set } = Object.getOwnPropertyDescriptor(this.prototype, name) ?? {
            get() {
                return this[key];
            },
            set(v) {
                this[key] = v;
            },
        }
        return {
            /*
            get() {
                return get?.call(this);
                },
                */
            get,
            set(value) {
                const me = this;
                const oldValue = get?.call(me);
                set?.call(me, value);
                me.requestUpdate(name, oldValue, options);
            },
            configurable: true,
            enumerable: true,
        }
    }

    static getPropertyOptions(name) {
        return this[elementProperties].get(name) ?? defaultPropertyDeclaration;
    }

    constructor() {
        super();
        this.#initialize();
    }

    connectedCallback() {
        const me = this;
        me.#renderRoot ??= me.createRenderRoot();
        me.enableUpdating(true);
        me.#controllers?.forEach((c) => c.hostConnected?.());
    }

    disconnectedCallback() {
        const me = this;
        me.#controllers?.forEach((c) => c.hostDisconnected?.());
        me.adoptedStyleSheets = [];
        me.#renderRoot = null;
        if (me.shadowRoot) {
            me.shadowRoot.adoptedStyleSheets = [];
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.#attributeToProperty(name, newValue);
    }

    // ******************************
    // PUBLIC GETTERS
    // ******************************

    get hasUpdated() { return this.#hasUpdated; }
    get isUpdatePending() { return this.#isUpdatePending; }
    get renderRoot() { return this.#renderRoot; }

    // ******************************
    // PROTECTED FUNCTIONS 
    // ******************************

    addController(controller) {
        // if (!(controller instanceof ReactiveController)) throw new Error('Argument not instance of ReactiveController');
        const me = this;
        (me.#controllers ??= new Set()).add(controller);
        if (me.isConnected && me.renderRoot !== undefined) {
            controller.hostConnected?.();
        }
    }

    removeController(controller) {
        this.#controllers?.delete(controller);
    }

    createRenderRoot() {
        const me = this;
        const renderRoot = me.shadowRoot ?? me.attachShadow(me.constructor.shadowRootOptions);
        CSS.adoptStyles(renderRoot, me.constructor[elementStyles]);
        return renderRoot;
    }

    enableUpdating(requestedUpdate) { }

    firstUpdated(changedProperties) { }

    updated(changedProperties) { }

    getUpdateComplete() { return this.#updatePromise; }

    scheduleUpdate() { return this.performUpdate(); }

    shouldUpdate(changedProperties) { return this.isConnected; }

    willUpdate(changedProperties) { }

    update(changedProperties) {
        const me = this;
        // The forEach() expression will only run when when #reflectingProperties is
        // defined, and it returns undefined, setting #reflectingProperties to undefined
        me.#reflectingProperties &&= me.#reflectingProperties.forEach((p) => me.#propertyToAttribute(p, this[p]));
        me.#markUpdated();
    }

    get updateComplete() {
        return this.getUpdateComplete();
    }

    requestUpdate(name, oldValue, options) {
        const me = this;
        if (name !== undefined) {
            const ctor = me.constructor;
            const newValue = me[name];

            options ??= ctor.getPropertyOptions(name);

            const changed = (options.hasChanged ?? notEqual)(newValue, oldValue) ||
            (options.useDefault && options.reflect && newValue === me.#defaultValues?.get(name) && !me.hasAttribute(attributeNameForProperty(name, options)));

            if (changed) {
                me.#changeProperty(name, oldValue, options);
            } else {
                return;
            }


        }
        if (me.#isUpdatePending === false) {
            me.#updatePromise = me.#enqueueUpdate();
        }
    }

    performUpdate() {

        const me = this;
        if (!me.#isUpdatePending) return;

        if (!me.#hasUpdated) {
            me.#renderRoot ??= me.createRenderRoot();

            // Mixin instance properties once, if they exist.
            if (me.#instanceProperties) {
                for (const [p, value] of me.#instanceProperties) {
                    this[p] = value;
                }
                me.#instanceProperties = undefined;
            }

            const elementProps = me.constructor[elementProperties];
            if (elementProps.size > 0) {
                for (const [p, options] of elementProps) {
                    const { wrapped } = options;
                    const value = me[p];
                    if (
                        //options.wrapped === true &&
                        wrapped === true &&
                        !me.#changedProperties.has(p) &&
                        value !== undefined
                    ) {
                        me.#changeProperty(p, undefined, options, value);
                    }
                }
            }
        }

        let shouldUpdate = false;
        const changedProperties = me.#changedProperties;
        try {
            shouldUpdate = me.shouldUpdate(changedProperties);
            if (shouldUpdate) {
                me.willUpdate(changedProperties);
                me.#controllers?.forEach((c) => c.hostUpdate?.());
                me.update(changedProperties);
            } else {
                me.#markUpdated();
            }
        } catch (e) {
            shouldUpdate = false;
            me.#markUpdated();
            throw e;
        }

        if (shouldUpdate) {
            me.#didUpdate(changedProperties);
        }
    }

    // ******************************
    // PRIVATE FUNCTIONS 
    // ******************************

    #didUpdate(changedProperties) {
        const me = this;
        me.#controllers?.forEach((c) => c.hostUpdated?.());
        if (!me.#hasUpdated) {
            me.#hasUpdated = true;
            me.firstUpdated(changedProperties);
        }
        me.updated(changedProperties);
    }

    #markUpdated() {
        const me = this;
        me.#changedProperties = new Map();
        me.#isUpdatePending = false;
    }

    async #enqueueUpdate() {
        const me = this;
        me.#isUpdatePending = true;
        try {
            await me.#updatePromise;
        } catch (e) {
            Promise.reject(e);
        }
        const result = me.scheduleUpdate();

        if (result != null) {
            await result;
        }
        return !me.#isUpdatePending;
    }

    //#changeProperty(name, oldValue, options, initializeValue) {
    #changeProperty(name, oldValue, {useDefault, reflect, wrapped}, initializeValue) {
        const me = this;          

        // Record default value when useDefault is used. This allows us to
        // restore this value when the attribute is removed.
        if (useDefault && !(me.#defaultValues ??= new Map()).has(name)) {
            me.#defaultValues.set(name, initializeValue ?? oldValue ?? me[name]);

            // if this is not wrapping an accessor, it must be an initial setting
            // and in this case we do not want to record the change or reflect.
            if (wrapped !== true || initializeValue !== undefined) {
                return;
            }
        }

        if (!me.#changedProperties.has(name)) {
            // On the initial change, the old value should be `undefined`, except
            // with `useDefault`
            if (!me.hasUpdated && !useDefault) {
                oldValue = undefined;
            }            
            me.#changedProperties.set(name, oldValue);
        }

        if (reflect === true && me.#reflectingProperty !== name) {
            (me.#reflectingProperties ??= new Set()).add(name);
        }
    }

    #attributeToProperty(name, value) {
        const me = this;
        const ctor = me.constructor;
        const propName = (ctor[attributeToPropertyMap]).get(name);
        if (propName !== undefined && me.#reflectingProperty !== propName) {
            const options = ctor.getPropertyOptions(propName);
            const converter =
                typeof options.converter === 'function'
                    ? { fromAttribute: options.converter }
                    : options.converter?.fromAttribute !== undefined
                        ? options.converter
                        : defaultConverter;
            // mark state reflecting
            me.#reflectingProperty = propName;
            const convertedValue = converter?.fromAttribute(value, options.type)
            me[propName] = convertedValue ?? me.#defaultValues?.get(propName) ?? null;
            // mark state not reflecting
            me.#reflectingProperty = null;
        }
    }

    #propertyToAttribute(name, value) {
        const me = this;
        const elementProps = me.constructor[elementProperties];
        const options = elementProps?.get(name);
        const attr = attributeNameForProperty(name, options);
        if (attr !== undefined && options.reflect === true) {
            const converter =
                (options.converter)?.toAttribute !==
                    undefined
                    ? (options.converter)
                    : defaultConverter;
            const attrValue = converter?.toAttribute(value, options.type);

            me.#reflectingProperty = name;
            if (attrValue == null) {
                me.removeAttribute(attr);
            } else {
                me.setAttribute(attr, attrValue);
            }
            // mark state not reflecting
            me.#reflectingProperty = null;
        }
    }

    #saveInstanceProperties() {
        const me = this;
        const instanceProperties = new Map();
        const elementProps = me.constructor[elementProperties];
        for (const p of elementProps.keys()) {
            if (Object.hasOwn(me, p)) {
                instanceProperties.set(p, me[p]);
                delete me[p];
            }
        }
        if (instanceProperties.size > 0) {
            me.#instanceProperties = instanceProperties;
        }
    }

    #initialize() {
        const me = this;
        me.#updatePromise = new Promise((res) => me.enableUpdating = res);
        me.#changedProperties = new Map();
        me.#saveInstanceProperties();
        me.requestUpdate();
        me.constructor[initializers]?.forEach((i) => i(this));
    }
}
