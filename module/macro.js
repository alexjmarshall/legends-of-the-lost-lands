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
  const spellSound = spell.data.data.attributes.sound?.value || null; // TODO need generic spell sound here -- use sounds for school

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

async function useItem(itemId, data={ sound, flavor, verb, chatMsgContent, chatMsgType }, consumable=false) {
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const token = char.token;
  const item = Util.getItemFromActor(itemId, actor);
  const sound = data.sound || item.data.data.attributes.sound?.value;
  const flavor = data.flavor || item.name;
  const desc = item.data.data.description
  const chatBubbleText = `${actor.name} ${data.verb || 'uses'} ${item.name}.`;
  const content = data.chatMsgContent || desc || chatBubbleText;
  const type = data.chatMsgType || CONST.CHAT_MESSAGE_TYPES.EMOTE;
  const holdable = item.data.data.attributes.holdable?.value;

  if ( holdable && !item.data.data.held_left && !item.data.data.held_right ) {
    throw new Error(`${item.name} must be held to use`);
  }

  try {
    consumable && await Util.reduceItemQty(item, actor);
    Util.macroChatMessage(token || actor, {content, flavor, sound, type}, false);
    Util.chatBubble(token, chatBubbleText);
  } catch (error) {
    throw error;
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
      chatMsgContent = `${actor.name} takes ${Util.chatInlineRoll(healPoints)} point${healPoints > 1 ? 's' : ''} of healing`;
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
    const thirstData = actor.getFlag("lostlands", 'thirst') || {};
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
    const field = {label: 'Charges used', key: 'numChargesUsed'};
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

export async function heldWeaponAttackMacro(options={}) {
  const selectedTokens = canvas.tokens.controlled;
  if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
  const targets = [...game.user.targets];
  const ranTarget = targets.length > 1;
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = options.targetToken || targets[ranTargetIndex];

  const attackers = [];
  for(const token of selectedTokens) {
    const actor = token.actor;

    let weapons = actor.items.filter(i => i.type === 'item' &&
      (!!i.data.data.attributes.atk_modes?.value || !!i.data.data.attributes.bow?.value) &&
      i.data.data.attributes.size &&
      (i.data.data.held_left || i.data.data.held_right)
    );
    if ( weapons.length && weapons.some(w => !Object.keys(Constant.SIZE_VALUES).includes(w.data.data.attributes.size.value.toUpperCase())) ) {
      return ui.notifications.error("Invalid weapon size specified");
    }

    (async () => {
      const sweepWeap = weapons.find(i => i.data.data.attributes.sweep?.value); // TODO select sweep with maneuver
      if (!sweepWeap) return;
      const weapSize = Constant.SIZE_VALUES[sweepWeap.data.data.attributes.size?.value];
      const sweeping = ranTarget && targets.length <= weapSize && selectedTokens.length === 1 && !options.skipSweep;
      if (sweeping) {
        options.skipSweep = true;
        options.atkMode = 'swi(s)';
        for (const [i,t] of targets.entries()) {
          options.targetToken = t;
          options.atkMod = 0 - (i + 1) || 0;
          heldWeaponAttackMacro(options);
          await Util.wait(500);
        }
        return;
      }
    })();

    // if no weapons, return error if hands full, otherwise add dummy weapon object
    const numHeld = actor.items.filter(i => i.type === 'item' && (i.data.data.held_left || i.data.data.held_right)).length;
    const unarmed = !weapons.length;
    if (unarmed) {
      if (numHeld) return ui.notifications.error("Not holding any weapons");
      weapons.push({_id:'1', name: 'Fist'});
    }

    // sort weapons by size ascending
    weapons.sort((a,b) => Util.sizeComparator(a,b));
    
    // if wearing a shield and holding multiple weapons, can only use biggest one
    if (weapons.length > 1) {
      const wearingShield = token.actor.data.items.some(i => i.type === 'item' &&
                            i.data.data.worn && !!i.data.data.attributes.shield_shape?.value);
      if (wearingShield) weapons = [weapons[weapons.length - 1]];
    }

    // extract item ids and flag first weapon as offhand
    const weapIds = weapons.map((w, i) => {
      return Object.create({
        _id: w._id,
        offhand: i === 0 && weapons.length > 1,
        mainhand: i > 0,
        atkMode: options.atkMode,
        hitSound: options.hitSound,
        missSound: options.missSound,
      })
    });
    
    attackers.push({
      token: token,
      weapons: weapIds,
      ranTarget,
      chatMsgData: {content: '', flavor: '', sound: options.sound, bubbleString: ''},
      attacks: [],
      unarmed,
      atkMod: options.atkMod,
    })
  }

  return attack(attackers, targetToken, options);
}

export function quickSlashAttackMacro(itemId, options={}) {
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = token ? token.actor : game.user.character;
  if (!actor) return ui.notifications.error("Select character using the weapon");

  const weapon = actor.data.items.get(itemId) ?? actor.data.items.find(i => Util.stringMatch(i.name, itemId));
  if (!weapon) return ui.notifications.error("Could not find weapon on this character");

  const targets = [...game.user.targets];
  const ranTarget = targets.length > 1;
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];

  const attackers = [];
  const flavor = `${weapon.name} (quick slash)`;
  attackers.push({
    token: token,
    weapons: [{_id: itemId, atkMode: 'swi(s)'}],
    chatMsgData: {content: '', flavor: '', sound: '', bubbleString: ''},
    flavor,
    ranTarget,
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
  const ranTarget = targets.length > 1;
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];
  options.twoWeaponFighting = false;

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
    const attacks = attackNames.map(a => Object.create({_id: a}));
    attackers.push({
      token: token,
      weapons: attacks,
      ranTarget,
      chatMsgData: {content: '', flavor: '', sound: options.sound, bubbleString: ''},
      attacks: []
    })
  }
  return attack(attackers, targetToken, options);
}

export async function saveMacro(damage=0, options={}) {
  const tokens = canvas.tokens.controlled || [];
  if(!tokens.length) {
    const token = Util.getTokenFromActor(game.user.character);
    if (!token) return ui.notifications.error("Select token(s) to make a saving throw");
    tokens.push(token);
  } 
  
  return save(tokens, damage, options);
}

async function save(tokens, damage, options={}) {
  if(!tokens.length) return;
  const token = tokens[0];
  const actor = token.actor;
  const saveTarget = +token.actor.data.data.st;
  if(!saveTarget) {
    ui.notifications.error(`${actor.name} has no save target number set`);
    tokens.shift();
    return save(tokens, damage, options);
  }
  const modDialogFlavor = options.flavor || 'Saving Throw';
  if (options.showModDialog && !options.shownModDialog) {
    const field = {label: 'Save modifiers', key: 'dialogMod'};
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
  let content = `${actor.name} saves ${Util.chatInlineRoll(saveText)}${resultText}`;
  content += `${damage ? ` for ${Util.chatInlineRoll(takenDamage)} damage` : ``}${critFail ? `${options.critFailText}` : ``}.`;
  const flavor = options.flavor || (damage ? 'Save for Half Damage' : 'Saving Throw');
  const chatBubbleText = options.bubbleText;
  Util.macroChatMessage(token, {
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

// export async function thiefSkillMacro(skill, options={}) {
//   const char = Util.selectedCharacter();
//   const actor = char.actor;
//   const token = char.token;

//   options.flavor = skill;
//   options.saveAttr = 'dex';
//   const lockPickItem = actor.items.find(i => i.type === 'item' && Util.stringMatch(i.name, 'lockpicks'));
//   switch (skill.toLowerCase().replace(/\s/g,'')) {
//     case 'openlocks':
//       if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot open locks without lock picks`);
//       // options.bubbleText = `${actor.name} attempts to pick a lock...`;
//       options.critFailText = ` and their lock pick breaks!`;
//       options.critFailSound = 'break_lock_pick';
//       options.critFailBrokenItem = lockPickItem;
//       await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
//       break;
//     case 'disarmtraps':
//       if(!lockPickItem || +lockPickItem.data.data.quantity < 1) return ui.notifications.error(`Cannot disarm traps without lock picks`);
//       // options.bubbleText = `${actor.name} attempts to disarm a trap...`;
//       options.critFailText = ` and the trap fires!`;
//       options.critFailSound = 'break_lock_pick';
//       options.critFailBrokenItem = lockPickItem;
//       await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
//       break;
//     case 'pickpockets':
//       // options.bubbleText = `${actor.name} attempts to pick a pocket...`;
//       options.critFailText = ` and is immediately caught!`;
//       await Util.playVoiceSound(Constant.VOICE_MOODS.OK, actor, token, {push: true, bubble: true, chance: 0.7});
//       break;
//     case 'movesilently':
//       options.critFailText = ` and is immediately caught!`;
//       break;
//     // case 'hideinshadows':
//     //   options.critFailText = ` and is immediately caught!`;
//   }

//   return saveMacro(0, options);
// }

// export function backstabMacro(options={}) {
//   const selectedTokens = canvas.tokens.controlled;
//   if(!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
//   const targets = [...game.user.targets];
//   if (targets.length > 1) return ui.notifications.error("Select one target");
//   const targetToken = targets[0];

//   const attackers = [];
//   for (const token of selectedTokens) {
//     const backstabItem = token.actor.items.find(i => i.type === 'feature' && Util.stringMatch(i.name, 'Backstab'));
//     const dmgMulti = +backstabItem.data.data.attributes.dmg_multi?.value;
//     if(!dmgMulti) {
//       ui.notifications.error(`${token.actor.name} has no damage multiplier set on backstab feature`);
//       continue;
//     }
//     if(!backstabItem) {
//       ui.notifications.error(`Backstab feature not found on this character`);
//       continue;
//     }
//     const heldWeapons = token.actor.items.filter(i => i.type === 'item' && (i.data.data.held_left || i.data.data.held_right));
//     if (!heldWeapons.length) {
//       ui.notifications.error(`${token.actor.name} is not holding any weapons`);
//       continue;
//     }
//     if (heldWeapons.length > 1) {
//       ui.notifications.error(`${token.actor.name} must be holding only one weapon to backstab`);
//       continue;
//     }
//     const weapon = heldWeapons[0];
//     if(!weapon.data.data.attributes.light?.value) {
//       ui.notifications.error(`${token.actor.name} cannot backstab with ${weapon.name}`);
//       continue;
//     }
//     const flavor = `${weapon.name} (backstab)`;
//     attackers.push({
//       token: token,
//       weapons: [{_id: weapon._id, dmgType: 'thrust'}], 
//       chatMsgData: {content: '', flavor: '', sound: '', bubbleString: ''},
//       flavor,
//       attacks: [],
//       dmgMulti: dmgMulti,
//       showAltDialog: false,
//       atkMod: 4,
//       throwable: false,
//       hitText: `<span style="${resultStyle('#FFFF5C')}">BACKSTAB</span>`
//     })
//   }

//   return attack(attackers, targetToken, options);
// }

/*
* options:
* {
*  flavor: chat message header -- actor
*  twoWeaponFighting: true/false -- flagged false by monster attackRoutineMacro
*  showModDialog: true/false
*  skipThrowDialog: true/false
*  dialogAtkMod: (value)
*  dialogDmgMod: (value)
*  applyEffect: true/false (press ctrl)
* }
*/
export async function attackMacro(weapons, options={}) {
  if (!Array.isArray(weapons)) weapons = [weapons];
  weapons = weapons.map(a => Object.create({_id: a}));
  const selectedTokens = canvas.tokens.controlled;
  if (!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
  const targets= [...game.user.targets];
  const ranTarget = targets.length > 1;
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const targetToken = targets[ranTargetIndex];

  const attackers = [];
  for(const token of selectedTokens) {
    attackers.push({
      token: token,
      weapons: weapons,
      ranTarget,
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
  const attackingActor = token.actor;
  const attackerRollData = attackingActor.getRollData();
  if (!attackerRollData) {
    ui.notifications.error("Invalid attacker data");
    attackers.shift();
    return attack(attackers, targetToken, options);
  }
  const targetActor = targetToken?.actor;
  const targetRollData = targetActor?.getRollData();
  const removedLocs = targetActor?.data.data.removedLocs;
  const weapons = attacker.weapons;
  const weapon = weapons[0];
  const range = measureRange(token, targetToken);
  const attackerSize = Constant.SIZE_VALUES[attackerRollData.size];
  if (attackerSize == null) {
    ui.notifications.error("Attacker size not set");
    attackers.shift();
    return attack(attackers, targetToken, options);
  }
  const targetSize = Constant.SIZE_VALUES[targetRollData?.size];

  // if this attacker's weapons are finished, remove attacker and create attack chat msg
  if (!weapons.length) {
    chatMsgData.flavor = attacker.flavor || chatMsgData.flavor;
    // remove comma at end of flavor and add names
    chatMsgData.flavor = chatMsgData.flavor.replace(/,\s*$/, '') + `${targetActor ? ` vs. ${targetActor.name}` : ''}`;
    // add follow up attack to content
    const followAttackText = ` and ${attackingActor.name} is fast enough to attack again!`
    if (attacker.followAttack && !attacker.kill) chatMsgData.content = chatMsgData.content.replace(/!<br>\s*$|\.<br>\s*$/, '') + followAttackText; //TODO remove br
    Util.macroChatMessage(token, chatMsgData, false);
    const chatBubbleString = attacker.bubbleString || chatMsgData.bubbleString;
    Util.chatBubble(token, chatBubbleString);    

    for (const attack of attacks) {
      if (targetRollData && options.applyEffect === true && game.user.isGM) {
        const targetHp = +targetActor?.data.data.hp?.value;
        const targetMaxNegHP = targetActor?.type === "humanoid" || targetActor?.type === "character" ?
          (0 - (targetActor?.data.data.attributes.ability_scores?.con?.value ?? 10)) : 0;
        const dmg = attack.damage;
        let hpUpdate = attack.instantKill ? Math.min(targetMaxNegHP, targetHp - dmg) : targetHp - dmg;
        let update = {"data.hp.value": hpUpdate};

        const energyDrainDmg = attack.energyDrainDamage;
        if (energyDrainDmg) {
          const maxHp = +targetToken?.actor.data.data.hp?.max;
          const dmg = Math.min(energyDrainDmg, maxHp);
          Object.assign(update, {"data.hp.max": maxHp - dmg});
        }
        
        if (hpUpdate < targetHp) await targetActor.update(update);
      }
      
      attack.sound && Util.playSound(`${attack.sound}`, token, {push: true, bubble: false});
      // wait if there are more attacks or more attackers left to handle
      if ( attacks.indexOf(attack) < attacks.length - 1 || attackers.length > 1 ) await Util.wait(500);
    }

    if (attacker.kill) Util.playVoiceSound(Constant.VOICE_MOODS.KILL, attackingActor, token, {push: true, bubble: true, chance: 0.7});

    const totalEnergyDrainDmg = +attacker.totalEnergyDrainDmg;
    if (totalEnergyDrainDmg) {
      const storedDamage = targetToken.actor.getFlag("lostlands", "energyDrainDamage") || 0;
      await targetToken.actor.setFlag("lostlands", "energyDrainDamage", storedDamage + dmg);
    }

    attackers.shift();
    return attack(attackers, targetToken, options);
  }

  // get weapon and its properties
  const actorItems = token.actor.data.items;
  let weaponItem;
  if (attacker.unarmed) {
    weaponItem = Constant.WEAPONS.fist;
  } else {
    weaponItem = actorItems.get(weapon._id) || actorItems.find(i => Util.stringMatch(i.name, weapon._id));
  }

  // checks for valid weapon data
  if (!weaponItem) {
    ui.notifications.error("Could not find item on this character");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (weaponItem.data.data.quantity < 1) {
    ui.notifications.error("Item must have a quantity greater than 0 to use");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const weaponHeld = !!weaponItem.data.data.held_left || !!weaponItem.data.data.held_right;
  if (weaponItem.data.data.attributes.holdable && !weaponHeld) {
    ui.notifications.error("Item must be held to use");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const weapName = weaponItem.name;
  weapon.name = weapName;
  const weapAttrs = weaponItem.data.data.attributes;
  let weapSpeed = +weapAttrs.speed?.value || 10 - attackerSize * 2;
  const weapBleed = +weapAttrs.bleed?.value || 0;
  let weapImp = +weapAttrs.impact?.value || 0;
  let weapPen = +weapAttrs.pen?.value || 0;
  const weapSize = Constant.SIZE_VALUES[weapAttrs.size?.value];
  if (weapSize == null) {
    ui.notifications.error("Invalid weapon size specified");
    weapons.shift();
    return attack(attackers, targetToken, options); 
  }
  const weapCategory = weapAttrs.weap_category?.value || '';
  const isCurvedSword = Util.stringMatch(weapCategory,"curved swords");
  const weapDmgVsLrg = weapAttrs.dmg_vs_large?.value || 0;
  let weapDmg = weapAttrs.dmg?.value;
  const weaponHeldTwoHands = !!weaponItem.data.data.held_left && !!weaponItem.data.data.held_right;
  let weapAtkMod = +weapAttrs.atk_mod?.value || 0;
  let sitAtkMod = 0;
  let sitDmgMod = 0;
  let aimPenalty = 0;
  let aimArea;
  let aimText = '';

  if (!weapDmg) {
    ui.notifications.error("Invalid weapon damage specified");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }

  // handle double weapon
  const isDoubleWeapon = !!weapAttrs.double_weapon?.value;
  if (isDoubleWeapon) {
    const dmgs = weapDmg.toLowerCase().replace(/\s/g,'').split('/') || [];
    if (dmgs.length !== 2) {
      ui.notifications.error("Invalid double weapon damage specified");
      weapons.shift();
      return attack(attackers, targetToken, options);
    }
    if (weapon.dwSideTwo) {
      weapDmg = dmgs[1];
      options.twoWeaponFighting = false;
    } else {
      weapDmg = dmgs[0];
      if (weaponHeldTwoHands) weapons.push(Object.assign(weapon, {dwSideTwo: true}));
    }
  }

  // atk modes TODO weight base adds to weight calculation, use for containers quivers etc. allows user to choose between different ammo quivers worn
  const isBow = !!weapAttrs.bow?.value;
  const quiver = attackingActor.items.find(i => i.data.data.worn && i.data.data.attributes.quiver?.value);
  const ammoName = Constant.AMMO_TYPES.find(t => quiver?.name.toLowerCase().includes(t));
  const atkModes = isBow ? quiver.data.data.attributes.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || []
    : weapAttrs.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || [];
 
  if (atkModes.length && atkModes.some(a => !Object.keys(Constant.ATK_MODES).includes(a))) {
    ui.notifications.error("Invalid attack mode(s) specified");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const defaultThrowAtkMode = atkModes.find(a => a.includes('thrw'));
  let throwable = attacker.throwable ?? !!(weapAttrs.range?.value && defaultThrowAtkMode);

  // attacker reach
  const reachValues = [...new Set(weapAttrs.reach?.value.split(',').map(n => Number(n)).filter(t => !isNaN(t)))];
  const defaultReach = Math.floor(attackerSize / 2) * Constant.SQUARE_SIZE || -1; // TODO decide on square size - 1 yard?
  let maxReach = reachValues.length ? Math.max(...reachValues) * Constant.SQUARE_SIZE : defaultReach;
  // subtract 1 from max reach if not holding the weapon with both hands
  if (!weaponHeldTwoHands && reachValues.length > 1) {
    maxReach -= 1;
  }

  // weapon tags
  const bonusToGroups = !!weapAttrs.bonus_to_groups?.value;
  const flexWeapon = !!weapAttrs.flex_weapon?.value;
  const fragile = !!weapAttrs.fragile?.value;
  const unwieldy = !!weapAttrs.unwieldy?.value;
  const reload = !!weapAttrs.reload?.value;
  const energyDrain = !!weapAttrs.energy_drain?.value;
  const atkHeight = weaponItem.data.data.atk_height;
  const atkStyle = weaponItem.data.data.atk_style;
  const atkTime = weaponItem.data.data.atk_init;
  
  // reload item if needed
  const loaded =  !!weaponItem.data.data.loaded;
  if ( reload && !loaded ) {
    await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.loaded': true}]);
    chatMsgData.content += `${attackingActor.name} reloads ${weapName}<br>`;
    weapons.shift();
    return attack(attackers, targetToken, options);
  }

  // automatic throw if target beyond max reach in feet
  if ( range > maxReach && throwable && weapon.atkMode == null ) {
    weapon.atkMode = defaultThrowAtkMode;
    attacker.showAltDialog = false;
  }
  
  const mainhand = weapon.mainhand && options.twoWeaponFighting !== false;
  const offhand = weapon.offhand && options.twoWeaponFighting !== false;
  
  // can't use offhand weapon when wearing a shield
  const wearingShield = actorItems.some(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield_shape?.value);
  if ( offhand === true && wearingShield ) {
    weapons.shift();
    return attack(attackers, targetToken, options);
  }

  // TODO replace atkMode dialog with dialog for options.coverageArea -- for choices use Constants minus removedLocs
  // add parry choice if weapon has parry bonus defined
  // parryBonus && atkModes.push('parry');

  let atkMode = weapon.atkMode || weaponItem.data.data.atk_mode || atkModes[0];

  if (Util.stringMatch(atkMode, 'parry')) {
    weapons.shift(); // TODO show msg if parrying with every held weapon
    if (!weapons.length) {
      ui.notifications.notify(`Parrying with ${weaponItem.name}`);
    }
    return attack(attackers, targetToken, options);
  }

  let atkType = Constant.ATK_MODES[atkMode]?.ATK_TYPE || 'melee';
  let dmgType = Constant.DMG_TYPES.includes(weapAttrs.dmg_type?.value) ? weapAttrs.dmg_type?.value : Constant.ATK_MODES[atkMode]?.DMG_TYPE || 'blunt';
  let atkForm = Constant.ATK_MODES[atkMode]?.ATK_FORM || 'attack';

  let hitLocTableName;

  if (targetActor) {
    const validAreas = [];
    for (const [k,v] of Object.entries(Constant.AIM_AREAS)) {
      const nonRemovedLocs = v.filter(l => !removedLocs?.includes(l));
      if (nonRemovedLocs.length) validAreas.push(k);
    }
    
    hitLocTableName = (Util.stringMatch(atkForm, 'swing') || Util.stringMatch(atkForm, 'attack')) ? 'SWING' : 'THRUST';
    if (atkHeight === 'high' || atkHeight === 'low') {
      hitLocTableName += `_${atkHeight.toUpperCase()}`;
    }

    const getPenalty = chance => 0 - Math.min(8, Math.round(Math.log(100 / chance) / Math.log(1.8)));

    const aimAreaPenalties = Object.fromEntries(validAreas.map( a => {
      const tableName = hitLocTableName + `_${a.toUpperCase()}`;
      return [a, getPenalty(Constant.HIT_LOC_ARRS[tableName].length)];
    }));

    if ( options.showAltDialog && attacker.showAltDialog !== false && !options.shownAltDialog ) {
      const title = `${weapon.name} Attack Options`;
      const stanceDesc = `${Util.upperCaseFirst(atkStyle)} ${atkHeight} ${atkForm}`;
      const callback = () => attack(attackers, targetToken, options);
      return attackOptionsDialog(attackingActor, options, stanceDesc, title, aimAreaPenalties, callback);
    }

    aimArea = options.altDialogChoice;
    const formatAimArea = area => area.replace('_',' ');
    aimText = aimArea ? ` aims at ${targetActor?.name ? `${targetActor.name}'s` : `the`} ${formatAimArea(aimArea)} and` : '';
    aimPenalty = aimAreaPenalties[aimArea];
    if (aimArea) {
      hitLocTableName += `_${aimArea.toUpperCase()}`;
    }
  }

  const thrown = Util.stringMatch(atkForm,'throw');
  // throwing offhand weapon is not allowed
  if ( offhand === true && thrown ) {
    weapons.shift();
    return attack(attackers, targetToken, options);
  }

  // check if target is beyond reach/range
  const weaponRange = +weapAttrs.range?.value;
  const missileAtk = Util.stringMatch(atkType, 'missile');
  const isShooting = Util.stringMatch(atkForm,"shoot");

  if (missileAtk && !weaponRange) {
    ui.notifications.error("Invalid range specified");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (!missileAtk && (maxReach == null || maxReach < 0)) {
    ui.notifications.error("Invalid reach specified");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const maxRange = missileAtk ? weaponRange : maxReach;
  if (range > +maxRange) {
    if (range <= Math.max(...reachValues.map(v => Number(v) * Constant.SQUARE_SIZE))) {
      ui.notifications.warn(`Must hold ${weapon.name} in two hands to use its max reach`);
    } else {
      ui.notifications.error(`Target is beyond the ${missileAtk ? 'range' : 'reach'} of ${weapon.name}`);
    }
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const minReach = Math.min(...reachValues) * Constant.SQUARE_SIZE || -1;
  if (range < +minReach) {
    weapDmg = '1d3';
    dmgType = 'blunt';
    ui.notifications.warn(`Using ${weapon.name} closer than its min reach`);
  }

  // mod dialog
  if ( options.showModDialog && !options.shownModDialog ) {
    const fields = [
      {label: 'To-hit modifiers', key: 'dialogAtkMod'}
    ];
    if (!attacker.skipDmgDialog) fields.push({label: 'Damage modifiers', key: 'dialogDmgMod', placeholder: 'e.g. x2, +3d6'});
    return modDialog(options, 'Attack', fields, () => attack(attackers, targetToken, options));
  }
  let dialogAtkMod = {}, dialogDmgMod = {};
  try {
    dialogAtkMod.formula = options.dialogAtkMod && await new Roll(options.dialogAtkMod).evaluate() ? options.dialogAtkMod : 0;
    if (/^[\+|\-|\*|\/]/.test(dialogAtkMod.formula)) dialogAtkMod.includesSign = true;
    dialogDmgMod.formula = options.dialogDmgMod && await new Roll(options.dialogDmgMod).evaluate() ? options.dialogDmgMod : 0;
    if (/^[\+|\-|\*|\/]/.test(dialogDmgMod.formula)) dialogDmgMod.includesSign = true;
  } catch {
    ui.notifications.error("Invalid input to modifier dialog");
    options.shownModDialog = false;
    return attack(attackers, targetToken, options);
  }

  // get attacker's properties
  const immuneFumbles = !!attackerRollData.immune_fumbles  //|| attackingActor._id === targetActor?._id;
  const bab = attackerRollData.bab || 0;
  const dexMod = attackerRollData.dex_mod || 0;
  const strMod = attackerRollData.str_mod || 0;
  const twoWeaponFightingPenalty = mainhand ? -3 + dexMod : offhand ? -5 + dexMod : 0;
  const atkAttr = Constant.ATK_MODES[atkMode]?.ATK_ATTR;
  const dmgAttr = Constant.ATK_MODES[atkMode]?.DMG_ATTR;
  const attrAtkMod = attackerRollData[`${atkAttr}_mod`] || 0;
  let attrDmgMod = (offhand && attackerRollData[`${dmgAttr}_mod`] > 0 ? Math.floor(attackerRollData[`${dmgAttr}_mod`] / 2) : attackerRollData[`${dmgAttr}_mod`]) || 0;
  const attackerAttrAtkMod = attackerRollData.atk_mod || 0;
  const attackerAttrDmgMod = attackerRollData.dmg_mod || 0;
  const attackerAtkMod = attacker.atkMod || 0;
  const attackerDmgMod = attacker.dmgMod || 0;
  const weapProfs = Array.isArray(attackerRollData.weap_profs) ? attackerRollData.weap_profs : 
    Util.getArrFromCSL(attackerRollData.weap_profs || '').map(p => p.toLowerCase());
  let stanceAtkMod = 0;
  let stanceDmgMod = 0;
  let critDmg = 0;
  let totalImpaleDmg = 0;


  // stance mods
  stanceAtkMod += Constant.STANCE_MODS[atkStyle]?.atk_mod || 0;
  stanceDmgMod += Constant.STANCE_MODS[atkStyle]?.dmg_mod(weaponItem) || 0;
  weapImp += Constant.STANCE_MODS[atkStyle]?.impact_mod(weaponItem) || 0;
  weapSpeed += Constant.STANCE_MODS[atkStyle]?.speed_mod(weaponItem) || 0;
  attrDmgMod += Constant.STANCE_MODS[atkStyle]?.str_dmg_mod(attackingActor) || 0;


  // get target's properties
  // can be immune to critical hits, bleed, knockdown and impale
  const immuneCriticalHits = !!targetRollData?.immune_critical_hits;
  const immuneBleed = !!targetRollData?.immune_bleed;
  const immuneKnockdown = !!targetRollData?.immune_knockdown;
  const immuneImpale = !!targetRollData?.immune_impale;
  let dr = Number(targetRollData?.ac.total[dmgType]?.dr) || 0;
  let targetAc = Number(targetRollData?.ac?.total[dmgType]?.ac);
  let targetTouchAc = Number(targetRollData?.ac?.touch_ac);
  let unarmoredAc = targetTouchAc + (Constant.ARMOR_VS_DMG_TYPE.none[dmgType]?.ac || 0);
  let shieldBonus = Number(targetRollData?.ac?.total[dmgType]?.shield_bonus);
  const targetHp = +targetActor?.data.data.hp?.value;
  const targetMaxNegHP = targetActor?.type === "humanoid" || targetActor?.type === "character" ?
    (0 - (targetActor?.data.data.attributes.ability_scores?.con?.value ?? 10)) : 0;
  const targetIncapacitated =targetActor.data.effects.some(e => Util.stringMatch(e.data.label, 'Incapacitated'));
  const targetProne = targetActor.data.effects.some(e => Util.stringMatch(e.data.label, 'Prone'));
  const targetDead = targetActor.data.effects.some(e => Util.stringMatch(e.data.label, 'Dead'));
  const targetHelpless = targetActor.data.effects.some(e => Util.stringMatch(e.data.label, 'Helpless'));
  const targetHeldItems = targetActor?.items.filter(i => i.data.data.held_right || i.data.data.held_left);
  const targetWeapSpeedItem = !targetHeldItems.length ? null 
    : targetHeldItems.reduce((a,b) => (+b.data.data.attributes.speed?.value || 0) > (+a.data.data.attributes.speed?.value || 0) ? b : a);
  const targetWeapSpeedItemAtkStyle = targetWeapSpeedItem.data.data.atk_style || 'stable';
  let targetWeapSpeed = !targetWeapSpeedItem ? 10 - targetSize : (+targetWeapSpeedItem.data.data.attributes.speed?.value || 0);
  targetWeapSpeed += Constant.STANCE_MODS[targetWeapSpeedItemAtkStyle]?.speed_mod(targetWeapSpeedItem) || 0;
  const targetReachValues = [...new Set(targetHeldItems.map(i => i.data.data.attributes.reach?.value.split(',').map(n => Number(n)).filter(t => !isNaN(t))).flat())];
  const targetDefaultReach = Math.floor(targetSize / 2) * Constant.SQUARE_SIZE || -1;
  const targetMaxReach = targetReachValues.length ? Math.max(...targetReachValues) * Constant.SQUARE_SIZE : targetDefaultReach;
  const targetHasReach = range <= targetMaxReach;

  // situational mods
  // 1.5x attrDmgMod if holding weapon with both hands
  if (weaponHeldTwoHands && !isShooting) attrDmgMod = Math.max(attrDmgMod, Math.floor(attrDmgMod * 1.5));
  // +1 if holding a weapon of same size in both hands
  if (weapSize === attackerSize && weaponHeldTwoHands && !isShooting) sitAtkMod++;
  // -2 if holding a weapon one size larger in one hand
  if (weapSize > attackerSize && !weaponHeldTwoHands) sitAtkMod = sitAtkMod - 2;
  // -3 if target is size S and attacker is bigger than medium
  if (targetSize === 1 && attackerSize > 2) sitAtkMod = sitAtkMod - 3;
  // -2 if target is size T and attacker is medium
  if (targetSize === 0 && attackerSize === 2) sitAtkMod = sitAtkMod - 2;
  // -4 if target is size T and attacker is bigger than medium
  if (targetSize === 0 && attackerSize > 2) sitAtkMod = sitAtkMod - 4;
  // chance of second attack by weapon speed
  const speedDiff = weapSpeed - targetWeapSpeed;
  const followAttackChance = speedDiff * 2;
  if (weapons.length === 1 && speedDiff > 0 && await Util.rollDice('d100') <= followAttackChance) {
    attacker.followAttack = true;
  }
  // -2 if weapon category defined but not in attacker's weapon proficiencies
  // TODO weap specialization and mastery
  if (weapCategory != null && !weapProfs.includes(weapCategory)) {
    sitAtkMod = sitAtkMod - 2;
  }
  // -2 if thrusting with curved sword
  if (isCurvedSword && Util.stringMatch(atkForm,'thrust')) sitAtkMod -= 2;
  // dmg bonus vs. large
  if (targetSize > 2) {
    sitDmgMod += weapDmgVsLrg;
  }

  // determine range penalty, handle missile situational mods, and reduce qty of thrown weapon/missile
  let rangePenalty = 0;
  if (missileAtk) {
    rangePenalty = attacker.ranTarget ? 0 : -Math.abs(Math.floor(range / 10)) || 0;
    // bonus to groups
    if (attacker.ranTarget && bonusToGroups) {
      sitAtkMod = sitAtkMod + 2;
    }
    // bonus to-hit large monsters with missiles
    if (targetSize > 2) {
      sitAtkMod = sitAtkMod + 2;
    }

    // reduce qty of thrown weapon/missile
    if (thrown) {
      try {
        await Util.reduceItemQty(weaponItem, attackingActor);
      } catch (error) {
        ui.notifications.error(error);
        weapons.shift();
        return attack(attackers, targetToken, options);
      }
    } else if (isShooting) {
      // must be holding with two hands to use a bow/crossbow
      if (!weaponHeldTwoHands) {
        ui.notifications.error(`Must hold ${weapName} with both hands to use`);
        weapons.shift();
        return attack(attackers, targetToken, options);
      }
      const quiver = token.actor.items.find(i => i.data.data.worn && i.data.data.attributes.quiver?.value);
      const quiverQty = quiver?.data.data.quantity;
      
      try {
        if (!quiver || !quiverQty) {
          throw new Error("Nothing found to shoot from this weapon");
        }
        const itemsUpdate = [{'_id': quiver._id, 'data.quantity': quiverQty - 1}];
        // set crossbow to unloaded
        if (reload) itemsUpdate.push({'_id': weaponItem._id, 'data.loaded': false});
        await token.actor.updateEmbeddedDocuments("Item", itemsUpdate);
      } catch (error) {
        ui.notifications.error(error);
        weapons.shift();
        return attack(attackers, targetToken, options);
      }
    }
  }

  // attack
  const d20Result = await Util.rollDice("d20");
  const atkFactors = [d20Result, bab, attrAtkMod, twoWeaponFightingPenalty, attackerAttrAtkMod, attackerAtkMod, weapAtkMod, rangePenalty, stanceAtkMod, sitAtkMod, aimPenalty];
  let totalAtk = atkFactors.reduce((prev, curr) => curr ? prev + `+${curr}` : prev);
  // have to add dialog mod afterwards, in case it multiplies/divides
  let dialogAtk = '';
  if (dialogAtkMod.formula) {
    dialogAtk = `${!dialogAtkMod.includesSign ? `+` : ''}${dialogAtkMod.formula}`;
    totalAtk = /^[\*|\/]/.test(dialogAtk) ? `(${totalAtk})${dialogAtk}` : `${totalAtk}${dialogAtk}`;
  }
  let totalAtkResult = Math.max(1, await Util.rollDice(totalAtk));
  const hitSound = weapon.hitSound || weapAttrs.hit_sound?.value || Constant.ATK_MODES[atkMode]?.HIT_SOUND;
  const missSound = weapon.missSound || weapAttrs.miss_sound?.value || Constant.ATK_MODES[atkMode]?.MISS_SOUND;
  let resultSound = missSound;
  let hitDesc = '';
  let hitVerb = 'hits';
  let missDesc = '';
  let resultText = '';
  let dmgEffect = '';
  let isHit = true;
  let injuryObj = {};
  let acObj = {};
  const minorBleedDesc = Constant.minorBleedDesc;
  const majorBleedDesc = Constant.majorBleedDesc;
  const bloodWellDesc = Constant.bloodWellDesc;
  const weaponStuckDesc = Constant.weaponStuckDesc;
  const knockdownDesc = Constant.knockdownDesc;
  const knockbackDesc = Constant.knockbackDesc;
  const staggerDesc = Constant.staggerDesc;
  const knockWindDesc = Constant.knockWindDesc;
  let coverageArea = '';
  let endHeight = '';

  
  let rolledWeapDmg = await Util.rollDice(weapDmg);
  const maxWeapDmg = await new Roll(weapDmg).evaluate({maximize: true}).total; 
  let weapDmgResult = rolledWeapDmg;

  const adjTokens = (token, disposition) => {
    return canvas.tokens.objects.children.filter(t => 
      (disposition ? t.data.disposition === disposition : true) &&
      t.actor._id !== targetActor?._id &&
      t.actor._id !== attackingActor._id &&
      measureRange(token, t) < 10);
  }
  
  if (!isNaN(targetAc)) {
    let hitLoc = '';
    const maxImpaleAreas = ['chest','eye'];
    const doubleBleedAreas = ['neck','groin','armpit'];
    const easyBleedAreas = ['neck','jaw','face','skull','eye','forearm','hand','foot','armpit'];
    const doubleKnockdownAreas = ['skull','face','eye','jaw','knee','shin','foot'];
    const helmetAreas = ['skull','face','eye','jaw'];
    const dropKnockdownAreas = ['hand','forearm'];
    let sortedWornArmors = [];
    const parry = targetRollData.ac.parry || {};
    let parryItem = targetActor.items.get(parry.parry_item_id);
    let parryItemHeight = parryItem?.data.data.atk_height;
    let targetParryBonus = parry.parry_bonus || 0;
    const isRiposteParrying = parryItem && targetParryBonus > 0;
    let isFluidParrying = false;

    // roll for hit location if character or humanoid
    if ( Util.stringMatch(targetActor?.type, 'character') || Util.stringMatch(targetRollData.type, 'humanoid') ) {

      const hitLocTable = Constant.HIT_LOC_ARRS[hitLocTableName];
      hitLocTable.filter(l => !removedLocs.includes(l));
      const hitLocRoll = await Util.rollDice(`d${hitLocTable.length}`);
      hitLoc = hitLocTable[hitLocRoll - 1];
      coverageArea = hitLoc.replace('right ', '').replace('left ', '');
      for (const [k,v] of Object.entries(Constant.HEIGHT_AREAS)) {
        if (v.includes(coverageArea)) {
          endHeight = k;
          break;
        }
      }
      endHeight = endHeight || atkHeight;

      // fluid parrying
      isFluidParrying = parryItem && parry.fluid_parry_bonus >= targetParryBonus && Util.stringMatch(parryItemHeight, endHeight);
      if (isFluidParrying) targetParryBonus = parry.fluid_parry_bonus;
      //TODO make status effects like unconscious reset parry/fluid automatically

      acObj = targetRollData.ac[coverageArea][dmgType] || acObj;
      dr = acObj.dr ?? dr;
      targetAc = acObj.ac ?? targetAc;
      sortedWornArmors = targetRollData.ac[coverageArea].sorted_armor_ids?.map(id => targetActor.items.get(id)) || [];

      // shield mods
      // check for friendly adjacent tokens wearing a Large Round Shield, i.e. shield wall
      const largeShieldLocs = [...new Set(Object.values(Constant.SHIELD_TYPES.round.L).map(v => Util.getArrFromCSL(v)).flat())];
      if(largeShieldLocs.includes(coverageArea)) {
        const adjFriendlyTokens = adjTokens(targetToken, 1);
        const adjLargeShields = adjFriendlyTokens.map(t => t.actor.items.filter(i => i.data.data.worn &&
          Util.stringMatch(i.data.data.attributes.shield_shape?.value, 'large round') &&
          i.data.data.shield_height && Util.getArrFromCSL(Constant.SHIELD_TYPES.round.L[i.data.data.shield_height]).includes(coverageArea)
        )).flat();
        const adjLargeShieldAcs = adjLargeShields.map(s => (+s.data.data.ac?.[dmgType]?.ac) || 0);
        const adjLargeShieldDrs = adjLargeShields.map(s => (+s.data.data.ac?.[dmgType]?.dr) || 0);
        // take best
        const shieldWallAcMod = Math.max(...adjLargeShieldAcs, 0);
        const shieldWallDrMod = Math.max(...adjLargeShieldDrs, 0);
        targetAc += shieldWallAcMod;
        dr += shieldWallDrMod;
      }

      // handle effects based on target shield
      shieldBonus = acObj.shield_bonus || 0;
      if (flexWeapon) {
        // disregard all shield and parry mods if weapon is flexible
        sortedWornArmors = sortedWornArmors.filter(i => !i.data.data.attributes.shield_shape?.value);
        targetAc -= shieldBonus;
        targetAc -= targetParryBonus;
      } else if (isShooting) {
        targetAc -= targetParryBonus;
      }
    }

    

    const isBrutalHit = Util.stringMatch(atkStyle, 'power');
    resultText += `${isBrutalHit ? ' brutally hard' : ''} at ${!aimArea && targetActor?.name ? `${targetActor?.name}'s`: `the`}${hitLoc ? ` ${hitLoc}`:``} (${Util.chatInlineRoll(totalAtk)} vs. AC ${targetAc})`;
    // 20 always hits
    if( d20Result === 20 && totalAtkResult < targetAc) {
      totalAtkResult = targetAc;
    }
    isHit = totalAtkResult >= targetAc;

    if (isHit) {
      resultSound = hitSound;
      const armorUpdates = []; // TODO declare at very beginning, all attacker/defender item updates, and attacker/defender updates
      let dent = false;
      let lastLayerDr = 0;
      const armorPenVal = Util.stringMatch(dmgType,'blunt') ? weapImp : weapPen;
      const appliedArmors = sortedWornArmors.filter(a => applyArmor(a));

      // critical hits
      const baseCritChance = totalAtkResult - targetAc;
      const skillfulHitChance = baseCritChance + weapSpeed;
      const critMulti = Constant.HIT_LOCATIONS[coverageArea].crit_chance_multi ?? 0;
      const painCritChance = critMulti * baseCritChance; // TODO curved swords have lower min reach
      const isSkillfulHit = !immuneCriticalHits && await Util.rollDice('d100') <= skillfulHitChance;
      const isCriticalHit = !immuneCriticalHits && await Util.rollDice('d100') <= painCritChance;
      if (isSkillfulHit) {
        const armor = appliedArmors[0];
        const armorName = armor?.name;
        const isBulky = !!armor?.data.data.attributes.bulky?.value;
        const isShield = !!armor?.data.data.attributes.shield_shape?.value;
        // if pierce and armor is bulky, bypass armor
        if (Util.stringMatch(dmgType, 'piercing') && isBulky || isShield) {
          hitDesc += ` and finds a gap ${isBulky ? 'in' : 'around'} ${armorName}`;
          appliedArmors.shift();
        }
      }

      // brutal hit gives "free" chance to smash top level of armor
      if (isBrutalHit && appliedArmors.length) {
        await (async () => {
          const armor = appliedArmors[0];
          const armorName = armor.name;
          const regex = new RegExp(`${armorName}$`);
          const armorMaterial = armor.data.data.attributes.material?.value || '';
          const penArmor = await penetrateArmor(armorMaterial, dmgType, armorPenVal, lastLayerDr);
          if (!penArmor) return;

          lastLayerDr = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].dr;
          const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates);
          if (!armorAbsorb.absorbed) return;

          hitDesc = hitDesc.replace(regex,'') + armorAbsorb.hitDesc;
          dent = armorAbsorb.armorDented;
          stanceDmgMod -= armorAbsorb.absorbDr;
        })();
      }

      // penetration / impale
      const impaleChance = Constant.BASE_IMPALE_CHANCE - 5 * weapSize;
      const doImpale = !immuneImpale && await Util.rollDice('d100') <= impaleChance;
      if (doImpale) {
        const maxTargetImpales = appliedArmors.length + Constant.HIT_LOCATIONS[coverageArea].max_impale;
        const maxImpales = Math.min(weapPen, maxTargetImpales);
        let lastLayerDr = 0;
        let stuck = false;

        for (let i = 0; i < maxImpales; i++) {
          // armor penetration if armor layers remain
          if (appliedArmors.length) {
            const armor = appliedArmors[0];
            const armorName = armor.name;
            const regex = new RegExp(`${armorName}$`);
            const armorMaterial = armor?.data.data.attributes.material?.value || '';
            const penArmor = await penetrateArmor(armorMaterial, dmgType, armorPenVal, lastLayerDr);
            if (!penArmor) break;

            const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates);
            if (!armorAbsorb.absorbed) continue;

            lastLayerDr = armorAbsorb.absorbDr
            hitDesc = hitDesc.replace(regex,'') + armorAbsorb.hitDesc;
            dent = armorAbsorb.armorDented;

          // special damage effects if no armor layers remain
          } else {
            let rolledDmg = await Util.rollDice(weapDmg);
            let impaleDamage = rolledDmg;
            if (i > 0 && maxImpaleAreas.includes(coverageArea)) {
              impaleDamage = maxWeapDmg;
            }
            totalImpaleDmg += impaleDamage;
            hitVerb = Util.stringMatch(dmgType, 'blunt') ? 'lacerates' 
              : (Util.stringMatch(dmgType, 'piercing') || isShooting) ? 'impales'
              : 'cuts';

            if (await Util.rollDice('d100') > impaleChance) {
              break;
            }

          }
          // beyond first impale, weapon gets stuck
          if (i > 0) stuck = true;
        }

        // apply damage and append results string to hitDesc
        dmgEffect = !stuck ? dmgEffect : Util.replacePunc(dmgEffect) + weaponStuckDesc;
      }

      // convert slashing and piercing damage to blunt if blunting armor remains
      // blunting armor is bulky if blunt, metal if slashing, and metal and bulky if piercing
      const bluntingArmor = appliedArmors.find(i =>
        Util.stringMatch(dmgType, 'blunt') ? i.data.data.attributes.bulky?.value && !dent
        : Util.stringMatch(dmgType, 'slashing') ? i.data.data.attributes.metal?.value
        : i.data.data.attributes.bulky?.value && i.data.data.attributes.metal?.value
      );
      if ( bluntingArmor && !Util.stringMatch(dmgType, 'blunt') ) {
        hitDesc += !hitDesc.includes(bluntingArmor.name) ? ` and fails to penetrate ${bluntingArmor.name} but` : '';
        // apply worst of current or blunt dr
        const bluntAcObj = targetRollData.ac[coverageArea]['blunt'] || {};
        dr = Math.max(dr, bluntAcObj.dr ?? 0);
        dmgType = 'blunt';
      }

      // apply hit verb
      hitDesc += /but$/.test(hitDesc) ? ` ${hitVerb}` : ` and ${hitVerb}`;

      // apply extra location crit damage
      if (isCriticalHit && !bluntingArmor) {
        weapDmgResult = maxWeapDmg;
        const critDmgMulti = (Constant.HIT_LOCATIONS[coverageArea].crit_dmg_multi ?? 1) - 1;
        critDmg += (weapDmgResult - dr + attrDmgMod + stanceDmgMod) * critDmgMulti;
        hitDesc += ` a vulnerable point`;
      }

      // knockdowns
      const knockDownMulti = doubleKnockdownAreas.includes(coverageArea) ? 2 : 1;
      const knockdownChance = knockDownMulti * 5 * weapImp - 20 * (targetSize - 2);
      const canKnockdown = Util.stringMatch(atkForm, 'swing') || Util.stringMatch(dmgType, 'blunt');
      const isKnockdown = !immuneKnockdown && !targetProne && canKnockdown && await Util.rollDice('d100') <= knockdownChance;
      if (isKnockdown) {
        const armor = appliedArmors[0];
        const isShield = !!armor?.data.data.attributes.shield_shape?.value;
        // knockdown can disarm weapon, knock off helmet, or disarm shield if held in fluid stance
        (() => {
          if ( !!armor && !isShield && helmetAreas.includes(coverageArea)) {
            const attachedHelm = armor?.data.data.attributes.coverage?.value.includes('neck') && !!armor?.data.data.attributes.material?.value.includes('plate');
            if (!attachedHelm && (2 * Math.random() > 1)) {
              dmgEffect = ` and knocks ${armor.name} off ${targetActor.name}'s head` + dmgEffect;
              return;
            }
          }
          if ( dropKnockdownAreas.includes(coverageArea) && Constant.HIT_LOCATIONS[coverageArea]?.bilateral ) {
            const side = hitLoc.includes('right') ? 'right' : 'left';
            const otherSide = side === 'right' ? 'left' : 'right;'
            const heldItem = targetActor.items.find(i => i.data.data[`held_${side}`] && !i.data.data[`held_${otherSide}`]);
            if (heldItem && (2 * Math.random() > 1)) {
              dmgEffect = ` and knocks ${heldItem.name} from ${targetActor.name}'s grip` + dmgEffect;
            }
            return;
          }
          if ( isShield && Util.stringMatch(armor.data.data.shield_style, 'fluid') ) {
            if (2 * Math.random() > 1) {
              dmgEffect = ` and knocks ${armor.name} from ${targetActor.name}'s grip` + dmgEffect;
            }
            return;
          }

          let skipWeaps = false;
          const sizeDiff = attackerSize - targetSize;
          const knockdownDmg = sizeDiff * 4 + weapImp;
          const isStunned = targetActor.data.effects.some(e => Util.stringMatch(e.data.label, 'Stunned'));
          if (knockdownDmg > 8 && (2 * Math.random() > 1)) {
            dmgEffect = knockbackDesc + dmgEffect;
            skipWeaps = true;
          } else if ( isStunned || (knockdownDmg > 2 && (2 * Math.random() > 1)) ) {
            dmgEffect = knockdownDesc + dmgEffect;
            skipWeaps = true;
          } else {
            if (['gut','chest','groin'].includes(coverageArea)) {
              dmgEffect = knockWindDesc + dmgEffect;
            } else {
              dmgEffect = staggerDesc + dmgEffect;
            }
          }

          // remove any other weapons
          if (skipWeaps) while (weapons.length) weapons.shift();
        })();
        // add prone condition manually
      }

      // bleeding
      const armorMaterial = appliedArmors[0]?.data.data.attributes.material?.value || '';
      const bleedDr = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].dr || 0;
      let bleedChance = weapBleed * 2 - bleedDr * 3;
      const canBleed = !Util.stringMatch(dmgType,'blunt') || totalImpaleDmg;
      if (easyBleedAreas.includes(coverageArea)) bleedChance *= 2;
      const doBleed = !immuneBleed && canBleed && await Util.rollDice('d100') <= bleedChance;
      if (doBleed) {
        // determine severity
        let severityDesc = totalImpaleDmg && doubleBleedAreas.includes(coverageArea) ? majorBleedDesc : minorBleedDesc;
        if (dmgEffect.includes(Util.replacePunc(weaponStuckDesc))) {
          severityDesc = severityDesc.replace(minorBleedDesc,'').replace(majorBleedDesc,bloodWellDesc);
        }
        dmgEffect = Util.replacePunc(dmgEffect) + severityDesc;
        // add bleed/heavy bleed condition manually
      }

      // consider any shot weapon as piercing for the purpose of injury determination
      const injuryDmgType = isShooting ? "piercing" : dmgType;
      injuryObj = Constant.HIT_LOCATIONS[coverageArea]?.injury?.[injuryDmgType] || {};

      resultText += hitDesc;

      // apply armor damage updates TODO doo these at the end of attack function, collect all itemUpdates for each actor together in array
      // if (armorUpdates.length) await targetActor.updateEmbeddedDocuments("Item", armorUpdates);

    // handle misses
    } else {
      const deflectingArmor = sortedWornArmors[0];
      const isShield = !!deflectingArmor?.data.data.attributes.shield_shape?.value;
      if (!isRiposteParrying && !isFluidParrying) {
        // use shield if worn in fluid style
        const isFluid = Util.stringMatch(deflectingArmor?.data.data.shield_style, 'fluid');
        const shieldHeight = deflectingArmor?.data.data.shield_height || '';
        if (isShield && isFluid && Util.stringMatch(shieldHeight, endHeight)) {
          parryItem = deflectingArmor;
          targetParryBonus = +parryItem?.data.data.attributes.base_ac?.value || 0;
          parryItemHeight = shieldHeight;
        }
      }
      const targetDexMod = (targetDead || targetHelpless || targetIncapacitated || isShooting) ? 0
        : Math.max(Math.min(+targetRollData.dex_mod, +targetRollData.ac.max_dex_mod || 0), 0);
      const parryDesc = ` but ${targetActor.name} parries${parryItem ? ` with ${parryItem.name}` : ''}`;
      const parryHeightPenalty = Util.stringMatch(parryItemHeight, endHeight) ? 0
        : Util.stringMatch(parryItemHeight, 'mid') || Util.stringMatch(endHeight, 'mid') ? 2
        : 4;

      // determine miss desc
      // riposte
      if ( isRiposteParrying && totalAtkResult < unarmoredAc + targetParryBonus - parryHeightPenalty ) {
        missDesc = parryDesc;
        // check for parry item breakage
        if (parryItem && parryItem.data.data.attributes.fragile?.value && await Util.rollDice('d100') <= Constant.WEAP_BREAK_CHANCE) {
          missDesc += ` and ${parryItem.name} breaks!`;
        } else {
          missDesc += ' and can riposte!';
        }
      } else if (totalAtkResult < unarmoredAc - targetDexMod) {
        missDesc = ` but misses entirely`;
      } else if (totalAtkResult < unarmoredAc) {
        const dodgeVerb = Constant.HEIGHT_AREAS.high.includes(coverageArea) ? 'ducks'
          : atkForm === 'thrust' ? 'sidesteps'
          : atkForm === 'swing' ? 'jumps back'
          : 'dodges';
        missDesc = ` but ${targetActor.name} ${dodgeVerb}`;
        // dodging defender has a chance to counter equal to follow attack chance
        if ( targetHasReach && await Util.rollDice('d100') <= followAttackChance * -1 ) {
          missDesc += ` and can counter!`;
        }
      } else if (totalAtkResult < unarmoredAc + targetParryBonus) {
        missDesc = parryDesc;
        // check for weapon item breakage
        if (parryItem && fragile && await Util.rollDice('d100') <= Constant.WEAP_BREAK_CHANCE) {
          missDesc += ` and ${weapon.name} breaks!`;
        }
      } else {
        const hide = targetActor.data.data.attributes.hide?.value;
        let deflectingArmorName = deflectingArmor?.name;
        if (Constant.ARMOR_VS_DMG_TYPE[hide] && !deflectingArmorName && coverageArea !== 'eye') {
          const hideDesc = Util.stringMatch(hide,'leather') ? `${hide}y` : Util.stringMatch(hide, 'scale') ? `${hide.replace('e','')}y` : `${hide}`;
          deflectingArmorName = ` the ${hideDesc} hide`;
        }
        const isPlate = deflectingArmor?.data.data.attributes.material?.value.includes('plate');
        missDesc = ` ${deflectingArmorName ? 
         ` but the ${isShooting ? 'missile' : 'blow'}${isShooting && isShield ? ` thunks into ` : isShield ? ` is deflected by` : ` glances off`} ${deflectingArmorName}` : 
         ' but misses'}`;
        // check for weapon item breakage
        if ( (isPlate || isShield) && fragile && await Util.rollDice('d100') <= Constant.WEAP_BREAK_CHANCE) {
          missDesc += ` and ${weapon.name} breaks!`; // TODO reduce qty -- create repair item macro?
        }
      }

      // fumbles
      const baseFumbleChance = targetAc - totalAtkResult + weapImp;
      const fumbleChance = unwieldy ? Math.ceil(1.5 * baseFumbleChance) : baseFumbleChance;
      if (!immuneFumbles && await Util.rollDice('d100') <= fumbleChance) {
        attacker.followAttack = false;
        const heldItems = attackingActor.items.filter(i => i.data.data.held_right || i.data.data.held_left);
        const adjTargets = adjTokens(token);
        const selectRandom = (arr) => {
          const res = Math.floor(Math.random() * arr.length);
          return arr[res];
        };
        const fumbles = [
          `slips and falls`, 
          `stumbles, leaving them open to attack`,
        ];
        unwieldy && fumbles.push(`hits themselves instead!`);
        heldItems.length && fumbles.push(`drops ${selectRandom(heldItems)?.name}`)
        Util.stringMatch(atkType,'melee') && adjTargets.length && fumbles.push(`strikes ${selectRandom(adjTargets)?.name} instead!`);

        const fumble = selectRandom(fumbles);
        const fumbleText = ` and${missDesc.includes('misses entirely') ? '' : ` ${attackingActor.name}`} ${fumble}`;
        missDesc = Util.replacePunc(missDesc) + fumbleText;
        while (weapons.length) weapons.shift();
      }

      resultText += missDesc;
    }
  } else {
    resultText += ` ${Util.chatInlineRoll(totalAtk)}`;
  }

  // damage
  const drMod = 0 - dr;
  const dmgMods = [drMod, critDmg, totalImpaleDmg, attrDmgMod, stanceDmgMod, attackerAttrDmgMod, attackerDmgMod, sitDmgMod].filter(m => m);
  const dmgModText = dmgMods.reduce((prev, curr) => curr < 0 ? prev + `-${Math.abs(curr)}` : prev + `+${curr}`, '');
  let totalDmgText= `${attacker.dmgMulti ? `${weapDmgResult}*${attacker.dmgMulti}` : `${weapDmgResult}`}${dmgModText}`;
  let dialogDmg = '';
  if (dialogDmgMod.formula) {
    dialogDmg = `${!dialogDmgMod.includesSign ? `+` : ''}${dialogDmgMod.formula}`;
    totalDmgText= /^[\*|\/]/.test(dialogDmg) ? `(${totalDmgText})${dialogDmg}` : `${totalDmgText}${dialogDmg}`;
  }
  let totalDmgResult = await Util.rollDice(totalDmgText);
  // min 1 damage, update both text and totalDmgResult
  if (totalDmgResult < 1) totalDmgText += `+${1 - totalDmgResult}`;
  totalDmgResult = Math.max(1, totalDmgResult);
  let dmgText = ` for ${Util.chatInlineRoll(totalDmgText)}${dr ? ` (DR ${dr})`:''}${dmgType ? ` ${dmgType}` : ''} damage`;

  let injuryWeapDmg = weapDmgResult - dr + attrDmgMod + stanceDmgMod;
  if (Util.stringMatch(dmgType,'blunt')) injuryWeapDmg = Math.min(weapImp, injuryWeapDmg);
  const injuryDmg = totalDmgResult > targetHp ? totalDmgResult - targetHp : 0;
  const injury = (injuryWeapDmg > 8 && injuryDmg > 8 && !!injuryObj['gruesome'] ? injuryObj['gruesome'] :
    injuryWeapDmg > 5 && injuryDmg > 5 ? injuryObj['critical'] :
    injuryWeapDmg > 2 && injuryDmg > 2 ? injuryObj['serious'] :
    injuryObj['light']) || {};

  attacks.push({
    instantKill: totalDmgResult > targetHp && injury.fatal,
    sound: resultSound,
    damage: isHit ? totalDmgResult : null,
    energyDrainDamage: isHit && energyDrain ? totalDmgResult : null
  });

  const sumDmg = attacks.reduce((sum, a) => sum + a.damage, 0);
  const sumEnergyDrainDmg = attacks.reduce((sum, a) => sum + a.energyDrainDamage, 0);
  attacker.totalEnergyDrainDmg = sumEnergyDrainDmg;
  if (targetHp > 0 && sumDmg >= targetHp) {
    while (weapons.length) weapons.shift();
    attacker.kill = true;
  }

  // result
  if (isHit) {
    resultText += dmgText;

    if (totalDmgResult < 2) {
      resultText = resultText.replace('hits', 'grazes');
    }
// use swing high/low tables, but only when prone or mounted?
// touch attack macro for grapples/hooks etc.
// handle bleed dmg like disease
// fix disease macros, collect list of GM macros
// add XP macro
// finalize death & dying mechanic
// MAJOR TODO armor should have HP proportional to coverage area, and base_AC is proportionally reduced as HP is reduced -- only reduce to half of base_ac, then it falls apart
    if (sumDmg > targetHp) {
      let injuryText = injury.text.replace('them', targetActor?.name);
      // replace cleaves with slices for curved swords
      if (isCurvedSword) {
        injuryText = injuryText.replace('cleaves','slices');
      }
      // replace impale damage vers
      ['impales','lacerates','cuts'].forEach(v => {
        if (injuryText.includes(v)) {
          resultText = resultText.replace(v,'hits');
        }
      });

      if (injury.removal) {
        dmgEffect = dmgEffect.replace(weaponStuckDesc,'');
      }
      resultText += injuryText || '';
      
      if (targetHp > 0) while (weapons.length) weapons.shift();
  
      // remove knockdown/stagger descriptions
      dmgEffect = dmgEffect.replace(staggerDesc,'').replace(knockWindDesc,'');
      
      if (injury.dmgEffect) {
        // replace existing dmg effect descs if included in injury dmg effect
        if (injury.dmgEffect.includes('bleed') || injury.dmgEffect.includes('blood')) {
          dmgEffect = dmgEffect.replace(minorBleedDesc,'').replace(majorBleedDesc,'');
        }
        if (injury.dmgEffect.includes(weaponStuckDesc)) {
          dmgEffect = dmgEffect.replace(weaponStuckDesc,'');
        }
        dmgEffect = Util.replacePunc(dmgEffect.replace(injury.dmgEffect,'')) + injury.dmgEffect;
      }
    }

    if (dmgEffect) {
      if (!dmgEffect.includes(targetActor?.name)) {
        dmgEffect = dmgEffect.replace('them', targetActor?.name);
      }
      resultText = Util.replacePunc(resultText) + dmgEffect;
    }

    // remove bleed effects if target is dead
    if (targetHp <= targetMaxNegHP) {
      resultText = resultText
        .replace(minorBleedDesc,'')
        .replace(majorBleedDesc,'')
        .replace(Constant.internalBleedDesc(coverageArea),'')
        .replace(Constant.knockoutDesc.replace('them', targetActor?.name),'');
    }

    // replace bleed description if weapon is stuck
    if (resultText.includes(Util.replacePunc(weaponStuckDesc))) {
      resultText = resultText.replace(minorBleedDesc,'').replace(majorBleedDesc,bloodWellDesc);
    }
  }

  const rangeText = missileAtk && range ? ` ${range}'` : '';
  const pluralize = name => /h$/.test(name) ? `${Util.lowerCaseFirst(name)}es` : `${Util.lowerCaseFirst(name)}s`;

  chatMsgData.content += `${attackingActor.name}` + aimText;
  chatMsgData.content += Util.stringMatch(atkForm, 'attack') ? ` ${pluralize(weapName)}`:
    ` ${atkForm}s${isBow && ammoName ? ` a ${ammoName} from` : ''} ${weapName}`;
  chatMsgData.content += `${resultText}`;
  const lastChar = resultText.charAt(resultText.length - 1);
  chatMsgData.content += lastChar === '!' || lastChar === '.' ? '<br>' : `.<br>`;
  
  chatMsgData.flavor += Util.stringMatch(atkForm, 'attack') ? `${weapName}, ` : `${weapName}${atkStyle !== 'stable' ? ` ${atkStyle}` : ''} ${atkForm.toLowerCase()}${rangeText}${atkHeight ? ` from ${atkHeight}` : ''},`;
  chatMsgData.bubbleString += Util.stringMatch(atkForm, 'attack') ? `${attackingActor.name} ${pluralize(weapName)}${targetActor ? ` ${targetActor.name}` : ''}<br>` :
    `${attackingActor.name} ${atkForm}s ${weapName}${targetActor ? ` at ${targetActor.name}` : ''}.<br>`;

  weapons.shift();

  return attack(attackers, targetToken, options);
}

function applyArmor (armor) {
  const currentAC = +armor?.data.data.attributes.base_ac?.value;
  const maxAc = +armor?.data.data.attributes.base_ac?.max;

  return Math.random() <= currentAC / maxAc; 
}

async function penetrateArmor(armorMaterial, dmgType, armorPenVal, lastLayerDr) {
  const armorBaseAc = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.base_AC || 0;
  const armorAc = armorBaseAc + (Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].ac || 0);
  if (!armorAc) return true;
  const penChance = Constant.BASE_IMPALE_CHANCE + armorPenVal * 10 - (armorAc + lastLayerDr) * 10;
  const result = await Util.rollDice('d100');
  return result <= penChance;
}

function armorAbsorption(appliedArmors, armorDented, dmgType, armorUpdates) {
  const armor = appliedArmors[0];
  if (!armor) return {};

  const isPlate = armor?.data.data.attributes.material?.value.includes('plate');
  const isBulky = !!armor?.data.data.attributes.bulky?.value;
  const isShield = !!armor?.data.data.attributes.shield_shape?.value;
  const absorbed = dmgType !== 'blunt' || isBulky || isShield;

  // plate armor is dented or broken if already dented
  armorDented = !armorDented && isPlate;

  const absorbDr = absorbed ? Number(armor?.data.data.ac?.[dmgType]?.dr) || 0 : 0;

  const skipArmor = !absorbed || absorbed && !armorDented;
  skipArmor && appliedArmors.shift();
  let hitDesc = '';

  if (absorbed) {
    const baseAc = Number(armor.data.data.attributes.base_ac?.value);
    let verb = armorDented ? 'dents' : isBulky ? 'punctures' : isShield ? 'cracks' : 'tears';

    // only damage armor if not dented
    if (!armorDented) {
      const itemUpdate = {'_id': armor._id, 'data.attributes.base_ac.value': Math.max(0, baseAc - 1)};
      if (baseAc < 1) { // TODO use condition instead of base AC
        verb = isShield ? 'splinters' : 'tears apart';
        const qty = +armor.data.data.quantity || 0;
        qty && Object.assign(itemUpdate, {'data.quantity': qty - 1});
      }
      armorUpdates.push(itemUpdate);
    }
    hitDesc = ` and ${verb} ${armor.name}`;
  }

  return { absorbed, absorbDr, armorDented, hitDesc };
}

export function setStance(options={}) {
  let char;
  try {
    char = Util.selectedCharacter();
  } catch (e) {
    return ui.notifications.error(e.message);
  }
  const actor = char.actor;
  const weapons = actor.items.filter(i => i.type === 'item'
    && i.data.data.attributes.atk_modes
    && (i.data.data.held_left || i.data.data.held_right)
  );
  const shields = actor.items.filter(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield_shape?.value);

  if (!weapons.length && !shields.length) {
    return ui.notifications.info("Not holding any applicable items");
  }
  if (weapons.some(w => Constant.SIZE_VALUES[w.data.data.attributes.size?.value] == null)) {
    return ui.notifications.error("Invalid weapon size specified");
  }

  const heights = ['high','mid','low'];
  
  const getButton = (item, type, key, val, currVal) => `
    <button id="${item._id}-${type}-${val}" class="stance-button${currVal === val ? ' selected-button' : ''}" data-${type}-${key}="${val}">
      ${key === 'mode' ? formatAtkMode(val) : Util.upperCaseFirst(val)}
    </button>
  `;
  const getRows = (item, type, rows) => rows.map(r => `
    <div id="${item._id}-${type}-${r.id}" class="flexrow stance-buttons">
      <label class="flex1 stance-label">${r.label}</label>
      <div class="flexrow flex4">${r.buttons}</div>
    </div>
  `).join('');
  
  const getShieldChoices = item => {
    const styles = ['stable','fluid'];
    const currHeight = item.data.data.shield_height || 'mid';
    const currStyle = item.data.data.shield_style || 'stable';
    const heightButtons = { id: 'heights', label: 'Height',  buttons: heights.map(h => getButton(item, 'shield', 'height', h, currHeight)).join('') };
    const styleButtons = { id: 'styles', label: 'Style', buttons: styles.map(s => getButton(item, 'shield', 'style', s, currStyle)).join('') };
    const rows = [styleButtons,heightButtons];

    return `
      <div id="${item._id}" style="margin-bottom:1em;">
        <label>${item.name}</label>
        <div style="padding-left:5px;">
          ${getRows(item, 'shield', rows)}
        </div>
      </div>
    `;
  };

  // style (fluid, stable, power), height (low, mid, high), timing (riposte, immediate, counter)
  const getWeaponChoices = (item, atkModes) => {
    const styles = ['stable','fluid','power'];
    const itemData = item.data.data;
    const currStyle = itemData.atk_style || 'stable';
    const currHeight = itemData.atk_height || 'mid';
    const currMode = itemData.atk_mode || atkModes[0];
    // const currGrip = itemData.atk_grip || 'normal';
    const currInit = itemData.atk_init || 'offense';
    // const grips = ['hammer','reverse'];
    // if (atkModes.includes('swi(s)')) grips.push('thumb');
    const inits = ['immediate','counter','riposte'];

    const styleButtons = { id: 'styles', label: 'Style', buttons: styles.map(s => getButton(item, 'atk', 'style', s, currStyle)).join('') };
    const heightButtons = { id: 'heights', label: 'Height',  buttons: heights.map(h => getButton(item, 'atk', 'height', h, currHeight)).join('') };
    const modeButtons = { id: 'modes', label: 'Mode',  buttons: atkModes.map(m => getButton(item, 'atk', 'mode', m, currMode)).join('') };
    // const gripButtons = { id: 'grips', label: 'Grip',  buttons: grips.map(g => getButton(item, 'atk', 'grip', g, currGrip)).join('') };
    const initButtons = { id: 'inits', label: 'Timing',  buttons: inits.map(i => getButton(item, 'atk', 'init', i, currInit)).join('') };

    const rows = [styleButtons,heightButtons,modeButtons,initButtons];

    return `
      <div id="${item._id}" style="margin-bottom:1em;">
        <label>${item.name}</label>
        <div style="padding-left:5px;">
          ${getRows(item, 'atk', rows)}
        </div>
      </div>
    `;
  };
  
  let content = ``;
  for (const w of weapons) {
    const weapAttrs = w.data.data.attributes;
    const atkModes = weapAttrs.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || [];
    if (atkModes.length && atkModes.some(a => !Object.keys(Constant.ATK_MODES).includes(a))) {
      return ui.notifications.error(`Invalid attack mode(s) specified for ${w.name}`);
    }

    content += getWeaponChoices(w, atkModes);
  }
  for (const s of shields) {
    content += getShieldChoices(s);
  }

  return new Dialog({
    title: `Set Stance`,
    content,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Submit`,
        callback: async html => {
          const addStance = (item, updates, content) => {
            const rows = ["atk_mode","atk_style","atk_height","atk_init","shield_style","shield_height"];
            const update = {'_id': item._id};
            const selections = {};
            const selectedButtons = html.find(`#${item._id} .selected-button`);
            selectedButtons.each(function() {
              const $button = $(this);
              for (const field of rows) {
                const newVal = $button.data(field.replace('_','-'));
                if (!newVal) continue;
                const oldVal = item.data.data[field];
                selections[field] = newVal;
                if (newVal !== oldVal) {
                  const key = `data.${field}`;
                  Object.assign(update, {[key]: newVal});
                }
              }
            });

            const shield = !!selections['shield_height'];
            const atkStyle = ` ${selections['atk_style']}`;
            const style = shield ? ` ${selections['shield_style']}` : atkStyle;
            const height = shield ? ` ${selections['shield_height']}` : ` ${selections['atk_height']}`;
            const atkForm = Constant.ATK_MODES[selections['atk_mode']]?.ATK_FORM;
            const mode = atkForm ? ` ${atkForm}ing` : '';
            // const grip = (selections['atk_grip'] == null || selections['atk_grip'] === 'hammer') ? '' :  ` in a ${selections['atk_grip']} grip`;
            const init = (selections['atk_init'] === 'riposte' || selections['atk_init'] === 'counter') ? ' and cedes the initiative' : '';
            const doChatMsg = Object.keys(update).length > 1;
            if (doChatMsg) {
              updates.push(update);
              const choiceDesc = `${style}${height}${mode}`;
              const contentDesc = `a${choiceDesc} guard with ${item.name}${init}.`
              content = !content ? `${actor.name} takes ${contentDesc}`
                : content.replace(/.$/,'') + ` and ${contentDesc}`;
            }
            return content;
          }
          const updates = [];
          let content = '';
          shields.forEach(s => content = addStance(s, updates, content));
          weapons.forEach(w => content = addStance(w, updates, content)); // TODO one chat msg for each dual wield/attack routine attack?
          actor.updateEmbeddedDocuments("Item", updates);
          Util.macroChatMessage(char.token, {
            content,
            flavor: `Set Stance`,
          }, true);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    render: html => {
      const stanceButtons = html.find(`.stance-button`);
      for (const button of stanceButtons) {
        const $button = $(button);
        $button.click(function() {
          const $button = $(this);
          if (!$button.hasClass("selected-button")) {
            $button.siblings().removeClass("selected-button");
            $button.addClass("selected-button");
          }
        });
      }
    },
    default: "one",
  }).render(true);
}

function formatAtkMode(mode) {
  const form = Constant.ATK_MODES[mode]?.ATK_FORM;
  return Util.upperCaseFirst(mode.replace(/^.*\(/, `${form} (`).replace(/(\([a-z]\))/, (match, p1) => p1.toUpperCase()));
} 

function resultStyle(bgColour) {
  return `background: ${bgColour}; padding: 1px 4px; border: 1px solid #4b4a44; border-radius: 2px; white-space: nowrap; word-break: break-all; font-style: normal;`;
}

function measureRange(token1, token2) {
  const canvasDistance = token1 && token2 ? (canvas.grid.grid.constructor.name === 'SquareGrid' ?
  canvas.grid.measureDistanceGrid(token1.position, token2.position) :
  canvas.grid.measureDistance(token1.position, token2.position)) : undefined;
  // return range rounded to 5'
  return Math.floor(+canvasDistance / Constant.SQUARE_SIZE) * Constant.SQUARE_SIZE;
}

function attackOptionsDialog(attackingActor, options, stanceDesc, title, choices, callback) {
  // TODO atk style modifies speed/impact? Or simply must be in fluid style to use preparatory actions and counter (unless masterstrike)
  // attacking while counter/riposte resets timing to immediate UNLESS parrying with offhand weapon. Then it is persistent on offhand and attacks only with main hand
  // buttons - 
  // preparatory: None, Feint (proficient), Beat (proficient), Hook Shield (axe, proficient), Bind (specialize)
  // attack - attack modes, moulinet (swing, one for each swing atk mode -- specialize), the masterstrikes (obviate feint/beat/bind vs. certain stances, mastery, some require thumb grip)
  const content = `
    <div class="flexrow stance-buttons">
      <label class="flex1 stance-label">Stance</label>
      <div class="flexrow flex4">${stanceDesc}</div>
    </div>
    <div class="flexrow aim-buttons">
      ${Object.keys(choices).includes('head') ? `<button class="choice-button" value="head">Head (${choices.head})</button>` : ''}
    </div>
    <div class="flexrow aim-buttons">
      ${Object.keys(choices).includes('right_arm') ? `<button class="choice-button" value="right_arm">R. Arm (${choices.right_arm})</button>` : ''}
      ${Object.keys(choices).includes('upper_torso') ? `<button class="choice-button" value="upper_torso">U. Torso (${choices.upper_torso})</button>` : ''}
      ${Object.keys(choices).includes('left_arm') ? `<button class="choice-button" value="left_arm">L. Arm (${choices.left_arm})</button>` : ''}
    </div>
    <div class="flexrow aim-buttons">
      ${Object.keys(choices).includes('lower_torso') ? `<button class="choice-button" value="lower_torso">L. Torso (${choices.lower_torso})</button>` : ''}
    </div>
    <div class="flexrow aim-buttons">
      ${Object.keys(choices).includes('right_leg') ? `<button class="choice-button" value="right_leg">R. Leg (${choices.right_leg})</button>` : ''}
      ${Object.keys(choices).includes('left_leg') ? `<button class="choice-button" value="left_leg">L. Leg (${choices.left_leg})</button>` : ''}
    </div>
  `;

  const d = new Dialog({
    title,
    content,
    buttons: {},
    render: html => {
      const $buttons = html.find(`button`);
      $buttons.click(function() {
        const $button = $(this);
        const value = $button.val();
        options.shownAltDialog= true;
        options.altDialogChoice = value;
        callback();
        return closeDialog();
      });
    },
    default: "one",
  })
  function closeDialog() {
    d.close();
  }
  d.render(true);
}

function altDialog(options, title, buttons) {
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
        return button.callback();
      }
    }]));
  }
}

function modDialog(options, title, fields=[{label:'', key:'', placeholder:''}], callback) {
  let formFields = ``;
  fields.forEach(field => {
    formFields += `<div class="form-group">
                    <label>${field.label}</label>
                    <input type="text" id="${field.key}" placeholder="${field.placeholder || 'e.g. +2, -4'}">
                  </div>`;
  });
  const content = `<form>${formFields}</form>`;
  new Dialog({
    title: 'Modify ' + title,
    content,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Submit`,
        callback: html => {
          options.shownModDialog = true;
          fields.forEach(field => {
            options[field.key] = html.find(`[id=${field.key}]`)?.val().trim().toLowerCase().replace('x','*');
          });
          callback();
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => console.log("Cancelled modifier dialog")
      }
    },
    default: "one",
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
  const attitudeObj = attitudeMap[targetActor._id];
  let attitude = attitudeObj?.attitude;
  const flavor = options.flavor || 'Reaction Roll'

  if ( options.override === true || !attitude || targetLevel > attitudeObj.lvl ) {
    if ( options.showModDialog && !options.shownModDialog ) {
      const fields = [
        {label: `${Util.upperCaseFirst(flavor.toLowerCase())} modifiers`, key: 'dialogMod'}
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
        [targetActor._id]: {attitude: attitude, lvl: targetLevel}
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
    // const attitudeText = `<span style="${resultStyle(attitudeColours[attitude])}">${attitude.toUpperCase()}</span>`;
    const attitudeText = `${reactingActor.name} considers ${targetActor.name} (${Util.chatInlineRoll(rxnText)}) and feels ${attitude}...`;
    const chatData = {
      content: attitudeText,
      flavor: `Reaction Roll vs. ${targetActor.name}`
    }
    const token = Util.getTokenFromActor(reactingActor);
    Util.macroChatMessage(reactingActor, chatData, false);
    Util.chatBubble(token, `${reactingActor.name} considers ${targetActor.name}`, {emote: true});
  }

  return attitude;
}

export async function buyMacro(item, priceInCp, merchant, qty, options={}) {
  if (!priceInCp) return;
  const token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : undefined;
  const actor = game.user.character || token?.actor;
  const sameActor = actor?.isToken ? merchant.isToken && actor.token._id === merchant.token._id :
    actor?._id === merchant._id;
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
  const actorItems = actor.data.items;
  const gpItem = actorItems.find(i => Util.stringMatch(i.name, 'Gold Pieces'));
  const gp = +gpItem?.data.data.quantity || 0;
  const gpInCp = gp * Constant.CURRENCY_RATIOS.cps_per_gp;
  const spItem = actorItems.find(i => Util.stringMatch(i.name, 'Silver Pieces'));
  const sp = +spItem?.data.data.quantity || 0;
  const spInCp = sp * Constant.CURRENCY_RATIOS.cps_per_sp;
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
      content: `${actor.name} tries to buy ${qty} ${item.name}${qty > 1 ? 's' : ''} for ${totalPriceString}, but doesn't have enough money. The merchant appears annoyed.`,
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
    spUpdateQty = Math.floor(changeInCp / Constant.CURRENCY_RATIOS.cps_per_sp);
    cpUpdateQty = changeInCp - spUpdateQty * Constant.CURRENCY_RATIOS.cps_per_sp;
  // case 4: payment requires gp
  } else {
    let changeInCp = totalMoneyInCp - totalPriceInCp;
    gpUpdateQty = Math.floor(changeInCp / Constant.CURRENCY_RATIOS.cps_per_gp);
    changeInCp -= gpUpdateQty * Constant.CURRENCY_RATIOS.cps_per_gp;
    spUpdateQty = Math.floor(changeInCp / Constant.CURRENCY_RATIOS.cps_per_sp);
    cpUpdateQty = changeInCp - spUpdateQty * Constant.CURRENCY_RATIOS.cps_per_sp;
  }
  const cpUpdate = {_id: cpItem?._id, "data.quantity": cpUpdateQty},
        spUpdate = {_id: spItem?._id, "data.quantity": spUpdateQty},
        gpUpdate = {_id: gpItem?._id, "data.quantity": gpUpdateQty};
  // add to updates if item has id and update quantity is different than existing quantity
  const updates = [cpUpdate, spUpdate, gpUpdate].filter( u => u._id &&
    u["data.quantity"] !== Number(actorItems.get(u._id)?.data.data.quantity));
  
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
      default: "one",
     }).render(true);
  }

  return finalizePurchase();

  async function finalizePurchase() {
    await actor.updateEmbeddedDocuments("Item", updates);
    await merchant.updateEmbeddedDocuments("Item", [{'_id': item._id, 'data.quantity': merchantQty - qty}]);
    await merchant.update({"data.attributes.gold.value": merchantGold + Math.floor(totalPriceInCp / Constant.CURRENCY_RATIOS.cps_per_gp)});

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
      content: `${actor.name} buys ${qty} ${item.name}${qty > 1 ? 's' : ''} from ${merchant.name} for ${totalPriceString}.`,
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
    },
    default: "one",
  }).render(true);
}

export async function applyFatigue(actorId, type, execTime, newTime, heal=false) {
  const actor = game.actors.get(actorId);
  if (!actor) return;

  const isResting = game.cub.hasCondition('Rest', actor, {warn: false});
  if (isResting) return;
  
  if ( Util.stringMatch(type, 'exhaustion')) {
    const isAsleep = game.cub.hasCondition('Asleep', actor, {warn: false});
    if (isAsleep) return;
  }

  let dmgMulti = 0;
  let typeString = type;

  if (type == 'exposure') {
    const isWarm = game.cub.hasCondition('Warm', actor, {warn: false});
    if (isWarm) return;
    
    const diffClo = Fatigue.diffClo(actor);
    dmgMulti = Math.floor(Math.abs(diffClo) / 10);
    if (!dmgMulti) return;
    typeString = diffClo < 0 ? 'cold' : 'heat';
  }
  
  const clock = Fatigue.CLOCKS[type];
  const { damageDice, damageInterval } = clock;
  const intervalInSeconds = Util.intervalInSeconds(damageInterval);
  const extraDice = Math.max(0, Math.floor((newTime - execTime) / intervalInSeconds));
  const numDice = 1 + extraDice;
  const dice = `${numDice}${damageDice}${dmgMulti ? `*${dmgMulti}` : ''}`;

  const result = await applyFatigueDamage(actor, typeString, dice, heal);
  const data = actor.getFlag("lostlands", type) || {};
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

  const content = `${actor.name} takes ${Util.chatInlineRoll(result)} point${result > 1 ? 's' : ''} of ${heal ? `healing` : 'damage'} from ${type}.`;
  flavor = flavor || Util.upperCaseFirst(type);

  await Util.macroChatMessage(actor, { content, flavor }, false);
  await actor.update(update);

  return appliedResult;
}

async function applyRest(actor, wakeTime, sleptTime, restType='Rough') {

  // subtract first 6 hours of slept time before calculating extra healing dice
  sleptTime = sleptTime - Constant.SECONDS_IN_HOUR * 6;
  const extraDice = Math.max(0, Math.floor(sleptTime / Constant.SECONDS_IN_DAY));
  const numDice = 1 + extraDice;
  const hasBedroll = actor.items.some(i => i.type === 'item' && Util.stringMatch(i.name, "Bedroll"));
  const restDice = Util.stringMatch(restType, 'Rough') ? hasBedroll ? 'd3' : 'd2' : Fatigue.REST_TYPES[restType];
  const dice = `${numDice}${restDice}`;
  const flavor = `Rest (${restType})`;

  const wearingMetalArmor = actor.items.some(i => i.data.data.worn && !!i.data.data.attributes.metal?.value);
  if (wearingMetalArmor) {
    return Util.macroChatMessage(actor, {
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

// export async function addRemovedBodyPart(part=null, options={}) {
//   if (!game.user.isGM) return ui.notifications.error(`You shouldn't be here...`);

//   const char = Util.selectedCharacter();
//   const actor = char.actor;

//   const removedParts = actor.getFlag("lostlands", "removedParts") || [];

// }

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
  const actorId = actor._id;
  const scope = {actorId, disease};
  const command = Fatigue.DISEASE_DAMAGE_COMMAND;
  const macro = await Util.getMacroByCommand(`${command}`, `return game.lostlands.Macro.${command};`);
  const intervalId = await TimeQ.doEvery(interval, startTime, macro._id, scope);

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
    confirmed && await Util.macroChatMessage(actor, {
      content: `${actor.name}'s ${disease} has resolved.`,
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
    await Util.macroChatMessage(actor, { content: `${actor.name} feels unwell...`, flavor }, false);
    // await Util.addCondition("Diseased", actor);
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
