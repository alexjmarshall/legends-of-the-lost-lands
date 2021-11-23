import * as Constant from "./constants.js";
import { TimeQ } from "./time-queue.js";
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
    macroData.command = `game.lostlands.Macro.playVoice("${data.mood}")`;
    macroData.type = "script";
  }
  if (!macroData.command) {
    ui.notifications.error("Could not find a macro for this");
    return false;
  }
  macroData.flags = { "lostlands.attrMacro": true };
  let macro = game.macros.find(m => (m.name === macroData.name && m.data.command === macroData.command));
  if (!macro) {
    macro = await Macro.create(macroData);
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

export function playVoice(mood) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const token = char.token;
  const voice = actor.data.data.voice;
  if (!voice) return ui.notifications.error(`${actor.name} does not have a selected voice`);
  Util.playVoiceSound(mood, actor, token);
}

export async function toggleRestMode(value, options={}) {
  if (!game.user.isGM) return ui.notifications.error(`You shouldn't be here...`);

  const restMode = value != null ? !!value : !game.settings.get("lostlands", "restMode");
  const notify = value == null;
  const restDice = options.altDialogChoice || Constant.DEFAULT_REST_DICE;

  if (options.showAltDialog && !options.shownAltDialog) {
    const choices = ['d3', 'd4', 'd6', 'd8'];
    return altDialog(options, 'Rest Dice', choices, () => toggleRestMode(value, options));
  }

  await game.settings.set("lostlands", "restDice", restDice);
  await game.settings.set("lostlands", "restMode", restMode);
  notify && ui.notifications.info(`Rest Mode is ${restMode ? 'on' : 'off'} (${restDice} hp/night)`);
}

export async function castSpell(spellId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const spell = Util.getItemFromActor(spellId, actor, 'spell');
  const spellSound = spell.data.data.attributes.sound?.value || null; // need generic spell sound here
  const isPrepared = !!spell.data.data.prepared;
  if (!isPrepared) return ui.notifications.error(`${spell.name} was not prepared`);
  const spellLevel = spell.data.data.attributes.lvl?.value;
  if (!spellLevel) return ui.notifications.error(`${spell.name} has no level set`);
  const actorSpellSlots = +actor.data.data.attributes[`${spell.type}`]?.[`lvl_${spellLevel}`].value || 0;
  if (actorSpellSlots <= 0) return ui.notifications.error(`No spells remaining of level ${spellLevel}`);
  const updateData = { data: {
    attributes: {
      [`${spell.type}`]: {
        [`lvl_${spellLevel}`]: {
          value: (actorSpellSlots - 1)
        }
      }
    }
  }};
  await actor.update(updateData);
  // await play sound based on spell school first
  await useItem(spellId, {
    sound: spellSound,
    verb: `casts`
  });
}

async function useItem(itemId, data={
  sound: '', 
  flavor: '', 
  verb: '', 
  chatMsgContent: '',
  chatMsgType: CONST.CHAT_MESSAGE_TYPES.EMOTE
}, consumable=false) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const token = char.token;
  const item = Util.getItemFromActor(itemId, actor);
  const sound = data.sound || item.data.data.attributes.sound?.value;
  const flavor = data.flavor || item.name;
  const desc = item.data.data.description
  const chatBubbleText = `${actor.name} ${data.verb || 'uses'} ${item.name}`;
  const content = data.chatMsgContent || desc || chatBubbleText;
  const type = data.chatMsgType || (desc ? CONST.CHAT_MESSAGE_TYPES.IC : CONST.CHAT_MESSAGE_TYPES.EMOTE);
  if (item.data.data.attributes.holdable && item.data.data.held !== true) {
    return ui.notifications.error(`${item.name} must be held to use`);
  }
  consumable && await Util.reduceItemQty(item, actor);
  Util.macroChatMessage(token, {content, flavor, sound, type}, false);
  Util.chatBubble(token, chatBubbleText);
}

export async function drinkPotion(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const item = Util.getItemFromActor(itemId, actor);
  const healFormula = item.data.data.attributes.heal?.value;
  let chatMsgContent, chatMsgType, hpUpdate;

  if (healFormula) {
    const healPoints = await Util.rollDice(healFormula);
    chatMsgContent = `${Util.chatInlineRoll(healPoints)} point${healPoints > 1 ? 's' : ''} of healing`;
    chatMsgType = CONST.CHAT_MESSAGE_TYPES.EMOTE;
    if (options.applyEffect) {
      const currentHp = +actor.data.data.hp?.value;
      const maxHp = +actor.data.data.hp?.max;
      // can only drink a potion if conscious
      if (currentHp > 0) hpUpdate = Math.min(maxHp, currentHp + healPoints);
    }
  }

  await useItem(itemId, {
    sound: 'drink_potion',
    verb: `quaffs`,
    chatMsgContent,
    chatMsgType
  }, true);

  await Util.resetThirst(actor, Util.now());

  !isNaN(hpUpdate) && await actor.update({'data.hp.value': hpUpdate});
}

export async function readScroll(itemId, options={}) {
  await useItem(itemId, {
    sound: 'read_scroll',
    verb: `reads`
  }, true);
}

export async function sleep(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const token = char.token;

  const wasSleeping = !!actor.getFlag("lostlands", "sleeping");
  await actor.setFlag("lostlands", "sleeping", !wasSleeping);

  if (!wasSleeping) {
    const macro = await Util.getMacroByCommand("sleeping", "return game.lostlands.Util.chatBubble(token, 'zZz...', true);")
    const newIntervalId = await TimeQ.doEvery({second: 6}, Util.now(), macro.id, {token});
    await actor.setFlag("lostlands", "sleeping_interval_id", newIntervalId);
  } else {
    const intervalId = actor.getFlag("lostlands", "sleeping_interval_id");
    TimeQ.cancel(intervalId);
  }
}

export async function drinkWater(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;

  await useItem(itemId, {
    sound: 'drink_water',
    verb: `drinks from`
  }, false);

  await Util.resetThirst(actor, Util.now());
}

export async function eatFood(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;

  await useItem(itemId, {
    sound: 'eat_food',
    verb: `eats`
  }, true);

  await Util.resetHunger(actor, Util.now());
  await Util.resetThirst(actor, Util.now() - Util.secondsInDay());
}

export async function useChargedItem(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const item = Util.getItemFromActor(itemId, actor);
  const charges = +item.data.data.attributes.charges?.value;
  const sound = item.data.data.attributes.sound?.value || null; // generic use charges sound?
  const numChargesUsed = options.numChargesUsed == null ? 1 : +options.numChargesUsed;
  const chargesLeft = charges - numChargesUsed;
  const itemUpdate = {'_id': item._id, 'data.attributes.charges.value': chargesLeft};

  if (!charges) return ui.notifications.error(`${item.name} has no charges remaining`);

  if(!options.numChargesUsed && !options.shownModDialog && options.showModDialog) {
    const field = {label: 'Charges used?', key: 'numChargesUsed'};
    return modDialog(options, `Use ${item.name}`, [field], () => useChargedItem(itemId, options));
  }

  if (chargesLeft > charges) {
    ui.notifications.error(`Cannot increase charges through use (but nice try)`);
    options.shownModDialog = false;
    options.showModDialog = true;
    return useChargedItem(itemId, options);
  }

  await useItem(itemId, {
    sound,
    flavor: `${item.name} (expend ${numChargesUsed} charge${numChargesUsed > 1 ? 's' : ''})`,
    verb: `expends ${numChargesUsed} charge${numChargesUsed > 1 ? 's' : ''} from`
  }, false);

  chargesLeft < charges && await actor.updateEmbeddedDocuments("Item", [itemUpdate]);
}

export function heldWeaponAttackMacro(options={}) {
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
  const targets = [...game.user.targets];
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];

  const attackers = [];
  for(const token of selectedTokens) {
    let weapons = token.actor.items.filter(i => i.type === 'item' && i.data.data.held);
    // if weapons includes a light weapon, move it to end of array
    weapons.forEach((w, i, arr) => {
      if (w.data.data.attributes.light?.value) {
        arr.splice(i,1);
        arr.push(w);
      }
    });
    // add two dummy weapon objects if unarmed
    const unarmed = !weapons.length;
    unarmed && weapons.push({id:'1', name:'Fist'}, {id:'2', name: 'Fist'});
    
    if ( weapons.length > 1 ) {
      // can only use multiple weapons if Dex > 13 and not wearing a shield
      const dexScore = +token.actor.data.data.attributes.ability_scores?.dex.value;
      const wearingShield = !!token.actor.data.items.find(i => i.type === 'item' &&
      i.data.data.worn && Util.stringMatch(i.data.data.attributes.slot?.value, 'shield'));
      if (dexScore < 13 || wearingShield) weapons = [weapons[0]];
    }
    // extract item ids and flag weapons after the first as offhand
    const weapIds = weapons.map((w, i) => {
      return Object.create({
        id: w.id,
        offhand: i > 0
      })
    });
    attackers.push({
      token: token,
      weapons: weapIds,
      chatMsgData: {content: '', flavor: '', sound: options.sound, bubbleString: ''},
      attacks: [],
      unarmed
    })
  }

  return attack(attackers, targetToken, options);
}

export function quickDrawAttackMacro(itemId, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = token ? token.actor : game.user.character;
  if (!actor) return ui.notifications.error("Select character using the weapon");
  const weapon = actor.data.items.get(itemId) || actor.data.items.find(i => i.name.toLowerCase().replace(/\s/g,'') === itemId?.toLowerCase().replace(/\s/g,''));
  if (!weapon) return ui.notifications.error("Could not find weapon on this character");
  const dmgTypes = weapon.data.data.attributes.dmg_types?.value.split(',').map(t => t.trim()).filter(t => t) || [];
  const canQuickDraw = weapon.data.data.attributes.quick_draw?.value && dmgTypes.includes('cut');
  if (!canQuickDraw) return ui.notifications.error("This weapon cannot perform a quick draw attack");
  const targets = [...game.user.targets];
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];

  const attackers = [];
  const flavor = `${weapon.name} (quick draw)`;
  attackers.push({
    token: token,
    weapons: [{id: itemId, dmgType: 'cut'}],
    chatMsgData: {content: '', flavor: '', sound: '', bubbleString: ''},
    flavor,
    attacks: [],
    showAltDialog: false,
    throwable: false
  })

  return attack(attackers, targetToken, options);
}

export function attackRoutineMacro(options={}) {
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
  const targets = [...game.user.targets];
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];
  options.offhand = false;

  const attackers = [];
  for(const token of selectedTokens) {
    const atkRoutineItem = token.actor.items.find(i => i.type === 'feature' && Util.stringMatch(i.name, 'Attack Routine'));
    if(!atkRoutineItem) {
      ui.notifications.error(`Attack Routine feature not found on this character`);
      continue;
    }
    const atksString = atkRoutineItem.data.data.attributes.routine?.value;
    const attackNames = atksString?.split(',');
    if (!atksString || !attackNames.length) {
      ui.notifications.error(`${token.actor.name}'s Attack Routine has a missing or incorrectly formatted attack list`);
      continue;
    }
    const attacks = attackNames.map(a => Object.create({id: a}));
    attackers.push({
      token: token,
      weapons: attacks,
      chatMsgData: {content: '', flavor: '', sound: options.sound, bubbleString: ''},
      attacks: []
    })
  }
  return attack(attackers, targetToken, options);
}

export async function saveMacro(damage=0, options={}) {
  const tokens = canvas.tokens.controlled;
  if(!canvas.tokens.controlled.length) return ui.notifications.error("Select token(s) to make a saving throw");
  
  return save(tokens, damage, options);
}

async function save(tokens, damage, options={}) {
  if(!tokens.length) return;
  const token = tokens[0];
  const actor = token.actor;
  const saveTarget = +token.actor.data.data.attributes.st?.value;
  if(!saveTarget) {
    ui.notifications.error(`${actor.name} has no save target number set`);
    tokens.shift();
    return save(tokens, damage, options);
  }
  const modDialogFlavor = options.flavor || 'Saving Throw';
  if (options.showModDialog && !options.shownModDialog) {
    const field = {label: 'Save modifiers?', key: 'dialogMod'};
    return modDialog(options, modDialogFlavor, [field], () => save(tokens, damage, options));
  }
  const actorSaveMod = +actor.data.data.st_mod || 0;
  const saveAttr = options.saveAttr == null ? 'wis' : options.saveAttr;
  const saveAttrMod = +actor.data.data[`${saveAttr}_mod`];
  const d20Result = await new Roll("d20").evaluate().total;
  let dialogMod = '';
  try {
    dialogMod = options.dialogMod ? await new Roll(options.dialogMod).evaluate().total : '';
  } catch {
    ui.notifications.error("Invalid input to modifier dialog");
    options.shownModDialog = false;
    return save(tokens, damage, options);
  }
  const saveText = `${d20Result}${saveAttrMod ? `+${saveAttrMod}` : ''}${dialogMod ? `+${dialogMod}` : ''}${actorSaveMod ? `+${actorSaveMod}` : ''}`;
  const savingThrow = new Roll(saveText);
  await savingThrow.evaluate();
  const success = savingThrow.total >= saveTarget;
  const resultText = ` vs. ST ${saveTarget}` + ( success ? ` <span style="${resultStyle('#7CCD7C')}">SUCCESS</span>` : ` <span style="${resultStyle('#EE6363')}">FAIL</span>` );
  const critFail = d20Result === 1 && options.critFailText;
  if(critFail && options.critFailBrokenItem) {
    const itemQty = +options.critFailBrokenItem.data.data.quantity;
    const qtyUpdate = itemQty - 1;
    options.sound = options.critFailSound || options.sound;
    await actor.updateEmbeddedDocuments("Item", [{'_id': options.critFailBrokenItem._id, 'data.quantity': qtyUpdate}]);
  }
  const fail = !critFail && !success && options.failText;
  const takenDamage = success ? Math.floor(damage / 2) : damage;
  let content = `${Util.chatInlineRoll(saveText)}${resultText}`;
  content += `${damage ? ` for ${Util.chatInlineRoll(takenDamage)} damage` : ``}${critFail ? `${options.critFailText}` : ``}${fail ? `${options.failText}` : ``}`;
  const flavor = options.flavor || (damage ? 'Save for Half Damage' : 'Saving Throw');
  Util.macroChatMessage(token, {
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

export async function thiefSkillMacro(skill, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  if(!token) return ui.notifications.error("Select token attempting the thief skill");
  const actor = token.actor;

  options.flavor = skill;
  options.saveAttr = 'dex';
  const lockPickItem = actor.items.find(i => i.type === 'item' && Util.stringMatch(i.name, 'lockpicks'));
  switch (skill.toLowerCase().replace(/\s/g,'')) {
    case 'openlocks':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot open locks without lock picks`);
      options.failText = ` but may try again when their skill increases`;
      options.critFailText = ` and the lock pick breaks!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
      break;
    case 'disarmtraps':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot disarm traps without lock picks`);
      options.failText = ` but may try again when their skill increases`;
      options.critFailText = ` and the trap fires!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
      break;
    case 'pickpockets':
      options.failText = ` but may try again when their skill increases`;
      options.critFailText = ` and is immediately caught!`;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
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

export function backstabMacro(options={}) {
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
  const targets = [...game.user.targets];
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];

  const attackers = [];
  for (const token of selectedTokens) {
    const backstabItem = token.actor.items.find(i => i.type === 'feature' && Util.stringMatch(i.name, 'Backstab'));
    const dmgMulti = +backstabItem.data.data.attributes.dmg_multi?.value;
    if(!dmgMulti) {
      ui.notifications.error(`${token.actor.name} has no damage multiplier set on backstab feature`);
      continue;
    }
    if(!backstabItem) {
      ui.notifications.error(`Backstab feature not found on this character`);
      continue;
    }
    const heldWeapons = token.actor.items.filter(i => i.type === 'item' && i.data.data.held);
    if (!heldWeapons.length) {
      ui.notifications.error(`${token.actor.name} is not holding any weapons`);
      continue;
    }
    if (heldWeapons.length > 1) {
      ui.notifications.error(`${token.actor.name} must be holding only one weapon to backstab`);
      continue;
    }
    const weapon = heldWeapons[0];
    if(!weapon.data.data.attributes.light?.value) {
      ui.notifications.error(`${token.actor.name} cannot backstab with this weapon`);
      continue;
    }
    const flavor = `${weapon.name} (backstab)`;
    attackers.push({
      token: token,
      weapons: [{id: weapon.id, dmgType: 'thrust'}],
      chatMsgData: {content: '', flavor: '', sound: '', bubbleString: ''},
      flavor,
      attacks: [],
      dmgMulti: dmgMulti,
      showAltDialog: false,
      atkMod: 4,
      throwable: false,
      hitText: `<span style="${resultStyle('#FFFF5C')}">BACKSTAB</span>`
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
*  applyEffect: true/false
*  throwable: true/false -- item attribute
*  reach: true/false -- item attribute
*  light: true/false -- item attribute
*  maxRange: (value) -- item attribute
*  atkType: melee/missile/throw/touch  -- item attribute
*  dmgType: cut/thrust/hew/bludgeon/throw/slingstone/arrow/bolt/punch/grapple/hook  -- item attribute
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
  // document all attribute properties -- rationalize with sheet
  // weapon light flag, two-hand flag
  // armor type leather, chain and plate
  // convert to silver standard, items have sp value instead of gp_value -- fix buyMacro and seiing in foundry.js
  // macro for disease, starvation, thirts etc. -- show colour bars on char sheet for fatigued/very fatigued (max hp less than/less than half max max hp), hungry (after 3 days since no food), thirsty (after 1 day with no water), diseased, cold
  // rename hungerClock to fatigueClock, if time advances more than 1 hour while fatigue clock is paused, open party heal dialog to GM
  // e.g. allow players to have their other owned characters e.g. horse, use an item, but that char must own the used item
  // add GM-only tab to characters for fatigue stuff -- show and reset of last eat/drink times, choose or reset disease, reset cold, edit max max HP
  // set default settings in day night cycle based on season in simple calendar
  // in rules doc, set categories for rest quality conditions, buy bedroll to improve quality when sleeping outside -- also poor quality sleep in armor!
  // apply rough resting each day when time changes -- if fatigue clock is OFF, party is in a safe place, so ask what quality of rest
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
  const targets= [...game.user.targets];
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];

  const attackers = [];
  for(const token of selectedTokens) {
    attackers.push({
      token: token,
      weapons: weapons,
      chatMsgData: { content: '', flavor: '', sound: '', bubbleString: '' },
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
  const targetRollData = targetToken?.actor.getRollData();
  const weapons = attacker.weapons;
  const weapon = weapons[0];
  const range = measureRange(token, targetToken);

  // if this attacker's weapons are finished, remove attacker and create attack chat msg
  if (!weapons.length) {
    chatMsgData.flavor = attacker.flavor || chatMsgData.flavor;
    chatMsgData.flavor = chatMsgData.flavor.replace(/,\s*$/, '');
    chatMsgData.flavor += targetToken?.actor.name ? ` vs. ${targetToken.actor.name}` : '';
    Util.macroChatMessage(token, chatMsgData, false);
    const chatBubbleString = attacker.bubbleString || chatMsgData.bubbleString;
    Util.chatBubble(token, chatBubbleString, true);
    for (const attack of attacks) {
      attack.sound && Util.playSound(`${attack.sound}`, token, {push: true, bubble: false});
      const targetHp = +targetToken?.actor.data.data.hp?.value;
      const hpUpdate = targetHp - attack.damage;
      if ( hpUpdate < targetHp ) {
        await targetToken.actor.update({"data.hp.value": hpUpdate});
        if ( hpUpdate < 1 && targetHp > 0 ) {
          Util.playVoiceSound(Constant.VOICE_MOODS.KILL, token.actor, token, {push: true, bubble: true, chance: 0.7});
        }
      }
      // wait if there are more attacks or more attackers left to handle
      if ( attacks.indexOf(attack) < attacks.length - 1 || attackers.length > 1 ) await Util.wait(500);
    }
    attackers.shift();
    return attack(attackers, targetToken, options);
  }

  // get weapon and its properties
  const actorItems = token.actor.data.items;
  let weaponItem = actorItems.get(weapon.id) || actorItems.find(i => i.name.toLowerCase().replace(/\s/g,'') === weapon.id?.toLowerCase().replace(/\s/g,''));
  if (attacker.unarmed) {
    weaponItem = {
      name: 'Fist',
      data:{
        data: {
          attributes: {
            atk_mod: { value: 0},
            dmg: { value: '1d2'},
            dmg_types: { value: 'punch'},
            light: { value: true}
          },
          quantity: 2
        }
      }
    }
  }
  if (!weaponItem) {
    ui.notifications.error("Could not find item on this character");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (weaponItem.data.data.quantity < 1) {
    ui.notifications.error("Item must have a quantity greater than zero to use");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (weaponItem.data.data.attributes.holdable && weaponItem.data.data.held !== true) {
    ui.notifications.error("Item must be held to use");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const weapName = weaponItem.name;
  weapon.name = weapName;
  const weapAttrs = weaponItem.data.data.attributes;
  const weapAtkMod = weapAttrs.atk_mod?.value;
  const weapDmg = weapAttrs.dmg?.value;
  const fragile = weapAttrs.fragile?.value;
  const finesse = weapAttrs.finesse?.value;
  const unwieldy = weapAttrs.unwieldy?.value;
  const critMin = weapAttrs.impale?.value ? 19 : 20;
  const reloadable = weapAttrs.reloadable?.value;
  const throwable = attacker.throwable == null ? weapAttrs.throwable?.value : attacker.throwable;
  const loaded =  weaponItem.data.data.loaded;
  // reload item if needed
  if ( reloadable && !loaded ) {
    await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.loaded': true}]);
    chatMsgData.content += `reloads ${weapName}<br>`;
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (!weapDmg) {
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const meleeRange = weapAttrs.reach?.value ? 10 : 5;
  if ( range > meleeRange && throwable && !weapon.dmgType ) {
    weapon.dmgType = 'throw';
    attacker.showAltDialog = false;
  }
  const offhand = options.offhand == null ? weapon.offhand : options.offhand;
  // throwing offhand weapon is not allowed
  if ( offhand === true && weapon.dmgType === 'throw' ) {
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if ( offhand === true && weapAttrs.light?.value !== true ) {
    ui.notifications.error("Weapon used in the offhand must be light");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const dmgTypes = weapAttrs.dmg_types?.value.split(',').map(t => t.trim()).filter(t => t) || [];
  // show attack choice dialogs
  if ( dmgTypes.length > 1 && options.showAltDialog && attacker.showAltDialog !== false && !weapon.shownAltDialog ) {
    return altDialog(
      weapon, 
      `${weapon.name} Form of Attack`, 
      dmgTypes, 
      () => attack(attackers, targetToken, options)
    );
  }
  if ( weapon.altDialogChoice && weapon.altDialogChoice !== weaponItem.data.data.dmg_type ) {
    await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.dmg_type': weapon.altDialogChoice}]);
  }
  let dmgType = weapon.dmgType || weaponItem.data.data.dmg_type || dmgTypes[0];
  if (!Object.keys(Constant.DMG_TYPES).includes(dmgType)) dmgType = 'attack';
  const atkType = Constant.DMG_TYPES[dmgType].ATK_TYPE || 'melee';
  const targetArmorItem = targetToken?.actor.items.find(i => i.data.data.worn &&
    Util.stringMatch(i.data.data.attributes.slot?.value, 'armor'));
  const targetArmorType = targetArmorItem?.data.data.attributes.type?.value ||
    targetToken?.actor.data.data.attributes.armor_type?.value ||
    'none';
  const vsACMod = Constant.DMG_TYPES[dmgType].VS_AC_MODS[targetArmorType];
  const maxRange = atkType === 'missile' ? (weapAttrs.max_range?.value || 0) : meleeRange;
  if (range > +maxRange) {
    ui.notifications.error("Target is beyond maximum range for this weapon");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (atkType === 'touch') attacker.skipDmgDialog = true;
  if ( options.showModDialog && !options.shownModDialog ) {
    const fields = [
      {label: 'Attack modifiers?', key: 'dialogAtkMod'}
    ];
    if (!attacker.skipDmgDialog) fields.push({label: 'Damage modifiers?', key: 'dialogDmgMod'});
    return modDialog(options, 'Attack', fields, () => attack(attackers, targetToken, options));
  }
  let dialogAtkMod = '', dialogDmgMod = '';
  try {
    dialogAtkMod = options.dialogAtkMod ? await new Roll(options.dialogAtkMod).evaluate().total : '';
    dialogDmgMod = options.dialogDmgMod ? await new Roll(options.dialogDmgMod).evaluate().total : '';
  } catch {
    ui.notifications.error("Invalid input to modifier dialog");
    options.shownModDialog = false;
    return attack(attackers, targetToken, options);
  }

  // get actor and its properties
  const rollData = token.actor.getRollData();
  const bab = rollData.bab || 0;
  const strMod = rollData.str_mod || 0;
  const dexMod = rollData.dex_mod || 0;
  const offhandAtkPenalty = offhand ? -2 : 0;
  const attrAtkMod = (atkType === 'missile' || finesse) ? dexMod : strMod;
  const attrDmgMod = (atkType === 'missile' && dmgType !== 'throw' || offhand) ? 0 : strMod;
  const actorAtkMod = rollData.atk_mod || 0;
  const actorDmgMod = rollData.dmg_mod || 0;
  const attackerAtkMod = attacker.atkMod;

  // get target's properties
  const preventCrit = targetToken?.actor.items.find(i => i.data.data.worn && Util.stringMatch(i.data.data.attributes.slot?.value, 'helmet'));

  // determine range penalty and reduce qty of thrown weapon/missile
  let rangePenalty;
  if (atkType === 'missile') {
    rangePenalty = -Math.abs(Math.floor(range / 10));
    // reduce qty of thrown weapon/missile
    if (dmgType === 'throw') {
      const weaponQty = weaponItem.data.data.quantity;
      await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.quantity': weaponQty - 1}]);
    } else {
      const quiver = token.actor.items.find(i => i.data.data.worn && Util.stringMatch(i.data.data.attributes.slot?.value, 'quiver'));
      const quiverQty = quiver?.data.data.quantity;
      const matchWeap = dmgType === 'bolt' ? quiver?.name?.toLowerCase()?.includes('bolt') :
        dmgType === 'arrow' ? quiver?.name?.toLowerCase()?.includes('arrow') : true;
      if(!quiver || !quiverQty || !matchWeap) {
        ui.notifications.error("Nothing found to shoot from this weapon");
        weapons.shift();
        return attack(attackers, targetToken, options);
      }
      const itemsUpdate = [{'_id': quiver._id, 'data.quantity': quiverQty - 1}];
      // set crossbow to unloaded
      if (reloadable) await itemsUpdate.push({'_id': weaponItem._id, 'data.loaded': false});
      await token.actor.updateEmbeddedDocuments("Item", itemsUpdate);
    }
  }

  // put together chat message content
  const d20Result = await new Roll("d20").evaluate().total;
  const weapDmgResult = await new Roll(weapDmg).evaluate().total;
  let totalAtk = `${d20Result}+${bab}+${attrAtkMod}${offhandAtkPenalty ? `+${offhandAtkPenalty}` : ''}`;
  totalAtk += `${actorAtkMod ? `+${actorAtkMod}` : ''}${weapAtkMod ? `+${weapAtkMod}` : ''}${vsACMod ? `+${vsACMod}` : ''}`;
  totalAtk += `${rangePenalty ? `+${rangePenalty}` : ''}${dialogAtkMod ? `+${dialogAtkMod}` : ''}${attackerAtkMod ? `+${attackerAtkMod}` : ''}`;
  let totalDmg = `${attacker.dmgMulti ? `${weapDmgResult}*${attacker.dmgMulti}` : `${weapDmgResult}`}${attrDmgMod ? `+${attrDmgMod}` : ''}`;
  totalDmg += `${actorDmgMod ? `+${actorDmgMod}` : ''}${dialogDmgMod ? `+${dialogDmgMod}` : ''}`;
  let dmgText = `${totalDmg ? ` for ${Util.chatInlineRoll(totalDmg)}` : ''}`;
  const isCrit = atkType !== 'touch' && d20Result >= critMin && !preventCrit;
  if (isCrit) dmgText += ` + ${Util.chatInlineRoll(`/r ${weapDmg}#${weapName} damage`)}`;
  dmgText += ' damage';
  if (atkType === 'touch') dmgText = '';
  let rangeText = range && rangePenalty ? ` ${range}'` : '';
  let hitSound = Constant.DMG_TYPES[dmgType].HIT_SOUND, missSound = Constant.DMG_TYPES[dmgType].MISS_SOUND;
  let resultText = '';
  let resultSound = missSound;
  let isHit = true;
  let targetAc = targetRollData?.ac;
  let touchAc = targetRollData?.touch_ac || Constant.AC_MIN;
  if (!isNaN(targetAc)) {
    // handle situational AC mods
    // check for friendly adjacent tokens wearing a Large Shield, i.e. shield wall
    const adjFriendlyTokens = canvas.tokens.objects.children.filter(t => t.data.disposition === 1 &&
      t.actor.id !== targetToken.actor.id &&
      t.actor.id !== token.actor.id &&
      measureRange(targetToken, t) < 10);
    const adjLargeShieldMods = adjFriendlyTokens.map(t => 
      t.actor.items.filter(i => i.data.data.worn &&
        Util.stringMatch(i.data.data.attributes.slot?.value, 'shield') &&
        Util.stringMatch(i.data.data.attributes.size?.value, 'large')
      ).map(i => +i.data.data.attributes.ac_mod?.value || 0)
    ).flat();
    const shieldWallMod = Math.max(...adjLargeShieldMods, 0);
    targetAc += shieldWallMod;
    touchAc += shieldWallMod;
    if (atkType === 'missile') {
      // disregard bucklers
      const bucklersHeld = targetToken.actor.items.filter(i => i.data.data.held &&
        Util.stringMatch(i.data.data.attributes.size?.value, 'small'));
      bucklersHeld.forEach(i =>{
        const mod = +i.data.data.attributes.ac_mod?.value || 0;
        targetAc -= mod;
        touchAc -= mod;
      });
      // +1 for each large shield worn
      const largeShieldsWorn = targetToken.actor.items.filter(i => i.data.data.worn &&
        Util.stringMatch(i.data.data.attributes.slot?.value, 'shield') &&
        Util.stringMatch(i.data.data.attributes.size?.value, 'large'));
      largeShieldsWorn.forEach((i) => {
        targetAc += 1;
        touchAc += 1;
      });
    }
    if (unwieldy) {
      // disregard shield mods if weapon is unwieldy, e.g. flail
      const wornOrHeldShields = targetToken.actor.items.filter(i => i.data.data.worn === true &&
        Util.stringMatch(i.data.data.attributes.slot?.value, 'shield') ||
        i.data.data.held === true && i.data.data.attributes.ac_mod?.value);
      const shieldAcMods = wornOrHeldShields.reduce((a, b) => a + (+b.data.data.attributes.ac_mod?.value || 0), shieldWallMod);
      targetAc -= shieldAcMods;
      touchAc -= shieldAcMods;
    }
    const totalAtkRoll = new Roll(totalAtk);
    await totalAtkRoll.evaluate();
    if (atkType === 'touch') targetAc = touchAc;
    isHit = totalAtkRoll.total >= targetAc;
    if (isHit) {
      resultText = ` vs. AC ${targetAc} ${attacker.hitText ? attacker.hitText : `<span style="${resultStyle('#7CCD7C')}">HIT</span>`}`;
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
    await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.quantity': weaponQty - 1}]);
  }
  chatMsgData.content += `${Util.chatInlineRoll(totalAtk)}${resultText}<br>`;
  chatMsgData.flavor += `${weapName} (${dmgType}${rangeText}), `;
  chatMsgData.bubbleString += `${getAttackChatBubble(token.actor.name, targetToken?.actor.name, weapName, dmgType)}<br>`;

  // add sound and damage
  let thisAttackDamage;
  if ( isHit && targetToken && options.applyEffect === true && game.user.isGM ) {
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

function getAttackChatBubble(attackerName, targetName, weapName, dmgType) {
  switch (dmgType) {
    case "arrow":
      return `${attackerName} shoots an arrow${targetName ? ` at ${targetName}` : ''} from ${weapName}`;
    case "attack":
      return `${attackerName} attacks${targetName ? ` ${targetName}` : ''}`;
    case "bludgeon":
      return `${attackerName} bludgeons${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "bolt":
      return `${attackerName} shoots a bolt${targetName ? ` at ${targetName}` : ''} from ${weapName}`;
    case "hew":
      return `${attackerName} hews${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "grapple":
      return `${attackerName} grapples${targetName ? ` ${targetName}` : ''} `;
    case "hook":
      return `${attackerName} hooks${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "punch":
      return `${attackerName} punches${targetName ? ` ${targetName}` : ''}`;
    case "cut":
      return `${attackerName} cuts${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "thrust":
      return `${attackerName} thrusts ${weapName}${targetName ? ` at ${targetName}` : ''} `;
    case "slingstone":
      return `${attackerName} slings a stone${targetName ? ` at ${targetName}` : ''} from ${weapName}`;
    case "throw":
      return `${attackerName} throws ${weapName}${targetName ? ` at ${targetName}` : ''} `;
  }
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

// function dmgTypeDialog(weapon, dmgTypes, callback) {
//   return new Dialog({
//     title: `${weapon.name} Form of Attack`,
//     content: ``,
//     buttons: dmgTypeButtons(),
//     default: dmgTypes[0]
//   }).render(true);

//   function dmgTypeButtons() {
//     return Object.fromEntries(dmgTypes.map(dmgType => [dmgType, {
//       label: dmgType,
//       callback: () => {
//         weapon.shownAltDialog = true;
//         weapon.dmgDialogType = dmgType;
//         callback();
//       }
//     }]));
//   }
// }

function altDialog(options, title, buttons, callback) {
  return new Dialog({
    title,
    content: ``,
    buttons: getButtons(),
    default: buttons[0]
  }).render(true);

  function getButtons() {
    return Object.fromEntries(buttons.map(button => [button, {
      label: Util.upperCaseFirst(button),
      callback: () => {
        options.shownAltDialog= true;
        options.altDialogChoice = button;
        callback();
      }
    }]));
  }
}

function modDialog(options, title, fields=[{label:'', default:'', key:''}], callback) {
  let formFields = ``;
  fields.forEach(field => {
    formFields += `<div class="form-group">
                    <label>${field.label}</label>
                    <input type="text" id="${field.key}" value="${field.default}" placeholder="e.g. -4, 2d6 etc.">
                  </div>`;
  });
  const content = `<form>${formFields}</form>`;
  new Dialog({
    title,
    content,
    buttons: {
      '1': {
        icon: '<i class="fas fa-check"></i>',
        label: `Submit`,
        callback: html => {
          options.shownModDialog = true;
          fields.forEach(field => {
            options[field.key] = html.find(`[id=${field.key}]`).val();
          });
          callback();
        }
      },
      '2': {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => console.log("Cancelled modifier dialog")
      }
    },
    default: '1'
  }).render(true);
}

export function reactionRollMacro(options) {
  if (!game.user.isGM) return;
  if (canvas.tokens.controlled.length !== 1) return ui.notifications.error("Select a single token");
  const reactingActor = canvas.tokens.controlled[0].actor;
  const targets = [...game.user.targets];
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetActor = targets[ranTargetIndex]?.actor;
  if (!targetActor) return ui.notifications.error("Select a target");
  options.override = true;

  return reactionRoll(reactingActor, targetActor, options);
}

export async function reactionRoll(reactingActor, targetActor, options) {
  if ( !reactingActor || !targetActor ) return;
  const targetLevel = targetActor.data.data.attributes.lvl?.value || 1;
  const attitudeMap = reactingActor.data.data.attitude_map;
  const attitudeObj = attitudeMap[targetActor.id];
  let attitude = attitudeObj?.attitude;
  const flavor = options.flavor || 'Reaction Roll'

  if ( options.override === true || !attitude || targetLevel > attitudeObj.lvl ) {
    if ( options.showModDialog && !options.shownModDialog ) {
      const fields = [
        {label: `${flavor} modifiers?`, key: 'dialogMod'}
      ];
      return modDialog(options, flavor, fields, () => reactionRoll(reactingActor, targetActor, options));
    }
    options.shownModDialog = false;
    const chaMod = +targetActor.data.data.cha_mod;
    const targetRxnMod = +targetActor.data.data.attributes.rxn_mod?.value;
    const base2d6Result = await new Roll("2d6").evaluate().total;
    let dialogMod = '';
    try {
      dialogMod = options.dialogMod ? await new Roll(options.dialogMod).evaluate().total : '';
    } catch {
      ui.notifications.error("Invalid input to modifier dialog");
      return reactionRoll(reactingActor, targetActor, options);
    }
    const rxnText = `${base2d6Result}${chaMod ? `+${chaMod}` : ''}${dialogMod ? `+${dialogMod}` : ''}${targetRxnMod ? `+${targetRxnMod}` : ''}`;
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
    await reactingActor.update({data: attitudeMapUpdate});
    console.log(`Reaction Roll: ${reactingActor.name} is ${attitude} towards ${targetActor.name}`);

    if (options.showChatMsg === false) return attitude;

    const attitudeColours = {
      [Constant.ATTITUDES.HOSTILE]: "#EE6363",
      [Constant.ATTITUDES.DISMISSIVE]: "#ee8663",
      [Constant.ATTITUDES.UNCERTAIN]: "#DDD",
      [Constant.ATTITUDES.ACCEPTING]: "#a6ce7e",
      [Constant.ATTITUDES.HELPFUL]: "#7CCD7C",
    }
    const attitudeText = `<span style="${resultStyle(attitudeColours[attitude])}">${attitude.toUpperCase()}</span>`;
    const chatData = {
      content: `${Util.chatInlineRoll(rxnText)} ${attitudeText}`,
      flavor: `Reaction Roll vs. ${targetActor.name}`
    }
    const token = canvas.tokens.objects.children.find(t => t.actor.id === reactingActor.id);
    Util.macroChatMessage(reactingActor, chatData, false);
    canvas.hud.bubbles.say(token, `${reactingActor.name} considers ${targetActor.name}...`, {emote: true});
  }

  return attitude;
}

export async function buyMacro(item, priceInCp, merchant, qty, options={}) {
  if (!priceInCp) return;
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = game.user.character || token?.actor;
  const sameActor = actor?.isToken ? merchant.isToken && actor.token.id === merchant.token.id :
    actor?.id === merchant.id;
  if ( !actor || sameActor ) return ui.notifications.error("Select buying token");
  const merchantGold = +merchant.data.data.attributes.gold?.value;
  if (!merchantGold) return ui.notifications.error("Merchant gold attribute not set");
  const merchantQty = +item.data.data.quantity;
  if (!merchantQty) return ui.notifications.error("No stock available");
  if (merchantQty > 1 && !options.shownSplitDialog) {
    return itemSplitDialog(merchantQty, item, priceInCp, merchant, options);
  }
  if (!qty) qty = merchantQty;

  // pay for item
  // note: 1 gp = 10 sp = 50 cp
  const actorItems = actor.data.items;
  const gpItem = actorItems.find(i => Util.stringMatch(i.name, 'Gold Pieces'));
  const gp = +gpItem?.data.data.quantity || 0;
  const gpInCp = gp * 50;
  const spItem = actorItems.find(i => Util.stringMatch(i.name, 'Silver Pieces'));
  const sp = +spItem?.data.data.quantity || 0;
  const spInCp = sp * 5;
  const cpItem = actorItems.find(i => Util.stringMatch(i.name, 'Copper Pieces'));
  const cp = +cpItem?.data.data.quantity || 0;
  const totalMoneyInCp = gpInCp + spInCp + cp;
  const totalPriceInCp = priceInCp * qty;
  const totalPriceString = Util.getPriceString(totalPriceInCp);

  // pay for item from actor
  let cpUpdateQty = cp, spUpdateQty = sp, gpUpdateQty = gp;
  // case 1: not enough money
  if (totalPriceInCp > totalMoneyInCp) {
    const chatData = {
      content: `${actor.name} tries to buy ${qty} ${item.name}${qty > 1 ? 's' : ''} for ${totalPriceString}, but doesn't have enough money`,
      flavor: `Buy`
    };
    return Util.macroChatMessage(actor, chatData, true);
  }
  // case 2: can pay with cp
  if (cp >= totalPriceInCp) {
    cpUpdateQty = cp - totalPriceInCp;
  // case 3: can pay with cp and sp
  } else if (cp + spInCp >= totalPriceInCp) {
    const cpAndSpInCp = cp + spInCp;
    let changeInCp = cpAndSpInCp - totalPriceInCp;
    spUpdateQty = Math.floor(changeInCp / 5);
    cpUpdateQty = changeInCp - spUpdateQty * 5;
  // case 4: payment requires gp
  } else {
    let changeInCp = totalMoneyInCp - totalPriceInCp;
    gpUpdateQty = Math.floor(changeInCp / 50);
    changeInCp -= gpUpdateQty * 50;
    spUpdateQty = Math.floor(changeInCp / 5);
    cpUpdateQty = changeInCp - spUpdateQty * 5;
  }
  const cpUpdate = {_id: cpItem?._id, "data.quantity": cpUpdateQty},
        spUpdate = {_id: spItem?._id, "data.quantity": spUpdateQty},
        gpUpdate = {_id: gpItem?._id, "data.quantity": gpUpdateQty};
  // add to updates if item has id and update quantity is different than existing quantity
  const updates = [cpUpdate, spUpdate, gpUpdate].filter( u => u._id &&
    u["data.quantity.quantity"] !== actorItems.get(u._id)?.data.data.quantity);
  
  // show confirmation dialog if haven't shown split item dialog
  if (!options.shownSplitDialog) {
    return Dialog.confirm({
      title: "Confirm",
      content: `<p>Buy ${qty} ${item.name}${qty > 1 ? 's' : ''} for ${Util.getPriceString(totalPriceInCp)}?</p>`,
      yes: async () => {
        return finalizePurchase();
      },
      no: () => {},
      defaultYes: true
    });
  }
  return finalizePurchase();

  async function finalizePurchase() {
    await actor.updateEmbeddedDocuments("Item", updates);
    await merchant.updateEmbeddedDocuments("Item", [{'_id': item._id, 'data.quantity': merchantQty - qty}]);
    await merchant.update({"data.attributes.gold.value": merchantGold + Math.floor(totalPriceInCp / 50)});

    // add item to actor
    const itemData = {
      data: foundry.utils.deepClone(item.data.data),
      img: item.data.img,
      name: item.data.name,
      type: item.data.type,
    };
    itemData.data.quantity = qty;
    const targetItem = actor.items.find(i => {
      return i.data.type === itemData.type &&
      i.data.name === itemData.name &&
      i.data.data.macro === itemData.data.macro &&
      foundry.utils.fastDeepEqual(i.data.data.attributes, itemData.data.attributes);
    });
    if (targetItem) {
      const currentTargetQty = +targetItem.data.data.quantity;
      await actor.updateEmbeddedDocuments("Item", [{ "_id": targetItem._id, "data.quantity": currentTargetQty + qty }]);
    } else {
      await actor.createEmbeddedDocuments("Item", [itemData]);
    }

    // create chat message
    const chatData = {
      content: `${actor.name} buys ${qty} ${item.name}${qty > 1 ? 's' : ''} from ${merchant.name} for ${totalPriceString}`,
      sound: 'coins',
      flavor: 'Buy'
    }
    return Util.macroChatMessage(actor, chatData, true);
  }
}

function itemSplitDialog(maxQty, itemData, priceInCps, merchant, options) {
  new Dialog({
    title: `Buy ${itemData.name}`,
    content: 
      `<form>
        <div class="form-group">
          <label style="max-width:fit-content;max-width:-moz-fit-content;margin-right:0.5em">How many?</label>
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
        label: `Buy`,
        callback: html => {
          const quantity = +html.find('[id=qty]').val();
          options.shownSplitDialog = true;
          buyMacro(itemData, priceInCps, merchant, quantity, options);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    default: "one",
    render: html => {
      const qtyRange = html.find('[id=qty]'),
            qtySpan = html.find('[id=selectedQty]'),
            priceSpan = html.find('[id=price]');
      qtySpan.html(+qtyRange.val());
      priceSpan.html(Util.getPriceString(+qtyRange.val() * priceInCps));
      qtyRange.on("input", () => {
        qtySpan.html(+qtyRange.val());
        priceSpan.html(Util.getPriceString(+qtyRange.val() * priceInCps));
      });
    }
  }).render(true);
}

// async function applyDiseaseDamage(execTime) {

// }

// async function applyColdDamage(execTime) {

// }

export async function applyPartyFatigue(execTime, seconds, newTime, oldTime) {
  const pCs = Util.pCTokens().map(t => t.actor);

  return Promise.all(pCs.map(async (pc) => {
    await applyRest(pc, execTime, seconds, newTime, oldTime);
    // await applyHungerDamage(pc, execTime, seconds);
    // await applyThirstDamage(pc, execTime, seconds);
  }));
}

export async function applyRest(pc, execTime, newTime, oldTime) {
  const restMode = game.settings.get("lostlands", "restMode");
  const flavor = 'Rest';
  const warningSound = 'sleepy';
  const warningText = 'feels sleepy...';
  const applyAsHeal = true;
  const lastWakeTime = pc.getFlag("lostlands", "wake_start_time");
  let dice = restMode ? game.settings.get("lostlands", "restDice") : 'd2';
  let damageText = '';
  let doHeal = execTime - Util.secondsInDay() >= lastWakeTime &&
               newTime - oldTime >= SimpleCalendar.api.timestampPlusInterval(0, {hour: 6});
  let doWarning = execTime - Util.secondsInHour() * 12 >= lastWakeTime;

  if (restMode) {
    // if Rest Mode is active, reset hunger and thirst start times each rest
    await Util.resetHunger(pc, execTime);
    await Util.resetThirst(pc, execTime);
  } else {
    // if Rest Mode is inactive, must be sleeping and not hungry/thirsty to rest
    const isSleeping = !!pc.getFlag("lostlands", "sleeping");
    const isHungry = !!pc.getFlag("lostlands", "hungry");
    const isThirsty = !!pc.getFlag("lostlands", "thirsty");
    doHeal = doHeal && isSleeping && !isHungry && !isThirsty;
    if (isSleeping && !doHeal) {
      damageText = 'slept poorly...';
    }
    const hasBedroll = !!pc.items.find(i => i.type === 'item' && Util.stringMatch(i.name, "Bedroll"));
    if (!hasBedroll) dice = '1';
  }

  doHeal && await Util.resetSleep(pc, execTime);
  // doWarning && apply active effect for sleepy

  return applyFatigue(pc, {
    dice,
    flavor,
    damageText,
    warningSound,
    warningText,
    doWarning,
    doDamage: doHeal,
    applyAsHeal
  });
}

export async function applyHungerDamage(pc, execTime, seconds) {
  const dice = 'd2';
  const flavor = 'Hunger';
  const warningSound = 'stomach_rumble';
  const warningText = 'feels hungry...';
  const lastEatTime = pc.getFlag("lostlands", "hunger_start_time");
  const doWarning = execTime - Util.secondsInDay() >= lastEatTime;
  const doDamage = execTime - Util.secondsInDay() * 2 >= lastEatTime &&
                   (execTime - lastEatTime) % (Util.secondsInDay() * 2) < seconds;

  doWarning && await pc.setFlag("lostlands", "hungry", true);

  return applyFatigue(pc, execTime, {
    dice,
    flavor,
    warningSound,
    warningText,
    doWarning,
    doDamage
  });
}

export async function applyThirstDamage(pc, execTime, seconds) {
  const dice = 'd6';
  const flavor = 'Thirst';
  const warningSound = '';
  const warningText = 'feels thirsty...';
  const lastDrinkTime = pc.getFlag("lostlands", "thirst_start_time");
  const doWarning = execTime - Util.secondsInHour() * 12 >= lastDrinkTime;
  const doDamage = execTime - Util.secondsInDay() * 2 >= lastDrinkTime &&
                   (execTime - lastDrinkTime) % Util.secondsInDay() < seconds;

  doWarning && await pc.setFlag("lostlands", "thirsty", true);

  return applyFatigue(pc, execTime, {
    dice,
    flavor,
    damageText,
    warningSound,
    warningText,
    doWarning,
    doDamage
  });
}

async function applyFatigue(actor, 
  { 
    dice = 'd6', 
    flavor = 'Fatigue', 
    damageText = '',
    warningSound = '', 
    warningText = '',
    doWarning = true,
    doDamage = true,
    applyAsHeal = false
  } = {}
) {
  const hp = actor.data.data.hp?.value,
        maxHp = actor.data.data.hp?.max,
        maxMaxHp = actor.data.data.hp?.max_max;
  if ( hp < 0 || maxHp < 1 ) return;
  const token = Util.getTokenFromActor(actor);
  let result;

  if (doDamage) {

    result = await Util.rollDice(dice);
    const hpResult = applyAsHeal ? hp + result : hp - result;
    const hpUpdate = Math.min(maxHp, hpResult);
    const maxHpResult = maxHp - result + 1;
    const hpMaxUpdate = Math.min(Math.max(1, maxHpResult), maxMaxHp);
    const updates = {"data.hp.value": hpUpdate, "data.hp.max": hpMaxUpdate};

    damageText = damageText || 
                 `${Util.chatInlineRoll(result)} ${applyAsHeal ? 'points of healing' : 'damage'} from ${flavor.toLowerCase()}!`;
    Util.macroChatMessage(token, {
      content: damageText,
      flavor
    }, false);

    return actor.update(updates);
  }
  
  const isSleeping = !!actor.getFlag("lostlands", "sleeping");
  if (doWarning && !isSleeping) {

    if (Object.values(Constant.VOICE_MOODS).includes(warningSound)) {
      Util.playVoiceSound(warningSound, actor, token, {push: true, bubble: true, chance: 1});
    } else {
      Util.playSound(`${warningSound}`, token, {push: true, bubble: true});
    }

    if (!warningText) return;
    return Util.macroChatMessage(token, {
      content: `${actor.name} ${warningText}`,
      flavor
    }, false);
  }
}
