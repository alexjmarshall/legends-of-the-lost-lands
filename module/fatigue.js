import * as Util from "./utils.js";
import { TimeQ } from './time-queue.js';
import * as Constant from "./constants.js";

// TODO weather random macro, use table? use macro and save weather in a game setting
// TODO revise wilderness rules for pointcrawls, not hexcrawls -- basically precalculate distance between points in leagues for foot/horses
//     -- make journey macro that takes 2 selected map points and shows dialog with distance between them, possible multiple paths, calculates time based on party MV and foot/horseback
//     -- shows time it willl be on arrival, confirmation button to advance time
//     -- also check for random encounter, if indicated, show time of its occurence, and confirmation button to advance time
//     -- time represented as Dawn, Midday, Dusk, or Midnight -- random terrain?
//     -- pointcrawl maps, wilderness map (big view distance, time passes at 2x speed), dungeon/interior map (small view distance, time passes at 1x speed)
//     -- journey macro rolls random weather too
// use resources automatically if exist on character during long time skips
// TODO monster sheet
// TODO convert all mp3s to ogg
// TODO if max HP less than half max max HP, MV is halved (use condition/effect)
// TODO button to level up char, add level/HD to top bar of actor sheet, allow players to click this button, shows chat msg and rolls HP based on HD in attributes

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
  "summer": 1,
  "fall": 2,
  "spring": 2,
  "winter": 3
};
export function diffClo(char) {
  const requiredClo = game.settings.get("lostlands", "requiredClo");
  const wornClo = char.data.data.clo;
  const diff = wornClo - requiredClo;
  return diff || 0;
}
// startTime, intervalId
export const CLOCKS = {
  "hunger": {
    warningInterval: { hour: 12 },
    warningSound: 'stomach_rumble',
    damageInterval: { day: 3 },
    damageDice: 'd3',
    condition: "Hungry",
  },
  "thirst": {
    warningInterval: { hour: 12 },
    damageInterval: { day: 1 },
    damageDice: 'd6',
    condition: "Thirsty",
  },
  "exhaustion": {
    warningInterval: { hour: 12 },
    warningSound: 'sleepy',
    damageInterval: { day: 1 },
    damageDice: 'd6',
    condition: "Sleepy",
  },
  "exposure": {
    warningInterval: { minute: 0 },
    damageInterval: { hour: 1 },
    damageDice: 'd6',
    condition: "Hot/Cold",
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
  const data = actor.getFlag("lostlands", type);
  const damage = data.maxHpDamage;
  if (damage) {
    data.maxHpDamage = 0;
    await actor.setFlag("lostlands", type, data);
    await restoreMaxHpDamage(actor, damage);
  }
  const { condition } = CLOCKS[type];
  condition && await Util.removeCondition(condition, actor);
}

export async function resetFatigueClock(actor, type, time) {
  const data = actor.getFlag("lostlands", type);
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
      // TODO clean up/consolidate these functions using resetFatigueClock and resetFatigueDamage
      await syncStartTimes(char, time);
      await syncDamageClocks(char, time, resetClocks);
      await syncConditions(char, time);
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

async function syncConditions(char, time) {
  const isDead = Number(char.data.data.hp.value) < 0;
  const isAsleep = game.cub.hasCondition('Asleep', char, {warn: false});
  const isResting = game.cub.hasCondition('Rest', char, {warn: false});

  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {

    if (isDead) continue;

    let { condition, warningInterval, warningSound } = clock;
    const data = char.getFlag("lostlands", type);
    const startTime = data.startTime;
    if ( !warningInterval || !condition ) continue;
    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const beforeWarning = time < startTime + warningIntervalInSeconds;

    
    let conditionString = condition.toLowerCase();
    if (type === 'exposure') {
      const diff = diffClo(char);
      conditionString = getExposureConditionString(diff);
    }

    if ( isResting || beforeWarning || conditionString === 'fine' ) {
      await resetFatigueDamage(char, type);
      continue;
    }

    const hasCondition = game.cub.hasCondition(condition, char, {warn: false});
    if (hasCondition) continue;
    await Util.addCondition(condition, char);
    if (isAsleep) continue;
    
    const token = Util.getTokenFromActor(char);
    const flavor = Util.upperCaseFirst(type);
    const content = `feels ${conditionString}...`;
    await Util.macroChatMessage(token, char, { content, flavor }, false);

    if (!warningSound) continue;

    if ( Object.values(Constant.VOICE_MOODS).includes(warningSound) ) {
      Util.playVoiceSound(warningSound, char, token, {push: true, bubble: true, chance: 1});
    } else {
      Util.playSound(warningSound, token, {push: true, bubble: true});
    }
  }

  // diseases
  const charDiseases = char.getFlag("lostlands", "disease") || {};
  const diseased = Object.values(charDiseases).some(d => d.confirmed);

  diseased ? await Util.addCondition("Diseased", char) :
             await Util.removeCondition("Diseased", char);
}

export function getExposureConditionString(diffClo) {
  if (diffClo <= -3) return 'extremely cold';
  if (diffClo <= -1) return 'very cold';
  if (diffClo < 0) return 'cold';
  if (diffClo < 1) return 'fine';
  if (diffClo <= 2) return 'very hot';
  return 'extremely hot';
}

async function syncDamageClocks(char, time, override=false) {
  const actorId = char.id;
  
  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {

    const { damageInterval } = clock;
    if ( !damageInterval ) continue;

    const data = char.getFlag("lostlands", type);

    // if event is already scheduled, continue
    if ( data.intervalId && !override ) continue;

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
    await Util.removeCondition("Diseased", actor);
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
    await Util.removeCondition("Diseased", actor);
  } catch (error) {
    throw new Error(error);
  }
}

async function restoreMaxHpDamage(actor, damage) {
  const maxHp = Number(actor.data.data.hp.max);
  const maxMaxHp = Number(actor.data.data.hp.max_max);
  const result = Math.min(maxHp + damage, maxMaxHp);
  return actor.update({"data.hp.max": result});
}

export async function clearMaxHpDamage(actor) {
  // clocks
  for (const type of Object.keys(CLOCKS)) {
    const data = actor.getFlag("lostlands", type);
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