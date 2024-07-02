/**
 * Handle number key presses
 * @param {Event} event       The original digit key press
 * @param {boolean} up        Is it a keyup?
 * @param {Object}modifiers   What modifiers affect the keypress?
 * @private
 */
export async function _onDigit(event, up, modifiers) {
  if (modifiers.hasFocus || up) return;
  const num = parseInt(modifiers.key);
  const slot = ui.hotbar.macros.find((m) => m.key === num);
  let macro = slot.macro;
  if (macro) {
    // check for ctrl, shift, alt modifiers
    if (modifiers.isCtrl || modifiers.isShift || modifiers.isAlt) {
      const optionsParam = `{applyEffect:${modifiers.isCtrl},showModDialog:${modifiers.isShift},showAltDialog:${modifiers.isAlt}}`;
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
      macro = altMacro;
    }
    macro.execute();
  }
  this._handled.add(modifiers.key);
}
