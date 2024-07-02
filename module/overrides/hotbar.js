/**
 * Handle left-click events to
 * @param {MouseEvent} event    The originating click event
 * @protected
 */
export async function _onClickMacro(event) {
  event.preventDefault();
  const li = event.currentTarget;

  // Case 1 - create a new Macro
  if (li.classList.contains('inactive')) {
    const macro = await Macro.create({ name: 'New Macro', type: 'chat', scope: 'global' });
    await game.user.assignHotbarMacro(macro, Number(li.dataset.slot));
    macro.sheet.render(true);
  }
  // Case 2 - trigger a Macro
  else {
    const macro = game.macros.get(li.dataset.macroId);
    const isBrigandineMacro = macro.data.command.includes('game.brigandine.Macro');
    if (!isBrigandineMacro) return macro.execute();
    const optionsParam = `{applyEffect:${event.ctrlKey},showModDialog:${event.shiftKey},showAltDialog:${event.altKey}}`;
    const altCommand = `const options = ${optionsParam};${macro.data.command}`;
    let altMacro = game.macros.find((m) => m.name === macro.name && m.data.command === altCommand);
    if (!altMacro) {
      altMacro = await Macro.create({
        name: macro.name,
        type: macro.data.type,
        command: altCommand,
        flags: { 'brigandine.attrMacro': true },
      });
    }
    return altMacro.execute();
  }
}
