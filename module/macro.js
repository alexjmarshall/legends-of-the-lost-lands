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
      ui.notifications.error("Could not find a macro for this item or function.");
      return false;
    }
  }

  game.user.assignHotbarMacro(macro, slot);
  return false;
}

export async function spellMacro(spellId) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = token ? token.actor : game.user.character;
  if(!actor) return ui.notifications.error("Select spellcasting token.");
  const spell = actor.data.items.get(spellId) || actor.data.items.find(i => i.name.toLowerCase().replace(/\s/g,'') === spellId?.toLowerCase().replace(/\s/g,''));
  if(!spell) return ui.notifications.error("Could not find spell on this character.");
  const isPrepared = !!spell.data.data.prepared;
  if(!isPrepared) return ui.notifications.error("Cannot cast a spell that was not prepared.");
  const spellLevel = spell.data.data.attributes.lvl?.value;
  if(!spellLevel) return ui.notifications.error("Spell does not have level set.");

  let actorSpellSlots = +actor.data.data.attributes[`${spell.type}`]?.[`lvl_${spellLevel}`].value || 0;
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
  
  if(!spell.data.data.description) return ui.notifications.error("Spell has no description set.");
  macroChatMessage(token, { 
    content: spell.data.data.description, 
    flavor: spell.name, 
    sound: spell.data.data.attributes.sound?.value
  }, false);

  canvas.hud.bubbles.say(token, `casts ${spell.name}`, {emote: true});
  return actor.update(updateData);
}

export function potionMacro(itemId, options={}) {
  options.verb = 'quaffs';
  options.sound = 'drink_potion';
  return consumeItem(itemId, options);
}

export function scrollMacro(itemId, options={}) {
  options.verb = 'reads';
  // options.sound = 'drink_potion';
  return consumeItem(itemId, options);
}

async function consumeItem(itemId, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = token ? token.actor : game.user.character;
  if(!actor) return ui.notifications.error("Select character using the item.");
  const item = actor.data.items.get(itemId) || actor.data.items.find(i => i.name.toLowerCase().replace(/\s/g,'') === itemId?.toLowerCase().replace(/\s/g,''));
  if(!item) return ui.notifications.error("Could not find item on this character.");
  const itemQty = +item.data.data.quantity;
  if(!itemQty) return ui.notifications.error("Item must have a quantity greater than zero to use.");

  const ctrlOrAlt = options.showModDialog || options.applyDamage;
  const healFormula = item.data.data.attributes.heal?.value;
  if(ctrlOrAlt && healFormula) {
    try {
      const healPoints = await new Roll(healFormula).evaluate().total;
      const currentHp = +actor.data.data.hp?.value;
      const maxHp = +actor.data.data.hp?.max;
      let hpUpdate = currentHp + +healPoints;
      if ( hpUpdate > maxHp ) hpUpdate = maxHp;
      if(!isNaN(hpUpdate) && hpUpdate !== currentHp) await actor.update({'data.hp.value': hpUpdate});
      macroChatMessage(token, { 
        content: `heals [[${healPoints}]] points of damage`, 
        flavor: item.name, 
        sound: options.sound
      }, false);
    } catch {
      return ui.notifications.error("Invalid heal formula.");
    }
  } else {
    if(!item.data.data.description) return ui.notifications.error("Item has no description set.");
    macroChatMessage(token, { 
      content: item.data.data.description, 
      flavor: item.name, 
      sound: options.sound
    }, false);
  }
  canvas.hud.bubbles.say(token, `${options.verb || 'consumes'} ${item.name}`, {emote: true});
  const qtyUpdate = itemQty - 1;
  return actor.updateEmbeddedDocuments("Item", [{'_id': item.data._id, 'data.quantity': qtyUpdate}]);
}

export async function chargedItemMacro(itemId, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = token ? token.actor : game.user.character;
  if(!actor) return ui.notifications.error("Select character using the item.");
  const item = actor.data.items.get(itemId) || actor.data.items.find(i => i.name.toLowerCase().replace(/\s/g,'') === itemId?.toLowerCase().replace(/\s/g,''));
  if(!item) return ui.notifications.error("Could not find item on this character.");
  const charges = +item.data.data.attributes.charges?.value;
  if(!charges) return ui.notifications.error("Item has no charges remaining.");
  if(item.data.data.attributes.holdable && item.data.data.held !== true) return ui.notifications.error("Item must be held to use.");

  if(!options.numChargesUsed && !options.shownChargesUsedDialog && options.showModDialog) return chargesUsedDialog(options, itemId);
  const numChargesUsed = +options.numChargesUsed || 1;
  const chargesLeft = charges - numChargesUsed;
  
  if(!item.data.data.description) return ui.notifications.error("Item has no description set.");
  macroChatMessage(token, { 
    content: item.data.data.description, 
    flavor: `${item.name}: ${chargesLeft} charges`,
    sound: item.data.data.attributes.sound?.value
  }, false);

  canvas.hud.bubbles.say(token, `expends ${numChargesUsed} charge${numChargesUsed > 1 ? 's' : ''} from ${item.name}`, {emote: true});
  return actor.updateEmbeddedDocuments("Item", [{'_id': item.data._id, 'data.attributes.charges.value': chargesLeft}]);
}

function getMultiAttacks(itemId, token) {
  const actorItems = token.actor.data.items;
  const MultiItem = actorItems.get(itemId) || actorItems.find(i => i.type === 'feature' && i.name.toLowerCase().replace(/\s/g,'') === itemId?.toLowerCase().replace(/\s/g,''));
  const attrs = MultiItem?.data?.data?.attributes;
  return attrs?.routine?.value || attrs?.weapons?.value;
}

export async function saveMacro(damage=0, options={}) {
  const tokens = canvas.tokens.controlled;
  if(!canvas.tokens.controlled.length) return ui.notifications.error("Select token(s) to make a saving throw.");
  
  return save(tokens, damage, options);
}

async function save(tokens, damage, options) {
  if(!tokens.length) return;
  const token = tokens.slice(-1)[0];
  const actor = token.actor;
  const saveTarget = +token.actor.data.data.attributes.st?.value;
  if(!saveTarget) {
    ui.notifications.error(`${actor.name} has no save target number set.`);
    tokens.pop();
    return save(tokens, damage, options);
  }
  options.atkType = 'touch'; // to skip damage field in mod dialog
  if(options.showModDialog && !options.shownModDialog) return modDialog(options, options.flavor || 'Save', save, tokens, damage);
  options.shownModDialog = false;
  const actorSaveMod = +actor.data.data.save_mod || 0;
  const d20Result = await new Roll("d20").evaluate().total;
  let dialogAtkMod = '';
  try {
    dialogAtkMod = options.dialogAtkMod ? await new Roll(options.dialogAtkMod).evaluate().total : '';
  } catch {
    ui.notifications.error("Invalid input to modifier dialog.");
    tokens.pop();
    return save(tokens, damage, options);
  }
  const saveText = `${d20Result}${options.attrMod ? `+${options.attrMod}` : ''}${dialogAtkMod ? `+${dialogAtkMod}` : ''}${actorSaveMod ? `+${actorSaveMod}` : ''}`;
  const savingThrow = new Roll(saveText);
  await savingThrow.evaluate();
  const success = savingThrow.total >= saveTarget;
  const resultText = ` vs. ST ${saveTarget}` + ( success ? ` <span style="${resultStyle('#7CCD7C')}">SUCCESS</span>` : ` <span style="${resultStyle('#EE6363')}">FAIL</span>` );
  const critFail = d20Result === 1 && options.critFailText;
  if(critFail && options.critFailBrokenItem) {
    const itemQty = +options.critFailBrokenItem.data.data.quantity;
    const qtyUpdate = itemQty - 1;
    options.sound = options.critFailSound || options.sound;
    await actor.updateEmbeddedDocuments("Item", [{'_id': options.critFailBrokenItem.data._id, 'data.quantity': qtyUpdate}]);
  }
  const fail = !critFail && !success && options.failText;
  const takenDamage = success ? Math.floor(damage / 2) : damage;
  let content = `<div style="line-height:1.6em;">${options.verb || 'saves'} [[${saveText}]]${resultText}`;
  content += `${damage ? ` and takes [[${takenDamage}]] damage` : ``}${critFail ? `${options.critFailText}` : ``}${fail ? `${options.failText}` : ``}</div>`;
  const flavor = options.flavor || (damage ? 'Save for Half Damage' : 'Saving Throw');
  macroChatMessage(token, {
    content: content, 
    flavor: flavor,
    sound: options.sound
  });
  const currentHp = +actor.data.data.hp?.value;
  if ( !isNaN(currentHp) && takenDamage && ( game.user.isGM || token.actor.isOwner ) ) await token.actor.update({"data.hp.value": currentHp - takenDamage})
  
  // wait if not last actor and not showing mod dialogs
  if(tokens.length > 1 && !options.showModDialog) await wait(500);

  tokens.pop();
  save(tokens, damage, options);
}

export function thiefSkillMacro(skill, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  if(!token) return ui.notifications.error("Select character(s) attempting the thief skill.");
  const actor = token.actor;

  options.flavor = skill;
  options.attrMod = +actor.data.data.dex_mod;
  options.verb = `attempts to ${skill}`;
  const lockPickItem = actor.items.find(i => i.type === 'item' && i.name.toLowerCase().replace(/\s/g,'') === 'lockpicks');
  switch(skill.toLowerCase().replace(/\s/g,'')) {
    case 'openlocks':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`No lock picks found on character.`);
      options.failText = ` but may try again when their skill increases`;
      options.critFailText = ` and the lock pick breaks!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      break;
    case 'disarmtraps':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`No lock picks found on character.`);
      options.failText = ` but may try again when their skill increases`;
      options.critFailText = ` and the trap fires!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      break;
    case 'pickpockets':
      options.failText = ` but may try again when their skill increases`;
      options.critFailText = ` and is immediately caught!`;
      break;
    case 'movesilently':
      options.failText = ` but may hide to avoid detection`;
      options.critFailText = ` and is immediately caught!`;
      break;
    case 'hideinshadows':
      options.failText = ` and may be found if searched for`;
      options.critFailText = ` and is immediately caught!`;
  }
  return saveMacro(0, options);
}

/*
* options:
* {
*  flavor: chat message header -- actor
*  offhand: true/false -- weapon
*  skipHookDialog: true/false -- 
*  showModDialog: true/false
*  skipThrowDialog: true/false
*  dialogAtkMod: (value)
*  dialogDmgMod: (value)
*  applyDamage: true/false
*  throwable: true/false -- item attribute
*  reach: true/false -- item attribute
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
  if(!Array.isArray(weapons)) weapons = [weapons]; // need macro for thief skills, misc rolls like swim/climb, reaction/morale/random target/award XP?, sounds for spells and voices for hooks, on click/ double click token 1/3 time, at start of combat 1/2 time, and on < 0 HP -- or just give players a soundboard tab
  // XP progressions and other class/race features -- nah to auto level up
  // players must be able to edit two weapon fighting list -- DONE
  // do not show chat bubble for most macro actions -- looks good, but can set not pan to speaker globally? if not, don't have attack macro show chat bubble
  // should use combat tracker? or nah
  // how to abide by max HP limit? -- DONE
  // players cannot edit their XP or HP -- nah
  // if fragile weapon breaks, should reduce quantity!
  // spells should say in chat who is being targeted? -- nah
  // spell macro work for both spells and scrolls -- DONE
  // document all attribute properties
  // save and attack should take in actors rather than tokens as arg
  // replace buy basic items macro with merchant sheet
  // need to refactor sound strings to use whole filename including filetype
  // collections of sound profiles e.g. male_1, female_1 for player to choose
  // sounds played automatically: click your token (ok), take damage (hurt), drop below 0 HP (death), cast spell (?), drag-move (ok), thief skill (ok) turn undead (ok)
  // sounds: amused, angry, bored, death, dying, hurt, kill, lead, ok, party_death, party_fail, retreat, sleepy, toot, what. each has multiple which play randomly when icon clicked
  // only show soundsets of the same type as the PC's class 
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s).");
  if([...game.user.targets].length > 1) return ui.notifications.error("Select a single target.");
  const targetToken = [...game.user.targets][0];

  const attackers = [];
  for(const token of selectedTokens) {
    let attackerWeapons;
    // handle attack routine and two-weapon fighting
    if(weapons[0].toLowerCase().replace(/\s/g,'') === 'attackroutine' || weapons[0].toLowerCase().replace(/\s/g,'') === 'two-weaponfighting') {
      const attacksString = getMultiAttacks(weapons[0], token);
      if(!attacksString || !attacksString.includes(',')) {
        ui.notifications.error("Missing or incorrectly formatted attack list.");
        continue;
      }
      options.flavor = `${weapons[0]} (${attacksString})`;
      attackerWeapons = attacksString.split(',');
      if(weapons[0].toLowerCase().replace(/\s/g,'') === 'attackroutine') options.offhand = false;
      if(weapons[0].toLowerCase().replace(/\s/g,'') === 'two-weaponfighting') options.throwable = false;
    }
    // handle backstab
    if(weapons[0].toLowerCase().replace(/\s/g,'') === 'backstab') {
      const backstabItem = token.actor.items.find(i => i.type === 'feature' && i.name.toLowerCase().replace(/\s/g,'') === 'backstab');
      if(!backstabItem) {
        ui.notifications.error(`Backstab feature not found on this character.`);
        continue;
      }
      const weapName = backstabItem.data.data.attributes.weapon?.value;
      const weapItem = token.actor.items.find(i => i.name.toLowerCase().replace(/\s/g,'') === weapName.toLowerCase().replace(/\s/g,''));
      if(!weapItem) {
        ui.notifications.error(`No backstab weapon found.`);
        continue;
      }
      if(weapItem.data.data.attributes.light?.value !== true) {
        ui.notifications.error(`Cannot backstab with this weapon.`);
        continue;
      }
      const dmgMulti = +backstabItem.data.data.attributes.dmg_multi?.value;
      if(!dmgMulti) {
        ui.notifications.error(`No damage multiplier set on backstab feature.`);
        continue;
      }
      options.atkMod = 4;
      options.dmgMulti = dmgMulti;
      options.flavor = `Backstab (${weapName})`;
      options.throwable = false;
      attackerWeapons = [weapItem.id];
    }
    attackerWeapons = attackerWeapons || weapons.map(w => w);
    attackers.push({
      token: token,
      weapons: attackerWeapons.reverse(),
      chatMsgData: { content: '', flavor: options.flavor, sound: options.sound },
      attacks: []
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
  const attacks = attacker.attacks;
  const targetRollData = targetToken?.actor?.getRollData();
  const weaponId = weapons.slice(-1)[0];
  const range = measureRange(token, targetToken);

  // if this attacker's weapons are finished, remove attacker and create attack chat msg
  if(!weapons.length) {
    if(chatMsgData.content) {
      chatMsgData.content = `<div style="line-height:1.6em;">${chatMsgData.content}</div>`;
      macroChatMessage(token, chatMsgData);
      for(const attack of attacks) {
        attack.sound && AudioHelper.play({src: `systems/lostlands/sounds/${attack.sound}.mp3`, volume: 1, loop: false}, true);
        if(attack.damage) {
          let targetHp = +targetToken.actor.data.data.hp?.value;
          if(!isNaN(targetHp)) await targetToken.actor.update({"data.hp.value": targetHp - attack.damage});
        }
        // should wait unless last actors last weapon, or next weapon shows mod dialog
        // wait if NOT last weapon of last actor AND (NOT last weapon of this actor OR not showing mod dialog)
        if(!(attacks.indexOf(attack) === attacks.length -1 && attackers.length === 1) &&
          (attacks.indexOf(attack) !== attacks.length -1 || !options.showModDialog)) await wait(500);
      }
    }
    attackers.pop();
    return attack(attackers, targetToken, options);
  }

  // get weapon and its properties
  const actorItems = token.actor.data.items;
  const weaponItem = actorItems.get(weaponId) || actorItems.find(i => i.name.toLowerCase().replace(/\s/g,'') === weaponId?.toLowerCase().replace(/\s/g,''));
  if(!weaponItem) {
    ui.notifications.error("Could not find item on this character.");
    weapons.pop();
    attacker.offhand = true;
    return attack(attackers, targetToken, options);
  }
  if(weaponItem.data.data.quantity < 1) {
    ui.notifications.error("Item must have a quantity greater than zero to use.");
    weapons.pop();
    attacker.offhand = true;
    return attack(attackers, targetToken, options);
  }
  if(weaponItem.data.data.attributes.holdable && weaponItem.data.data.held !== true) {
    ui.notifications.error("Item must be held to use.");
    weapons.pop();
    attacker.offhand = true;
    return attack(attackers, targetToken, options);
  }
  const weapName = weaponItem.name || '';
  chatMsgData.flavor = chatMsgData.flavor || weapName;
  const weapAttrs = weaponItem.data.data.attributes;
  const weapAtkMod = weapAttrs.atk_mod?.value || 0;
  const weapDmg = weapAttrs.dmg?.value;
  if(!weapDmg) {
    ui.notifications.error("Damage not set for item.");
    weapons.pop();
    attacker.offhand = true;
    return attack(attackers, targetToken, options);
  }
  
  const offhand = options.offhand == null ? !!attacker.offhand : options.offhand;
  if(offhand && !weapAttrs.light?.value) {
    ui.notifications.error("Weapon used in the offhand must be light.");
    weapons.pop();
    return attack(attackers, targetToken, options);
  }
  const throwable = options.throwable == null ? weapAttrs.throwable?.value : options.throwable;
  const hasHook = options.hasHook == null ? weapAttrs.has_hook?.value : options.hasHook;
  const atkType = options.atkType == null ? weapAttrs.atk_type?.value : options.atkType;
  const maxRange = options.maxRange == null ? (atkType === 'melee' ? (weapAttrs.reach?.value ? 10 : 5) : weapAttrs.max_range?.value) : options.maxRange;
  const dmgType = options.dmgType == null ? weapAttrs.dmg_type?.value : options.dmgType;
  const fragile = options.fragile == null ? weapAttrs.fragile?.value : options.fragile;
  const finesse = options.finesse == null ? weapAttrs.finesse?.value : options.finesse;
  const unwieldy = options.unwieldy == null ? weapAttrs.unwieldy?.value : options.unwieldy;
  const critMin = options.critMin == null ? (weapAttrs.crit_min?.value || 20) : options.critMin;
  
  // show attack choice dialogs
  // automate throw dialog
  if(range && throwable && !options.skipThrowDialog && !options.shownThrowDialog) {
    if(range > 5) {
      options.atkType = 'throw';
      options.dmgType = 'throw';
    }
    options.shownThrowDialog = true;
    return attack(attackers, targetToken, options);
  }
  if(throwable && !options.skipThrowDialog && !options.shownThrowDialog) return throwDialog(options, attackers, targetToken);
  if(hasHook && !options.skipHookDialog && !options.shownHookDialog) return hookDialog(options, attackers, targetToken);
  if(options.showModDialog && !options.shownModDialog && attacker.showModDialog !== false) return modDialog(options, 'Attack', attack, attackers, targetToken);
  options.shownThrowDialog = false;
  options.shownHookDialog = false;
  options.shownModDialog = false;
  attacker.showModDialog = false;
  
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

  if(range > +maxRange) {
    ui.notifications.error("Target is beyond maximum range for this weapon.");
    weapons.pop();
    attacker.offhand = true;
    return attack(attackers, targetToken, options);
  }
  // determine range penalty and reduce qty of thrown weapon/missile
  let rangePenalty;
  if(atkType === 'missile' || atkType === 'throw') {
    rangePenalty = -Math.abs(Math.floor(range / 10));
    // reduce qty of thrown weapon/missile
    if(atkType === 'throw') {
      const weaponQty = weaponItem.data.data.quantity;
      await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem.data._id, 'data.quantity': weaponQty - 1}]);
    } else {
      const quiver = token.actor.items.find(i => i.data.data.worn && i.data.data.attributes.slot?.value?.toLowerCase() === 'quiver');
      const quiverQty = quiver?.data.data.quantity;
      const matchWeap = dmgType === 'bolt' ? quiver?.name?.toLowerCase()?.includes('bolt') : dmgType === 'arrow' ? quiver?.name?.toLowerCase()?.includes('bolt') : true;
      if(!quiver || !quiverQty || !matchWeap) {
        ui.notifications.error("Nothing found to shoot from this weapon.");
        weapons.pop();
        attacker.offhand = true;
        return attack(attackers, targetToken, options);
      }
      await token.actor.updateEmbeddedDocuments("Item", [{'_id': quiver.data._id, 'data.quantity': quiverQty - 1}]);
    }
  }

  // put together chat message content
  const d20Result = await new Roll("d20").evaluate().total;
  let dialogAtkMod = '', dialogDmgMod = '';
  try {
    dialogAtkMod = options.dialogAtkMod ? await new Roll(options.dialogAtkMod).evaluate().total : '';
    dialogDmgMod = options.dialogDmgMod ? await new Roll(options.dialogDmgMod).evaluate().total : '';
  } catch {
    ui.notifications.error("Invalid input to modifier dialog.");
    attackers.pop();
    return attack(attackers, targetToken, options);
  }
  const weapDmgResult = await new Roll(weapDmg).evaluate().total;
  let totalAtk = `${d20Result}+${bab}+${attrAtkMod}${offhandAtkPenalty ? `+${offhandAtkPenalty}` : ''}`;
  totalAtk += `${actorAtkMod ? `+${actorAtkMod}` : ''}${weapAtkMod ? `+${weapAtkMod}` : ''}`;
  totalAtk += `${rangePenalty ? `+${rangePenalty}` : ''}${dialogAtkMod ? `+${dialogAtkMod}` : ''}${options.atkMod ? `+${options.atkMod}` : ''}`;
  let totalDmg = `${options.dmgMulti ? `${weapDmgResult}*${options.dmgMulti}` : `${weapDmgResult}`}${attrDmgMod ? `+${attrDmgMod}` : ''}`;
  totalDmg += `${actorDmgMod ? `+${actorDmgMod}` : ''}${dialogDmgMod ? `+${dialogDmgMod}` : ''}`;
  const isCrit = atkType !== 'touch' && d20Result >= critMin && !targetToken.actor.items.find(i => i.data.data.worn && i.data.data.attributes.prevent_crit?.value === true);
  let dmgText = `${totalDmg ? ` for <span style="font-style:normal;">[[${totalDmg}]]</span>` : ''}`;
  if(isCrit) dmgText += ` + <span style="font-style:normal;">[[/r ${weapDmg}#${weapName} damage]]</span>`;
  dmgText += ' damage';
  if(atkType === 'touch') dmgText = '';

  let targetNameText = targetToken?.actor?.name ? ` ${targetToken.actor.name}` : '';
  let rangeText = range && rangePenalty ? ` (${range}')` : '';
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
  let targetAc;
  if(!isNaN(targetRollData?.ac)) {
    // check for friendly adjacent tokens wearing a Large Shield
    // note this doesn't work for monsters
    const adjacentFriendlyTokens = canvas.tokens.objects.children.filter(t => t.data.disposition === 1 && measureRange(targetToken, t) === 5);
    const largeShieldMods = adjacentFriendlyTokens.map(t => 
      t.actor.items.filter(i => i.data.data.held && i.data.data.attributes.large?.value)
      .map(i => i.data.data.attributes.ac_mod?.value)
    ).flat();
    const largeShieldMod = Math.max(...largeShieldMods, 0);
    targetAc = targetRollData.ac + largeShieldMod;
    const touchAc = targetRollData.touch_ac || targetRollData.ac;
    if(atkType === 'missile' || atkType === 'throw') {
      // disregard bucklers, add +1 for each large shield held
      const bucklersHeld = targetToken.actor.items.filter(i => i.data.data.held && i.data.data.attributes.small?.value);
      bucklersHeld.forEach(i => targetAc -= +i.data.data.attributes.ac_mod?.value || 0);
      const largeShieldsHeld = targetToken.actor.items.filter(i => i.data.data.held && i.data.data.attributes.large?.value);
      largeShieldsHeld.forEach((i) => targetAc += 1);
    }
    // handle bonus for bash vs. metal armor
    const targetArmor = targetToken.actor.items.find(i => i.data.data.worn && i.data.data.attributes.slot?.value === 'armor');
    const targetArmorType = targetArmor?.data.data.attributes.type?.value.toLowerCase();
    if((targetArmorType === 'chain' || targetArmorType === 'plate') && dmgType === 'bash') {
      targetAc -= 2;
    }
    // disregard shield mods if weapon is unwieldy, e.g. flail
    if(unwieldy && atkType === 'melee') {
      const shieldMods = largeShieldMod + targetToken.actor.items.filter(i => i.data.data.held && i.data.data.attributes.ac_mod?.value > 0)
        .reduce((a,b) => a + b.data.data.attributes.ac_mod.value, 0);
      targetAc -= shieldMods;
    }
    const totalAtkRoll = new Roll(totalAtk);
    await totalAtkRoll.evaluate();
    isHit = totalAtkRoll.total >= (atkType === 'touch' ? touchAc : targetAc);
    if(isHit) {
      resultText = ` vs. AC ${targetAc} <span style="${resultStyle('#7CCD7C')}">HIT</span>`;
      resultSound = hitSound;
    } else {
      resultText = ` vs. AC ${targetAc} <span style="${resultStyle('#EE6363')}">MISS</span>`;
    }
  }
  if(isCrit && isHit) resultText = `${targetAc ? ` vs. AC ${targetAc}` : ''} <span style="${resultStyle('#FFFF5C')}">CRIT</span>`;
  if(unwieldy && atkType === 'melee' && d20Result === 1) {
    isHit = true;
    resultText += ` hit self`;
    resultSound = hitSound;
  }
  if(isHit) resultText += dmgText;
  if(fragile && atkType === 'melee' && d20Result === 1) {
    resultText += ` <span style="${resultStyle('#EE6363')}">WEAPON BREAK</span>`;
    resultSound = 'weapon_break';
    // reduce qty by 1
  }

  chatMsgData.content += `${attackText}${rangeText} <span style="font-style:normal;">[[${totalAtk}]]</span>${resultText}<br>`;

  // add sound and damage
  attacks.push({sound: '', damage: ''});
  const thisAttack = attacks.slice(-1)[0];
  thisAttack.sound = resultSound;
  if(isHit && targetToken && options.applyDamage === true && game.user.isGM) {
    const totalDmgRoll = new Roll(totalDmg);
    await totalDmgRoll.evaluate();
    thisAttack.damage = totalDmgRoll.total;
  }

  // reset for new weapon
  weapons.pop();
  attacker.offhand = true;

  return attack(attackers, targetToken, options);
}

function resultStyle(bgColour) {
  return `background: ${bgColour}; padding: 1px 4px; border: 1px solid #4b4a44; border-radius: 2px; white-space: nowrap; word-break: break-all; font-style: normal;`;
}

function measureRange(token1, token2) {
  const canvasDistance = token1 && token2 ? (canvas.grid.grid.constructor.name === 'SquareGrid' ?
  canvas.grid.measureDistanceGrid(token1.position, token2.position) :
  canvas.grid.measureDistance(token1.position, token2.position)) : undefined;
  // return range rounded to 5'
  return Math.floor(+canvasDistance / 5) * 5;
}

export function macroChatMessage(token, data, chatBubble=true) {
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker(token),
    content: data.content.trim(),
    type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
    flavor: data.flavor,
    sound: data.sound ? `systems/lostlands/sounds/${data.sound}.mp3` : undefined
  }, {chatBubble: chatBubble});
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

function chargesUsedDialog(options, ...data) {
  new Dialog({
    title: "Modifiers",
    content: 
      `<form>
        <div class="form-group">
          <label>Charges expended?</label>
          <input type="number" id="chargesUsed" value="1">
        </div>
      </form>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Use`,
        callback: html => {
          options.shownChargesUsedDialog = true;
          options.numChargesUsed = +html.find('[id=chargesUsed]')[0]?.value;
          chargedItemMacro(...data, options);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => console.log("Cancelled chargesUsed dialog")
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
        const itemCost = selectedItem.data.data.attributes.gp_value?.value;
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
