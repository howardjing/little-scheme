import { evaluate } from './evaluate';

const expressions = [
  1,
  ["quote", 1],
  ["quote", [1,2]],
  ['addOne', 10],
  ['cons', 1, [2, 3]],
  ['head', ['a', 'b', 'c']],
  ['tail', ['a', 'b', 'c']],
  ['isEmpty', []],
  ['isEmpty', [1,2]],
  ['isEqual', 1, 2],
  ['isEqual', 2, 2],
  ['isAtom', 1],
  ['isAtom', 2],
  ['isAtom', ['primitive']],
  ['isAtom', [['primitive']]],
  ['isZero', 0],
  ['isZero', [0]],
  ['addOne', 10],
  ['subOne', 10],
  ['isNumber', 123],
  ['isNumber', '12'],
  ['cons', 1, ['cons', 2, ['cons', 3, []]]]
]

expressions.forEach(expression => {
  try {
    console.log("EVALUATING", expression);
    console.log(evaluate(expression))
  } catch (e) {
    console.error(e)
  }
})
