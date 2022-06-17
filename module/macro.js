import * as Constant from "./constants.js";
import { TimeQ } from "./time-queue.js";
import * as Util from "./utils.js";
import * as Fatigue from "./fatigue.js";
import * as Dialog from "./dialogs.js";
import { attack } from "./combat.js";

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

export function selectRestDice(actor, options={}) { // TODO fix this and add disease dialog since changing altDialog params
  if (!game.user.isGM) return ui.notifications.error(`You shouldn't be here...`);

  const choice = options.altDialogChoice;

  if (choice) {
    return actor.setFlag("lostlands", "restDice", choice);
  }
  
  const choices = Object.entries(Fatigue.REST_TYPES).map(type => {
    return {
      label: `${type[0]}<br>${type[1] ? type[1] : 'd2/d3'}`,
      value: type[0],
      callback: () => selectRestDice(actor, options),
    };
  });
  
  return Dialog.altDialog(options, `${actor.name} Rest Dice`, choices);
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
    return Fatigue.deleteAllDiseases(actor); 
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
    return Dialog.modDialog(options, `Use ${item.name}`, [field], () => useChargedItem(itemId, options));
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
  const target = {
    token: options.targetToken || targets[ranTargetIndex],
    update: {},
    itemUpdates:[],
  } ;

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
      update: {},
      itemUpdates:[],
    })
  }

  return attack(attackers, target, options);
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
  const target = {
    token: targets[ranTargetIndex],
    update: {},
    itemUpdates:[],
  } ;

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
    throwable: false,
    update: {},
    itemUpdates:[],
  })

  return attack(attackers, target, options);
}

export function attackRoutineMacro(options={}) {
  const selectedTokens = canvas.tokens.controlled;
  if (!selectedTokens.length) return ui.notifications.error("Select attacking token(s)");
  const targets = [...game.user.targets];
  const ranTarget = targets.length > 1;
  const ranTargetIndex = Math.floor(Math.random() * targets.length);
  const target = {
    token: targets[ranTargetIndex],
    update: {},
    itemUpdates:[],
  };
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
      attacks: [],
      update: {},
      itemUpdates:[],
    })
  }
  return attack(attackers, target, options);
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
  if (!tokens.length) return;
  const token = tokens[0];
  const actor = token.actor;
  if (!actor) return;
  const saveTarget = +actor.data.data.sv || 0;
  if (!saveTarget) {
    ui.notifications.error(`${actor.name} has no save target number set`);
    tokens.shift();
    return save(tokens, damage, options);
  }

  // get roll modifiers
  // press alt to make a mental attack save, i.e. modified by wis
  const saveVsMental = !!options.showAltDialog;
  const saveAttr = options.saveAttr || (saveVsMental ? 'wis' : '');
  const saveAttrMod = saveAttr ? +actor.data.data[`${saveAttr}_mod`] : 0;
  const d20Result = await new Roll("d20").evaluate().total;
  // mod dialog
  const modDialogFlavor = options.flavor || 'Saving Throw';
  if (options.showModDialog && !options.shownModDialog) {

    const fields = [{label: 'Save modifiers', key: 'dialogMod'}];
    return Dialog.modDialog(options, modDialogFlavor, fields, () => save(tokens, damage, options));
  }
  let dialogMod = '';
  try {
    dialogMod = options.dialogMod ? await new Roll(options.dialogMod).evaluate().total : '';
  } catch {
    ui.notifications.error("Invalid input to modifier dialog");
    options.shownModDialog = false;
    return save(tokens, damage, options);
  }

  const saveText = `${d20Result}${saveAttrMod ? `+${saveAttrMod}` : ''}${dialogMod ? `+${dialogMod}` : ''}`;
  const savingThrowResult = await Util.rollDice(saveText);
  // d20 roll of 1 always fails
  const success = d20Result !== 1 && savingThrowResult >= saveTarget;
  const resultText = ` vs. SV ${saveTarget}`
    + ( success ? ` <span style="${Util.resultStyle('#7CCD7C')}">SUCCESS</span>`
    : ` <span style="${Util.resultStyle('#EE6363')}">FAIL</span>` );

  let content = `${actor.name} saves${saveVsMental ? ' vs. mental attack' : ''} ${Util.chatInlineRoll(saveText)}${resultText}`;
  let flavor = options.flavor || 'Saving Throw';

  // save for half damage
  if (damage) {
    const mdr = Math.min(5, +actor.data.data.ac?.mdr || 0);
    damage = Math.floor(damage * (6 - mdr) / 6);
    const takenDamage = success ? Math.floor(damage / 2) : damage;
    content += ` for ${Util.chatInlineRoll(takenDamage)} damage.`;
    flavor = `Save for Half ${damage} Damage`;
    const currentHp = +actor.data.data.hp?.value;
    if ( !isNaN(currentHp) && takenDamage && ( game.user.isGM || token.actor.isOwner ) ) {
      actor.update({"data.hp.value": currentHp - takenDamage});
    } 
  }

  // critical fails TODO handle this in separate skill test macro
  const critFail = d20Result === 1 && options.critFailText;
  if(critFail) {
    content += `${options.critFailText}`;
    // broken item
    if (options.critFailBrokenItem) {
      const itemQty = +options.critFailBrokenItem.data.data.quantity;
      const qtyUpdate = itemQty - 1;
      options.sound = options.critFailSound || options.sound;
      try {
        await actor.updateEmbeddedDocuments("Item", [{'_id': options.critFailBrokenItem._id, 'data.quantity': qtyUpdate}]);
      } catch {
        ui.notifications.error(`Error updating quantity of ${options.critFailBrokenItem.name}`);
      }
    }
  }
  
  const chatBubbleText = options.bubbleText;
  Util.macroChatMessage(token, {
    content: content, 
    flavor: flavor,
    sound: options.sound
  }, false);
  Util.chatBubble(token, chatBubbleText);
  
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
//       hitText: `<span style="${Util.resultStyle('#FFFF5C')}">BACKSTAB</span>`
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
  const target = {
    token: targets[ranTargetIndex],
    update: {},
    itemUpdates:[],
  };

  const attackers = [];
  for(const token of selectedTokens) {
    attackers.push({
      token: token,
      weapons: weapons,
      ranTarget,
      chatMsgData: { content: '', flavor: '', sound: '', bubbleString: '' },
      attacks: [],
      update: {},
      itemUpdates:[],
    })
  }

  return attack(attackers, target, options);
}

export function setStanceMacro(options={}) { // TODO refactor into separate wrapper and dialog function in dialogs.js
  return Dialog.setStanceDialog(options);
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
      return Dialog.modDialog(options, flavor, fields, () => reactionRoll(reactingActor, targetActor, options));
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
    // const attitudeText = `<span style="${Util.resultStyle(attitudeColours[attitude])}">${attitude.toUpperCase()}</span>`;
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
    return Dialog.itemSplitDialog(merchantQty, item, priceInCp, merchant, options);
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

export async function applyFatigue(actorId, type, execTime, newTime, heal=false) {
  const actor = game.actors.get(actorId);
  if (!actor) return;

  // only apply fatigue damage if actor is in the current scene
  const token = Util.getTokenFromActor(actor);
  if (!token) return;

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
    const dmgMulti = Fatigue.getExposureCondition(diffClo).dmgMulti;
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
  if (actor && Util.actorIsDead(actor)) return 0;

  let result = await Util.rollDice(dice);
  let appliedResult = result;
  let update;
  
  if (heal) {
    appliedResult = Math.min(result, maxHp - hp);
    const hpUpdate = hp + appliedResult;
    update = {"data.hp.value": hpUpdate};
  } else {
    const maxHpUpdate = maxHp - result;
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
      return {
        label: Util.upperCaseFirst(type),
        value: type,
        callback: () => addDisease(null, options),
      };
    });
    return Dialog.altDialog(options, `Add Disease to ${actor.name}`, choices);
  }

  const charDiseases = actor.getFlag("lostlands", "disease") || {};
  if ( !options.shownConfirmDialog && charDiseases.hasOwnProperty(disease)) {
    return ui.notifications.error(`${actor.name} already has ${disease}`);
  } 

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
    confirmed: false,
    maxHpDamage: 0,
  };

  await actor.setFlag("lostlands", "disease", charDiseases);

  return ui.notifications.info(`Added ${Util.upperCaseFirst(disease)} to ${actor.name}`);
}

export async function applyDisease(actorId, disease, execTime, newTime) {
  const actor = game.actors.get(actorId);
  if (!actor) return;

  // only apply fatigue damage if actor is in the current scene
  const token = Util.getTokenFromActor(actor);
  if (!token) return;

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
    return Dialog.confirmDiseaseDialog(actor, disease, () => confirmDisease(), () => Fatigue.deleteDisease(actor, disease));
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
  actorDiseases[disease].maxHpDamage = Number(actorDiseases[disease].maxHpDamage + result) || result;
  await actor.setFlag("lostlands", "disease", actorDiseases);

  if (resolved) return resolveDisease();

  return true;
}

export async function clearFatigueDamageMacro() {
  if (!game.user.isGM) return ui.notifications.error(`You shouldn't be here...`);
  const char = Util.selectedCharacter();
  const actor = char.actor;
  const healedDamage = await Fatigue.clearMaxHpDamage(actor);
  const message = healedDamage > 0 ? `Cleared ${healedDamage} max HP damage from ${actor.name}`
    : `No max HP damage to clear from ${actor.name}`;

  return ui.notifications.info(message);
}
