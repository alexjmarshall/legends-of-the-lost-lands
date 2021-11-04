import * as Constant from "./constants.js";
import * as Util from "./utils.js";

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
  const macroData = {};
  // case 1: item
  if (data.data) {
    const item = data.data;
    const itemMacroWithId = item.data.macro?.replace(/itemId/g, item._id);
    macroData.name = item.name;
    macroData.command = itemMacroWithId;
    macroData.type = "script";
  }
  // case 2: roll
  if (data.roll && data.label) {
    macroData.name = data.label;
    macroData.command = `/r ${data.roll}#${data.label}`;
    macroData.type = "chat";
  }
  // case 3: voice button
  if (data.mood) {
    macroData.name = `Voice: ${data.mood}`;
    macroData.command = `game.lostlands.Macro.voiceMacro("${data.mood}")`;
    macroData.type = "script";
  }
  let macro = game.macros.find(m => (m.name === macroData.name && m.data.command === macroData.command));
  if (!macro) {
    if (macroData.command) {
      macro = await Macro.create({
        name: macroData.name,
        type: macroData.type,
        command: macroData.command,
        flags: { "lostlands.attrMacro": true }
      });
    }
    else {
      ui.notifications.error("Could not find a macro for this.");
      return false;
    }
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

export function voiceMacro(mood) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = token ? token.actor : game.user.character;
  if(!actor) return ui.notifications.error("Select speaking token.");
  const voice = actor.data.data.voice;
  if(!voice) return ui.notifications.error("Character does not have a selected voice.");
  return Util.playVoiceSound(mood, actor, token);
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
    sound: spell.data.data.attributes.sound?.value,
    type: CONST.CHAT_MESSAGE_TYPES.IC
  }, false);
  canvas.hud.bubbles.say(token, `${actor.name} casts ${spell.name}.`, {emote: true});

  return actor.update(updateData);
}

export function potionMacro(itemId, options={}) {
  options.verb = 'quaffs';
  options.sound = 'drink_potion';
  return consumeItem(itemId, options);
}

export function scrollMacro(itemId, options={}) {
  options.verb = 'reads';
  return consumeItem(itemId, options);
}

async function consumeItem(itemId, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = token ? token.actor : game.user.character;
  if (!actor) return ui.notifications.error("Select character using the item.");
  const item = actor.data.items.get(itemId) || actor.data.items.find(i => i.name.toLowerCase().replace(/\s/g,'') === itemId?.toLowerCase().replace(/\s/g,''));
  if (!item) return ui.notifications.error("Could not find item on this character.");
  const itemQty = +item.data.data.quantity;
  if (!itemQty) return ui.notifications.error("Item must have a quantity greater than zero to use.");

  const healFormula = item.data.data.attributes.heal?.value;
  if (options.applyDamage && healFormula) {
    try {
      const healPoints = await new Roll(healFormula).evaluate().total;
      const currentHp = +actor.data.data.hp?.value;
      const maxHp = +actor.data.data.hp?.max;
      let hpUpdate = currentHp + +healPoints;
      if ( hpUpdate > maxHp ) hpUpdate = maxHp;
      if(!isNaN(hpUpdate) && hpUpdate !== currentHp) await actor.update({'data.hp.value': hpUpdate});
      macroChatMessage(token, { 
        content: `${actor.name} is healed ${chatInlineRoll(healPoints)} points of damage.`, 
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
      sound: options.sound,
      type: CONST.CHAT_MESSAGE_TYPES.IC
    }, false);
  }
  canvas.hud.bubbles.say(token, `${actor.name} ${options.verb || 'consumes'} ${item.name}.`, {emote: true});
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

  if(!options.numChargesUsed && !options.shownChargesUsedDialog && options.showModDialog) return chargesUsedDialog(options, item.name, itemId, options);
  const numChargesUsed = +options.numChargesUsed || 1;
  const chargesLeft = charges - numChargesUsed;
  
  if(!item.data.data.description) return ui.notifications.error("Item has no description set.");
  macroChatMessage(token, { 
    content: item.data.data.description, 
    flavor: `${item.name}: ${chargesLeft} charges`,
    sound: item.data.data.attributes.sound?.value,
    type: CONST.CHAT_MESSAGE_TYPES.IC
  }, false);
  canvas.hud.bubbles.say(token, `${actor.name} expends ${numChargesUsed} charge${numChargesUsed > 1 ? 's' : ''} from ${item.name}.`, {emote: true});
  
  return actor.updateEmbeddedDocuments("Item", [{'_id': item.data._id, 'data.attributes.charges.value': chargesLeft}]);
}

export function twoWeaponFightingMacro(options) {
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s).");
  if([...game.user.targets].length > 1) return ui.notifications.error("Select a single target.");
  const targetToken = [...game.user.targets][0];
  options.throwable = false;

  const attackers = [];
  for(const token of selectedTokens) {
    const weapons = token.actor.items.filter(i => i.type === 'item' && i.data.data.held);
    if (!weapons.length) {
      ui.notifications.error(`${token.actor.name} is not holding any weapons.`);
      continue;
    }
    // if weapons includes a light weapon, move it to end of array
    weapons.forEach((w, i, arr) => {
      if (w.data.data.attributes.light?.value) {
        arr.splice(i,1);
        arr.push(w);
      }
    });
    // extract item ids and flag weapons after the first as offhand
    const weapIds = weapons.map((w, i) => {
      return Object.create({
        id: w.id,
        offhand: i > 0
      })
    });
    const weaponsString = weapons.reduce((a,b) => a + `${b.name}, `, '').replace(/,\s*$/,'');
    attackers.push({
      token: token,
      weapons: weapIds,
      chatMsgData: {content: '', flavor: `Two-Weapon Fighting (${weaponsString})`, sound: options.sound},
      attacks: []
    })
  }
  return attack(attackers, targetToken, options);
}

export function attackRoutineMacro(options) {
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s).");
  if([...game.user.targets].length > 1) return ui.notifications.error("Select a single target.");
  const targetToken = [...game.user.targets][0];
  options.offhand = false;

  const attackers = [];
  for(const token of selectedTokens) {
    const atkRoutineItem = token.actor.items.find(i => i.type === 'feature' && i.name === 'Attack Routine');
    if(!atkRoutineItem) {
      ui.notifications.error(`Attack Routine feature not found on this character.`);
      continue;
    }
    const atksString = atkRoutineItem.data.data.attributes.routine?.value;
    const attackNames = atksString?.split(',');
    if (!atksString || !attackNames.length) {
      ui.notifications.error(`${token.actor.name}'s Attack Routine has a missing or incorrectly formatted attack list.`);
      continue;
    }
    const attacks = attackNames.map(a => Object.create({id: a}));
    attackers.push({
      token: token,
      weapons: attacks,
      chatMsgData: {content: '', flavor: `Attack Routine (${atksString})`, sound: options.sound},
      attacks: []
    })
  }
  return attack(attackers, targetToken, options);
}

export async function saveMacro(damage=0, options={}) {
  const tokens = canvas.tokens.controlled;
  if(!canvas.tokens.controlled.length) return ui.notifications.error("Select token(s) to make a saving throw.");
  
  return save(tokens, damage, options);
}

async function save(tokens, damage, options) {
  if(!tokens.length) return;
  const token = tokens[0];
  const actor = token.actor;
  const saveTarget = +token.actor.data.data.attributes.st?.value;
  if(!saveTarget) {
    ui.notifications.error(`${actor.name} has no save target number set.`);
    tokens.shift();
    return save(tokens, damage, options);
  }
  options.skipDmgDialog = true;
  const modDialogFlavor = options.flavor || 'Save';
  if(options.showModDialog && !options.shownModDialog) return modDialog(options, modDialogFlavor, save, tokens, damage, options);
  const actorSaveMod = +actor.data.data.save_mod || 0;
  const d20Result = await new Roll("d20").evaluate().total;
  let dialogAtkMod = '';
  try {
    dialogAtkMod = options.dialogAtkMod ? await new Roll(options.dialogAtkMod).evaluate().total : '';
  } catch {
    ui.notifications.error("Invalid input to modifier dialog.");
    options.shownModDialog = false;
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
  let content = `<div style="line-height:1.6em;">${actor.name} ${options.verb || 'saves'} ${chatInlineRoll(saveText)}${resultText}`;
  content += `${damage ? ` and takes ${chatInlineRoll(takenDamage)} damage` : ``}${critFail ? `${options.critFailText}` : ``}${fail ? `${options.failText}` : ``}</div>`;
  const flavor = options.flavor || (damage ? 'Save for Half Damage' : 'Saving Throw');
  macroChatMessage(token, {
    content: content, 
    flavor: flavor,
    sound: options.sound
  });
  const currentHp = +actor.data.data.hp?.value;
  if ( !isNaN(currentHp) && takenDamage && ( game.user.isGM || token.actor.isOwner ) ) await token.actor.update({"data.hp.value": currentHp - takenDamage})
  
  // wait if not last actor
  if (tokens.length > 1) await Util.wait(500);
  
  tokens.shift();
  return save(tokens, damage, options);
}

function chatInlineRoll(content) {
  return `<span style="font-style:normal;">[[${content}]]</span>`
}

export async function thiefSkillMacro(skill, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  if(!token) return ui.notifications.error("Select token attempting the thief skill.");
  const actor = token.actor;

  options.flavor = skill;
  options.attrMod = +actor.data.data.dex_mod;
  options.verb = `attempts to ${skill}`;
  const lockPickItem = actor.items.find(i => i.type === 'item' && i.name.toLowerCase().replace(/\s/g,'') === 'lockpicks');
  switch(skill.toLowerCase().replace(/\s/g,'')) {
    case 'openlocks':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot open locks without lock picks.`);
      options.failText = ` but may try again when their skill increases.`;
      options.critFailText = ` and the lock pick breaks!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, chatBubble: true, chance: 0.7});
      break;
    case 'disarmtraps':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot disarm traps without lock picks.`);
      options.failText = ` but may try again when their skill increases.`;
      options.critFailText = ` and the trap fires!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, chatBubble: true, chance: 0.7});
      break;
    case 'pickpockets':
      options.failText = ` but may try again when their skill increases.`;
      options.critFailText = ` and is immediately caught!`;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, chatBubble: true, chance: 0.7});
      break;
    case 'movesilently':
      options.failText = ` but may hide to avoid detection.`;
      options.critFailText = ` and is immediately caught!`;
      break;
    case 'hideinshadows':
      options.failText = ` and may be found if searched for.`;
      options.critFailText = ` and is immediately caught!`;
  }

  return saveMacro(0, options);
}

export function backstabMacro(options) {
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s).");
  if([...game.user.targets].length > 1) return ui.notifications.error("Select a single target.");
  const targetToken = [...game.user.targets][0];
  options.atkMod = 4;
  options.throwable = false;

  const attackers = [];
  for(const token of selectedTokens) {
    const backstabItem = token.actor.items.find(i => i.type === 'feature' && i.name === 'Backstab');
    const dmgMulti = +backstabItem.data.data.attributes.dmg_multi?.value;
    if(!dmgMulti) {
      ui.notifications.error(`${token.actor.name} has no damage multiplier set on backstab feature.`);
      continue;
    }
    if(!backstabItem) {
      ui.notifications.error(`Backstab feature not found on this character.`);
      continue;
    }
    const heldWeapons = token.actor.items.filter(i => i.type === 'item' && i.data.data.held);
    if (!heldWeapons.length) {
      ui.notifications.error(`${token.actor.name} is not holding any weapons.`);
      continue;
    }
    if (heldWeapons.length > 1) {
      ui.notifications.error(`${token.actor.name} must be holding only one weapon to backstab.`);
      continue;
    }
    const weapon = heldWeapons[0];
    if(!weapon.data.data.attributes.light?.value) {
      ui.notifications.error(`${token.actor.name} cannot backstab with this weapon.`);
      continue;
    }
    attackers.push({
      token: token,
      weapons: [{id: weapon.id}],
      chatMsgData: {content: '', flavor: `Backstab (${weapon.name})`, sound: options.sound},
      attacks: [],
      dmgMulti: dmgMulti
    })
  }

  return attack(attackers, targetToken, options);
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
  if(!Array.isArray(weapons)) weapons = [weapons];
  weapons = weapons.map(a => Object.create({id: a}));
  // need macro for misc rolls like swim/climb, reaction/morale/random target/award XP?, sounds for spells
  // XP progressions and other class/race features -- YAH to auto level up
  // should use combat tracker? or nah
  // players cannot edit their XP or HP?
  // document all attribute properties
  // combine throw and hook into attack Form dialog and show it with shift!
  // instead of throwable/has_hook, each weapon has an alt attack form -- can be alt damage type, throw or hook
  // clean up chat messages -- move target name to flavor after vs., and attack form/verb to flavor
  // switch to shift for modifier dialog, and alt for alt attack form. for click chat numbers, ctrl to apply damage, alt to heal, and ctrl-alt to save for half
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s).");
  if([...game.user.targets].length > 1) return ui.notifications.error("Select a single target.");
  const targetToken = [...game.user.targets][0];

  const attackers = [];
  for(const token of selectedTokens) {
    attackers.push({
      token: token,
      weapons: weapons,
      chatMsgData: { content: '', flavor: options.flavor, sound: options.sound },
      attacks: []
    })
  }

  return attack(attackers, targetToken, options);
}

async function attack(attackers, targetToken, options) {
  if(!attackers.length) return;
  const attacker = attackers[0];
  const token = attacker.token;
  const chatMsgData = attacker.chatMsgData;
  const attacks = attacker.attacks;
  const targetRollData = targetToken?.actor?.getRollData();
  const weapons = attacker.weapons;
  const weapon = weapons[0];
  const range = measureRange(token, targetToken);

  // if this attacker's weapons are finished, remove attacker and create attack chat msg
  if(!weapons.length) {
    if(chatMsgData.content) {
      chatMsgData.content = `<div style="line-height:1.6em;">${chatMsgData.content}</div>`;
      macroChatMessage(token, chatMsgData);
      for(const attack of attacks) {
        attack.sound && AudioHelper.play({src: `systems/lostlands/sounds/${attack.sound}.mp3`, volume: 1, loop: false}, true);
        if (attack.damage) {
          const targetHp = +targetToken.actor.data.data.hp?.value;
          const hpUpdate = targetHp - attack.damage;
          if (!isNaN(hpUpdate)) await targetToken.actor.update({"data.hp.value": hpUpdate});
          if (hpUpdate < 1 && targetHp > 0) Util.playVoiceSound(Constant.VOICE_MOODS.KILL, token.actor, token, {push: true, chatBubble: true, chance: 0.7});
        }
        // wait if there are more attacks or more attackers left to handle
        if ( attacks.indexOf(attack) < attacks.length - 1 || attackers.length > 1 ) await Util.wait(500);
      }
    }
    attackers.shift();
    return attack(attackers, targetToken, options);
  }

  // get weapon and its properties
  const actorItems = token.actor.data.items;
  // weapon.id can be an item id or a weapon name
  const weaponItem = actorItems.get(weapon.id) || actorItems.find(i => i.name.toLowerCase().replace(/\s/g,'') === weapon.id?.toLowerCase().replace(/\s/g,''));
  if(!weaponItem) {
    ui.notifications.error("Could not find item on this character.");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if(weaponItem.data.data.quantity < 1) {
    ui.notifications.error("Item must have a quantity greater than zero to use.");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if(weaponItem.data.data.attributes.holdable && weaponItem.data.data.held !== true) {
    ui.notifications.error("Item must be held to use.");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const weapName = weaponItem.name || '';
  chatMsgData.flavor = chatMsgData.flavor || weapName;
  const weapAttrs = weaponItem.data.data.attributes;
  const weapAtkMod = weapAttrs.atk_mod?.value || 0;
  const weapDmg = weapAttrs.dmg?.value;
  if(!weapDmg) {
    ui.notifications.error("Damage not set for item.");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  
  const offhand = options.offhand == null ? weapon.offhand : options.offhand;
  if(offhand === true && !weapAttrs.light?.value) {
    ui.notifications.error("Weapon used in the offhand must be light.");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const throwable = options.throwable == null ? weapAttrs.throwable?.value : options.throwable;
  const hasHook = weapAttrs.has_hook?.value;
  const atkType = weapon.atkType == null ? weapAttrs.atk_type?.value : weapon.atkType;
  if (atkType === 'touch') attacker.skipDmgDialog = true;
  const maxRange = atkType === 'melee' ? (weapAttrs.reach?.value ? 10 : 5) : weapAttrs.max_range?.value;
  const dmgType = weapon.dmgType == null ? weapAttrs.dmg_type?.value : weapon.dmgType;
  const fragile = weapAttrs.fragile?.value;
  const finesse = weapAttrs.finesse?.value;
  const unwieldy = weapAttrs.unwieldy?.value;
  const critMin = weapAttrs.crit_min?.value || 20;
  const reloadable = weapAttrs.reloadable?.value;
  const loaded =  weaponItem.data.data.loaded;
  // reload item if needed
  if ( reloadable && !loaded ) {
    await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem.data._id, 'data.loaded': true}]);
    chatMsgData.content += `reloads ${weapName}<br>`;
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  
  // show attack choice dialogs
  // automate throw dialog if have target range
  if ( range && throwable && !options.skipThrowDialog && !weapon.shownThrowDialog ) {
    if (range > 5) {
      weapon.atkType = 'throw';
      weapon.dmgType = 'throw';
    }
    weapon.shownThrowDialog = true;
    return attack(attackers, targetToken, options);
  }
  if ( throwable && !options.skipThrowDialog && !weapon.shownThrowDialog ) return throwDialog(weapon, weapName, attackers, targetToken, options);
  if ( hasHook && !options.skipHookDialog && !weapon.shownHookDialog ) return hookDialog(weapon, weapName, attackers, targetToken, options);
  if ( options.showModDialog && !options.shownModDialog ) return modDialog(options, 'Attack', attack, attackers, targetToken, options);
  let dialogAtkMod = '', dialogDmgMod = '';
  try {
    dialogAtkMod = attacker.dialogAtkMod ? await new Roll(attacker.dialogAtkMod).evaluate().total : '';
    dialogDmgMod = attacker.dialogDmgMod ? await new Roll(attacker.dialogDmgMod).evaluate().total : '';
  } catch {
    ui.notifications.error("Invalid input to modifier dialog.");
    options.shownModDialog = false;
    return attack(attackers, targetToken, options);
  }
  
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

  // get target's properties
  const preventCrit = targetToken?.actor.items.find(i => i.data.data.worn && i.data.data.attributes.prevent_crit?.value === true);

  if(range > +maxRange) {
    ui.notifications.error("Target is beyond maximum range for this weapon.");
    weapons.shift();
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
      const matchWeap = dmgType === 'bolt' ? quiver?.name?.toLowerCase()?.includes('bolt') :
        dmgType === 'arrow' ? quiver?.name?.toLowerCase()?.includes('arrow') : true;
      if(!quiver || !quiverQty || !matchWeap) {
        ui.notifications.error("Nothing found to shoot from this weapon.");
        weapons.shift();
        return attack(attackers, targetToken, options);
      }
      const itemsUpdate = [{'_id': quiver.data._id, 'data.quantity': quiverQty - 1}];
      // set crossbow to unloaded
      if (reloadable) await itemsUpdate.push({'_id': weaponItem.data._id, 'data.loaded': false});
      await token.actor.updateEmbeddedDocuments("Item", itemsUpdate);
    }
  }

  // put together chat message content
  const d20Result = await new Roll("d20").evaluate().total;
  const weapDmgResult = await new Roll(weapDmg).evaluate().total;
  let totalAtk = `${d20Result}+${bab}+${attrAtkMod}${offhandAtkPenalty ? `+${offhandAtkPenalty}` : ''}`;
  totalAtk += `${actorAtkMod ? `+${actorAtkMod}` : ''}${weapAtkMod ? `+${weapAtkMod}` : ''}`;
  totalAtk += `${rangePenalty ? `+${rangePenalty}` : ''}${dialogAtkMod ? `+${dialogAtkMod}` : ''}${options.atkMod ? `+${options.atkMod}` : ''}`;
  let totalDmg = `${attacker.dmgMulti ? `${weapDmgResult}*${attacker.dmgMulti}` : `${weapDmgResult}`}${attrDmgMod ? `+${attrDmgMod}` : ''}`;
  totalDmg += `${actorDmgMod ? `+${actorDmgMod}` : ''}${dialogDmgMod ? `+${dialogDmgMod}` : ''}`;
  let dmgText = `${totalDmg ? ` for ${chatInlineRoll(totalDmg)}` : ''}`;
  const isCrit = atkType !== 'touch' && d20Result >= critMin && !preventCrit;
  if(isCrit) dmgText += ` + ${chatInlineRoll(`/r ${weapDmg}#${weapName} damage`)}`;
  dmgText += ' damage';
  if(atkType === 'touch') dmgText = '';

  let targetNameText = targetToken?.actor?.name ? ` ${targetToken.actor.name}` : '';
  let rangeText = range && rangePenalty ? ` (${range}')` : '';
  let attackText = `attacks${targetNameText}`;
  let hitSound, missSound;
  switch (dmgType) {
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
  if (!isNaN(targetRollData?.ac)) {
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
    if (atkType === 'missile' || atkType === 'throw') {
      // disregard bucklers, add +1 for each large shield held
      const bucklersHeld = targetToken.actor.items.filter(i => i.data.data.held && i.data.data.attributes.small?.value);
      bucklersHeld.forEach(i => targetAc -= +i.data.data.attributes.ac_mod?.value || 0);
      const largeShieldsHeld = targetToken.actor.items.filter(i => i.data.data.held && i.data.data.attributes.large?.value);
      largeShieldsHeld.forEach((i) => targetAc += 1);
    }
    // handle bonus for bash vs. metal armor
    const targetArmor = targetToken.actor.items.find(i => i.data.data.worn && i.data.data.attributes.slot?.value === 'armor');
    const targetArmorType = targetArmor?.data.data.attributes.type?.value.toLowerCase();
    if ( (targetArmorType === 'chain' || targetArmorType === 'plate') && dmgType === 'bash' ) {
      targetAc -= 2;
    }
    // disregard shield mods if weapon is unwieldy, e.g. flail
    if ( unwieldy && atkType === 'melee' ) {
      const shieldMods = largeShieldMod + targetToken.actor.items.filter(i => i.data.data.held && i.data.data.attributes.ac_mod?.value > 0)
        .reduce((a,b) => a + b.data.data.attributes.ac_mod.value, 0);
      targetAc -= shieldMods;
    }
    const totalAtkRoll = new Roll(totalAtk);
    await totalAtkRoll.evaluate();
    isHit = totalAtkRoll.total >= (atkType === 'touch' ? touchAc : targetAc);
    if (isHit) {
      resultText = ` vs. AC ${targetAc} <span style="${resultStyle('#7CCD7C')}">HIT</span>`;
      resultSound = hitSound;
    } else {
      resultText = ` vs. AC ${targetAc} <span style="${resultStyle('#EE6363')}">MISS</span>`;
    }
  }

  if ( isCrit && isHit ) resultText = `${targetAc ? ` vs. AC ${targetAc}` : ''} <span style="${resultStyle('#FFFF5C')}">CRIT</span>`;
  if ( unwieldy && atkType === 'melee' && d20Result === 1)  {
    isHit = true;
    resultText += ` hit self`;
    resultSound = hitSound;
  }
  if (isHit) resultText += dmgText;
  if ( fragile && atkType === 'melee' && d20Result === 1 ) {
    resultText += ` <span style="${resultStyle('#EE6363')}">WEAPON BREAK</span>`;
    resultSound = 'weapon_break';
    const weaponQty = weaponItem.data.data.quantity;
    await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem.data._id, 'data.quantity': weaponQty - 1}]);
  }

  chatMsgData.content += `${attackText}${rangeText} ${chatInlineRoll(totalAtk)}${resultText}<br>`;

  // add sound and damage
  let thisAttackDamage;
  if ( isHit && targetToken && options.applyDamage === true && game.user.isGM ) {
    const totalDmgRoll = new Roll(totalDmg);
    await totalDmgRoll.evaluate();
    thisAttackDamage = totalDmgRoll.total;
  }
  attacks.push({
    sound: resultSound,
    damage: thisAttackDamage
  });

  weapons.shift();

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
  if (!data.content) return;
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker(token),
    content: data.content.trim(),
    type: data.type || CONST.CHAT_MESSAGE_TYPES.EMOTE,
    flavor: data.flavor,
    sound: data.sound ? `systems/lostlands/sounds/${data.sound}.mp3` : undefined
  }, {chatBubble: chatBubble});
}

function hookDialog(weapon, label, ...data) {
  return new Dialog({
    title: `${label} Form of Attack`,
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-user-friends"></i>',
        label: "Standard",
        callback: () => {
          weapon.shownHookDialog = true;
          attack(...data);
        }
      },
      two: {
        icon: '<i class="fas fa-candy-cane"></i>',
        label: "Hook",
        callback: () => {
          weapon.shownHookDialog = true;
          weapon.atkType = 'touch';
          weapon.dmgType = 'hook';
          attack(...data);
        }
      }
    },
    default: "one"
  }).render(true);
}

function modDialog(mods, label, callback, ...data) {
  new Dialog({
    title: `${label} Modifiers`,
    content: 
      `<form>
        <div class="form-group">
          <label>${label} modifiers</label>
          <input type="text" id="atkMod" placeholder="e.g. -4">
        </div>
        ${mods.skipDmgDialog === true ? '' : `<div class="form-group">
          <label>Damage modifiers</label>
          <input type="text" id="dmgMod" placeholder="e.g. 2d6">
        </div>`}
      </form>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `${label}`,
        callback: html => {
          mods.shownModDialog = true;
          mods.dialogAtkMod = html.find('[id=atkMod]')[0]?.value;
          mods.dialogDmgMod = html.find('[id=dmgMod]')[0]?.value;
          callback(...data);
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

function chargesUsedDialog(item, label, ...data) {
  new Dialog({
    title: `${label} Charges Used`,
    content: 
      `<form>
        <div class="form-group">
          <label>Charges used</label>
          <input type="number" id="chargesUsed" value="1">
        </div>
      </form>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Use`,
        callback: html => {
          item.shownChargesUsedDialog = true;
          item.numChargesUsed = +html.find('[id=chargesUsed]')[0]?.value;
          chargedItemMacro(...data);
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

function throwDialog(weapon, label, ...data) {
  new Dialog({
    title: `${label} Form of Attack`,
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-user-friends"></i>',
        label: "Melee",
        callback: () => {
          weapon.shownThrowDialog = true;
          weapon.atkType = 'melee';
          attack(...data);
        }
      },
      two: {
        icon: '<i class="fas fa-people-arrows"></i>',
        label: "Throw",
        callback: () => {
          weapon.shownThrowDialog = true;
          weapon.atkType = 'throw';
          weapon.dmgType = 'throw';
          attack(...data);
        }
      }
    },
    default: "one"
  }).render(true);
}

export function reactionRollMacro(options) {
  if (!game.user.isGM) return;
  if (canvas.tokens.controlled.length !== 1) return ui.notifications.error("Select a single token.");
  const reactingActor = canvas.tokens.controlled[0].actor;
  if ([...game.user.targets].length !== 1) return ui.notifications.error("Select a single target.");
  const targetActor = [...game.user.targets][0].actor;
  options.override = true;

  return reactionRoll(reactingActor, targetActor, options);
}

export async function reactionRoll(reactingActor, targetActor, options) {
  if ( !reactingActor || !targetActor ) return;
  const targetLevel = targetActor.data.data.attributes.lvl?.value || 1;
  const attitudeMap = reactingActor.data.data.attitude_map;
  const attitudeObj = attitudeMap[targetActor.id];
  let attitude = attitudeObj?.attitude;

  if ( options.override === true || !attitude || targetLevel > attitudeObj.lvl ) {
    if ( options.showModDialog && !options.shownModDialog ) {
      options.skipDmgDialog = true;
      return modDialog(options, options.flavor || 'Reaction Roll', reactionRoll, reactingActor, targetActor, options);
    }
    options.shownModDialog = false;
    const chaMod = +targetActor.data.data.cha_mod;
    const targetRxnMod = +targetActor.data.data.attributes.rxn_mod?.value;
    const base2d6Result = await new Roll("2d6").evaluate().total;
    let dialogAtkMod = '';
    try {
      dialogAtkMod = options.dialogAtkMod ? await new Roll(options.dialogAtkMod).evaluate().total : '';
    } catch {
      ui.notifications.error("Invalid input to modifier dialog.");
      return reactionRoll(reactingActor, targetActor, options);
    }
    const rxnText = `${base2d6Result}${chaMod ? `+${chaMod}` : ''}${dialogAtkMod ? `+${dialogAtkMod}` : ''}${targetRxnMod ? `+${targetRxnMod}` : ''}`;
    const rxnRollResult = await new Roll(rxnText).evaluate().total;
    if (isNaN(rxnRollResult)) return;

    if (rxnRollResult <= 2) attitude = Constant.ATTITUDES.HOSTILE;
    else if (rxnRollResult <= 5) attitude = Constant.ATTITUDES.DISMISSIVE;
    else if (rxnRollResult <= 8) attitude = Constant.ATTITUDES.UNCERTAIN;
    else if (rxnRollResult <= 11) attitude = Constant.ATTITUDES.ACCEPTING;
    else attitude = Constant.ATTITUDES.HELPFUL;
    const attitudeMapUpdate = {
      attitude_map: {
        [targetActor.id]: {attitude: attitude, lvl: targetLevel}}
    };
    reactingActor.update({data: attitudeMapUpdate});

    const attitudeColours = {
      [Constant.ATTITUDES.HOSTILE]: "#EE6363",
      [Constant.ATTITUDES.DISMISSIVE]: "#ee8663",
      [Constant.ATTITUDES.UNCERTAIN]: "#DDD",
      [Constant.ATTITUDES.ACCEPTING]: "#a6ce7e",
      [Constant.ATTITUDES.HELPFUL]: "#7CCD7C",
    }
    const attitudeText = `<span style="${resultStyle(attitudeColours[attitude])}">${attitude.toUpperCase()}</span>`;

    const chatData = {
      content: `<div style="line-height:1.6em;">${reactingActor.name} reacts to ${targetActor.name} ${chatInlineRoll(rxnText)} ${attitudeText}</div>`,
      flavor: 'Reaction Roll'
    }
    macroChatMessage(reactingActor, chatData, true);
  }
  console.log(`Reaction Roll: ${reactingActor.name} is ${attitude} towards ${targetActor.name}`)
  return attitude;
}

export function buyMacro(item, price, merchant, qty, shownSplitDialog=false) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = game.user.character || token?.actor;
  const sameActor = actor?.isToken ? merchant.isToken && actor.token.id === merchant.token.id :
    actor?.id === merchant.id;
  if ( !actor || sameActor ) return ui.notifications.error("Select buying token.");
  const merchantGold = +merchant.data.data.attributes.gold?.value;
  if (!merchantGold) return ui.notifications.error("Merchant gold attribute not set.");
  const merchantQty = +item.data.data.quantity;
  if (!merchantQty) return ui.notifications.error("No stock available.");
  if (merchantQty > 1 && !shownSplitDialog) {
    return itemSplitDialog(merchantQty, item, price, merchant);
  }
  if (!qty) qty = merchantQty;

  // pay for item
  // note: 1 gp = 10 sp = 50 cp
  const actorItems = actor.data.items;
  const gpItem = actorItems.find(i => i.name === "Gold Pieces");
  const gp = +gpItem?.data.data.quantity || 0;
  const gpInCp = gp * 50;
  const spItem = actorItems.find(i => i.name === "Silver Pieces");
  const sp = +spItem?.data.data.quantity || 0;
  const spInCp = sp * 5;
  const cpItem = actorItems.find(i => i.name === "Copper Pieces");
  const cp = +cpItem?.data.data.quantity || 0;
  const totalMoneyInCp = gpInCp + spInCp + cp;
  const totalPrice = price * qty;
  const priceInCp = totalPrice * 50;
  const priceInSp = totalPrice * 10;

  // pay for item from actor
  let cpUpdateQty = cp, spUpdateQty = sp, gpUpdateQty = gp;
  // case 1: not enough money
  if (priceInCp > totalMoneyInCp) {
    const chatData = {
      content: `${actor.name} tries to purchase ${qty} ${item.name}${qty > 1 ? 's' : ''} for ${price} gp, but doesn't have enough money. The merchant appears annoyed.`,
    };
    return macroChatMessage(actor, chatData, true);
  }
  // case 2: can pay with cp
  if (cp >= priceInCp) {
    cpUpdateQty = cpUpdateQty - priceInCp;
  // case 3: can pay with cp and sp
  } else if (cp + spInCp >= priceInCp) {
    const cpInSp = Math.floor(cp / 5);
    cpUpdateQty = cpUpdateQty - cpInSp * 5;
    const priceLeftinSp = priceInSp - cpInSp;
    spUpdateQty = spUpdateQty - priceLeftinSp;
  // case 4: payment requires gp
  } else {
    const cpInSp = Math.floor(cp / 5);
    const cpAndSpInGp = Math.floor((cpInSp + sp) / 10);
    let priceLeft = totalPrice;
    if (cpAndSpInGp) {
      cpUpdateQty = cpUpdateQty - cpInSp * 5;
      const priceLeftinSp = cpAndSpInGp * 10 - cpInSp;
      spUpdateQty = spUpdateQty - priceLeftinSp;
      priceLeft = priceLeft - cpAndSpInGp;
    }
    gpUpdateQty = gp - priceLeft;
  }
  const cpUpdate = {_id: cpItem?.data._id, "data.quantity": cpUpdateQty};
  const spUpdate = {_id: spItem?.data._id, "data.quantity": spUpdateQty};
  const gpUpdate = {_id: gpItem?.data._id, "data.quantity": gpUpdateQty};
  cpUpdate._id && cpUpdateQty !== cp && actor.updateEmbeddedDocuments("Item", [cpUpdate]);
  spUpdate._id && spUpdateQty !== sp && actor.updateEmbeddedDocuments("Item", [spUpdate]);
  gpUpdate._id && gpUpdateQty !== gp && actor.updateEmbeddedDocuments("Item", [gpUpdate]);

  // update merchant's item quantity and merchant's gold
  merchant.updateEmbeddedDocuments("Item", [{'_id': item._id, 'data.quantity': merchantQty - qty}]);
  merchant.update({"data.attributes.gold.value": merchantGold + totalPrice});

  // add item to actor
  const itemData = {
    data: foundry.utils.deepClone(item.data.data),
    img: item.data.img,
    name: item.data.name,
    type: item.data.type,
  };
  itemData.data.quantity = qty;
  actor.createEmbeddedDocuments("Item", [itemData]);

  const cpPaidText = ` ${cp - cpUpdateQty} cp,`;
  const spPaidText = ` ${sp - spUpdateQty} sp,`;
  const gpPaidText = ` ${gp - gpUpdateQty} gp`;
  const chatData = {
    content: `${actor.name} buys ${qty} ${item.name}${qty > 1 ? 's' : ''} for ${totalPrice} GP, paying${cpPaidText}${spPaidText}${gpPaidText}.`,
    sound: 'coins'
  }
  return macroChatMessage(actor, chatData, true);
}

function itemSplitDialog(maxQty, itemData, price, ...data) {
  new Dialog({
    title: `Buy ${itemData.name}`,
    content: 
      `<form>
        <div class="form-group">
          <label style="max-width:fit-content;max-width:-moz-fit-content;">How many?</label>
          <span id="selectedQty" style="flex:1;text-align:center;"></span>
          <input class="flex7" type="range" id="qty" min="1" max="${maxQty}" value="1">
        </div>
        <div class="form-group">
          <label style="max-width:fit-content;max-width:-moz-fit-content;">Total price:</label>
          <span id="price" style="flex:1;text-align:center;"></span>
          <span class="flex7"></span>
        </div>
      </form>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Buy`,
        callback: html => {
          const quantity = +html.find('[id=qty]').val();
          buyMacro(itemData, price, ...data, quantity, true);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    default: "one",
    render: html => {
      const qtySpan = html.find('[id=selectedQty]');
      const qtyRange = html.find('[id=qty]');
      const priceSpan = html.find('[id=price]');
      qtySpan.html(+qtyRange.val());
      priceSpan.html(+qtyRange.val() * price);
      qtyRange.on("input", () => {
        qtySpan.html(+qtyRange.val());
        priceSpan.html(+qtyRange.val() * price);
      });
    }
  }).render(true);
}