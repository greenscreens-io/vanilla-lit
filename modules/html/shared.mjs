
// Added to an attribute name to mark the attribute as bound so we can find
// it easily.
export const boundAttributeSuffix = '$vlit$';
export const marker = `vlit$${String(Math.random()).slice(9)}$`;

// String used to tell if a comment is a marker comment
export const markerMatch = '?' + marker;

// Text used to insert a comment marker node. We use processing instruction
// syntax because it's slightly smaller, but parses as a comment node.
export const nodeMarker = `<${markerMatch}>`;

// Creates a dynamic marker. We never have to search for these in the DOM.
export const createMarker = () => document.createComment('');
export const isPrimitive = (value) => value === null || (typeof value != 'object' && typeof value != 'function');
export const isArray = Array.isArray;
export const isIterable = (value) => isArray(value) || typeof value?.[Symbol.iterator] === 'function';


export const walker = document.createTreeWalker(document, 129 /* NodeFilter.SHOW_{ELEMENT|COMMENT} */);
