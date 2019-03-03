
type Atom = number | string | boolean;

type Expression = Atom | ExpressionArray;
// https://github.com/Microsoft/TypeScript/issues/3988 -- workaround for type Expression = Atom | Expression[]
interface ExpressionArray extends Array<Expression> {}

const _head = <T>(xs: T[]): T => xs[0];
const _tail = <T>(xs: T[]): T[] => xs.slice(1);
const isEmpty = (expression: Expression) => !isAtom(expression) && expression.length === 0;
/**
 * Given an expression, there are six possible actions we can take.
 *
 * 1. *const
 * 2. *identifier
 * 3. *quote
 * 4. *lambda
 * 5. *cond
 * 6. *application
 */
type Action = "*const" | "*identifier" | "*quote" | "*lambda" | "*cond" | "*application";

type Entry = { [name: string]: Expression }
type Table = Entry[];

type PrimitiveFun = ['primitive', Primitive];
type NonPrimitiveFun = ['nonPrimitive', Expression];
type Fun = PrimitiveFun | NonPrimitiveFun;

const isPrimitiveFun = (fun: Fun): fun is PrimitiveFun => _head(fun) === 'primitive';
const isNonPrimitiveFun = (fun: Fun): fun is NonPrimitiveFun => _head(fun) === 'nonPrimitive';


/**
 * primitive functions we support
 */
enum Primitive {
  cons = 'cons',
  head = 'head',
  tail = 'tail',
  isEmpty = 'isEmpty',
  isEqual = 'isEqual',
  isAtom = 'isAtom',
  isZero = 'isZero',
  addOne = 'addOne',
  subOne = 'subOne',
  isNumber = 'isNumber',
}

const lookup = (name: string, table: Table): Expression => {
  console.log('lookup', name);
  const entry = table.find(entry => entry.hasOwnProperty(name));
  if (entry) {
    return entry[name];
  }

  throw new Error(`Could not find key ${name}`)
}

/**
 * atomToAction
 */

/**
 * Given an expression, evaluate it
 */
const evaluate = (expression: Expression) => {
  return value(expression);
}

const isAtom = (expression: Expression): expression is Atom => !Array.isArray(expression);
const isNumber = (expression: Expression): expression is number => typeof expression === 'number';
const isBoolean = (expression: Expression): expression is boolean => expression === true || expression === false;

const value = (expression: Expression) => {
  return meaning(expression, []);
}

const meaning = (expression: Expression, context: Table) => {
  console.log("finding meaning of", expression, context)
  const val = handleAction(expressionToAction(expression))(expression, context);
  console.log("meaning was", val);
  return val;
}

const handleAction = (action: Action): (expression: Expression, context: Table) => Expression => {
  switch (action) {
    case '*const': return handleConst;
    case '*identifier': return handleIdentifier;
    case '*quote': return handleQuote;
    case '*lambda': return dummy;
    case '*cond': return dummy;
    case '*application': return handleApplication;
    default: throw new Error(`Invalid action: ${action}`)
  }
}

/**
 * We assume that expression takes the form of a number, a boolean, or one of our primitve functions.
 *
 * For example,
 *
 * 1
 *
 * or
 *
 * false
 *
 * or
 *
 * 'addOne'
 */
function handleConst(expression: Expression): Expression {
  if (!isAtom(expression)) { throw new Error(`handleConst cannot evaluate ${JSON.stringify(expression)}`) }
  if (isNumber(expression) || isBoolean(expression)) {
    return expression;
  }

  // we assume expression is one of the primitive functions as defined in atomToAction
  const fun: Fun = ['primitive', expression as Primitive];
  return fun;
}

/**
 * TODO: figure out what's going on here
 */
function handleIdentifier(expression: Expression, context: Table): Expression {
  console.log("handleIdentifier", expression);
  return lookup(expression as string, context);
}

/**
 * We assume that expression takes the form of ['quote', ['things', 'to', 'quote']].
 * This essentially stops the evaluation process.
 */
function handleQuote(expression: Expression): Expression {
  if (isAtom(expression)) { throw new Error(`handleQuote cannot evaluate ${JSON.stringify(expression)}`)}
  console.log('handleQuote', expression);
  const [_, quoted] = expression;
  return quoted;
}

/**
 * Function applications can be primitive or non primitive. If a function application
 * is primitive, we assume it looks like the following:
 *
 * ['addOne', 10]
 *
 * The first element in the list is the primitive function name, and the rest of the list are
 * the function's arguments.
 *
 * If a function application is non primitive, we assume it looks like this:
 *
 * [['lambda', [a, b], ['cons', a, b]], 1, []]
 *
 * The first element in the list is the lambda function, and the rest of the list
 * are the function's arguments
 */
function handleApplication(expression: Expression, context: Table): Expression {
  console.log('handleApplication', expression, context);

  const apply = (fun: Fun, args: ExpressionArray) => {
    console.log("apply", fun, args)
    if (isPrimitiveFun(fun)) {
      const [_, primitive] = fun;
      return applyPrimitive(primitive, args);
    }

    throw new Error("Can't handle non primitive functions yet");
  }

  const applyPrimitive = (name: Primitive, args: ExpressionArray): Expression => {
    console.log("applyPrimitive", name, args)
    if (name === 'cons') {
      const [head, tail] = args;
      return [head].concat(tail);
    }

    if (name === 'head') {
      const list = args[0] as ExpressionArray;
      return list[0];
    }

    if (name === 'tail') {
      const list = args[0] as ExpressionArray;
      return list.slice(1);
    }

    if (name === 'isEmpty') {
      const list = args[0] as ExpressionArray;
      return list.length === 0;
    }

    if (name === 'isEqual') {
      const [first, second] = args;
      return first === second;
    }

    if (name === 'isAtom') {
      const expression = args[0];

      // TODO: not sure why this is necessary -- why not just call isAtom?
      // i also don't think this method is defined correctly
      // const isAppliedExpressionAtom = (expression: Expression) => {
      //   if (isAtom(expression)) { return true; }
      //   if (expression.length === 0) { return false; }
      //   const [head] = expression;
      //   if (head === 'primitive' || head === 'nonPrimitive') {
      //     return true;
      //   }

      //   return false;
      // }

      // return isAppliedExpressionAtom(expression);
      return isAtom(expression);
    }

    if (name === 'isZero') {
      const expression = args[0];
      return expression === 0;
    }

    if (name === 'addOne') {
      const expression = args[0];
      return (expression as number) + 1;
    }

    if (name === 'subOne') {
      const expression = args[0];
      return (expression as number) - 1;
    }

    if (name === 'isNumber') {
      const expression = args[0];
      return isNumber(expression);
    }

    throw new Error(`applyPrimitive cannot handle: ${name}`)
  }
  // here fn is either a lambda, or a primitive function name
  const [fn, ...args] = expression as ExpressionArray;

  // here we convert the function into a Fun, and deal with args
  // return apply(value(fn, context) as Fun, evalList(args, context));

  return apply(
    // evaluate function
    meaning(fn, context) as Fun,

    /**
     * Evaluate args. When evaluating args we must take care not to try
     * calling `meaning` on the empty array. This is because the empty
     * array is not a valid s expression.
     */
    args.map(arg => isEmpty(arg) ? arg : meaning(arg, context))
  )
}

const dummy = () => 'dummy';

const expressionToAction = (expression: Expression): Action => {
  const action = isAtom(expression) ? atomToAction(expression) : listToAction(expression);
  console.log(action,  expression);
  return action;
}

const atomToAction = (atom: Atom): Action => {
  if (isNumber(atom)) { return '*const' }
  if (isBoolean(atom)) { return '*const' }

  const primitiveFunctions = new Set(Object.keys(Primitive));
  if (primitiveFunctions.has(atom)) { return '*const' }

  return '*identifier';
}

const listToAction = (list: ExpressionArray): Action => {
  const [head] = list;
  if (isAtom(head)) {
    if (head === 'quote') {
      return '*quote';
    }
    if (head === 'lambda') {
      return '*lambda';
    }
    if (head === 'cond') {
      return '*cond';
    }

    return '*application';
  }

  return '*application';
}

export {
  Atom,
  Expression,
  evaluate,
};
