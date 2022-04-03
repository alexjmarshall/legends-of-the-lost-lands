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
      i.data.data.attributes.atk_modes &&
      i.data.data.attributes.size &&
      (i.data.data.held_left || i.data.data.held_right)
    );
    if ( weapons.some(w => !Object.keys(Constant.SIZE_VALUES).includes(w.data.data.attributes.size.value.toUpperCase())) ) {
      return ui.notifications.error("Invalid weapon size specified");
    }

    const hasSweepWeap = weapons.find(i => i.data.data.attributes.sweep?.value);
    const sweeping = hasSweepWeap && ranTarget && targets.length <= 4 && selectedTokens.length === 1 && !options.skipSweep;
    if (sweeping) {
      options.skipSweep = true;
      options.atkMod = -4;
      options.atkMode = 'swing(s)';
      for (const t of targets) {
        options.targetToken = t;
        heldWeaponAttackMacro(options);
        await Util.wait(500);
      }
      return;
    }

    // if no weapons, return error if hands full, otherwise add dummy weapon object
    const numHeld = actor.items.filter(i => i.type === 'item' && (i.data.data.held_left || i.data.data.held_right)).length;
    const unarmed = !weapons.length;
    if (unarmed) {
      if (numHeld) return ui.notifications.error("Not holding any weapons");
      weapons.push({id:'1', name: 'Fists'});
    }

    // TODO drag token on top of another owned token of larger size to mount them -- set mounted flag. Drag away to unmount.

    // sort weapons by size ascending
    weapons.sort((a,b) => Util.sizeComparator(a,b));
    
    // if wearing a shield and holding multiple weapons, can only use biggest one
    if (weapons.length > 1) {
      const wearingShield = token.actor.data.items.some(i => i.type === 'item' &&
                            i.data.data.worn && !!i.data.data.attributes.shield?.value);
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
    weapons: [{_id: itemId, atkMode: 'swing(s)'}],
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
    const attacks = attackNames.map(a => Object.create({id: a}));
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
  let content = `${actor.name} saves ${Util.chatInlineRoll(saveText)}${resultText}`;
  content += `${damage ? ` for ${Util.chatInlineRoll(takenDamage)} damage` : ``}${critFail ? `${options.critFailText}` : ``}`;
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
  if (targets.length > 1) return ui.notifications.error("Select one target");
  const targetToken = targets[0];

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
    const heldWeapons = token.actor.items.filter(i => i.type === 'item' && (i.data.data.held_left || i.data.data.held_right));
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
      ui.notifications.error(`${token.actor.name} cannot backstab with ${weapon.name}`);
      continue;
    }
    const flavor = `${weapon.name} (backstab)`;
    attackers.push({
      token: token,
      weapons: [{id: weapon._id, dmgType: 'thrust'}], // TODO
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
*  offhand: true/false -- flagged false by monster attackRoutineMacro
*  atk_mode
*  showModDialog: true/false
*  skipThrowDialog: true/false
*  dialogAtkMod: (value)
*  dialogDmgMod: (value)
*  applyEffect: true/false
*  throwable: true/false -- item attribute
*  reach: true/false -- item attribute
*  maxRange: (value) -- item attribute
*  dmgType: cut/thrust/hew/bludgeon/throw/slingstone/arrow/bolt/punch/grapple/hook  -- item attribute
*  fragile: true/false -- item attribute
*  finesse: true/false -- item attribute
*  unwieldly: true/false -- item attribute
*  critMin: (value) -- item attribute
* }
* required weapon item attributes:
* atk_modes: swing (blunt), swing (slashing), swing (piercing), thrust (blunt), thrust (slashing), thrust (piercing),
*            shoot (blunt), shoot (slashing), shoot (piercing), throw (blunt), throw (slashing), throw (piercing)
* size: T, S, M, L, H, G
* TODO +1 to hit if holding only 1 weapon of same size as character -- add flag for being held in 2 hands...another hand button to char sheet?
* TODO make attack routine work with features not held items
* features NOT automated: mounted bonus, mounted charge
* separate macro for touch attacks -- touch attack uses Dex to attack and dodge TODO derive touch AC again for actors
* TODO if select random targets (at least 3) and shoot attack, waive ranged penalty
* test whether range works with other units or only feet
*/
export async function attackMacro(weapons, options={}) {
  if (!Array.isArray(weapons)) weapons = [weapons];
  weapons = weapons.map(a => Object.create({id: a}));
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
  const weapons = attacker.weapons;
  const weapon = weapons[0];
  const range = measureRange(token, targetToken);
  const attackerSize = Constant.SIZE_VALUES[attackerRollData.size];
  const targetSize = Constant.SIZE_VALUES[targetRollData?.size];

  // if this attacker's weapons are finished, remove attacker and create attack chat msg // TODO update text of reaction roll to match attack roll
  if (!weapons.length) {
    chatMsgData.flavor = attacker.flavor || chatMsgData.flavor;
    // remove comma at end of flavor and add names
    chatMsgData.flavor = chatMsgData.flavor.replace(/,\s*$/, '') + `${targetActor ? ` vs. ${targetActor.name}` : ''}`;
    // add follow up attack to content
    const followAttackText = ` and ${attackingActor.name} is fast enough to attack again!`
    if (attacker.followAttack && !attacker.kill) chatMsgData.content = chatMsgData.content.replace(/!<br>\s*$|\.<br>\s*$/, '') + followAttackText;
    Util.macroChatMessage(token, chatMsgData, false);
    const chatBubbleString = attacker.bubbleString || chatMsgData.bubbleString;
    Util.chatBubble(token, chatBubbleString);

    for (const attack of attacks) {
      attack.sound && Util.playSound(`${attack.sound}`, token, {push: true, bubble: false});
      const targetHp = +targetToken?.actor.data.data.hp?.value;
      const hpUpdate = targetHp - attack.damage;
      const update = {"data.hp.value": hpUpdate};
      if (attack.energyDrainDamage) {
        const maxHp = +targetToken?.actor.data.data.hp?.max;
        const dmg = Math.min(attack.energyDrainDamage, maxHp);
        Object.assign(update, {"data.hp.max": maxHp - dmg});
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
  let weaponItem;
  if (attacker.unarmed) {
    weaponItem = {
      name: 'Fist',
      data:{
        data: {
          held_left: true,
          held_right: true,
          attributes: {
            atk_mod: { value: 0 },
            dmg: { value: '1d2/1d2' },
            atk_modes: { value: 'Swing (B), Thrust (B)' },
            double_weapon: { value: true },
            reach: { value: '0,1'},
          },
          quantity: 2
        }
      }
    }
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
  const weapSpeed = +weapAttrs.speed?.value || 10 - attackerSize * 2;
  const targetWeapSpeeds = targetActor?.items.filter(i => i.data.data.held_left || i.data.data.held_right).map(i => +i.data.data.attributes.speed?.value).filter(i => i) || [];
  const targetWeapSpeed = targetWeapSpeeds.length ? Math.min(...targetWeapSpeeds) : 10 - targetSize;
  const weapSize = Constant.SIZE_VALUES[weapAttrs.size?.value];
  const weapCategory = weapAttrs.category?.value;
  const parryBonus = +weapAttrs.parry_bonus?.value;
  const weapDmgVsLrg = weapAttrs.dmg_vs_large?.value || 0;
  let weapDmg = weapAttrs.dmg?.value;
  const weaponHeldTwoHands = !!weaponItem.data.data.held_left && !!weaponItem.data.data.held_right;
  let weapAtkMod = +weapAttrs.atk_mod?.value || 0;
  let sitAtkMod = 0;
  let sitDmgMod = 0;


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

  // atk modes
  const atkModes = weapAttrs.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || [];
  if (atkModes.length && atkModes.some(a => !Object.keys(Constant.ATK_MODES).includes(a))) {
    ui.notifications.error("Invalid attack mode(s) specified");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const defaultThrowAtkMode = atkModes.find(a => a.includes('throw'));
  let throwable = attacker.throwable ?? (weapAttrs.range?.value && defaultThrowAtkMode);

  // reach values
  const reachValues = weapAttrs.reach?.value.split(',').map(n => Number(n)).filter(t => t) || [];

  // subtract 1 from max reach if not holding the weapon with both hands
  const hasMaxReach = reachValues.length > 1;
  if (!weaponHeldTwoHands && hasMaxReach) {
    reachValues[reachValues.length - 1] = Math.min(reachValues[reachValues.length - 1] - 1, reachValues[0]);
  }

  // weapon tags
  const bonusToGroups = !!weapAttrs.bonus_to_groups?.value;
  const bonusToShields = !!weapAttrs.bonus_to_shields?.value; // TODO test monster attacks with attack routine and feature items not held weapons
  const chainWeapon = !!weapAttrs.chain_weapon?.value;
  const fragile = !!weapAttrs.fragile?.value;
  const unwieldy = !!weapAttrs.unwieldy?.value;
  const reload = !!weapAttrs.reload?.value;
  const energyDrain = !!weapAttrs.energy_drain?.value;
  
  // reload item if needed
  const loaded =  weaponItem.data.data.loaded;
  if ( reload && !loaded ) {
    await token.actor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.loaded': true}]);
    chatMsgData.content += `${attackingActor.name} reloads ${weapName}<br>`;
    weapons.shift();
    return attack(attackers, targetToken, options);
  }

  // automatic throw if target beyond max reach in feet
  const maxReach = reachValues[reachValues.length - 1] * 5 || -1;
  if ( range > maxReach && throwable && weapon.atkMode == null ) {
    weapon.atkMode = defaultThrowAtkMode;
    attacker.showAltDialog = false;
  }
  
  const mainhand = weapon.mainhand && options.twoWeaponFighting !== false;
  const offhand = weapon.offhand && options.twoWeaponFighting !== false;
  
  // can't use offhand weapon when wearing a shield
  const wearingShield = actorItems.some(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield?.value);
  if ( offhand === true && wearingShield ) {
    weapons.shift();
    return attack(attackers, targetToken, options);
  }

  // attack choice dialog
  const formatAtkMode = (mode) => Util.upperCaseFirst(mode.replace(/\(/, ' (').replace(/(\([a-z]\))/, (match, p1) => p1.toUpperCase()));

  // add parry choice if weapon has parry bonus defined
  parryBonus && atkModes.push('parry');

  const choices = atkModes.map(mode => {
    return {
      label: formatAtkMode(mode), 
      value: mode, 
      callback: () => attack(attackers, targetToken, options)
    }
  });

  if ( choices.length && options.showAltDialog && attacker.showAltDialog !== false && !weapon.shownAltDialog ) {
    return altDialog(
      weapon, 
      `${weapon.name} Attack Mode`, 
      choices
    );
  }

  if ( weaponItem._id && weapon.altDialogChoice && weapon.altDialogChoice !== weaponItem.data.data.atk_mode ) {
    try {
      await attackingActor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.atk_mode': weapon.altDialogChoice}]);
    } catch (error) {
      ui.notifications.error(`error updating stored atk_mode for ${weaponItem.name}, ${error}`);
    }
    if (Util.stringMatch(weapon.altDialogChoice, 'parry')) {
      Util.macroChatMessage(token, {
        content: `${attackingActor.name} takes a parrying stance with ${weaponItem.name}`,
        flavor: `${weaponItem.name} (parry)`
      }, false);
      weapons.shift();
      return attack(attackers, targetToken, options);
    }
  } else if (Util.stringMatch(weaponItem.data.data.atk_mode, 'parry')) {
    // reset parry
    try {
      await attackingActor.updateEmbeddedDocuments("Item", [{'_id': weaponItem._id, 'data.atk_mode': choices[0].value}]);
    } catch (error) {
      ui.notifications.error(`error updating stored atk_mode for ${weaponItem.name}, ${error}`);
    }
  }

  let atkMode = weapon.atkMode || weaponItem.data.data.atk_mode || weapon.altDialogChoice || atkModes[0];

  if (Util.stringMatch(atkMode, 'parry')) {
    weapons.shift();
    if (!weapons.length) {
      ui.notifications.notify(`Parrying with ${weaponItem.name}`);
    }
    return attack(attackers, targetToken, options);
  }

  const atkType = Constant.ATK_MODES[atkMode]?.ATK_TYPE || 'melee';
  let dmgType = Constant.ATK_MODES[atkMode]?.DMG_TYPE || 'blunt';
  let atkForm = Constant.ATK_MODES[atkMode]?.ATK_FORM || 'attack';

  const thrown = atkForm === 'throw';
  // throwing offhand weapon is not allowed
  if ( offhand === true && thrown ) {
    weapons.shift();
    return attack(attackers, targetToken, options);
  }

  // check if target is beyond reach/range
  const weaponRange = +weapAttrs.range?.value;
  const missileAtk = atkType === 'missile';
  if (missileAtk && !weaponRange) {
    ui.notifications.error("Invalid range specified");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  if (!missileAtk && (!maxReach || maxReach < 0)) {
    ui.notifications.error("Invalid reach specified");
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const maxRange = missileAtk ? weaponRange : maxReach;
  if (range > +maxRange) {
    ui.notifications.error(`Target is beyond the ${missileAtk ? 'range' : 'reach'} of ${weapon.name}`);
    weapons.shift();
    return attack(attackers, targetToken, options);
  }
  const minReach = reachValues[0] * 5 || -1;
  if (range < +minReach) {
    weapDmg = '1d3';
    dmgType = 'blunt';
    atkForm = 'thrust';
  }

  // mod dialog
  if ( options.showModDialog && !options.shownModDialog ) {
    const fields = [
      {label: 'Attack modifiers?', key: 'dialogAtkMod'}
    ];
    if (!attacker.skipDmgDialog) fields.push({label: 'Damage modifiers?', key: 'dialogDmgMod'});
    return modDialog(options, 'Attack', fields, () => attack(attackers, targetToken, options));
  }
  let dialogAtkMod = 0, dialogDmgMod = 0;
  try {
    dialogAtkMod = options.dialogAtkMod ? await new Roll(options.dialogAtkMod).evaluate().total : 0;
    dialogDmgMod = options.dialogDmgMod ? await new Roll(options.dialogDmgMod).evaluate().total : 0;
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
  const atkAttr = Constant.ATK_MODES[atkMode].ATK_ATTR;
  const dmgAttr = Constant.ATK_MODES[atkMode].DMG_ATTR;
  const attrAtkMod = attackerRollData[`${atkAttr}_mod`] || 0;
  const attrDmgMod = attackerRollData[`${dmgAttr}_mod`] || 0;
  const attackerAttrAtkMod = attackerRollData.atk_mod || 0;
  const attackerAttrDmgMod = attackerRollData.dmg_mod || 0;
  const attackerAtkMod = attacker.atkMod || 0;
  const attackerDmgMod = attacker.dmgMod || 0;
  const weapProfs = Array.isArray(attackerRollData.weap_profs) ? attackerRollData.weap_profs : 
    Util.getArrFromCSL(attackerRollData.weap_profs || '').map(p => p.toLowerCase());

  // get target's properties
  // can be immune to lucky hits, critical hits, bleed, knockdown and impale
  const immuneLuckyHits = !!targetRollData?.immune_lucky_hits;
  const immuneCriticalHits = !!targetRollData?.immune_critical_hits; /// || attackingActor._id === targetActor?._id;
  const immuneBleed = !!targetRollData?.immune_bleed;
  const immuneKnockdown = !!targetRollData?.immune_knockdown;
  const immuneImpale = !!targetRollData?.immune_impale;

  // situational mods
  // +1 if holding a weapon of same size in both hands
  if (weapSize === attackerSize && weaponHeldTwoHands) sitAtkMod++;
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
  if ( weapons.length === 1 && speedDiff > 0 && await Util.rollDice('d100') <= followAttackChance) {
    attacker.followAttack = true;
  }
  // -2 if weapon category defined but not in attacker's weapon proficiencies
  // TODO weap specialization and mastery
  if (weapCategory != null && !weapProfs.includes(weapCategory)) {
    sitAtkMod = sitAtkMod - 2;
  }
  // dmg bonus vs. large
  if (targetSize > 2) {
    sitDmgMod += weapDmgVsLrg;
  }



  // determine range penalty, handle missile situational mods, and reduce qty of thrown weapon/missile
  let rangePenalty = 0;
  if (atkType === 'missile') {
    rangePenalty = attacker.ranTarget ? 0 : -Math.abs(Math.floor(range / 10)) || 0;
    // bonus to groups
    if (attacker.ranTarget && bonusToGroups) {
      sitAtkMod =  sitAtkMod + 2;
    }
    // bonus to-hit large monsters with missiles
    if (targetSize > 2) {
      sitAtkMod =  sitAtkMod + 2;
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
    } else {
      const quiver = token.actor.items.find(i => i.data.data.worn && i.data.data.attributes.quiver?.value);
      const quiverQty = quiver?.data.data.quantity;

      try {
        if( !quiver || !quiverQty ) {
          throw new Error("Nothing found to shoot from this weapon");
        }
        const itemsUpdate = [{'_id': quiver._id, 'data.quantity': quiverQty - 1}];
        // set crossbow to unloaded
        if (reloadable) itemsUpdate.push({'_id': weaponItem._id, 'data.loaded': false});
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
  let totalAtk = `${d20Result}+${bab}+${attrAtkMod}+${twoWeaponFightingPenalty}+${attackerAttrAtkMod}+${attackerAtkMod}+${weapAtkMod}+${rangePenalty}+${sitAtkMod}+${dialogAtkMod}`;
  let totalAtkResult = await Util.rollDice(totalAtk);
  const hitSound = weapon.hitSound ?? Constant.ATK_MODES[atkMode]?.HIT_SOUND;
  const missSound = weapon.missSound ?? Constant.ATK_MODES[atkMode]?.MISS_SOUND;
  let hitDesc = '';
  let missDesc = '';
  let resultText = '';
  let dmgEffect = '';
  let dr = Number(targetRollData?.ac.total[dmgType]?.dr) || 0;
  let resultSound = missSound;
  let targetAc = Number(targetRollData?.ac?.total[dmgType]?.ac);
  let targetTouchAc = Number(targetRollData?.ac?.touch_ac);
  let unarmoredAc = targetTouchAc + (Constant.ARMOR_VS_DMG_TYPE.none[dmgType]?.ac || 0);
  let shieldBonus = Number(targetRollData?.ac?.total[dmgType]?.shield_bonus);
  let isHit = true;
  let injuryObj = {};
  const targetHp = +targetActor?.data.data.hp?.value;
  const minorBleedDesc = ' and the wound bleeds heavily';
  const majorBleedDesc = ' and blood spurts from the wound!';

  
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
    let coverageArea = '';
    const deepImpaleAreas = ['chest','gut','thigh'];
    const maxImpaleAreas = ['chest','neck','skull','eye'];
    const doubleBleedAreas = ['neck','shoulder'];
    const easyBleedAreas = ['neck','face','skull','eye','forearm','elbow'];
    const doubleKnockdownAreas = ['skull','knee'];
    const invalidKnockdownAreas = ['hand','forearm','elbow','upper arm'];
    let sortedWornArmors = [];
    const parry = targetRollData.ac.parry;
    const isParrying = parry?.parry_item_id && parry?.parry_bonus > 0 && targetHp > 0;

    const applyArmor = (armor) => {
      const currentAC = +armor?.data.data.attributes.base_ac?.value;
      const maxAc = +armor?.data.data.attributes.base_ac?.max;

      return Math.random() <= currentAC / maxAc; 
      // return Math.ceil(Math.random() * maxAc) <= currentAC;
    }

    // roll for hit location if character or humanoid
    if ( targetActor.type === 'character' || targetRollData.type?.value === 'humanoid' ) { // TODO test with monster enemies with hardcoded armor types
      const hitLocRoll = await Util.rollDice("d100");
      let hitLocTable = atkForm === 'swing' ? 'SWING' : 'THRUST'; // use thrust table for everything besides swings TODO swing high/low, from atk mode dialog? -2 to swing high extra damage
      hitLoc = Constant.HIT_LOC_ARRS[hitLocTable][hitLocRoll - 1];
      coverageArea = hitLoc.replace('right ', '').replace('left ', '');
      const acObj = targetRollData.ac[coverageArea][dmgType] || {};
      targetAc = acObj.ac ?? targetAc;
      sortedWornArmors = acObj.sorted_armor_ids?.map(id => targetActor.items.get(id)) || [];

      
      dr = acObj.dr ?? dr;
      weapDmgResult = Math.max(1, weapDmgResult - dr);

      resultText += `${hitLoc ? ` at the ${hitLoc}` : ` at ${targetActor.name}`}`;

      // shield mods
      // check for friendly adjacent tokens wearing a Large Shield, i.e. shield wall
      const largeShieldCoverage = Constant.SHIELD_TYPES.large.coverage;
      const largeShieldLocs = Util.getArrFromCSL(largeShieldCoverage).filter(l => Object.keys(Constant.HIT_LOCATIONS).includes(l.toLowerCase()));
      if(largeShieldLocs.includes(coverageArea)) {
        const adjFriendlyTokens = adjTokens(targetToken, 1);
        const adjLargeShields = adjFriendlyTokens.map(t => t.actor.items.filter(i => i.data.data.worn &&
          i.data.data.attributes.shield?.value &&
          Util.stringMatch(i.data.data.attributes.size?.value, 'L'))
        ).flat();
        const adjLargeShieldMods = adjLargeShields.map(s => (+s.data.data.ac?.[dmgType]?.ac + +s.data.data.ac?.mac) || 0);
        // take best
        const shieldWallMod = Math.max(...adjLargeShieldMods, 0);
        targetAc += shieldWallMod;
      }

      // handle effects based on target shield
      // shield = targetActor?.items.find(i => (i.data.data.held_left || i.data.data.held_right || i.data.data.worn) &&
      //   i.data.data.attributes.shield?.value &&
      //   i.data.data.locations?.includes(coverageArea));
      shieldBonus = acObj.shield_bonus;
      if (shieldBonus) {
        if (bonusToShields) shieldBonus = Math.min(0, shieldBonus - 1);

        if (missileAtk) {
          // disregard bucklers vs. missile
          const holdingBuckler = (shield?.data.data.held_left || shield?.data.data.held_right) && Util.stringMatch(shield?.data.data.attributes.size?.value, 'T');
          if (holdingBuckler) {
            targetAc -= shieldBonus;
          }
        }
        if (chainWeapon) {
          // disregard all shield mods if weapon is unwieldy, e.g. flail
          sortedWornArmors = sortedWornArmors.filter( i => !i.data.data.attributes.shield?.value);
        }
      }

      // TODO store injuries like diseases, remove when character HP equal maxHP and no fatigue damage to maxHp

    }

    resultText += ` (${Util.chatInlineRoll(totalAtk)} vs. AC ${targetAc})`;
    // 20 always hits
    if( d20Result === 20 && totalAtkResult < targetAc) {
      totalAtkResult = targetAc;
    }
    isHit = totalAtkResult >= targetAc || d20Result === 20;


    // TODO remove bleed bonus for overall curved swords explanation: -1 min bleed, 1.5x crit, 1/2 knockdown damage
    if (isHit) {
      // critical hits
      const critChance = Util.stringMatch(weapCategory, 'curved swords') ? Math.ceil(1.5 * (totalAtkResult - targetAc)) : totalAtkResult - targetAc
      const isCriticalHit = !immuneCriticalHits && await Util.rollDice('d100') <= critChance;

      // avoids rigid armor/shield
      if (isCriticalHit) {
        sortedWornArmors = sortedWornArmors.filter( i => !i.data.data.attributes.rigid?.value && !i.data.data.attributes.shield?.value);
        hitDesc = ' and strikes a weak spot';
      }

      // lucky hits
      const isLuckyHit = d20Result >= 20 && !immuneLuckyHits;

      if (isLuckyHit) {
        const armor = sortedWornArmors[0];
        const isSteelPlate = !!armor?.data.data.attributes.material?.value === 'steel plate';
        const isRigid = !!armor?.data.data.attributes.rigid?.value;
        const isShield = !!armor?.data.data.attributes.shield?.value;

        // if damage type is blunt, armor must be rigid or shield to absorb the damage
        if ( armor && (dmgType !== 'blunt' || isRigid || isShield) ) {
          const baseAc = Number(armor.data.data.attributes.base_ac?.value);
          let verb = isSteelPlate ? 'dents' : isRigid ? 'punctures' : isShield ? 'splinters' : 'tears';
          const itemUpdate = {'_id': armor._id, 'data.attributes.base_ac.value': Math.max(0, baseAc - 1)};
          if (baseAc < 1) {
            verb = 'destroys';
            const qty = armor.data.data.quantity;
            Object.assign(itemUpdate, {'data.quantity': qty - 1});
          }
          // options.applyEffect === true && game.user.isGM && await targetActor.updateEmbeddedDocuments("Item", [itemUpdate]);
          hitDesc += ` and ${verb} their ${armor.name}`;
        } else {
          rolledWeapDmg = maxWeapDmg;
          weapDmgResult = Math.max(1, maxWeapDmg - dr);
          hitDesc += isCriticalHit ? ' brutally hard' : ' and hits brutally hard';
        }

        // steel plate can't be fully bypassed by lucky hits
        if (!isSteelPlate) sortedWornArmors.shift();
      }

      // handle crit multiplier after lucky hit damage modification
      if (isCriticalHit) weapDmgResult = weapDmgResult + weapDmgResult;

      // knockdown
      const knockdownDamage = Util.stringMatch(weapCategory, 'curved swords') ? Math.ceil(weapDmgResult / 2) : weapDmgResult;
      const isProne = targetActor.data.effects.some(e => e.data.label === 'Prone');
      const knockDownMulti = invalidKnockdownAreas.includes(coverageArea) ? 0 :
                             doubleKnockdownAreas.includes(coverageArea) ? 2 : 1;
      const knockdownChance = knockDownMulti * 2 * (knockdownDamage + strMod + 10 - weapSpeed) - 10 * (targetSize - attackerSize);
      const isKnockdown = !immuneKnockdown && !isProne && atkForm === 'swing' && await Util.rollDice('d100') <= knockdownChance;
      if (isKnockdown) {
        dmgEffect += " and knocks them down";
        // add prone condition manually
      }

      // impale
      // steel plate cannot be impaled
      const isImpale = !immuneImpale && dmgType === 'piercing' && rolledWeapDmg === maxWeapDmg;
      if (isImpale) {
        let stuck = false;
        const canDeepImpale = coverageArea ? deepImpaleAreas.includes(coverageArea) : true;
        const maxImpales = 1 + Math.min(weapSize, targetSize) || 1;
        let impaleDmg = 0;
        let armorPenString = '';

        for (let i = 0; i < maxImpales; i++) {
          const armor = sortedWornArmors[0];
          const isSteelPlate = !!armor?.data.data.attributes.material?.value === 'steel plate';
          if (isSteelPlate) break;

          let rolledDmg = maxImpaleAreas.includes(coverageArea) ? maxWeapDmg : await Util.rollDice(weapDmg);
          let dmg = rolledDmg;

          if (applyArmor(armor)) {
            let verb = 'penetrates';
            const isRigid = !!armor.data.data.attributes.rigid?.value;
            const isShield = !!armor.data.data.attributes.shield?.value;
            // if armor is non-rigid or shield it absorbs the impale damage
            if (!isRigid || (isShield && !['forearm','hand'].includes(coverageArea))) {
              dmg = 0;
            }
            // damage armor
            const baseAc = Number(armor?.data.data.attributes.base_ac?.value);
            const itemUpdate = {'_id': armor._id, 'data.attributes.base_ac.value': Math.max(0, baseAc - 1)};
            const armorDestroyed = baseAc < 1;
            if (armorDestroyed) {
              verb = 'destroys';
              const qty = armor.data.data.quantity;
              Object.assign(itemUpdate, {'data.quantity': qty - 1});
            }
            // options.applyEffect === true && game.user.isGM && await targetActor.updateEmbeddedDocuments("Item", [itemUpdate]);
            // append string
            armorPenString += ` and ${verb} their ${armor.name}`;
          }

          // beyond first impale level, no more damage done if target area is shallow or spiked bludgeon
          // weapon gets stuck if not a shot missile
          if (i > 0) {
            if (!canDeepImpale || Util.stringMatch(weapAttrs.category?.value, 'spiked bludgeon')) {
              dmg = 0;
            }
            stuck = atkForm !== 'shoot';
          }

          impaleDmg += dmg;

          // remove attacker's weapon if it's stuck
          // if (stuck) {
          //   try {
          //     await Util.reduceItemQty(weaponItem, attackingActor);
          //   } catch (error) {
          //     ui.notifications.error(error);
          //     weapons.shift();
          //     return attack(attackers, targetToken, options);
          //   }
          // }
          // ~25% chance of rolling damage again and weapon getting stuck if not shoot
          if (!isHit || rolledDmg < Math.round(maxWeapDmg * 3 / 4)) {
            break;
          }

          sortedWornArmors.shift();
        }

        // apply damage and append results string to hitDesc
        weapDmgResult += impaleDmg;
        const impaleDesc = armorPenString + (impaleDmg > 0 ? ` and impales them` : '');
        dmgEffect += stuck ? ` and the weapon is stuck` : '';
        hitDesc += impaleDesc;
      }

      // bleed TODO minor bleed once per turn? chance is 5% per point of damage. Severe bleed has to occur on certain areas, and 25% chance if 6+ dmg
      // bleeding does extra damage immediately, then again after the interval
      // impale can also cause severe bleed
      // metal armor cannot be cut
      const metalArmor = sortedWornArmors.find(i => i.data.data.attributes.metal?.value);
      let minBleedDmg = 6;
      let bleedChance = 25;
      if (Util.stringMatch(weapCategory, 'curved swords')) minBleedDmg--;
      if (easyBleedAreas.includes(coverageArea)) bleedChance *= 2;
      const isBleed = !immuneBleed && !applyArmor(metalArmor) && dmgType === 'slashing' && rolledWeapDmg >= minBleedDmg && await Util.rollDice('d100') <= bleedChance;
      
      if (isBleed) {
        const armor = sortedWornArmors[0];
        let doBleed = true;
        (function() {if (applyArmor(armor)) {
          const isRigid = !!armor.data.data.attributes.rigid?.value;
          const isShield = !!armor.data.data.attributes.shield?.value;
          let verb = isRigid ? 'punctures' : isShield ? 'splinters' : 'tears';

          // if armor is rigid or shield it absorbs damage and negates bleed
          if (isRigid || (isShield && !['forearm','hand'].includes(coverageArea))) {
            doBleed = false;

            // if weapon is a curved sword, break here and don't damage armor
            if (Util.stringMatch(weapCategory, 'curved swords')) return;
          }
          // damage armor
          const baseAc = Number(armor?.data.data.attributes.base_ac?.value);
          const itemUpdate = {'_id': armor._id, 'data.attributes.base_ac.value': Math.max(0, baseAc - 1)};
          const armorDestroyed = baseAc < 1;
          if (armorDestroyed) {
            verb = 'destroys';
            const qty = armor.data.data.quantity;
            Object.assign(itemUpdate, {'data.quantity': qty - 1});
          }
          // options.applyEffect === true && game.user.isGM && await targetActor.updateEmbeddedDocuments("Item", [itemUpdate]);
          // append string
          hitDesc += ` and ${verb} their ${armor.name}`;
        }})()

        if (doBleed) {
          dmgEffect += doubleBleedAreas.includes(coverageArea) ? majorBleedDesc : minorBleedDesc;
        }
        // add bleed/heavy bleed condition manually

        sortedWornArmors.shift();
      }

      injuryObj = Constant.HIT_LOCATIONS[coverageArea]?.injury?.[dmgType] || {};

      resultSound = hitSound;
      hitDesc = hitDesc || ' and hits';
      resultText += hitDesc;

      // switch dmgType to blunt if metal armor/plate remains
      const steelPlateArmor = sortedWornArmors.find(i => i.data.data.attributes.material?.value === 'steel plate');
      if ( applyArmor(metalArmor) && dmgType === 'slashing' || applyArmor(steelPlateArmor) && dmgType === 'piercing' ) {
        dmgType = 'blunt';
        if (/hits$/.test(hitDesc)) {
          const bluntingArmor = steelPlateArmor || metalArmor;
          hitDesc += ` though ${bluntingArmor.name} turns the blade`;
        }
      }

    } else {
      const deflectingArmor = totalAtkResult >= unarmoredAc + shieldBonus ? sortedWornArmors.find(i => !i.data.data.attributes.shield?.value) : sortedWornArmors[0];
      
      const targetHeldItems = !!targetActor.items.filter(i => i.data.data.held_right || i.data.data.held_left);
      let parryItem = targetActor.items.get(parry?.parry_item_id);
      if (!parryItem && targetHeldItems.length) {
        parryItem = targetHeldItems.reduce((a,b) => (+b.data.data.attributes.parry_bonus?.value || 0) > (+a.data.data.attributes.parry_bonus?.value || 0) ? b : a);
      }
      let targetParryBonus = +parryItem?.data.data.attributes.parry_bonus?.value || 0;
      let maxDexMod= +targetRollData.ac.max_dex_mod || 0;
      if (targetHp <= 0) {
        targetParryBonus = 0;
        maxDexMod = 0;
      }
      const parryDesc = ` but ${targetActor.name} parries${parryItem ? ` with ${parryItem.name}` : ''}`;
      // determine miss desc
      if (isParrying) {
        missDesc = parryDesc;
      } else if (totalAtkResult < unarmoredAc - targetParryBonus - maxDexMod) {
        missDesc = ` but misses entirely.`;
      } else if (totalAtkResult < unarmoredAc - targetParryBonus) {
        missDesc = ` but ${targetActor.name} dodges the blow.`;
      } else if (totalAtkResult < unarmoredAc) {
        missDesc = parryDesc;
      } else {
        missDesc = ` but the blow is deflected${deflectingArmor ? ` by ${deflectingArmor.name}` : ''}`;
      }

      // fumbles
      const fumbleChance = unwieldy ? Math.ceil(1.5 * (targetAc - totalAtkResult)) : targetAc - totalAtkResult;
      if (!immuneFumbles && await Util.rollDice('d100') <= fumbleChance) {
        const heldItems = attackingActor.items.filter(i => i.data.data.held_right || i.data.data.held_left);
        const adjTargets = adjTokens(token);
        const selectRandom = (arr) => {
          const res = Math.floor(Math.random() * arr.length);
          return arr[res];
        };
        const fumbles = [
          ` and${isParrying ? ` ${attackingActor.name}` : ''} slips and falls`, 
          ` and${isParrying ? ` ${attackingActor.name}` : ''} stumbles, leaving them open to attack`,
        ];
        fragile && fumbles.push(` and ${weapName} breaks!`);
        unwieldy && fumbles.push(` and${isParrying ? ` ${attackingActor.name}` : ''} hits themselves instead!`);
        heldItems.length && fumbles.push(` and${isParrying ? ` ${attackingActor.name}` : ''} drops ${selectRandom(heldItems)?.name}`)
        atkType === 'melee' && adjTargets.length && fumbles.push(` and${isParrying ? ` ${attackingActor.name}` : ''} strikes ${selectRandom(adjTargets)?.name} instead!`);

        const fumble = selectRandom(fumbles);
        missDesc = (isParrying ? missDesc : ' but misses wildly') + fumble;
        while (weapons.length) weapons.shift();
      }

      resultText += missDesc;
    }
  } else {
    resultText += ` ${Util.chatInlineRoll(totalAtk)}`;
  }

  // damage
  let totalDmg = `${attacker.dmgMulti ? `${weapDmgResult}*${attacker.dmgMulti}` : `${weapDmgResult}`}+${attrDmgMod}+${attackerAttrDmgMod}+${attackerDmgMod}+${sitDmgMod}+${dialogDmgMod}`;
  let dmgText = ` for ${Util.chatInlineRoll(totalDmg)}${dmgType ? ` ${dmgType}` : ''} damage`;
  
  // TODO use separate variables not object properties
  const applyDamage = isHit && targetRollData && options.applyEffect === true && game.user.isGM;
  const totalDmgResult = await Util.rollDice(totalDmg);
  attacks.push({
    sound: resultSound,
    damage: applyDamage ? totalDmgResult : null,
    energyDrainDamage: applyDamage && energyDrain ? totalDmgResult : null // TODO remember to always apply damage automatically for energy drain, or it won't be recorded
  });

  const sumDmg = attacks.reduce((sum, a) => sum + a.damage, 0);
  if (targetHp > 0 && sumDmg >= targetHp) {
    while (weapons.length) weapons.shift();
    attacker.kill = true;
  }

  // result
  if (isHit) {
    resultText += dmgText;


    if (totalDmgResult < 2 && targetHp > 0) {
      resultText = resultText.replace('hits', 'grazes');
    }

    // TODO find a way to get the Dies Instantly chat result!
    const negHPs = Math.max(targetHp - totalDmgResult, totalDmgResult * -1);
    const injury = negHPs < -5 ? injuryObj.critical : negHPs < -2 ? injuryObj.serious : negHPs < 0 ? injuryObj.light : {};
    if (negHPs) resultText += injury.text || '';

    // hard code bleed effects for certain injuries
    if ( resultText.includes('severs') || resultText.includes('lacerates') ) {
      dmgEffect = dmgEffect.replace(majorBleedDesc,'');
      if (!dmgEffect.includes(minorBleedDesc)) {
        dmgEffect += minorBleedDesc;
      }
    }

    if ( resultText.includes('artery') || resultText.includes('lops off' )) {
      dmgEffect = dmgEffect.replace(minorBleedDesc,'');
      if (!dmgEffect.includes(majorBleedDesc)) {
        dmgEffect += majorBleedDesc;
      }
    }

    // remove bleed effects if target is dead
    if (targetHp <= -10) {
      dmgEffect = dmgEffect.replace(minorBleedDesc,'').replace(majorBleedDesc,'');
    }

    resultText += dmgEffect;

  }

  const rangeText = atkType === 'missile' && range ? ` ${range}'` : '';

  chatMsgData.content += atkForm === 'attack' ? `${attackingActor.name} attacks${targetActor ? ` ${targetActor.name}` : ''}`:
    `${attackingActor.name} ${atkForm}s ${weapName}`;
  chatMsgData.content += `${resultText}`;
  const lastChar = resultText.charAt(resultText.length - 1);
  chatMsgData.content += lastChar === '!' || lastChar === '.' ? '<br>' : `.<br>`;
  
  chatMsgData.flavor += atkForm === 'attack' ? `${weapName}, ` : `${weapName} ${formatAtkMode(atkMode) || atkForm}${rangeText}, `; //, ${Constant.ATK_MODES[atkMode]?.DMG_TYPE || dmgType}
  // TODO chat bubble exceptions, like punching, grappling etc.
  chatMsgData.bubbleString += atkForm === 'attack' ? `${attackingActor.name} attacks${targetActor ? ` at ${targetActor.name}` : ''}<br>` :
    `${attackingActor.name} ${atkForm}s ${weapName}${targetActor ? ` at ${targetActor.name}` : ''}<br>`;




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

function modDialog(options, title, fields=[{label:'', key:''}], callback) {
  let formFields = ``;
  fields.forEach(field => {
    formFields += `<div class="form-group">
                    <label>${field.label}</label>
                    <input type="text" id="${field.key}" placeholder="e.g. -4, 2d6">
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
  const attitudeObj = attitudeMap[targetActor._id];
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
    const attitudeText = `<span style="${resultStyle(attitudeColours[attitude])}">${attitude.toUpperCase()}</span>`;
    const chatData = {
      content: `${Util.chatInlineRoll(rxnText)} ${attitudeText}`,
      flavor: `Reaction Roll vs. ${targetActor.name}`
    }
    const token = Util.getTokenFromActor(reactingActor);
    Util.macroChatMessage(reactingActor, chatData, false);
    Util.chatBubble(token, `${reactingActor.name} reacts to ${targetActor.name}`, {emote: true});
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
  const cpUpdate = {id: cpItem?._id, "data.quantity": cpUpdateQty},
        spUpdate = {id: spItem?._id, "data.quantity": spUpdateQty},
        gpUpdate = {id: gpItem?._id, "data.quantity": gpUpdateQty};
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
      await actor.updateEmbeddedDocuments("Item", [{ "id": targetItem._id, "data.quantity": currentTargetQty + qty }]);
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
  if (!actor) return;

  const isResting = game.cub.hasCondition('Rest', actor, {warn: false});
  if (isResting) return;
  
  if ( type === 'exhaustion') {
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
  const restDice = restType === 'Rough' ? hasBedroll ? 'd3' : 'd2' : Fatigue.REST_TYPES[restType];
  const dice = `${numDice}${restDice}`;
  const flavor = `Rest (${restType})`;

  const wearingArmor = actor.items.some(i => i.data.data.worn && Util.stringMatch(i.data.data.attributes.slot?.value, 'armor'));
  if (wearingArmor) {
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

export async function addRemovedBodyPart(part=null, options={}) {
  if (!game.user.isGM) return ui.notifications.error(`You shouldn't be here...`);

  const char = Util.selectedCharacter();
  const actor = char.actor;

  const removedParts = actor.getFlag("lostlands", "removedParts") || [];

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

