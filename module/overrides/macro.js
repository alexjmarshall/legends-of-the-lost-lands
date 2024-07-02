/**
 * Execute the Macro command.
 * @param {object} [scope={}]     Provide some additional scope configuration for the Macro
 * @param {Actor} [scope.actor]   An Actor who is the protagonist of the executed action
 * @param {Token} [scope.token]   A Token which is the protagonist of the executed action
 */
export async function execute(scope = {}) {
  switch (this.data.type) {
    case 'chat':
      return this._executeChat();
    case 'script':
      if (!game.user.can('MACRO_SCRIPT')) {
        return ui.notifications.warn(`You are not allowed to use JavaScript macros.`);
      }
      return this._executeScript(scope);
  }
}

/**
 * Execute the command as a chat macro.
 * Chat macros simulate the process of the command being entered into the Chat Log input textarea.
 * @private
 */
export async function _executeChat() {
  return ui.chat.processMessage(this.data.command).catch((err) => {
    ui.notifications.error('There was an error in your chat message syntax.');
    console.error(err);
  });
}

/**
 * Execute the command as a script macro.
 * Script Macros are wrapped in an async IIFE to allow the use of asynchronous commands and await statements.
 * @private
 */
export async function _executeScript(scope = {}) {
  // // Add variables to the evaluation scope
  // const variables = Object.entries
  // const speaker = ChatMessage.getSpeaker();
  // const character = game.user.character;
  // scope.actor = scope.actor || game.actors.get(speaker.actor);
  // scope.token = scope.token || (canvas.ready ? canvas.tokens.get(speaker.token) : null);

  // Attempt script execution
  const body = `${this.data.command}`;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction(...Object.keys(scope), body);
  try {
    return await fn.call(this, ...Object.values(scope));
  } catch (err) {
    ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
    console.error(err);
  }
}
