export function rollDice(formula) {
  return new Roll(formula).evaluate().total;
}
