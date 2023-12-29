
export const shallowArrayEquals = (oldArgs, newArgs) => oldArgs === newArgs ||
    (oldArgs.length === newArgs.length && oldArgs.every((v, i) => Object.is(v, newArgs[i])));

