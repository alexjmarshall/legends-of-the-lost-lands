import * as Constant from "./constants.js";
import { TimeQ } from "./time-queue.js";
import * as Util from "./utils.js";
import * as Fatigue from "./fatigue.js";

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

export async function playVoice(mood) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const token = char.token;
  const voice = actor.data.data.voice;
  if (!voice) return ui.notifications.error(`${actor.name} does not have a selected voice`);

  try {
    return await Util.playVoiceSound(mood, actor, token);
  } catch (error) {
    return ui.notifications.error(error);
  }
}

export async function togglePartyRest(options={}) {
  const selectedTokens = canvas.tokens.controlled;
  if (!selectedTokens.length) return ui.notifications.error("Select resting token(s)");
  const condition = "Rest";

  return Promise.all(
    selectedTokens.map(async (token) => {

      try {
        const actor = token.actor;
        const isResting = game.cub.hasCondition(condition, actor, {warn: false});
        isResting ? await Util.removeCondition(condition, actor) :
                    await Util.addCondition(condition, actor);
      } catch (error) {
        return ui.notifications.error(error);
      }
    })
  );
}

export function selectRestDice(actor, options={}) {
  if (!game.user.isGM) return ui.notifications.error(`You shouldn't be here...`);

  const choice = options.altDialogChoice;

  if (choice) {
    return actor.setFlag("lostlands", "restDice", choice);
  }
  
  const choices = Object.entries(Fatigue.REST_TYPES).map(type => {
    return {label: `${type[0]}<br>${type[1] ? type[1] : 'd2/d3'}`, value: type[0]};
  });
  
  return altDialog(options, `${actor.name} Rest Dice`, choices, () => selectRestDice(actor, options));
}

export async function castSpell(spellId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const spell = Util.getItemFromActor(spellId, actor, 'spell');
  const spellSound = spell.data.data.attributes.sound?.value || null; // TODO need generic spell sound here

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

  try {
    // await play sound based on spell school first
    await useItem(spellId, {
      sound: spellSound,
      verb: `casts`
    });
    await actor.update(updateData);
  } catch (error) {
    return ui.notifications.error(error);
  }
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
  const holdable = item.data.data.attributes.holdable?.value;

  if ( holdable && item.data.data.held !== true) {
    throw new Error(`${item.name} must be held to use`);
  }

  try {
    consumable && await Util.reduceItemQty(item, actor);
    Util.macroChatMessage(token, actor, {content, flavor, sound, type}, false);
    Util.chatBubble(token, chatBubbleText);
  } catch (error) {
    throw new Error(error);
  }
}

export async function cureDisease() {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  
  try {
    return await Fatigue.deleteAllDiseases(actor);
  } catch (error) {
    return ui.notifications.error(error);
  }
}

export async function drinkPotion(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const item = Util.getItemFromActor(itemId, actor);
  const healFormula = item.data.data.attributes.heal?.value;
  let chatMsgContent, chatMsgType, hpUpdate;

  try {

    await useItem(itemId, {
      sound: 'drink_potion',
      verb: `quaffs`,
      chatMsgContent,
      chatMsgType
    }, true);
  
    if (healFormula) {
      const healPoints = await Util.rollDice(healFormula);
      chatMsgContent = `${Util.chatInlineRoll(healPoints)} point${healPoints > 1 ? 's' : ''} of healing`;
      chatMsgType = CONST.CHAT_MESSAGE_TYPES.EMOTE;
      if (options.applyEffect) {
        const currentHp = +actor.data.data.hp?.value;
        const maxHp = +actor.data.data.hp?.max;
        // can only drink a potion if conscious
        if (currentHp > 0) {
          hpUpdate = Math.min(maxHp, currentHp + healPoints);
          await actor.update({'data.hp.value': hpUpdate});
        } 
      }
    }
  
    await Fatigue.resetFatigueType(actor, 'thirst');
  } catch (error) {
    return ui.notifications.error(error);
  }
}

export async function readScroll(itemId, options={}) {
  // TODO make saving throw here if scroll level is higher than max level able to cast
  // also return error if character is not able to cast scrolls
  try {
    await useItem(itemId, {
      sound: 'read_scroll',
      verb: `reads`
    }, true);
  } catch (error) {
    return ui.notifications.error(error);
  }
}

export async function drinkWater(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;

  try {
    await useItem(itemId, {
      sound: 'drink_water',
      verb: `drinks from`
    }, false);
    await Fatigue.resetFatigueType(actor, 'thirst');
  } catch (error) {
    return ui.notifications.error(error);
  }
}

export async function eatFood(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;

  try {

    await useItem(itemId, {
      sound: 'eat_food',
      verb: `eats`
    }, true);

    await Fatigue.resetFatigueType(actor, 'hunger');

    // reset thirst to 12 hours ago if this is later than last drink time
    const twelveHoursAgo = Util.now() - Constant.SECONDS_IN_HOUR * 12;
    const thirstData = actor.getFlag("lostlands", 'thirst');
    const lastDrinkTime = thirstData.startTime;
    if (twelveHoursAgo > lastDrinkTime) {
      await Fatigue.resetFatigueType(actor, 'thirst', twelveHoursAgo);
    }

  } catch (error) {
    return ui.notifications.error(error);
  }
}

export async function useChargedItem(itemId, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const item = Util.getItemFromActor(itemId, actor);
  const charges = +item.data.data.attributes.charges?.value;
  const sound = item.data.data.attributes.sound?.value || null; // TODO generic use charges sound
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

  try {

    await useItem(itemId, {
      sound,
      flavor: `${item.name} (expend ${numChargesUsed} charge${numChargesUsed > 1 ? 's' : ''})`,
      verb: `expends ${numChargesUsed} charge${numChargesUsed > 1 ? 's' : ''} from`
    }, false);

    chargesLeft < charges && await actor.updateEmbeddedDocuments("Item", [itemUpdate]);

  } catch (error) {
    return ui.notifications.error(error);
  }
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
      const wearingShield = token.actor.data.items.some(i => i.type === 'item' &&
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

  const weapon = actor.data.items.get(itemId) ?? actor.data.items.find(i => Util.stringMatch(i.name, itemId));
  if (!weapon) return ui.notifications.error("Could not find weapon on this character");

  const canQuickDraw = weapon.data.data.attributes.quick_draw?.value;
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
  if (!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
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
  const actorSaveMod = +actor.data.data.sv_mod || 0;
  const saveAttr = options.saveAttr || 'wis';
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
  const resultText = ` vs. SV ${saveTarget}` + ( success ? ` <span style="${resultStyle('#7CCD7C')}">SUCCESS</span>` : ` <span style="${resultStyle('#EE6363')}">FAIL</span>` );
  const critFail = d20Result === 1 && options.critFailText;
  if(critFail && options.critFailBrokenItem) {
    const itemQty = +options.critFailBrokenItem.data.data.quantity;
    const qtyUpdate = itemQty - 1;
    options.sound = options.critFailSound || options.sound;
    try {
      await actor.updateEmbeddedDocuments("Item", [{'_id': options.critFailBrokenItem._id, 'data.quantity': qtyUpdate}]);
    } catch {
      ui.notifications.error(`Error updating quantity of ${options.critFailBrokenItem.name}`);
    }
  }
  const takenDamage = success ? Math.floor(damage / 2) : damage;
  let content = `${Util.chatInlineRoll(saveText)}${resultText}`;
  content += `${damage ? ` for ${Util.chatInlineRoll(takenDamage)} damage` : ``}${critFail ? `${options.critFailText}` : ``}`;
  const flavor = options.flavor || (damage ? 'Save for Half Damage' : 'Saving Throw');
  const chatBubbleText = options.bubbleText;
  Util.macroChatMessage(token, actor, {
    content: content, 
    flavor: flavor,
    sound: options.sound
  }, false);
  Util.chatBubble(token, chatBubbleText);
  const currentHp = +actor.data.data.hp?.value;
  if ( !isNaN(currentHp) && takenDamage && ( game.user.isGM || token.actor.isOwner ) ) await token.actor.update({"data.hp.value": currentHp - takenDamage})
  
  // wait if not last actor
  if (tokens.length > 1) await Util.wait(500);
  
  tokens.shift();
  return save(tokens, damage, options);
}

export async function learnSpellMacro(options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;

  options.saveAttr = 'int';
  options.bubbleText = `${actor.name} attempts to learn a spell...`;

  return saveMacro(0, options);
}

export async function thiefSkillMacro(skill, options={}) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const token = char.token;

  options.flavor = skill;
  options.saveAttr = 'dex';
  const lockPickItem = actor.items.find(i => i.type === 'item' && Util.stringMatch(i.name, 'lockpicks'));
  switch (skill.toLowerCase().replace(/\s/g,'')) {
    case 'openlocks':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot open locks without lock picks`);
      // options.bubbleText = `${actor.name} attempts to pick a lock...`;
      options.critFailText = ` and their lock pick breaks!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
      break;
    case 'disarmtraps':
      if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot disarm traps without lock picks`);
      // options.bubbleText = `${actor.name} attempts to disarm a trap...`;
      options.critFailText = ` and the trap fires!`;
      options.critFailSound = 'break_lock_pick';
      options.critFailBrokenItem = lockPickItem;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
      break;
    case 'pickpockets':
      // options.bubbleText = `${actor.name} attempts to pick a pocket...`;
      options.critFailText = ` and is immediately caught!`;
      await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
      break;
    case 'movesilently':
      options.critFailText = ` and is immediately caught!`;
      break;
    // case 'hideinshadows':
    //   options.critFailText = ` and is immediately caught!`;
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
* options: // TODO this list should have only option attributes used, make similar documentation for other macros that use options arg
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
// TODO dry up combat code and extract to separate file
export async function attackMacro(weapons, options={}) {
  if (!Array.isArray(weapons)) weapons = [weapons];
  weapons = weapons.map(a => Object.create({id: a}));
  const selectedTokens = canvas.tokens.controlled;
  if (!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
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
    Util.macroChatMessage(token, token.actor, chatMsgData, false);
    const chatBubbleString = attacker.bubbleString || chatMsgData.bubbleString;
    Util.chatBubble(token, chatBubbleString);

    for (const attack of attacks) {
      attack.sound && Util.playSound(`${attack.sound}`, token, {push: true, bubble: false});
      const targetHp = +targetToken?.actor.data.data.hp?.value;
      const hpUpdate = targetHp - attack.damage;
      const update = {"data.hp.value": hpUpdate};
      if (attack.energyDrainDamage) {
        const maxMaxHp = +targetToken?.actor.data.data.hp?.max_max;
        const maxHp = +targetToken?.actor.data.data.hp?.max;
        const dmg = Math.min(attack.energyDrainDamage, maxHp, maxMaxHp);
        Object.assign(update, {"data.hp.max_max": maxMaxHp - dmg, "data.hp.max": maxHp - dmg});
        const storedDamage = targetToken.actor.getFlag("lostlands", "energyDrainDamage") || 0;
        await targetToken.actor.setFlag("lostlands", "energyDrainDamage", storedDamage + dmg);
      }
      if ( hpUpdate < targetHp ) {
        await targetToken.actor.update(update);
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
  const throwable = attacker.throwable ?? weapAttrs.throwable?.value;
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
  const offhand = options.offhand ?? weapon.offhand;
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
  const dmgTypes = [...new Set(weapAttrs.dmg_types?.value.split(',').map(t => t.trim()).filter(t => t))] || [];
  // show attack choice dialogs
  if ( options.showAltDialog && attacker.showAltDialog !== false && !weapon.shownAltDialog ) {
    const choices = dmgTypes.map(type => {
      return {label: Util.upperCaseFirst(type), value: type}
    });
    return altDialog(
      weapon, 
      `${weapon.name} Form of Attack`, 
      choices, 
      () => attack(attackers, targetToken, options)
    );
  }
  if ( weapon.altDialogChoice && weapon.altDialogChoice !== weaponItem.data.data.dmg_type ) {
    try {
      await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.dmg_type': weapon.altDialogChoice}]);
    } catch {
      ui.notifications.error(`error updating stored damage type for ${weaponItem.name}`);
    }
  }
  let dmgType = weapon.dmgType || weaponItem.data.data.dmg_type || dmgTypes[0];
  if (!Object.keys(Constant.DMG_TYPES).includes(dmgType)) {
    dmgType = 'attack';
  }
  const atkType = Constant.DMG_TYPES[dmgType].ATK_TYPE || 'melee';
  const targetArmorItem = targetToken?.actor.items.find(i => i.data.data.worn &&
                          Util.stringMatch(i.data.data.attributes.slot?.value, 'armor'));
  const targetArmorType = targetArmorItem?.data.data.attributes.type?.value ||
                          targetToken?.actor.data.data.attributes.armor_type?.value || 'none';
  const vsACMod = Constant.DMG_TYPES[dmgType].VS_AC_MODS[targetArmorType];
  const maxRange = atkType === 'missile' ? (weapAttrs.max_range?.value || 0) : meleeRange;
  if (range > +maxRange) {
    ui.notifications.error("Target is beyond maximum range for this weapon");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (atkType === 'touch') {
    attacker.skipDmgDialog = true;
  }
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
      try {
        await Util.reduceItemQty(weaponItem, token.actor);
      } catch (error) {
        ui.notifications.error(error);
        weapons.shift();
        return attack(attackers, targetToken, options);
      }
    } else {
      const quiver = token.actor.items.find(i => i.data.data.worn && Util.stringMatch(i.data.data.attributes.slot?.value, 'quiver'));
      const quiverQty = quiver?.data.data.quantity;
      const matchWeap = dmgType === 'bolt' ? quiver?.name?.toLowerCase()?.includes('bolt') :
        dmgType === 'arrow' ? quiver?.name?.toLowerCase()?.includes('arrow') : true;

      try {
        if( !quiver || !quiverQty || !matchWeap ) {
          throw new Error("Nothing found to shoot from this weapon");
        }
        const itemsUpdate = [{'_id': quiver._id, 'data.quantity': quiverQty - 1}];
        // set crossbow to unloaded
        if (reloadable) await itemsUpdate.push({'_id': weaponItem._id, 'data.loaded': false});
        await token.actor.updateEmbeddedDocuments("Item", itemsUpdate);
      } catch (error) {
        ui.notifications.error(error);
        weapons.shift();
        return attack(attackers, targetToken, options);
      }
    }
  }

  // put together chat message content
  const d20Result = await Util.rollDice("d20");
  const weapDmgResult = await Util.rollDice(weapDmg);
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
      const wornOrHeldShields = targetToken.actor.items.filter(i => i.data.data.worn &&
        Util.stringMatch(i.data.data.attributes.slot?.value, 'shield') ||
        i.data.data.held && i.data.data.attributes.ac_mod?.value);
      const shieldAcMods = wornOrHeldShields.reduce((a, b) => a + (+b.data.data.attributes.ac_mod?.value || 0), shieldWallMod);
      targetAc -= shieldAcMods;
      touchAc -= shieldAcMods;
    }
    const totalAtkResult = await Util.rollDice(totalAtk);
    if (atkType === 'touch') targetAc = touchAc;
    isHit = totalAtkResult >= targetAc;
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
    try {
      await Util.reduceItemQty(weaponItem, token.actor);
    } catch (error) {
      ui.notifications.error(error);
      weapons.shift();
      return attack(attackers, targetToken, options);
    }
  }
  chatMsgData.content += `${Util.chatInlineRoll(totalAtk)}${resultText}<br>`;
  chatMsgData.flavor += `${weapName} (${dmgType}${rangeText}), `;
  chatMsgData.bubbleString += `${token.actor.name} ${getAttackChatBubble(targetToken?.actor.name, weapName, dmgType)}<br>`;

  // add sound and damage
  let thisAttackDamage = await Util.rollDice(totalDmg);
  let damage;

  if ( isHit && targetToken && options.applyEffect === true && game.user.isGM ) {
    damage = thisAttackDamage;
  }
  attacks.push({
    sound: resultSound,
    damage,
    energyDrainDamage: dmgType === 'energy drain' ? thisAttackDamage : null
  });

  let dmg = 0;
  for (const attack of attacks) {
    dmg += attack.damage;
  }

  const targetHp = +targetToken?.actor.data.data.hp?.value;
  if (dmg >= targetHp) {
    weapons = [];
  } else {
    weapons.shift();
  }

  return attack(attackers, targetToken, options);
}

function getAttackChatBubble(targetName, weapName, dmgType) {
  switch (dmgType) {
    case "arrow":
      return `shoots an arrow${targetName ? ` at ${targetName}` : ''} from ${weapName}`;
    case "attack":
      return `attacks${targetName ? ` ${targetName}` : ''}`;
    case "bludgeon":
      return `bludgeons${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "bolt":
      return `shoots a bolt${targetName ? ` at ${targetName}` : ''} from ${weapName}`;
    case "hew":
      return `hews${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "grapple":
      return `grapples${targetName ? ` ${targetName}` : ''}`;
    case "hook":
      return `hooks${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "punch":
      return `punches${targetName ? ` ${targetName}` : ''}`;
    case "cut":
      return `cuts${targetName ? ` ${targetName}` : ''} with ${weapName}`;
    case "thrust":
      return `thrusts ${weapName}${targetName ? ` at ${targetName}` : ''}`;
    case "slingstone":
      return `slings a stone${targetName ? ` at ${targetName}` : ''} from ${weapName}`;
    case "throw":
      return `throws ${weapName}${targetName ? ` at ${targetName}` : ''}`;
    case "energy drain":
      return `drains life energy${targetName ? ` from ${targetName}` : ''}`;
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

function altDialog(options, title, buttons, callback) {
  return new Dialog({
    title,
    content: ``,
    buttons: getButtons(),
  }).render(true);

  function getButtons() {
    return Object.fromEntries(buttons.map(button => [button.label, {
      label: button.label,
      callback: () => {
        options.shownAltDialog= true;
        options.altDialogChoice = button.value;
        return callback();
      }
    }]));
  }
}

function modDialog(options, title, fields=[{label:'', key:''}], callback) {
  let formFields = ``;
  fields.forEach(field => {
    formFields += `<div class="form-group">
                    <label>${field.label}</label>
                    <input type="text" id="${field.key}" placeholder="e.g. -4, 2d6 etc.">
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
  }).render(true);
}

export async function reactionRollMacro(options) {
  if (!game.user.isGM) return;
  if (canvas.tokens.controlled.length !== 1) return ui.notifications.error("Select a single token");
  const reactingActor = canvas.tokens.controlled[0].actor;
  const targets = [...game.user.targets];
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetActor = targets[ranTargetIndex]?.actor;
  if (!targetActor) return ui.notifications.error("Select a target");
  options.override = true;

  try {
    return await reactionRoll(reactingActor, targetActor, options);
  } catch (error) {
    return ui.notifications.error(error);
  }
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

    if (rxnRollResult <= 2) attitude = Constant.ATTITUDES.HOSTILE;
    else if (rxnRollResult <= 5) attitude = Constant.ATTITUDES.DISMISSIVE;
    else if (rxnRollResult <= 8) attitude = Constant.ATTITUDES.UNCERTAIN;
    else if (rxnRollResult <= 11) attitude = Constant.ATTITUDES.ACCEPTING;
    else attitude = Constant.ATTITUDES.HELPFUL;
    const attitudeMapUpdate = {
      attitude_map: {
        [targetActor.id]: {attitude: attitude, lvl: targetLevel}
      }
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
    Util.macroChatMessage(token, reactingActor, chatData, false);
    Util.chatBubble(token, `${reactingActor.name} reacts to ${targetActor.name}`, {emote: true});
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
    return Util.macroChatMessage(null, actor, chatData, true);
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
    return new Dialog({
      title: "Confirm Purchase",
      content: `<p>Buy ${qty} ${item.name}${qty > 1 ? 's' : ''} for ${Util.getPriceString(totalPriceInCp)}?</p>`,
      buttons: {
       one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Yes",
        callback: () => finalizePurchase(),
       },
       two: {
        icon: '<i class="fas fa-times"></i>',
        label: "No",
        callback: () => {},
       }
      },
     }).render(true);
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
    return Util.macroChatMessage(null, actor, chatData, true);
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

export async function applyFatigue(actorId, type, execTime, newTime, heal=false) {
  const actor = game.actors.get(actorId);
  let dmgMulti, typeString = type;

  const isResting = game.cub.hasCondition('Rest', actor, {warn: false});
  if (isResting) return;
  
  if ( type === 'exhaustion') {
    const isAsleep = game.cub.hasCondition('Asleep', actor, {warn: false});
    if (isAsleep) return;
  }

  if (type == 'exposure') {
    const isWarm = game.cub.hasCondition('Warm', actor, {warn: false});
    if (isWarm) return;
    const diffClo = Fatigue.diffClo(actor);
    dmgMulti = Math.floor(Math.abs(diffClo));
    if (dmgMulti === 0) return;
    typeString = diffClo < 0 ? 'cold' : 'heat';
  }
  
  const clock = Fatigue.CLOCKS[type];
  const { damageDice, damageInterval } = clock;
  const intervalInSeconds = Util.intervalInSeconds(damageInterval);
  const extraDice = Math.max(0, Math.floor((newTime - execTime) / intervalInSeconds));
  const numDice = 1 + extraDice;
  const dice = `${numDice}${damageDice}${dmgMulti ? `*${dmgMulti}` : ''}`;

  const result = await applyFatigueDamage(actor, typeString, dice, heal);
  const data = actor.getFlag("lostlands", type);
  data.maxHpDamage = data.maxHpDamage + result || result;

  await actor.setFlag("lostlands", type, data);
}

async function applyFatigueDamage(actor, type, dice, heal=false, flavor) {
  const hp = Number(actor.data.data.hp.value);
  const maxHp = Number(actor.data.data.hp.max);
  if (hp < 0) return 0;

  let result = await Util.rollDice(dice);
  let appliedResult = result;
  let update;
  
  if (heal) {
    appliedResult = Math.min(result, maxHp - hp);
    const hpUpdate = hp + appliedResult;
    update = {"data.hp.value": hpUpdate};
  } else {
    appliedResult = Math.min(result, maxHp);
    const maxHpUpdate = maxHp - appliedResult;
    const hpUpdate = hp - result;
    update = {"data.hp.max": maxHpUpdate, "data.hp.value": hpUpdate};
  }

  const content = `${Util.chatInlineRoll(result)} point${result > 1 ? 's' : ''} of ${heal ? `healing` : 'damage'} from ${type}.`;
  flavor = flavor || Util.upperCaseFirst(type);
  const token = Util.getTokenFromActor(actor);

  await Util.macroChatMessage(token, actor, { content, flavor }, false);
  await actor.update(update);

  return appliedResult;
}

async function applyRest(actor, wakeTime, sleptTime, restType='Rough') {

  // subtract first 6 hours of slept time before calculating extra healing dice
  sleptTime = sleptTime - Constant.SECONDS_IN_HOUR * 6;
  const extraDice = Math.max(0, Math.floor(sleptTime / Constant.SECONDS_IN_DAY));
  const numDice = 1 + extraDice;
  const hasBedroll = actor.items.some(i => i.type === 'item' && Util.stringMatch(i.name, "Bedroll"));
  const restDice = restType === 'Rough' ? hasBedroll ? 'd3' : 'd2' : Fatigue.REST_TYPES[restType];
  const dice = `${numDice}${restDice}`;
  const flavor = `Rest (${restType})`;

  const wearingArmor = actor.items.some(i => i.data.data.worn && Util.stringMatch(i.data.data.attributes.slot?.value, 'armor'));
  if (wearingArmor) {
    const token = Util.getTokenFromActor(actor);
    return Util.macroChatMessage(token, actor, {
      content: `${actor.name} slept poorly...`,
      flavor
    }, false);
  }

  await actor.setFlag("lostlands", "last_rest_time", wakeTime);
  await applyFatigueDamage(actor, `rest`, dice, true, flavor);
}

export async function applyRestOnWake(actor, sleepStartTime, sleepEndTime, restDice) {
  const lastRestTime = actor.getFlag("lostlands", "last_rest_time");
  const sleptTime = sleepEndTime - sleepStartTime;
  const sleptTimeHours = Math.floor(sleptTime / Constant.SECONDS_IN_HOUR);
  const lastRestedHoursAgo = Math.floor((sleepEndTime - lastRestTime) / Constant.SECONDS_IN_HOUR);

  if (sleptTimeHours >= 3) {
    await Fatigue.resetFatigueType(actor, 'exhaustion', sleepEndTime);
  }

  if ( sleptTimeHours >= 6 && lastRestedHoursAgo >= 22 ) {
    await applyRest(actor, sleepEndTime, sleptTime, restDice);
  }
}

export async function addDisease(disease=null, options={}) {
  if (!game.user.isGM) return ui.notifications.error(`You shouldn't be here...`);

  const char = Util.selectedCharacter();
  const actor = char.actor;
  const diseases = Fatigue.DISEASES;
  disease = disease || options.altDialogChoice;

  if ( !disease && !options.shownAltDialog ) {
    const choices = Object.keys(diseases).map(type => {
      return {label: Util.upperCaseFirst(type), value: type};
    });
    return altDialog(options, `Add Disease to ${actor.name}`, choices, () => addDisease(null, options));
  }

  const charDiseases = actor.getFlag("lostlands", "disease") || {};
  if (charDiseases.hasOwnProperty(disease)) return;

  const startTime = Util.now();
  const interval = Fatigue.DISEASES[disease].damageInterval;
  const actorId = actor.id;
  const scope = {actorId, disease};
  const command = Fatigue.DISEASE_DAMAGE_COMMAND;
  const macro = await Util.getMacroByCommand(`${command}`, `return game.lostlands.Macro.${command};`);
  const intervalId = await TimeQ.doEvery(interval, startTime, macro.id, scope);

  charDiseases[disease] = {
    startTime,
    intervalId,
    confirmed: false
  };

  await actor.setFlag("lostlands", "disease", charDiseases);

  return ui.notifications.info(`Added ${Util.upperCaseFirst(disease)} to ${actor.name}`);
}

export async function applyDisease(actorId, disease, execTime, newTime) {
  const actor = game.actors.get(actorId);
  const token = Util.getTokenFromActor(actor);
  const type = 'disease';
  const flavor = Util.upperCaseFirst(type);
  const interval = Fatigue.DISEASES[disease].damageInterval;
  const intervalInSeconds = Util.intervalInSeconds(interval);
  const extraDice = Math.max(0, Math.floor((newTime - execTime) / intervalInSeconds));
  const numDice = 1 + extraDice;
  const die = Fatigue.DISEASES[disease].virulence;
  const dice = new Array(numDice).fill(die);
  let damage = 0;
  let resolved = false;
  const actorDiseases = actor.getFlag("lostlands", "disease");
  if (!actorDiseases) return false;
  const confirmed = !!actorDiseases[disease].confirmed;
  const startTime = actorDiseases[disease].startTime;

  // if within incubation period, return
  const incubationPeriod = Fatigue.DISEASES[disease].incubationPeriod;
  const incubationInSeconds = Util.intervalInSeconds(incubationPeriod);
  const isIncubating = newTime < startTime + incubationInSeconds;
  if (isIncubating) return true;

  const resolveDisease = async () => {
    await Fatigue.deleteDisease(actor, disease);
    confirmed && await Util.macroChatMessage(token, actor, {
      content: `${actor.name}'s ${disease} has resolved.`,
      type: CONST.CHAT_MESSAGE_TYPES.IC,
      flavor
    }, false);
    // return false to prevent reschedule
    return false;
  };

  const confirmDisease = async () => {
    const actorDiseases = actor.getFlag("lostlands", "disease");
    if (!actorDiseases) return false;
    actorDiseases[disease].confirmed = true;
    await actor.setFlag("lostlands", "disease", actorDiseases);
    await Util.macroChatMessage(token, actor, { content: `${actor.name} feels unwell...`, flavor }, false);
    await Util.addCondition("Diseased", actor);
    return applyDisease(actorId, disease, execTime, newTime);
  };

  if (!confirmed) {
    return new Dialog({
      title: "Confirm Disease",
      content: `<p>${actor.name} must Save or contract ${Util.upperCaseFirst(disease)}. Success?</p>`,
      buttons: {
       one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Yes",
        callback: () => Fatigue.deleteDisease(actor, disease)
       },
       two: {
        icon: '<i class="fas fa-times"></i>',
        label: "No",
        callback: () => confirmDisease()
       }
      },
    }).render(true);
  }
  
  // determine damage and whether disease resolves (if 1 is rolled)
  for (const die of dice) {
    const result = await Util.rollDice(die);
    damage += result;
    if (result === 1) {
      resolved = true;
      break;
    }
  }

  const result = await applyFatigueDamage(actor, type, `${damage}`);
  actorDiseases[disease].maxHpDamage = actorDiseases[disease].maxHpDamage + result || result;
  await actor.setFlag("lostlands", "disease", actorDiseases);

  if (resolved) return resolveDisease();

  return true;
}
