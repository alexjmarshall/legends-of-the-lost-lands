import * as Util from "./utils.js";
import { TimeQ } from './time-queue.js';
import * as Constant from "./constants.js";

// TODO update rules doc
// TODO if total of max HP damage > max HP, MV halved (use condition/effect)
// TODO button to level up char, add level/HD to top bar of actor sheet, allow players to click this button, shows chat msg and rolls HP based on HD in attributes
// TODO XP progressions for basic attributes, and button on charsheet, allow players to click. don't allow players to edit HP or XP
// TODO d6 skills like swim/climb in features or attributes?
// TODO macro for morale check 
// TODO macro for award XP
// TODO sounds for spells
// TODO convert all mp3s to ogg
// TODO record all actor attributes by type in actor.js, and item attributes by type in item.js
// TODO convert to silver standard, items have sp value instead of gp_value -- fix buyMacro and selling in foundry.js?
// TODO set default settings in day night cycle based on season in simple calendar
// TODO banker sheet & macro -- money change, trust fund (stored on PC), storage (stored on banker)
// TODO inn sheet & macro -- allow players to choose food/sleep quality level on sheet, diff inns have diff quality levels (set in attributes),
//      auto sets rest mode with rest type on char, on remove effect, heals & pays
// TODO make magical ingredient list for potions
// TODO add poison type to diseases (virulence 8), think thru process of Ranger Slow Poison
// TODO sound for energy drain hit/miss
// TODO give 1 point buffer before heat stress damage, same as cold
// Poison from attack causes ONE save to be done after battle is over
// Random 3 choices for critical hits!
// certain pieces of armor prevent critical hit damage, but not necessarily the crit result
// attribute of immune to crits, e.g. for oozes -- try to not make further distinctions, e.g. all crit results can apply if not immune
// thrust weapons explode damage die, hew weapons crit on 19-20?
// crits typically do max damage, backstab doesn't multiply damage, do it manually after any exploding damage is done
// always make damage roll deferred roll to click?
// init macro rolls init and starts battle playlist
// make all ability scores into resource type to store current/max values, to player view just show current value
// fix resources showing max not current value to players
// thrown needs to be an attack type, not damage type
// make sound property of weapon item
// grapple 1 dice every 4 levels
// add dialog to save for half damage macro to choose type of damage
// custom drag n drop logic to turn arrows/bolts into additional quantity for quiver
// in attribute tabs make fields max width fit content/ moz-fit-content
/*
* TODO hexcrawl
*   use terrain layer and terrain ruler module on a hex map with single party token
*   paint difficult terrain for rough/very rough terrain types
*   how to handle horseback? can set flag on party token, then prolly have to interact with API of terrain layer/ruler
*   need new sheet/actor type for token? can try to auto calc speed
*   manually set mv of party token
*   use white/tan fog of war instead of black
*/
/* TODO journeys (?)
*     -- used for top level gridless pointcrawl map with distances between nodes precalculated
*     -- make journey macro that takes 2 selected map points and shows dialog with distance between them
*     -- possible multiple paths, calculates time based on party MV and foot/horseback
*     -- shows time it will be on arrival, confirmation button to advance time
*     -- also check for random encounter, if indicated, show time of its occurence, and confirmation button to advance time
*     -- time represented as Dawn, Midday, Dusk, or Midnight -- random terrain?
*     -- rolls random weather too
*/

// Conditions:
//  Warm
//  Hot/Cold
//  Rest
//  Asleep
//  Sleepy
//  Hungry
//  Thirsty
//  Dead
//  Diseased
//  Fatigued

export const FATIGUE_DAMAGE_COMMAND = 'applyFatigue(actorId, type, execTime, newTime)';
export const DISEASE_DAMAGE_COMMAND = 'applyDisease(actorId, disease, execTime, newTime)';

export const REST_TYPES = {
  "Rough": null,
  "Peasant": "d4",
  "Merchant": "d6",
  "Noble": "d8",
  "Royal": "d10",
};
const REQ_CLO_BY_SEASON = {
  "summer": 6,
  "fall": 16,
  "spring": 16,
  "winter": 26
};
export function diffClo(char) {
  const requiredClo = game.settings.get("lostlands", "requiredClo");
  const wornClo = char.data.data.clo;
  const diff = wornClo - requiredClo;
  return diff || 0;
}
export const CLOCKS = {
  "hunger": {
    warningInterval: { hour: 12 },
    warningSound: 'stomach_rumble',
    damageInterval: { day: 3 },
    damageDice: 'd3',
    condition: "Hungry",
    warnCondition: (date) => date.second === 0 && date.minute === 0 && date.hour % 4 === 0
  },
  "thirst": {
    warningInterval: { hour: 12 },
    damageInterval: { day: 1 },
    damageDice: 'd6',
    condition: "Thirsty",
    warnCondition: (date) => date.second === 0 && date.minute === 0 && date.hour % 1 === 0
  },
  "exhaustion": {
    warningInterval: { hour: 12 },
    warningSound: 'sleepy',
    damageInterval: { day: 1 },
    damageDice: 'd6',
    condition: "Sleepy",
    warnCondition: (date) => date.second === 0 && date.minute === 0 && date.hour % 2 === 0
  },
  "exposure": {
    warningInterval: { minute: 0 },
    damageInterval: { hour: 1 },
    damageDice: 'd6',
    condition: "Hot/Cold",
    warnCondition: (date) => date.second === 0 && date.minute % 10 === 0
  },
};
export const DISEASES = {
  "grippe": {
    symptoms: ["cough", "headache", "fatigue"],
    virulence: "d3",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  "dysentery": {
    symptoms: ["diarrhea", "abdominal pain", "fatigue"],
    virulence: "d4",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  "typhoid": {
    symptoms: ["fever", "abdominal pain", "rash"],
    virulence: "d4",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  "gangrene": {
    symptoms: ["numbness", "black tissue"],
    virulence: "d6",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  "malaria": {
    symptoms: ["paroxysms", "vomiting", "fever"],
    virulence: "d6",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  "spotted fever": {
    symptoms: ["rash", "headache", "confusion"],
    virulence: "d8",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  "plague": {
    symptoms: ["black tissue", "headache", "fever"],
    virulence: "d8",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  "leprosy": {
    symptoms: ["black tissue", "numbness", "rash"],
    virulence: "d10",
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
};

export async function resetFatigueDamage(actor, type) {
  const data = actor.getFlag("lostlands", type) || {};
  const damage = data.maxHpDamage;
  if (damage) {
    data.maxHpDamage = 0;
    await actor.setFlag("lostlands", type, data);
    await restoreMaxHpDamage(actor, damage);
  }
  // const { condition } = CLOCKS[type];
  // condition && await Util.removeCondition(condition, actor);
}

export async function resetFatigueClock(actor, type, time=Util.now()) {
  const data = actor.getFlag("lostlands", type) || {};
  data.startTime = time;
  const {damageInterval} = CLOCKS[type];
  data.intervalId && await TimeQ.cancel(data.intervalId);
  const scope = {actorId: actor.id, type};
  const macro = await Util.getMacroByCommand(`${FATIGUE_DAMAGE_COMMAND}`, `return game.lostlands.Macro.${FATIGUE_DAMAGE_COMMAND};`);
  data.intervalId = await TimeQ.doEvery(damageInterval, time, macro.id, scope);
  await actor.setFlag("lostlands", type, data);
}

export async function resetFatigueType(actor, type, time=Util.now()) {
  await resetFatigueClock(actor, type, time);
  await resetFatigueDamage(actor, type);
}

export function reqClo(season) {
  season = season || SimpleCalendar.api.getCurrentSeason()?.name.toLowerCase();
  const reqClo = REQ_CLO_BY_SEASON[season];
  return reqClo;
}

export async function syncFatigueClocks(time, resetClocks=false) {
  const allChars = game.actors.filter(a => a.type === 'character' && a.hasPlayerOwner);
  
  return Promise.all(
    allChars.map(async (char) => {
      await syncStartTimes(char, time);
      await syncDamageClocks(char, time, resetClocks);
      await resetDamageAndWarn(char, time);
    })
  );
}

async function syncStartTimes(char, time) {
  const invalid = (startTime) => startTime == null || startTime > time;

  // clocks
  for (const type of Object.keys(CLOCKS)) {
    const data = char.getFlag("lostlands", type) || {};
    if (invalid(data.startTime)) {
      data.startTime = time;
      await char.setFlag("lostlands", type, data);
    }
  }

  // last rest time
  const lastRestTimeFlag = "last_rest_time";
  const lastRestTime = char.getFlag("lostlands", lastRestTimeFlag);
  if (invalid(lastRestTime)) await char.setFlag("lostlands", lastRestTimeFlag, time);

  // diseases
  const charDiseases = char.getFlag("lostlands", "disease") || {};

  for (const [disease, data] of Object.entries(charDiseases)) {
    if (invalid(data.startTime)) {
      await deleteDisease(char, disease);
    }
  }
}

async function resetDamageAndWarn(char, time) {
  const isDead = Number(char.data.data.hp.value) < 0;
  if (isDead) return;

  const isAsleep = game.cub.hasCondition('Asleep', char, {warn: false});
  const isResting = game.cub.hasCondition('Rest', char, {warn: false});
  const isWarm = game.cub.hasCondition('Warm', char, {warn: false});

  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {
    let { condition, warningInterval, warningSound } = clock;
    const data = char.getFlag("lostlands", type);
    const startTime = data.startTime;
    if ( !warningInterval || !condition ) continue;

    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const beforeWarning = time < startTime + warningIntervalInSeconds;

    let conditionString = condition.toLowerCase();
    let typeString = Util.upperCaseFirst(type);
    let resetExposure = false;
    if (type === 'exposure') {
      const diff = diffClo(char);
      conditionString = getExposureConditionString(diff);
      typeString = diffClo < 0 ? 'Cold' : 'Heat';
      resetExposure = isWarm || conditionString === 'cool' || conditionString === 'warm';
    }
  
    if ( isResting || beforeWarning || resetExposure ) {
      await resetFatigueDamage(char, type);
      continue;
    }

    if (isAsleep) continue;
    
    const date = SimpleCalendar.api.timestampToDate(time);
    const doWarn = clock.warnCondition(date);
    if (!doWarn) continue;

    const flavor = typeString;
    const content = `${char.name} feels ${conditionString}...`;
    await Util.macroChatMessage(char, { content, flavor }, false);

    const token = Util.getTokenFromActor(char);
    if (!token || !warningSound) return;

    if ( Object.values(Constant.VOICE_MOODS).includes(warningSound) ) {
      return Util.playVoiceSound(warningSound, char, token, {push: true, bubble: true, chance: 1});
    }
      
    return Util.playSound(warningSound, token, {push: true, bubble: true});
  }
}

export function getExposureConditionString(diffClo) {
  if (diffClo <= -20) return 'extremely cold';
  if (diffClo <= -10) return 'cold';
  if (diffClo < 0) return 'cool';
  if (diffClo < 10) return 'warm';
  if (diffClo < 20) return 'hot';
  return 'extremely hot';
}

async function syncDamageClocks(char, time, override=false) {
  const actorId = char.id;
  
  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {

    const { damageInterval } = clock;
    if ( !damageInterval ) continue;

    const data = char.getFlag("lostlands", type);

    // if event is already scheduled and override not set, continue
    const scheduled = TimeQ.find(data.intervalId);
    if ( scheduled && !override ) continue;

    data.intervalId && await TimeQ.cancel(data.intervalId);
    const startTime = Util.prevTime(damageInterval, data.startTime, time);
    const scope = {actorId, type};
    const macro = await Util.getMacroByCommand(`${FATIGUE_DAMAGE_COMMAND}`, `return game.lostlands.Macro.${FATIGUE_DAMAGE_COMMAND};`);
    data.intervalId = await TimeQ.doEvery(damageInterval, startTime, macro.id, scope);
    
    await char.setFlag("lostlands", type, data);
  }

  // diseases
  const charDiseases = char.getFlag("lostlands", "disease") || {};
  let setDiseases = false;

  for (const [disease, data] of Object.entries(charDiseases)) {
    if ( data.intervalId && !override ) continue;

    const damageInterval = DISEASES[disease].damageInterval;
    const startTime = Util.prevTime(damageInterval, data.startTime, time);
    const scope = {actorId, disease};
    const macro = await Util.getMacroByCommand(`${DISEASE_DAMAGE_COMMAND}`, `return game.lostlands.Macro.${DISEASE_DAMAGE_COMMAND};`);
    data.intervalId = await TimeQ.doEvery(damageInterval, startTime, macro.id, scope);
    setDiseases = true;
  }

  setDiseases && await char.setFlag("lostlands", "disease", charDiseases);
}

export async function deleteDisease(actor, disease) {
  const diseases = actor.getFlag("lostlands", "disease");
  if (!diseases || !diseases[disease]) return;

  const intervalId = diseases[disease].intervalId;
  await TimeQ.cancel(intervalId);

  const damage = diseases[disease].maxHpDamage;
  damage && await restoreMaxHpDamage(actor, damage);

  delete diseases[disease];

  if (!Object.keys(diseases).length) {
    // await Util.removeCondition("Diseased", actor);
    await actor.unsetFlag("lostlands", "disease");
  }

  await actor.setFlag("lostlands", "disease", diseases);
}

export async function deleteAllDiseases(actor) {
  const diseases = actor.getFlag("lostlands", "disease");
  if (!diseases) return;
  let damage = 0;

  for (const disease of Object.values(diseases)) {
    const intervalId = disease.intervalId;
    await TimeQ.cancel(intervalId);
    damage += disease.maxHpDamage;
  }

  try {
    await actor.unsetFlag("lostlands", "disease");
    damage && await restoreMaxHpDamage(actor, damage);
    // await Util.removeCondition("Diseased", actor);
  } catch (error) {
    throw new Error(error);
  }
}

async function restoreMaxHpDamage(actor, damage) {
  const maxHp = Number(actor.data.data.hp.max);
  const result = maxHp + damage;
  return actor.update({"data.hp.max": result});
}

export async function clearMaxHpDamage(actor) {
  // clocks
  for (const type of Object.keys(CLOCKS)) {
    const data = actor.getFlag("lostlands", type) || {};
    if (data.maxHpDamage !== 0) {
      data.maxHpDamage = 0;
      await actor.setFlag("lostlands", type, data);
    }
  }
  // diseases
  const diseases = actor.getFlag("lostlands", "disease");
  if (!diseases) return;
  for (const data of Object.values(diseases)) {
    data.maxHpDamage = 0;
  }
  await actor.setFlag("lostlands", "disease", diseases);
}