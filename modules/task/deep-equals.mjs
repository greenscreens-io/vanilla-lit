const objectValueOf = Object.prototype.valueOf;
const objectToString = Object.prototype.toString;
const { keys: objectKeys } = Object;
const { isArray } = Array;

// check if provided objects are valid for matching
const isMatchable = (a, b) => a !== null && b !== null && typeof a === 'object' && typeof b === 'object';

// Object must have the same prototype / constructor
const isSameConstructor = (a, b) => a.constructor !== b.constructor;

const isSameType = (a, b, type) => a instanceof type && b instanceof type;

const isMap = (a, b) => isSameType(a, b, Map);

const isSet = (a, b) => isSameType(a, b, Set);

const isSizeEqual = (a, b) => a.size === b.size;

// Arrays must have the same length and recursively equal items
const matchArray = (a, b) => (a.length !== b.length)  ? false : a.every((v, i) => deepEquals(v, b[i]));

const matchValue = (a, b) => a.valueOf() === b.valueOf();

const matchString = (a, b) => a.toString() === b.toString();

const matchRegExp = (a, b) => a.source === b.source && a.flags === b.flags;

const matchMap = (a, b) => {
    if (!isSizeEqual(a, b)) return false;
    for (const [k, v] of a.entries()) {
        if (deepEquals(v, b.get(k)) === false ||
            (v === undefined && b.has(k) === false)) {
            return false;
        }
    }
    return true;    
}

const matchSet = (a, b) => {
    if (!isSizeEqual(a, b)) return false;
    for (const k of a.keys()) {
        if (b.has(k) === false) {
            return false;
        }
    }
    return true;
}

// We have two objects, check every key
const matchObjects = (a, b) => {
        const keys = objectKeys(a);
        if (keys.length !== objectKeys(b).length) {
            return false;
        }
        
        for (const key of keys) {
            if (!Object.hasOwn(b, key) || !deepEquals(a[key], b[key])) {
                return false;
            }
        }

        return true;
}

/**
 * Recursively checks two objects for equality.
 *
 * This function handles the following cases:
 *  - Primitives: primitives compared with Object.is()
 *  - Objects: to be equal, two objects must:
 *    - have the same constructor
 *    - have same set of own property names
 *    - have each own property be deeply equal
 *  - Arrays, Maps, Sets, and RegExps
 *  - Objects with custom valueOf() (ex: Date)
 *  - Objects with custom toString() (ex: URL)
 *
 * Important: Objects must be free of cycles, otherwise this function will
 * run infinitely!
 */
export const deepEquals = (a, b) => {

    if (Object.is(a, b)) return true;

    if (!isMatchable(a, b)) return false;

    if (!isSameConstructor(a, b)) return false;

    if (isArray(a)) return matchArray(a, b);

    // Defer to custom valueOf implementations. This handles Dates which return
    // ms since epoch: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/valueOf
    if (a.valueOf !== objectValueOf) return matchValue(a, b);

    // Defer to custom toString implementations. This should handle
    // TrustedTypes, URLs, and such. This might be a bit risky, but
    // fast-deep-equals does it.
    if (a.toString !== objectToString) return matchString(a, b);

    if (isMap(a, b)) return matchMap(a, b);

    if (isSet(a, b, Set)) return matchSet(a, b);

    if (a instanceof RegExp) return matchRegExp(a, b);

    if (!matchObjects(a, b)) return false;
    
    // All keys in the two objects have been compared!
    return true;
}

export const deepArrayEquals = (oldArgs, newArgs) => oldArgs === newArgs ||
    (oldArgs.length === newArgs.length &&
        oldArgs.every((v, i) => deepEquals(v, newArgs[i])));
