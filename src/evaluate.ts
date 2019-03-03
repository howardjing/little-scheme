
type Atom = number | string | boolean;

type Expression = Atom | ExpressionArray;
// https://github.com/Microsoft/TypeScript/issues/3988 -- workaround for type Expression = Atom | Expression[]
interface ExpressionArray extends Array<Expression> {}

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
 *
 * See the various handle functions (handleConst, handleApplication, etc.) for more details.
 */
type Action = "*const" | "*identifier" | "*quote" | "*lambda" | "*cond" | "*application";

type Entry = { [name: string]: Expression }
type Table = Entry[];

type PrimitiveFun = ['primitive', Primitive];
/**
 * This represents a lambda function
 *   - Table represents the current context
 *   - string[] is the list of arguments
 *   - Expression is the lambda body
 */
type NonPrimitiveFun = ['nonPrimitive', [Table, string[], Expression]];
type Fun = PrimitiveFun | NonPrimitiveFun;

const isPrimitiveFun = (fun: Fun): fun is PrimitiveFun => fun[0] === 'primitive';
const isNonPrimitiveFun = (fun: Fun): fun is NonPrimitiveFun => fun[0] === 'nonPrimitive';


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

const PRIMITIVE_FUNCTIONS = new Set(Object.keys(Primitive));

const lookup = (name: string, table: Table): Expression => {
  console.log('lookup', name);
  const entry = table.find(entry => entry.hasOwnProperty(name));
  if (entry) {
    return entry[name];
  }

  throw new Error(`Could not find key ${name}`)
}

const buildEntry = (formals: string[], values: ExpressionArray) => {
  if (formals.length !== values.length) {
    throw new Error(`Mismatched length between formals and values: ${JSON.stringify(formals)}, ${JSON.stringify(values)}`)
  }
  const entry: { [name: string]: Expression } = {};
  formals.forEach((formal, i) => {
    entry[formal] = values[i];
  });
  return entry;
}

const extendTable = (entry: Entry, table: Table): Table => [entry, ...table];

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
  console.log("finding meaning of", expression, 'context', context)
  const val = handleAction(expressionToAction(expression))(expression, context);
  console.log("meaning was", val);
  return val;
}

const handleAction = (action: Action): (expression: Expression, context: Table) => Expression => {
  switch (action) {
    case '*const': return handleConst;
    case '*identifier': return handleIdentifier;
    case '*quote': return handleQuote;
    case '*lambda': return handleLambda;
    case '*cond': return handleCond;
    case '*application': return handleApplication;
    default: throw new Error(`Invalid action: ${action}`)
  }
}

/**
 * We assume that expression takes the form of a number, a boolean, or one of our primitive functions.
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
 *
 * If our expression is a number or a boolean, stop processing. Otherwise, we assume that have a primitive function.
 *
 * Note that this means we can't handle strings directly! This is because we would then have no way
 * to differentiate between the string `addOne` and the function `addOne`. Instead, all strings must
 * be passed through `quote`.
 */
function handleConst(expression: Expression): Expression {
  if (!isAtom(expression)) { throw new Error(`handleConst cannot evaluate ${JSON.stringify(expression)}`) }
  if (isNumber(expression) || isBoolean(expression)) {
    return expression;
  }

  if (!PRIMITIVE_FUNCTIONS.has(expression)) { throw new Error(`handleConst found unknown primitive ${expression}`)}

  // we assume expression is one of the primitive functions as defined in atomToAction
  const fun: Fun = ['primitive', expression as Primitive];
  return fun;
}

/**
 * TODO: figure out what's going on here
 */
function handleIdentifier(expression: Expression, context: Table): Expression {
  console.log("handleIdentifier", expression, 'context', context);
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

function handleLambda(expression: Expression, context: Table): Expression {
  if (isAtom(expression)) { throw new Error(`handleQuote cannot evaluate ${JSON.stringify(expression)}`)}
  console.log('handleLambda', expression, 'context', context);
  const formals = expression[1] as string[];
  const body = expression[2];
  const lambda: NonPrimitiveFun = ['nonPrimitive', [context, formals, body]];
  return lambda as Expression;
}

/**
 * We assume that expression takes the form of
 *
 * ['cond', [['isEqual', 1, 2], 1], [['isEqual', 1, 3], 2], ['else', 3]]
 *
 * For each line in the conditional, we evaluate the first part of the line. If it evaluates to
 * true, we evaluate the second part of the line.
 *
 * If we encounter an 'else' in the first part of the line, then we treat that line as true, and
 * evaluate the second part of the line.
 */
function handleCond(expression: Expression, context: Table): Expression {
  if (isAtom(expression)) { throw new Error(`handleCond cannot evaluate ${JSON.stringify(expression)}`)}
  console.log('handleQuote', expression, 'context', context);

  // ignore the first element in expression -- the first element is 'cond'
  const truthfulExp: ExpressionArray | undefined = expression.slice(1)
    // @ts-ignore - for some reason it thinks this lambda function is not the correct type
    .find((subexp) => {
      if (isAtom(subexp)) { throw new Error(`Invalid subexp ${JSON.stringify(subexp)}`) }

      const [predicate] = subexp as ExpressionArray;
      return predicate === 'else' || meaning(predicate, context);
    });

  if (truthfulExp === undefined) { throw new Error(`No truthy condition in ${JSON.stringify(expression)}`)}
  const [_, body] = truthfulExp;
  return meaning(body, context);
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
  console.log('handleApplication', expression, 'context', context);

  /**
   * helper method that distinguishes between primitive and non primitive functions
   */
  const apply = (fun: Fun, args: ExpressionArray) => {
    console.log("apply", fun, 'with args', args)
    if (isPrimitiveFun(fun)) {
      const [_, primitive] = fun;
      return applyPrimitive(primitive, args);
    }

    if (isNonPrimitiveFun(fun)) {
      const [_, lambda] = fun;
      return applyClosure(lambda, args);
    }

    throw new Error(`Can't handle function ${JSON.stringify(fun)}`);
  }

  /**
   * handle our base default functions
   */
  const applyPrimitive = (name: Primitive, args: ExpressionArray): Expression => {
    console.log("applyPrimitive", name, 'with args', args)
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

  const applyClosure = (fun: [Table, string[], Expression], args: ExpressionArray): Expression => {
    const [table, formals, body] = fun;
    return meaning(body, extendTable(buildEntry(formals, args), table))
  }
  // here fn is either a lambda, or a primitive function name
  const [fn, ...args] = expression as ExpressionArray;

  return apply(
    /**
     * Evaluate our function. Why must we evaluate our function?
     *
     * We evaluate our function to determine whether it is a
     * primitive function or a non primitive function.
     *
     * If it is a primitive, it will
     * eventually call handleConst which will return a ['primitive', fn] tuple.
     *
     * If it is a non primitive, it will eventually
     * call handleLambda which will return a ['nonPrimitive', [table, formals, body]] tuple.
     */
    meaning(fn, context) as Fun,

    /**
     * Evaluate our args.
     *
     * Why must we evaluate args? This is because arguments themselves
     * may be function applications that need evaluating. For example,
     * consider the following s expression:
     *
     * (cons 1 (cons 2 (cons 3 (cons ()))))
     *
     * Our arguments are 1 and (cons 2 (cons 3 (cons ()))). In order to
     * evaluate our root s expression, we must evaluate its children to
     * know that we're consing 1 onto (2 3).
     *
     * It is important to note that when evaluating args we must take care
     * to never evaluate the empty array. This is because the empty
     * array is not a valid s expression -- calling meaning([]) will cause
     * the app to crash.
     */
    args.map(arg => isEmpty(arg) ? arg : meaning(arg, context))
  )
}

const expressionToAction = (expression: Expression): Action => {
  const action = isAtom(expression) ? atomToAction(expression) : listToAction(expression);
  console.log(action,  expression);
  return action;
}

const atomToAction = (atom: Atom): Action => {
  if (isNumber(atom)) { return '*const' }
  if (isBoolean(atom)) { return '*const' }

  if (PRIMITIVE_FUNCTIONS.has(atom)) { return '*const' }

  /**
   * Assume this atom is a variable name referenced in a lambda function. For example,
   * in the following lambda expression,
   *
   * (lambda (a b) (cons a (cons b ())))
   *
   * within the lambda body, `a` and `b` will be treated as identifiers. We will need look at the
   * context to figure out what `a` and `b` should evaluate to.
   */
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
