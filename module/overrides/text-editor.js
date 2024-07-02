/**
 * Handle left-mouse clicks on an inline roll, dispatching the formula or displaying the tooltip
 * @param {MouseEvent} event    The initiating click event
 * @private
 */
export async function _onClickInlineRoll(event) {
  event.preventDefault();
  const a = event.currentTarget;

  // For inline results expand or collapse the roll details
  if (a.classList.contains('inline-result')) {
    // apply damage/healing to selected token(s) on ctrl/alt clicks
    if (event.ctrlKey || event.altKey) {
      const hitPoints = +a.innerHTML.split('<i class="fas fa-dice-d20"></i>')?.slice(-1)[0]?.trim();
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
    if (a.classList.contains('expanded')) {
      return Roll.collapseInlineResult(a);
    } else {
      return Roll.expandInlineResult(a);
    }
  }

  // Get the current speaker
  const cls = ChatMessage.implementation;
  const speaker = cls.getSpeaker();
  let actor = cls.getSpeakerActor(speaker);
  let rollData = actor ? actor.getRollData() : {};

  // Obtain roll data from the contained sheet, if the inline roll is within an Actor or Item sheet
  const sheet = a.closest('.sheet');
  if (sheet) {
    const app = ui.windows[sheet.dataset.appid];
    if (['Actor', 'Item'].includes(app?.object?.entity)) rollData = app.object.getRollData();
  }

  // Execute a deferred roll
  const roll = Roll.create(a.dataset.formula, rollData).roll();
  return roll.toMessage({ flavor: a.dataset.flavor, speaker }, { rollMode: a.dataset.mode });
}
