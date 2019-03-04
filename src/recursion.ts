


const isEmpty = <T>(list: T[]): boolean => list.length === 0;
const tail = <T>(list: T[]): T[] => list.slice(1);

/**
 * Typical implementation using recursion
 */
const len = <T>(list: T[]): number => {
  if (isEmpty(list)) { return 0; }
  return 1 + len(tail(list));
}

/**
 * Let's add a constraint -- self reference is not allowed. It turns out
 * the following is incorrect -- there needs to be another function application
 * somewhere.
 */
const makeLenFail = <T>(makeSmallerLen: (list: T[]) => number) => (list: T[]): number => {
  if (isEmpty(list)) { return 0; }
  return 1 + makeSmallerLen(tail(list));
}
// console.log(makeLenFail(makeLenFail)([1]))


/**
 * We can't feed makeLen itself, instead of expecting a function that
 * expects the list directly, let's expect a function that expects a function that
 * expects the list
 */
const makeLenVague = <T>(makeSmallerLen: Function): (list: T[]) => number => {
  return (list: T[]): number => {
    if (isEmpty(list)) { return 0; }
    return 1 + makeSmallerLen(makeSmallerLen)(tail(list));
  }
}
console.log('makeLenVague', makeLenVague(makeLenVague)([1,2,3,4,5]))

/**
 * Let's hone in on the type of makeSmallerLen
 */
type MakeSmallerLen<T> = (f: MakeSmallerLen<T>) => (list: T[]) => number

const makeLenClearer = <T>(makeSmallerLen: MakeSmallerLen<T>): (list: T[]) => number => {
  return (list: T[]): number => {
    if (isEmpty(list)) { return 0; }
    return 1 + makeSmallerLen(makeSmallerLen)(tail(list));
  }
}
console.log('makeLenClearer', makeLenClearer(makeLenClearer)([1,2,3,4]))

/**
 * Calling our function like `makeLenClearer(makeLenClearer)(['our', 'list'])` is cumbersome.
 * Let's call it like we would `len` -- `len(['our', 'list'])`. We do this by creating a self
 * invoking function seeded with `makeLenClearer`.
 */
const makeCallingLenNicer = (f => f(f))(makeLenClearer);
console.log('makeCallingLenNicer', makeCallingLenNicer([1,2,3,4,5,6]));

/**
 * Expand things out again
 */
const lenInjected: <T>(list: T[]) => number = (<T>(f: MakeSmallerLen<T>) => f(f))(
  <T>(makeSmallerLen: MakeSmallerLen<T>) => (list: T[]) => {
    if (isEmpty(list)) { return 0; }
    return 1 + makeSmallerLen(makeSmallerLen)(tail(list))
  }
)
console.log('lenInjected', lenInjected([1,2,3,4,5,6,7]))

/**
 * Our public API looks good, but there's still some kludgyness in our recursive definition.
 * Instead of calling
 *
 * ```ts
 * 1 + len(tail(list))
 * ```
 *
 * we call
 *
 * ```ts
 * 1 + makeSmallerLen(makeSmallerLen)(tail(list))
 * ```
 *
 * Let's start the process of isolating the `makeSmallerLen(makeSmallerLen)` call. This starts
 * by adding another layer of indirection -- we isolate it into a separate lambda function.
 */
const lenExtraLambda = (f => f(f))(<T>(makeLen: MakeSmallerLen<T>) => (list: T[]) => {
  if (isEmpty(list)) {
    return 0;
  }
  //         the layer of indirection
  return 1 + ((x: T[]) => makeLen(makeLen)(x))(tail(list));
});
console.log("lenExtraLambda", lenExtraLambda([1,2,3,4,5,6,7,8]))

/**
 * Let's assign that lambda to a variable. Note that the lambda's type matches that of len, so let's call it len.
 */
const lenExtraLambdaMoved = (f => f(f))(<T>(makeLen: MakeSmallerLen<T>) => {
  const len = (x: T[]) => makeLen(makeLen)(x);
  return (list: T[]) => {
    if (isEmpty(list)) {
      return 0;
    }
    return 1 + len(tail(list));
  }
});
console.log("lenExtraLambdaMoved", lenExtraLambdaMoved([1,2,3,4,5,6,7,8]))

/**
 * Instead of assigning len to a variable, let's inject it in via a self invoking function.
 */
const lenExtraLambdaIsolated = (f => f(f))(<T>(makeLen: MakeSmallerLen<T>) => ((len) => (list: T[]) => {

  // our recursive definition
  if (isEmpty(list)) {
    return 0;
  }

  return 1 + len(tail(list));

  // lambda injected in at the end
})((x: T[]) => makeLen(makeLen)(x)));
console.log("YOOO", lenExtraLambdaIsolated([1,2,3]))

/**
 * Now our recursive definition is nice, but it's sandwiched between two layers of kludge. Let's shift things
 * around yet again. Let's inject in our recursive length definition at the end of everything as the function `recur`.
 */
const almostThere = (recur => (f => f(f))(<T>(makeLen: MakeSmallerLen<T>) => recur((x: T[]) => makeLen(makeLen)(x))))
  // our recursive definition injected in at the very end
  (<T>(len: (list: T[]) => number) => (list: T[]) => {
    if (isEmpty(list)) {
      return 0;
    }

    return 1 + len(tail(list));
  });
console.log("WOWW", almostThere([1,2,3,4,5]))

/**
 * We've now isolated our code into two parts. The first part is the machinery for recursively calling a function. The
 * second part seeds the machinery with a recursive definition.
 */
