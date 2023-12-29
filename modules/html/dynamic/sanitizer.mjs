
export const ENABLE_EXTRA_SECURITY_HOOKS = true;
const trustedTypes = globalThis.trustedTypes;

/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = trustedTypes
    ? trustedTypes.createPolicy('vanilla-lite-dynamic', {
        createHTML: (s) => s,
    })
    : undefined;

const identityFunction = (value) => value;

const noopSanitizer = (_node, _name, _type) => identityFunction;

let sanitizerFactoryInternal = noopSanitizer;

/** Sets the global sanitizer factory. */
export const setSanitizer = (newSanitizer) => {
    if (!ENABLE_EXTRA_SECURITY_HOOKS) return;
    if (sanitizerFactoryInternal !== noopSanitizer) {
        throw new Error(`Attempted to overwrite existing dynamic security policy.` +
            ` setSanitizeDOMValueFactory should be called at most once.`);
    }
    sanitizerFactoryInternal = newSanitizer;
}

export const isNoOp = sanitizerFactoryInternal === noopSanitizer;

export const sanityze  = sanitizerFactoryInternal;

export const createSanitizer = (node, name, type) => {
    return sanitizerFactoryInternal(node, name, type);
}

export const trustFromTemplateString = (tsa, stringFromTSA) => {
    
    // A security check to prevent spoofing of Lit template results.
    // In the future, we may be able to replace this with Array.isTemplateObject,
    // though we might need to make that check inside of the html and svg
    // functions, because precompiled templates don't come in as
    // TemplateStringArray objects.
    if (!Array.isArray(tsa) || !Object.hasOwn(tsa, 'raw')) {
        throw new Error('invalid template strings array');
    }

    return policy !== undefined
        ? policy.createHTML(stringFromTSA)
        : stringFromTSA;
}
