/**
 * Create a Macro from an attribute drop.
 * Get an existing lostlands macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 * 
 */
export async function createLostlandsMacro(data, slot) {
  if(data.type === 'Macro') return false;
  const item = data.data;
  const itemName = item?.name || '';
  const itemMacro = item?.data.macro || '';
  let itemMacroWithId = '';
  if(item?._id && itemMacro) itemMacroWithId = itemMacro.replace('itemId', item._id);

  const lightWeap = item.data?.attributes?.light?.value;
  if(lightWeap && !data.skipOffhandDialog) return offhandDialog(data, slot);

  const macroName = itemName || (data.label ? data.label : undefined);
  const macroCommand = itemMacroWithId || (data.roll ? `/r ${data.roll}#${data.label}` : undefined);
  const type = data.roll ? "chat" : "script";

  let macro = game.macros.find(m => (m.name === macroName && m.data.command === macroCommand));
  
  if (!macro) {
    if(macroCommand) macro = await Macro.create({
      name: macroName,
      type: type,
      command: macroCommand,
      flags: { "lostlands.attrMacro": true }
    });
    else {
      ui.notifications.error("Could not find a macro for this item.");
      return false;
    }
  }

  game.user.assignHotbarMacro(macro, slot);
  return false;
}

export function grappleMacro() {
  return weaponAttack(null, { atkType: 'touch', dmgType: 'grapple' });
}

export function spellMacro(spellId) {
  if(canvas.tokens.controlled.length !== 1) return ui.notifications.error("Select spellcasting token.");
  const token = canvas.tokens.controlled[0];
  const spell = token.actor.data.items.get(spellId);
  const isPrepared = !!spell.data.data.prepared;
  if(!isPrepared) return ui.notifications.error("Cannot cast a spell that was not prepared.");
  const spellLevel = spell.data.data.attributes.lvl?.value;
  if(!spellLevel) return ui.notifications.error("Spell does not have level set.");

  let actorSpellSlots = +token.actor.data.data.attributes[`${spell.type}`]?.[`lvl_${spellLevel}`].value || 0;
  if(actorSpellSlots <= 0) return ui.notifications.error("No spells remaining of this level.");
  const updateData = { data: {
    attributes: {
      [`${spell.type}`]: {
        [`lvl_${spellLevel}`]: {
          value: (actorSpellSlots - 1)
        }
      }
    }
  }};
  token.actor.update(updateData);
}

/*
* options:
* {
*  offhand: true/false
*  skipHookDialog: true/false
*  skipModDialog: true/false
*  skipThrowDialog: true/false
*  dialogAtkMod: (value)
*  dialogDmgMod: (value)
*  throwable: true/false -- item attribute
*  hasHook: true/false -- item attribute
*  light: true/false -- item attribute
*  maxRange: (value) -- item attribute
*  atkType: melee/missile/throw/touch  -- item attribute
*  dmgType: slash/thrust/bash/throw/stone/arrow/bolt/punch/grapple/hook  -- item attribute
*  fragile: true/false -- item attribute
*  finesse: true/false -- item attribute
*  unwieldly: true/false -- item attribute
*  critMin: (value) -- item attribute
* }
*/
export async function attackMacro(weaponId, options={}) {
  if(canvas.tokens.controlled.length !== 1) return ui.notifications.error("Select attacking token.");
  const token = canvas.tokens.controlled[0];

  // get weapon and its properties
  const weaponItem = token.actor.data.items.get(weaponId);
  if(!weaponItem) return ui.notifications.error("Cannot find item in selected character's inventory.");
  const weapName = weaponItem?.name || '';
  const weapAttrs = weaponItem?.data?.data?.attributes;
  const weapAtkMod = weapAttrs?.atk_mod?.value || 0;
  const weapDmg = weapAttrs?.dmg?.value;
  if(!weapDmg) return ui.notifications.error("Damage not set for item.");
  options.throwable = options.throwable || weapAttrs?.throwable?.value;
  options.hasHook = options.hasHook || weapAttrs?.has_hook?.value;
  options.maxRange = options.maxRange || weapAttrs?.max_range?.value;
  options.atkType = options.atkType || weapAttrs?.atk_type?.value;
  options.dmgType = options.dmgType || weapAttrs?.dmg_type?.value;
  options.fragile = options.fragile || weapAttrs?.fragile?.value;
  options.finesse = options.finesse || weapAttrs?.finesse?.value;
  options.unwieldy = options.unwieldy || weapAttrs?.unwieldy?.value;
  options.critMin = options.critMin || weapAttrs?.crit_min?.value
  
  // show attake choice dialogs
  if(options.throwable && !options.skipThrowDialog) return throwDialog(weaponId, options);
  if(options.hasHook && !options.skipHookDialog) return hookDialog(weaponId, options);
  if(!options.skipModDialog) return modDialog(weaponId, options);

  // get actor and its properties
  const rollData = token.actor.getRollData();
  const bab = rollData.bab || 0;
  const strMod = rollData.str_mod || 0;
  const dexMod = rollData.dex_mod || 0;
  const offhandAtkPenalty = options.offhand ? -2 : 0;
  const attrAtkMod = (options.atkType === 'missile' || options.atkType === 'throw' || options.finesse) ? dexMod : strMod;
  const attrDmgMod = (options.atkType === 'missile' || options.offhand) ? 0 : strMod;
  const actorAtkMod = rollData.atk_mod || 0;
  const actorDmgMod = rollData.dmg_mod || 0;  

  // determine target and range
  let targetToken, targetRollData, range, rangePenalty;
  if([...game.user.targets].length === 1) {
    targetToken = [...game.user.targets][0];
    targetRollData = targetToken.actor.getRollData();
    if(options.atkType === 'missile' || options.atkType === 'throw') {
      const canvasDistance = canvas.grid.grid.constructor.name === 'SquareGrid' ?
        canvas.grid.measureDistanceGrid(token.position, targetToken.position) :
        canvas.grid.measureDistance(token.position, targetToken.position);
      range = Math.floor(+canvasDistance / 5) * 5;
      if(range > +options.maxRange) return ui.notifications.error("Target is beyond maximum range for this weapon."); 
      rangePenalty = -Math.abs(Math.floor(range / 10));
    }
  }

  // put together chat message content
  const d20Roll = new Roll("d20");
  const d20Result = await d20Roll.evaluate().total;
  let totalAtk = `${d20Result}+${bab}+${attrAtkMod}${offhandAtkPenalty ? `+${offhandAtkPenalty}` : ''}`;
  totalAtk += `${actorAtkMod ? `+${actorAtkMod}` : ''}${weapAtkMod ? `+${weapAtkMod}` : ''}`;
  totalAtk += `${options.dialogAtkMod ? `+${options.dialogAtkMod}` : ''}${rangePenalty ? `+${rangePenalty}` : ''}`;
  const critMin = options.critMin || 20;
  const isCrit = options.atkType !== 'touch' && d20Result >= critMin;
  let totalDmg = `${weapDmg ? `${weapDmg}` : ''}${attrDmgMod ? `+${attrDmgMod}` : ''}`;
  totalDmg += `${actorDmgMod ? `+${actorDmgMod}` : ''}${options.dialogDmgMod ? `+${options.dialogDmgMod}` : ''}`;
  if(isCrit) totalDmg += `+${weapDmg}`;
  if(options.atkType === 'touch') totalDmg = '';

  let targetNameText = targetToken?.actor?.name ? ` ${targetToken.actor.name}` : '';
  let rangeText = range ? ` from ${range}' away` : '';
  let attackText = `attacks${targetNameText}${weapName ? ` with ${weapName}` : ''}`;
  let hitSound, missSound;
  switch(options.dmgType) {
    case 'slash':
      attackText = `slashes${targetNameText} with ${weapName}`;
      hitSound = 'slash_hit';
      missSound = 'slash_miss';
      break;
    case 'thrust':
      attackText = `thrusts ${weapName}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'thrust_hit';
      missSound = 'thrust_miss';
      break;
    case 'bash':
      attackText = `bashes${targetNameText} with ${weapName}`;
      hitSound = 'bash_hit';
      missSound = 'bash_miss';
      break;
    case 'stone':
      attackText = `slings a stone with ${weapName}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'stone_hit';
      missSound = 'stone_miss';
      break;
    case 'arrow':
      attackText = `shoots an arrow from ${weapName}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'arrow_hit';
      missSound = 'arrow_miss';
      break;
    case 'bolt':
      attackText = `shoots a bolt from ${weapName}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'bolt_hit';
      missSound = 'bolt_miss';
      break;
    case 'throw':
      attackText = `throws ${weapName}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'throw_hit';
      missSound = 'throw_miss';
      break;
    case 'grapple':
      attackText = `attempts to grapple${targetNameText}`;
      break;
    case 'hook':
      attackText = `attempts to hook${targetNameText} with ${weapName}`;
      break;
    case 'punch':
      attackText = `throws a punch${targetNameText ? ` at${targetNameText}` : ''}`;
      break;
  }

  const dmgText = `${totalDmg ? ` for [[${totalDmg}]] damage.` : ''}`;
  let resultText = dmgText;
  let resultSound, isHit;
  if(!isNaN(targetRollData?.ac)) {
    const totalAtkRoll = new Roll(totalAtk);
    await totalAtkRoll.evaluate();
    const touchAc = targetRollData.touch_ac || targetRollData.ac;
    isHit = totalAtkRoll.total >= (options.atkType === 'touch' ? touchAc : targetRollData.ac);
    if(isHit && !isCrit) {
      resultText = ` and <span style="${resultStyle('#7CCD7C')}">HITS</span>${dmgText}`;
      resultSound = hitSound;
    } else if(!isHit) {
      resultText = ` and <span style="${resultStyle('#EE6363')}">MISSES</span>`;
      resultSound = missSound;
    }
  }
  if(isCrit && isHit !== false) {
    resultText = ` and <span style="${resultStyle('#5DFC0A')}">CRITS</span>${dmgText}`;
    resultSound = hitSound;
  }
  if(options.fragile && options.atkType === 'melee' && d20Result === 1) {
    resultText = ` and their weapon <span style="${resultStyle('#EE6363')}">BREAKS</span>`;
    resultSound = 'weapon_break';
  }

  const content = `${attackText}${rangeText} [[${totalAtk}]]${resultText}`;
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker(token),
    content: content,
    type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
    emote: true,
    sound: resultSound ? `systems/lostlands/sounds/${resultSound}.mp3` : undefined
  }); // , {chatBubble: true}

  function resultStyle(bgColour) {
    return `background: ${bgColour}; padding: 1px 4px; border: 1px solid #4b4a44; border-radius: 2px; white-space: nowrap; word-break: break-all;`;
  }
}

function offhandDialog(data, slot) {
  const item = data.data;
  return new Dialog({
    title: "What form of attack?",
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-hand-point-right"></i>',
        label: "Main-hand",
        callback: () => {
          data.skipOffhandDialog = true;
          createLostlandsMacro(data, slot)
        }
      },
      two: {
        icon: '<i class="fas fa-hand-point-left"></i>',
        label: "Off-hand",
        callback: () => {
          data.skipOffhandDialog = true;
          item.data.macro = "game.lostlands.Macro.attackMacro('itemId', {offhand: true, throwable: false})";
          item.name += " (off-hand)";
          createLostlandsMacro(data, slot)
        }
      }
    },
    default: "one"
  }).render(true);
}

function hookDialog(weaponId, options) {
  return new Dialog({
    title: "What form of attack?",
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-user-friends"></i>',
        label: "Standard",
        callback: () => {
          options.skipHookDialog = true;
          attackMacro(weaponId, options);
        }
      },
      two: {
        icon: '<i class="fas fa-candy-cane"></i>',
        label: "Hook",
        callback: () => {
          options.skipHookDialog = true;
          options.atkType = 'touch';
          options.dmgType = 'hook';
          attackMacro(weaponId, options);
        }
      }
    },
    default: "one"
  }).render(true);
}

function modDialog(weaponId, options) {
  new Dialog({
    title: "Modifiers",
    content: 
      `<form>
        <div class="form-group">
          <label>Attack modifiers?</label>
          <input type="text" id="atkMod" placeholder="e.g. -4">
        </div>
        ${options.attackType === 'touch' ? '' : `<div class="form-group">
          <label>Damage modifiers?</label>
          <input type="text" id="dmgMod" placeholder="e.g. 2d6">
        </div>
      </form>`}`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Attack",
        callback: html => {
          options.skipModDialog = true;
          options.dialogAtkMod = html.find('[id=atkMod]')[0]?.value;
          options.dialogDmgMod = html.find('[id=dmgMod]')[0]?.value;
          attackMacro(weaponId, options);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => console.log("Cancelled attack")
      }
    },
    default: "one"
  }).render(true);
}

function throwDialog(weaponId, options) {
  new Dialog({
    title: "What form of attack?",
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-user-friends"></i>',
        label: "Melee",
        callback: () => {
          options.skipThrowDialog = true;
          options.atkType = 'melee';
          attackMacro(weaponId, options);
        }
      },
      two: {
        icon: '<i class="fas fa-people-arrows"></i>',
        label: "Throw",
        callback: () => {
          options.skipThrowDialog = true;
          options.atkType = 'throw';
          options.dmgType = 'throw';
          attackMacro(weaponId, options);
        }
      }
    },
    default: "one"
  }).render(true);
}

export function buyBasicEquipment() {
  let token = canvas.tokens.controlled[0];
  let actor = canvas.tokens.controlled[0]?.actor;
  if(!actor || !actor.isOwner){
    ui.notifications.error("Select the token of the character making the purchase.");
    return;
  }

  const basicItems = game.items.filter(i => i.folder?.parentFolder?.name == 'Basic Equipment');
  const armsAndArmor = basicItems.filter(i => i.folder?.name == 'Arms & Armor');
  const misc = basicItems.filter(i => i.folder?.name === 'Miscellaneous');
  
  let armsAndArmorOptionsText = ``;
  for (const item of armsAndArmor) {
    armsAndArmorOptionsText += `<option value="${item.id}">${item.name}</option>`;
  }

  let miscOptionsText = ``;
  for (const item of misc) {
    miscOptionsText += `<option value="${item.id}">${item.name}</option>`;
  }
  const optionsText = `
    <optgroup label="Miscellaneous">${miscOptionsText}</optgroup>
    <optgroup label="Arms & Armor">${armsAndArmorOptionsText}</optgroup>
  `;

  async function resolvePurchase(itemId, itemName, qty, price) {
    qty = +qty;
    let cost = +price;
    if(isNaN(qty) || qty < 0 || qty % 1 || isNaN(cost) || cost < 0 || cost % 1){
      ui.notifications.error("Invalid input.");
      return;
    }

    const actorItems = actor.data.items, gpItem = actorItems.find(i => i.name === "Gold Pieces");
    const gpQty = +gpItem?.data.data.quantity || 0;
    const spItem = actorItems.find(i => i.name === "Silver Pieces");
    const spQty = +spItem?.data.data.quantity || 0;
    const cpItem = actorItems.find(i => i.name === "Copper Pieces");
    const cpQty = +cpItem?.data.data.quantity || 0;
    const totalMoney = Math.round((gpQty + spQty/10 + cpQty/50) * 100) / 100;

    if(cost > totalMoney) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker(token),
        content: `tries to purchase ${qty} ${itemName}${qty > 1 ? 's' : ''} for ${price} GP, but doesn't have enough money. The merchant appears annoyed.`,
        type: CONST.CHAT_MESSAGE_TYPES.EMOTE
      });
      return;
    }

    // add item to actor
    const ownedItem = actorItems.find(i => i.name === itemName);
    if(ownedItem) {
      const ownedItemQty = +ownedItem.data.data.quantity;
      const itemUpdate = { _id: ownedItem.data._id, "data.quantity": ownedItemQty + qty };
      await actor.updateEmbeddedDocuments("Item", [itemUpdate]);
    } else {
      const itemData = game.items.get(itemId).clone({"data.quantity": qty});
      await actor.createEmbeddedDocuments("Item", [itemData.data]);
    }

    // pay for item from actor
    if(cpQty >= cost*50) {
      const cpUpdate = { _id: cpItem?.data._id, "data.quantity": cpQty - cost*50 };
      cpUpdate._id && await actor.updateEmbeddedDocuments("Item", [cpUpdate]);
    } else if(Math.round((spQty/10 + cpQty/50) * 100) / 100 >= cost) {
      const cpUpdate = { _id: cpItem?.data._id, "data.quantity": cpQty % 5 };
      cpUpdate._id && await actor.updateEmbeddedDocuments("Item", [cpUpdate]);
      cost = Math.round((cost - Math.floor(cpQty / 5) * 5 / 50) * 100) / 100;
      const spUpdate = { _id: spItem?.data._id, "data.quantity": spQty - cost*10 };
      spUpdate._id && await actor.updateEmbeddedDocuments("Item", [spUpdate]);
    } else {
      let change = Math.round((totalMoney - cost) * 100) / 100;
      let gpChange = Math.floor(change);
      change = Math.round((change - gpChange) * 10 * 100) / 100;
      let spChange = Math.floor(change);
      change = Math.round((change - spChange) * 5 * 100) / 100;
      const gpUpdate = { _id: gpItem?.data._id, "data.quantity": gpChange };
      gpUpdate._id && await actor.updateEmbeddedDocuments("Item", [gpUpdate]);
      const spUpdate = { _id: spItem?.data._id, "data.quantity": spChange };
      spUpdate._id && await actor.updateEmbeddedDocuments("Item", [spUpdate]);
      const cpUpdate = { _id: cpItem?.data._id, "data.quantity": change };
      cpUpdate._id && await actor.updateEmbeddedDocuments("Item", [cpUpdate]);
    }

    const content = `buys ${qty} ${itemName}${qty > 1 ? 's' : ''} for ${price} GP.`;
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker(token),
      content: content,
      type: CONST.CHAT_MESSAGE_TYPES.EMOTE
    });
  }

  new Dialog({
    title: "Buy Basic Equipment",
    content: 
      `<p><form id="purchase-form">
        <div class="flexrow">
          <div class="flexcol flex1">
            <label for="qty">Quantity</label>
            <input id="qty" type="number" value="1"/>
          </div>
          <div class="flexcol flex2" style="padding-right:2px">
            <label for="select">Item</label>
            <select id="select" style="padding:1px">
              ${optionsText}
            </select>
          </div>
          <div class="flexcol flex1">
            <label for="cost">Cost</label>
            <input id="cost" type="number"/>
          </div>
        </div>
      </form></p>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Buy",
        callback: async html => {
          const itemId = html.find("#select").val();
          const itemName = html.find("#select option:selected").text();
          const qty = html.find("#qty").val();
          const unitCost = html.find("#cost").val();
          const cost = qty && unitCost ? qty * unitCost : undefined;
          await resolvePurchase(itemId, itemName, qty, cost);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    default: "two",
    render: html => {
      const select = html.find("#select");
      const costInput = html.find("#cost");
      syncCostVal();

      select.change(function() {
        syncCostVal();
      })

      function syncCostVal() {
        const itemId = select.val();
        const selectedItem = game.items.get(itemId);
        const itemCost = selectedItem.data.data.attributes.value?.value;
        if(!itemCost) ui.notifications.error("Item does not have the value attribute set.");
        costInput.val(itemCost);
      }
    }
  }).render(true);
}
