import { evaluate } from './evaluate';

const expressions = [
  1,
  ["quote", 1],
  ["quote", [1,2]],
  ['cons', 1, ['quote', [2, 3]]],
  ['head', ['quote', ['a', 'b', 'c']]],
  ['tail', ['quote', ['a', 'b', 'c']]],
  ['isEmpty', []],
  ['isEmpty', ['quote', []]],
  ['isEmpty', ['quote', [1,2]]],
  ['isEqual', 1, 2],
  ['isEqual', 2, 2],
  ['isAtom', 1],
  ['isAtom', 2],
  ['isAtom', ['quote', 'primitive']],
  ['isAtom', ['quote', ['primitive']]],
  ['cons', ['cons', ['quote', 'primitive'], []], []],
  ['isAtom', ['cons', ['quote', 'primitive'], []]],
  ['isAtom', ['cons', ['cons', ['quote', 'primitive'], []], []]],
  ['isZero', 0],
  ['isZero', ['quote', [0]]],
  ['addOne', 10],
  ['subOne', 10],
  ['isNumber', 123],
  ['isNumber', ['quote', '12']],
  ['quote', []],
  ['cons', 1, []],
  ['cons', 1, ['cons', 2, ['cons', 3, []]]],
  ['cond', [['isEqual', 1, 2], 3], ['else', 4]],
  ['cond', [['isEqual', 1, 1], 3], ['else', 4]],
  ['cond', [['isEqual', 1, 2], 3], [['isEqual', 1, 1], 5], ['else', 4]],
  [['lambda', ['x'], ['addOne', 'x']], 20],
]

expressions.forEach(expression => {
  try {
    console.log("EVALUATING", expression);
    console.log(evaluate(expression))
    console.log("\n")
  } catch (e) {
    console.error(e)
  }
})
