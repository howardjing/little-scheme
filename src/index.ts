
type Atom = number | string;

type Expression = Atom | ExpressionArray;
// https://github.com/Microsoft/TypeScript/issues/3988 -- workaround for type Expression = Atom | Expression[]
interface ExpressionArray extends Array<Expression> {}


const apply = (expression: Expression) => {
  if (isAtom(expression)) { return expression }

  throw new Error(`Unsupported expression ${JSON.stringify(expression)}`)
}

const isAtom = (expression: Expression) => !Array.isArray(expression);

const expressions: Expression[] = [
  1,
  ["quote", 1],
  ["quote", [1,2]],
  ['+', 1, 2],
]

expressions.forEach(expression => {
  try {
    console.log("EVALUATING", expression);
    console.log(apply(expression))
  } catch (e) {
    console.error(e)
  }
})
