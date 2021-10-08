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

export async function spellMacro(spellId) {
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
  await token.actor.update(updateData);
  // show description in a chat msg with all rolls as deferred rolls
}

function getMultiAttacks(itemId, token) {
  const actorItems = token.actor.data.items;
  const MultiItem = actorItems.get(itemId) || actorItems.find(i => i.name.toLowerCase().replace(/\s/g,'') === itemId?.toLowerCase().replace(/\s/g,''));
  const attrs = MultiItem?.data?.data?.attributes;
  return attrs?.routine?.value || attrs?.weapons?.value;
}

export async function saveMacro(damage=0, options={}) {
  const tokens = canvas.tokens.controlled;
  if(!canvas.tokens.controlled.length) return ui.notifications.error("Select token(s) to make a saving throw.");
  options.atkType = 'touch'; // to omit mod dialog damage field
  
  save(tokens, damage, options);
}

async function save(tokens, damage, options) {
  if(!tokens.length) return;
  
  const token = tokens.slice(-1)[0];
  const st = +token.actor.data.data.attributes.st?.value;
  if(!st) {
    ui.notifications.error(`${token.actor.name} has no st attribute set.`);
    tokens.pop();
    return save(tokens, damage, options);
  }
  if(!options.skipModDialog && !options.shownModDialog) return modDialog(options, 'Save', save, tokens, damage);
  const actorStMod = token.actor.data.data.st_mod || 0;
  const d20Roll = new Roll("d20");
  await d20Roll.evaluate();
  const d20Result = d20Roll.total;
  const saveText = `${d20Result}${options.dialogAtkMod ? `+${options.dialogAtkMod}` : ''}${actorStMod ? `+${actorStMod}` : ''}`;
  const savingThrow = new Roll(saveText);
  await savingThrow.evaluate();
  const success = savingThrow.total >= st;
  const resultText = success ? ` <span style="${resultStyle('#7CCD7C')}">SUCCESS</span>` : ` <span style="${resultStyle('#EE6363')}">FAIL</span>`; 
  const takenDamage = success ? Math.floor(damage / 2) : damage;
  const content = `saves [[${saveText}]]${resultText}${takenDamage ? ` and takes [[${takenDamage}]] damage` : ``}`;
  
  if(options.delay && !options.shownModDialog) await wait(500);
  options.delay = true;
  const flavor = takenDamage ? 'Save for Half Damage' : 'Saving Throw';
  macroChatMessage(token, {content: content, flavor: flavor});
  const currentHp = +token.actor.data.data.hp?.value;
  if((game.user.isGM || token.actor.isOwner) && !isNaN(currentHp)) token.actor.update({"data.hp.value": currentHp - takenDamage})

  options.shownModDialog = false;
  tokens.pop();
  save(tokens, damage, options);
}

/*
* options:
* {
*  flavor: chat message header -- actor
*  offhand: true/false -- weapon
*  skipHookDialog: true/false -- 
*  skipModDialog: true/false
*  skipThrowDialog: true/false
*  dialogAtkMod: (value)
*  dialogDmgMod: (value)
*  applyDamage: true/false
*  throwable: true/false -- item attribute
*  hasHook: true/false -- item attribute
*  light: true/false -- item attribute
*  maxRange: (value) -- item attribute
*  atkType: melee/missile/throw/touch  -- item attribute
*  dmgType: slash/stab/bash/throw/stone/arrow/bolt/punch/grapple/hook  -- item attribute
*  fragile: true/false -- item attribute
*  finesse: true/false -- item attribute
*  unwieldly: true/false -- item attribute
*  critMin: (value) -- item attribute
* }
*/
export async function attackMacro(weapons, options={}) {
  if(!Array.isArray(weapons)) weapons = [weapons];

  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s).");
  if([...game.user.targets].length > 1) return ui.notifications.error("Select a single target.");
  const targetToken = [...game.user.targets][0];

  const attackers = [];
  for(const token of selectedTokens) {
    let attackerWeapons;
    if(weapons[0].toLowerCase().replace(/\s/g,'') === 'attackroutine' || weapons[0].toLowerCase().replace(/\s/g,'') === 'two-weaponfighting') {
      const attacksString = getMultiAttacks(weapons[0], token);
      if(!attacksString || !attacksString.includes(',')) return ui.notifications.error("Incorrectly formatted attack list.");
      options.flavor = `${weapons[0]} (${attacksString})`;
      attackerWeapons = attacksString.split(',');
      if(weapons[0].toLowerCase().replace(/\s/g,'') === 'attackroutine') options.offhand = false;
      if(weapons[0].toLowerCase().replace(/\s/g,'') === 'two-weaponfighting') options.throwable = false;
    }
    attackerWeapons = attackerWeapons || weapons.map(w => w);
    attackers.push({
      token: token,
      weapons: attackerWeapons.reverse(),
      chatMsgData: { content: '', flavor: options.flavor, sound: options.sound }
    })
  }

  attack(attackers, targetToken, options);
}

async function attack(attackers, targetToken, options) {
  if(!attackers.length) return;
  const attacker = attackers.slice(-1)[0];
  const token = attacker.token;
  const weapons = attacker.weapons;
  const chatMsgData = attacker.chatMsgData;

  // if this attacker's weapons are finished, remove attacker and create attack chat msg
  if(!weapons.length) {
    if(chatMsgData.content) {
      chatMsgData.content = `<div style="line-height:1.6em;">${chatMsgData.content}</div>`;
      macroChatMessage(token, chatMsgData);
    }
    attackers.pop();
    return attack(attackers, targetToken, options);
  }

  const targetRollData = targetToken?.actor?.getRollData();
  const weaponId = weapons.slice(-1)[0];

  // get weapon and its properties
  const actorItems = token.actor.data.items;
  const weaponItem = actorItems.get(weaponId) || actorItems.find(i => i.name.toLowerCase().replace(/\s/g,'') === weaponId?.toLowerCase().replace(/\s/g,''));
  if(!weaponItem) {
    ui.notifications.error("Cannot find item in selected character's inventory.");
    weapons.pop();
    attacker.offhand = true;
    return attack(attackers, targetToken, options);
  }
  const weapName = weaponItem?.name || '';
  const weapAttrs = weaponItem?.data?.data?.attributes;
  const weapAtkMod = weapAttrs?.atk_mod?.value || 0;
  const weapDmg = weapAttrs?.dmg?.value;
  if(!weapDmg) {
    ui.notifications.error("Damage not set for item.");
    weapons.pop();
    attacker.offhand = true;
    return attack(attackers, targetToken, options);
  }
  chatMsgData.flavor = chatMsgData.flavor || weapName;
  const offhand = options.offhand == null ? !!attacker.offhand : options.offhand;
  const throwable = options.throwable == null ? weapAttrs?.throwable?.value : options.throwable;
  const hasHook = options.hasHook == null ? weapAttrs?.has_hook?.value : options.hasHook;
  const maxRange = options.maxRange == null ? weapAttrs?.max_range?.value : options.maxRange;
  const atkType = options.atkType == null ? weapAttrs?.atk_type?.value : options.atkType;
  const dmgType = options.dmgType == null ? weapAttrs?.dmg_type?.value : options.dmgType;
  const fragile = options.fragile == null ? weapAttrs?.fragile?.value : options.fragile;
  const finesse = options.finesse == null ? weapAttrs?.finesse?.value : options.finesse;
  const unwieldy = options.unwieldy == null ? weapAttrs?.unwieldy?.value : options.unwieldy;
  const critMin = options.critMin == null ? (weapAttrs?.crit_min?.value || 20) : options.critMin;
  
  // show attack choice dialogs
  if(throwable && !options.skipThrowDialog && !options.shownThrowDialog) return throwDialog(options, attackers, targetToken);
  if(hasHook && !options.skipHookDialog && !options.shownHookDialog) return hookDialog(options, attackers, targetToken);
  if(!options.skipModDialog && !options.shownModDialog && !attacker.skipModDialog) return modDialog(options, 'Attack', attack, attackers, targetToken);
  attacker.skipModDialog = true;
  
  // get actor and its properties
  const rollData = token.actor.getRollData();
  const bab = rollData.bab || 0;
  const strMod = rollData.str_mod || 0;
  const dexMod = rollData.dex_mod || 0;
  const offhandAtkPenalty = offhand ? -2 : 0;
  const attrAtkMod = (atkType === 'missile' || atkType === 'throw' || finesse) ? dexMod : strMod;
  const attrDmgMod = (atkType === 'missile' || offhand) ? 0 : strMod;
  const actorAtkMod = rollData.atk_mod || 0;
  const actorDmgMod = rollData.dmg_mod || 0;  

  // determine target and range
  let range, rangePenalty;
  if(atkType === 'missile' || atkType === 'throw') {
    const canvasDistance = canvas.grid.grid.constructor.name === 'SquareGrid' ?
      canvas.grid.measureDistanceGrid(token.position, targetToken.position) :
      canvas.grid.measureDistance(token.position, targetToken.position);
    range = Math.floor(+canvasDistance / 5) * 5;
    if(range > +maxRange) {
      ui.notifications.error("Target is beyond maximum range for this weapon.");
      weapons.pop();
      options.shownThrowDialog = false;
      options.shownHookDialog = false;
      options.shownModDialog = false;
      attacker.offhand = true;
      return attack(attackers, targetToken, options);
    }
    rangePenalty = -Math.abs(Math.floor(range / 10));
  }

  // put together chat message content
  const d20Result = await new Roll("d20").evaluate().total;
  const dialogAtkMod = options.dialogAtkMod ? await new Roll(options.dialogAtkMod).evaluate().total : '';
  const dialogDmgMod = options.dialogDmgMod ? await new Roll(options.dialogDmgMod).evaluate().total : '';
  const weapDmgResult = await new Roll(weapDmg).evaluate().total;
  let totalAtk = `${d20Result}+${bab}+${attrAtkMod}${offhandAtkPenalty ? `+${offhandAtkPenalty}` : ''}`;
  totalAtk += `${actorAtkMod ? `+${actorAtkMod}` : ''}${weapAtkMod ? `+${weapAtkMod}` : ''}`;
  totalAtk += `${dialogAtkMod ? `+${dialogAtkMod}` : ''}${rangePenalty ? `+${rangePenalty}` : ''}`;
  let totalDmg = `${weapDmgResult}${attrDmgMod ? `+${attrDmgMod}` : ''}`;
  totalDmg += `${actorDmgMod ? `+${actorDmgMod}` : ''}${dialogDmgMod ? `+${dialogDmgMod}` : ''}`;
  const isCrit = atkType !== 'touch' && d20Result >= critMin;
  let dmgText = `${totalDmg ? ` for <span style="font-style:normal;">[[${totalDmg}]]</span>` : ''}`;
  if(isCrit) dmgText += ` + <span style="font-style:normal;">[[/r ${weapDmg}#${weapName} damage]]</span>`;
  dmgText += ' damage';
  if(atkType === 'touch') dmgText = '';

  let targetNameText = targetToken?.actor?.name ? ` ${targetToken.actor.name}` : '';
  let rangeText = range ? ` (${range}')` : '';
  let attackText = `attacks${targetNameText}`;
  let hitSound, missSound;
  switch(dmgType) {
    case 'slash':
      attackText = `slashes${targetNameText}`;
      hitSound = 'slash_hit';
      missSound = 'slash_miss';
      break;
    case 'stab':
      attackText = `stabs${targetNameText}`;
      hitSound = 'stab_hit';
      missSound = 'stab_miss';
      break;
    case 'bash':
      attackText = `bashes${targetNameText}`;
      hitSound = 'bash_hit';
      missSound = 'bash_miss';
      break;
    case 'stone':
      attackText = `slings a stone${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'stone_hit';
      missSound = 'stone_miss';
      break;
    case 'arrow':
      attackText = `shoots an arrow${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'arrow_hit';
      missSound = 'arrow_miss';
      break;
    case 'bolt':
      attackText = `shoots a bolt${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'bolt_hit';
      missSound = 'bolt_miss';
      break;
    case 'throw':
      attackText = `throws ${weapName}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'throw_hit';
      missSound = 'throw_miss';
      break;
    case 'grapple':
      attackText = `grapples${targetNameText}`;
      break;
    case 'hook':
      attackText = `hooks${targetNameText} with ${weapName}`;
      break;
    case 'punch':
      attackText = `punches${targetNameText}`;
      break;
  }

  let resultText = '';
  let resultSound = missSound;
  let isHit = true;
  if(!isNaN(targetRollData?.ac)) {
    const totalAtkRoll = new Roll(totalAtk);
    await totalAtkRoll.evaluate();
    const touchAc = targetRollData.touch_ac || targetRollData.ac;
    isHit = totalAtkRoll.total >= (atkType === 'touch' ? touchAc : targetRollData.ac);
    if(isHit) {
      resultText = ` <span style="${resultStyle('#7CCD7C')}">HIT</span>`;
      resultSound = hitSound;
    } else {
      resultText = ` <span style="${resultStyle('#EE6363')}">MISS</span>`;
    }
  }
  if(isCrit && isHit) resultText = ` <span style="${resultStyle('#FFFF5C')}">CRIT</span>`;
  if(unwieldy && atkType === 'melee' && d20Result === 1) {
    isHit = true;
    resultText += ` hit self`;
    resultSound = hitSound;
  }
  if(isHit) resultText += dmgText;
  if(fragile && atkType === 'melee' && d20Result === 1) {
    resultText += ` <span style="${resultStyle('#EE6363')}">WEAPON BREAK</span>`;
    resultSound = 'weapon_break';
  }

  chatMsgData.content += `${attackText}${rangeText} <span style="font-style:normal;">[[${totalAtk}]]</span>${resultText}<br>`;

  // play sound and apply damage
  if(options.delay && !options.shownThrowDialog && !options.shownHookDialog && !options.shownModDialog) await wait(500);
  options.delay = true;
  resultSound && AudioHelper.play({src: `systems/lostlands/sounds/${resultSound}.mp3`, volume: 1, loop: false}, true);
  if(isHit && targetToken && options.applyDamage === true && game.user.isGM) {
    const totalDmgRoll = new Roll(totalDmg);
    await totalDmgRoll.evaluate();
    const currentHp = +targetToken.actor.data.data.hp?.value;
    if(!isNaN(currentHp)) await targetToken.actor.update({"data.hp.value": currentHp - totalDmgRoll.total});
  }

  // reset for new weapon
  weapons.pop();
  options.shownThrowDialog = false;
  options.shownHookDialog = false;
  options.shownModDialog = false;
  attacker.offhand = true;

  return attack(attackers, targetToken, options);
}

function resultStyle(bgColour) {
  return `background: ${bgColour}; padding: 1px 4px; border: 1px solid #4b4a44; border-radius: 2px; white-space: nowrap; word-break: break-all; font-style: normal;`;
}

function macroChatMessage(token, data) {
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker(token),
    content: data.content.trim(),
    type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
    flavor: data.flavor,
    sound: data.sound
  }, {chatBubble: true});
}

function hookDialog(options, ...data) {
  return new Dialog({
    title: "What form of attack?",
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-user-friends"></i>',
        label: "Standard",
        callback: () => {
          options.shownHookDialog = true;
          attack(...data, options);
        }
      },
      two: {
        icon: '<i class="fas fa-candy-cane"></i>',
        label: "Hook",
        callback: () => {
          options.shownHookDialog = true;
          options.atkType = 'touch';
          options.dmgType = 'hook';
          attack(...data, options);
        }
      }
    },
    default: "one"
  }).render(true);
}

function modDialog(options, label, callback, ...data) {
  new Dialog({
    title: "Modifiers",
    content: 
      `<form>
        <div class="form-group">
          <label>${label} modifiers?</label>
          <input type="text" id="atkMod" placeholder="e.g. -4">
        </div>
        ${options.atkType === 'touch' ? '' : `<div class="form-group">
          <label>Damage modifiers?</label>
          <input type="text" id="dmgMod" placeholder="e.g. 2d6">
        </div>`}
      </form>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `${label}`,
        callback: html => {
          options.shownModDialog = true;
          options.dialogAtkMod = html.find('[id=atkMod]')[0]?.value;
          options.dialogDmgMod = html.find('[id=dmgMod]')[0]?.value;
          callback(...data, options);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => console.log("Cancelled modifier dialog")
      }
    },
    default: "one"
  }).render(true);
}

function throwDialog(options, ...data) {
  new Dialog({
    title: "What form of attack?",
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-user-friends"></i>',
        label: "Melee",
        callback: () => {
          options.shownThrowDialog = true;
          options.atkType = 'melee';
          attack(...data, options);
        }
      },
      two: {
        icon: '<i class="fas fa-people-arrows"></i>',
        label: "Throw",
        callback: () => {
          options.shownThrowDialog = true;
          options.atkType = 'throw';
          options.dmgType = 'throw';
          attack(...data, options);
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
        callback: html => {
          const itemId = html.find("#select").val();
          const itemName = html.find("#select option:selected").text();
          const qty = html.find("#qty").val();
          const unitCost = html.find("#cost").val();
          const cost = qty && unitCost ? qty * unitCost : undefined;
          resolvePurchase(itemId, itemName, qty, cost);
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

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
