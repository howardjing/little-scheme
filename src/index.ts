const expressions = [
  1,
  [1],
  [1,2],
  ['+', 1, 2],
]

type Atom = number | string;
type Expression = Atom | Atom[];

const apply = (expression: Expression) => {
  if (isAtom(expression)) { return expression }
  console.error("UNSUPPORTED EXPRESSION", expression);
}

const isAtom = (expression: Expression) => !Array.isArray(expression);

expressions.forEach(expression => {
  console.log(expression, apply(expression))
})
