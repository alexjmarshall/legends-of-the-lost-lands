/**
 * Handle clicking of dice tooltip buttons
 * @param {Event} event
 * @private
 */
export async function _onDiceRollClick(event) {
  event.preventDefault();
  let roll = $(event.currentTarget),
    tip = roll.find('.dice-tooltip');

  // apply damage/healing to selected token(s) on ctrl/alt/shift clicks
  if (event.ctrlKey || event.altKey) {
    const hitPoints = +roll.find('.dice-total').html().trim();
    if (!hitPoints) return;
    if (event.ctrlKey && event.altKey)
      return game.brigandine.Macro.saveMacro(hitPoints, { showModDialog: event.shiftKey });
    const selectedTokens = canvas.tokens.controlled;
    for (const token of selectedTokens) {
      const currentHp = +token.actor.data.data.hp?.value;
      const maxHp = +token.actor.data.data.hp?.max;
      let hpUpdate = event.ctrlKey ? currentHp - hitPoints : currentHp + hitPoints;
      if (hpUpdate > maxHp) hpUpdate = maxHp;
      if (!isNaN(hpUpdate) && hpUpdate !== currentHp) await token.actor.update({ 'data.hp.value': hpUpdate });
    }
    return;
  }

  if (!tip.is(':visible')) tip.slideDown(200);
  else tip.slideUp(200);
}
