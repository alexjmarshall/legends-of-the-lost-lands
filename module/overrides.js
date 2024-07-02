// libWrapper overrides
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

/**
 * Expand an inline roll element to display it's contained dice result as a tooltip
 * @param {HTMLAnchorElement} a     The inline-roll button
 * @return {Promise<void>}
 */
export async function expandInlineResult(a) {
  if (!a.classList.contains('inline-roll')) return;
  if (a.classList.contains('expanded')) return;

  // Create a new tooltip
  const roll = Roll.fromJSON(unescape(a.dataset.roll));
  const tip = document.createElement('div');
  const toolTip = await roll.getTooltip();
  if (!toolTip.includes('class="tooltip-part"')) return;
  tip.innerHTML = toolTip;

  // Add the tooltip
  const tooltip = tip.children[0];
  a.appendChild(tooltip);
  a.classList.add('expanded');

  // Set the position
  const pa = a.getBoundingClientRect();
  const pt = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.min(pa.x, window.innerWidth - (pt.width + 3))}px`;
  tooltip.style.top = `${Math.min(pa.y + pa.height + 3, window.innerHeight - (pt.height + 3))}px`;
  const zi = getComputedStyle(a).zIndex;
  tooltip.style.zIndex = Number.isNumeric(zi) ? zi + 1 : 100;
}

/**
 * Handle how changes to a Token attribute bar are applied to the Actor.
 * This allows for game systems to override this behavior and deploy special logic.
 * @param {string} attribute    The attribute path
 * @param {number} value        The target attribute value
 * @param {boolean} isDelta     Whether the number represents a relative change (true) or an absolute change (false)
 * @param {boolean} isBar       Whether the new value is part of an attribute bar, or just a direct value
 * @return {Promise<documents.Actor>}  The updated Actor document
 */
export async function modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
  const current = foundry.utils.getProperty(this.data.data, attribute);

  // Determine the updates to make to the actor data
  let updates;
  if (isBar) {
    if (isDelta) value = Math.min(Number(current.value) + value, current.max);
    updates = { [`data.${attribute}.value`]: value };
  } else {
    if (isDelta) value = Number(current.value) + value;
    updates = { [`data.${attribute}`]: value };
  }

  /**
   * A hook event that fires when a token's resource bar attribute has been modified.
   * @function modifyTokenAttribute
   * @memberof hookEvents
   * @param {object} data           An object describing the modification
   * @param {string} data.attribute The attribute path
   * @param {number} data.value     The target attribute value
   * @param {boolean} data.isDelta  Whether the number represents a relative change (true) or an absolute change (false)
   * @param {boolean} data.isBar    Whether the new value is part of an attribute bar, or just a direct value
   * @param {objects} updates       The update delta that will be applied to the Token's actor
   */
  const allowed = Hooks.call('modifyTokenAttribute', { attribute, value, isDelta, isBar }, updates);
  return allowed !== false ? this.update(updates) : this;
}

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

/**
 * Handle dropping of an item reference or item data onto an Actor Sheet
 * @param {DragEvent} event     The concluding DragEvent which contains drop data
 * @param {Object} data         The data transfer extracted from the event
 * @return {Promise<Object>}    A data object which describes the result of the drop
 * @private
 */
// TODO test and update all references to const/util files and cleanup
export async function _onDropItem(event, data, qtyDropped, options = {}) {
  if (!this.actor.isOwner) return false;
  const item = await Item.implementation.fromDropData(data);
  const itemData = item.toObject();
  const itemQty = +itemData.data.quantity;

  // Get the source actor and target actor
  const targetActor = this.actor;
  const sourceActor = data.tokenId
    ? canvas.tokens.objects.children.find((t) => t.id === data.tokenId)?.actor
    : game.actors.get(data.actorId);

  // Return if:
  // dragging a NON_PHYSICAL_ITEM_TYPE from an actor or to a container or merchant
  // dragging any item from a merchant and user is not GM
  const ITEM = game.brigandine.ITEM;
  const SPELLS = game.brigandine.SPELLS;
  const Constant = game.brigandine.Constant;
  const Util = game.brigandine.Util;
  if (
    (ITEM.NON_PHYSICAL_ITEM_TYPES.includes(itemData.type) && sourceActor) ||
    (ITEM.NON_PHYSICAL_ITEM_TYPES.includes(itemData.type) &&
      (targetActor.type === 'container' || targetActor.type === 'merchant')) ||
    (sourceActor?.type === 'merchant' && !game.user.isGM)
  ) {
    return false;
  }

  // Get the source item and source item siblings for sorting
  const sourceItem = sourceActor?.items.get(itemData._id);
  const siblings = sourceActor?.items.filter((i) => {
    return i.data.type === sourceItem?.data?.type && i.data._id !== sourceItem?.data?._id;
  });

  // Sell the item if dragging from a player character to a merchant TODO show dialog to sell or repair armour
  const overrideSell = game.user.isGM && event.ctrlKey;
  const handleSell =
    sourceItem &&
    sourceActor &&
    sourceActor.type === 'character' &&
    targetActor.type === 'merchant' &&
    !options.confirmedSell;
  if (!overrideSell && handleSell) {
    const priceValue = +sourceItem.data.data.value || 0;
    const attitude = await game.brigandine.Macro.reactionRoll(targetActor, sourceActor, { showModDialog: false }); // TODO
    const buyAdj = +Constant.ATTITUDE_BUY_ADJ[attitude] || 1;
    const buyFactor = +targetActor.data.data.attributes.buy_factor?.value || 1;
    const adjFactor = buyAdj * buyFactor;
    const priceInCps = Math.floor(priceValue * adjFactor);
    if (priceInCps < 1) {
      const chatData = {
        content: `${sourceActor.name} tries to sell ${
          sourceItem.name
        }, but it is worthless. ${Constant.ranAnnoyedMerchant()}`,
        flavor: `Sell`,
      };
      return Util.macroChatMessage(sourceActor, chatData, true);
    }
    // Determine dropped item quantity
    if (itemQty < 1) return;
    if (itemQty > 1 && !options.shownSplitDialog) {
      return _itemSellSplitDialog(itemQty, item, priceInCps, options, event, data);
    }
    if (!qtyDropped) qtyDropped = itemQty;
    const totalSellPrice = priceInCps * qtyDropped;
    const totalSellPriceString = Util.getPriceString(totalSellPrice);
    const merchantMoney = +targetActor.data.data.attributes.money?.value || 0;
    if (totalSellPrice > merchantMoney) return ui.notifications.error('The merchant does not have enough money.');

    // show confirmation dialog if haven't shown split item dialog
    if (!options.shownSplitDialog) {
      return Dialog.confirm({
        title: 'Confirm',
        content: `Sell ${qtyDropped} ${sourceItem.name}${qtyDropped > 1 ? 's' : ''} for ${totalSellPriceString}?`,
        yes: async () => {
          await finalizeSale();
          options.confirmedSell = true;
          return this._onDropItem(event, data, qtyDropped, options);
        },
        no: () => {},
        defaultYes: true,
      });
    }
    await finalizeSale();
  }

  // Determine dropped item quantity
  if (sourceItem && itemQty > 1 && !options.shownSplitDialog) return _itemSplitDialog(itemQty, options, event, data);
  if (!qtyDropped) qtyDropped = itemQty;
  itemData.data.quantity = qtyDropped;
  const currentSourceQty = +sourceItem?.data?.data?.quantity;
  const newSourceQty = currentSourceQty - qtyDropped;

  // Determine target item. If same actor, target item must be actual drop target
  const sameActor =
    targetActor.isToken || data.tokenId ? data.tokenId === targetActor.token?.id : data.actorId === targetActor.id;
  const targetItems = targetActor.items.filter(
    (i) =>
      i._id !== sourceItem?._id &&
      i.data.type === itemData.type &&
      i.data.name === itemData.name &&
      i.data.data.macro === itemData.data.macro &&
      foundry.utils.fastDeepEqual(i.data.data.attributes, itemData.data.attributes)
  );
  let targetItem = targetItems[0];
  if (sameActor) {
    const dropTarget = event.target.closest('[data-item-id]');
    const targetId = dropTarget ? dropTarget.dataset.itemId : null;
    targetItem = targetItems.find((i) => i.data._id === targetId) || null;
  }
  const currentTargetQty = +targetItem?.data.data.quantity || 0;

  // Check whether total weight transferred would exceed targetActor's limit
  const droppedItemWeight = qtyDropped * +itemData.data.weight;
  const targetEnc = +targetActor.data.data.enc;
  const targetLimit = +targetActor.data.data.attributes.capacity?.value;
  if (!sameActor && droppedItemWeight + targetEnc > targetLimit) return false;

  // Handle source and target being combined
  if (targetItem) {
    await targetActor.updateEmbeddedDocuments('Item', [
      { _id: targetItem._id, 'data.quantity': currentTargetQty + qtyDropped },
    ]);
    if (newSourceQty < 1) return sourceItem?.delete();
    return sourceActor?.updateEmbeddedDocuments('Item', [{ _id: sourceItem._id, 'data.quantity': newSourceQty }]);
  }

  // Handle source item being split
  if (itemQty > qtyDropped) {
    await this._onDropItemCreate(itemData);
    return sourceActor?.updateEmbeddedDocuments('Item', [{ _id: sourceItem._id, 'data.quantity': newSourceQty }]);
  }

  // If sourceActor and targetActor are the same, sort source and target items
  if (sameActor) return this._onSortItem(sourceItem, siblings, targetItem);

  // Otherwise, create a new item and delete source item
  await this._onDropItemCreate(itemData);
  return sourceItem?.delete();

  function _itemSellSplitDialog(maxQty, itemData, priceInCps, options, ...data) {
    new Dialog({
      title: `Sell ${itemData.name}`,
      content: `<form>
          <div class="form-group">
            <label style="max-width:fit-content;max-width:-moz-fit-content;">How many?</label>
            <span id="selectedQty" style="flex:1;text-align:center;"></span>
            <input class="flex7" type="range" id="qty" min="1" max="${maxQty}" value="1">
          </div>
          <div class="form-group">
            <label style="max-width:fit-content;max-width:-moz-fit-content;margin-right:0.5em">Total price:</label>
            <span id="price"></span>
          </div>
        </form>`,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: `Sell`,
          callback: (html) => {
            const quantity = +html.find('[id=qty]').val();
            options.shownSplitDialog = true;
            this._onDropItem(...data, quantity, options);
          },
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
        },
      },
      default: 'one',
      render: (html) => {
        const qtyRange = html.find('[id=qty]'),
          qtySpan = html.find('[id=selectedQty]'),
          priceSpan = html.find('[id=price]');
        qtySpan.html(+qtyRange.val());
        priceSpan.html(game.brigandine.Util.getPriceString(+qtyRange.val() * priceInCps));
        qtyRange.on('input', () => {
          qtySpan.html(+qtyRange.val());
          priceSpan.html(game.brigandine.Util.getPriceString(+qtyRange.val() * priceInCps));
        });
      },
    }).render(true);
  }

  function _itemSplitDialog(initialQty, options, ...data) {
    new Dialog({
      title: 'Split Item',
      content: `<form>
          <div class="form-group">
          <label style="max-width:fit-content;max-width:-moz-fit-content;">How many?</label>
            <span id="selectedQty" style="flex:1;text-align:center;">${initialQty}</span>
            <input class="flex7" type="range" id="qty" min="1" max="${initialQty}" value="${initialQty}">
          </div>
        </form>`,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: `Submit`,
          callback: (html) => {
            const quantity = +html.find('[id=qty]').val();
            options.shownSplitDialog = true;
            this._onDropItem(...data, quantity, options);
          },
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
        },
      },
      default: 'one',
      render: (html) => {
        const qtySpan = html.find('[id=selectedQty]');
        const qtyRange = html.find('[id=qty]');
        qtyRange.on('input', () => qtySpan.html(+qtyRange.val()));
      },
    }).render(true);
  }

  async function finalizeSale() {
    const expandedPriceObj = Util.expandPrice(totalSellPrice);
    const keyToItemName = {
      gp: Constant.COINS_OF_ACCOUNT.gp.name,
      sp: Constant.COINS_OF_ACCOUNT.sp.name,
      cp: Constant.COINS_OF_ACCOUNT.cp.name,
    };
    const updates = [];
    const createItemUpdates = [];

    for (const [k, v] of Object.entries(expandedPriceObj)) {
      if (!v) continue;
      const itemName = keyToItemName[k];
      let item = sourceActor.items.find((i) => Util.stringMatch(i.name, itemName));

      // create item if does not exist
      if (!item) {
        const coinItemData = game.items.getName(itemName)?.data;
        if (!coinItemData) return ui.notifications.error(`Could not find ${itemName} in game items!`);
        const createData = Util.cloneItem(coinItemData);
        createData.data.quantity = v;
        createItemUpdates.push(coinItemData);
        continue;
      }

      const itemQty = +item.data.data.quantity;
      const itemUpdateQty = itemQty + v;
      if (item._id && itemQty !== itemUpdateQty) {
        updates.push({ _id: item._id, 'data.quantity': itemUpdateQty });
      }
    }

    if (createItemUpdates.length) await sourceActor.createEmbeddedDocuments('Item', createItemUpdates);
    await sourceActor.updateEmbeddedDocuments('Item', updates);
    const merchantMoneyUpdate = merchantMoney - totalSellPrice;
    await targetActor.update({ 'data.attributes.money.value': merchantMoneyUpdate });

    // create chat message
    const chatData = {
      content: `${sourceActor.name} sells ${qtyDropped} ${sourceItem.name}${qtyDropped > 1 ? 's' : ''} to ${
        targetActor.name
      } for ${totalSellPriceString}.`,
      sound: 'coins',
      flavor: 'Sell',
    };
    return Util.macroChatMessage(sourceActor, chatData, true);
  }
}

/**
 * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
 * @param {Event} event
 * @param {Object} itemData
 * @private
 */
export function _onSortItem(source, siblings, target) {
  // Ensure we are only sorting like-types
  if (target && source.data.type !== target.data.type) return;

  // Perform the sort
  const sortUpdates = SortingHelpers.performIntegerSort(source, { target: target, siblings });
  const updateData = sortUpdates.map((u) => {
    const update = u.update;
    update._id = u.target.data._id;
    return update;
  });

  // Perform the update
  return this.actor.updateEmbeddedDocuments('Item', updateData);
}

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

export function measureDistanceGrid(origin, target) {
  const ray = new Ray(origin, target);
  const segments = [{ ray }];
  return this.grid.measureDistances(segments, { gridSpaces: true })[0];
}
