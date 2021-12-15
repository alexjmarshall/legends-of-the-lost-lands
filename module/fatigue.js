import * as Util from "./utils.js";
import { TimeQ } from './time-queue.js';
import * as Constant from "./constants.js";

// TODO make rest mode individual condition, with rest dice an individual flag
// how to handle to events that occur to inactive/offscreen characters? -- put in individual rest mode
// test rest mode healing

// TODO add disease symptoms to character sheet? add tab with last eat time, last drink time, clo, disease symptoms, GM: reset/delete disease buttons
// generic item icon for spells and features

// update reqClo setting on season change and weather change
// do cold damage using first additive method here
// compare worn clo to required clo, and add cold? condition
// use clo diff and number of times certain thresholds have passed, e.g. minutes, hours to calculate how much damage to do
// only apply cold damage if PC is alive

export const FATIGUE_DAMAGE_COMMAND = 'applyFatigueDamage(actorId, type, execTime, newTime)';
export const DISEASE_DAMAGE_COMMAND = 'applyDisease(actorId, disease, execTime, newTime)';

export const REST_TYPES = {
  "d3": "Peasant",
  "d4": "Merchant",
  "d6": "Noble",
  "d8": "Royal",
};
const REQ_CLO_BY_SEASON = {
  "summer": 1,
  "fall": 2,
  "spring": 2,
  "winter": 3
};
export const CLOCKS = {
  // "hunger": {
  //   warningInterval: { hour: 12 },
  //   warningSound: 'stomach_rumble',
  //   damageInterval: { day: 3 },
  //   damageDice: 'd3',
  //   startFlag: "last_eat_time",
  //   intervalFlag: "hunger_interval_id",
  //   condition: "Hungry",
  //   alwaysOn: true
  // },
  // "thirst": {
  //   warningInterval: { hour: 12 },
  //   damageInterval: { day: 1 },
  //   damageDice: 'd6',
  //   startFlag: "last_drink_time",
  //   intervalFlag: "thirst_interval_id",
  //   condition: "Thirsty",
  //   alwaysOn: true
  // },
  // "exhaustion": {
  //   warningInterval: { hour: 18 },
  //   warningSound: 'sleepy',
  //   damageInterval: { day: 1 },
  //   damageDice: 'd6',
  //   startFlag: "last_sleep_time",
  //   intervalFlag: "exhaustion_interval_id",
  //   condition: "Sleepy",
  //   alwaysOn: true
  // },
  // "cold": {
  //   warningInterval: {}, // immediate
  //   damageInterval: {}, // varies based on difference between worn and required Clo
  //   damageDice: 'd6',
  //   startFlag: "cold_start_time",
  //   intervalFlag: "cold_interval_id",
  //   condition: "Cold",
  //   alwaysOn: false
  // },
  // "rest": {
  //   warningInterval: {},
  //   damageInterval: {},
  //   damageDice: '',
  //   startFlag: "last_rest_time",
  //   intervalFlag: "",
  //   condition: "",
  //   alwaysOn: false
  // },
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

export async function resetFatigueType(actor, type, time=Util.now()) {
  let { startFlag, intervalFlag, condition, damageInterval } = CLOCKS[type];
  const startTime = actor.getFlag("lostlands", startFlag);
  startTime != time && await actor.setFlag("lostlands", startFlag, time);
  condition && await Util.removeCondition(condition, actor);

  let intervalId = actor.getFlag("lostlands", intervalFlag);
  intervalId && await TimeQ.cancel(intervalId);

  const actorId = actor.id;
  const scope = {actorId, type};
  const macro = await Util.getMacroByCommand(`${FATIGUE_DAMAGE_COMMAND}`, `return game.lostlands.Macro.${FATIGUE_DAMAGE_COMMAND};`);
  intervalId = await TimeQ.doEvery(damageInterval, time, macro.id, scope);

  return actor.setFlag("lostlands", intervalFlag, intervalId)
}

export function reqClo() {
  // change game setting of required clo when season changes
  // then GM can alter with macro for daily weather
  const season = SimpleCalendar.api.getCurrentSeason()?.name.toLowerCase();
  const reqClo = Constant.REQ_CLO_BY_SEASON[season];
  return reqClo;
}

export async function syncFatigueClocks(time, resetClocks=false) {

  const allChars = game.actors.filter(a => a.type === 'character' && a.hasPlayerOwner);

  for (const char of allChars) {
    // TODO don't add sleepy if Asleep, and check for rest mode

    await syncStartTimes(char, time);
    await syncConditions(char, time);
    await syncDamageClocks(char, time, resetClocks);
  }
}

async function syncStartTimes(char, time) {

  // clocks
  for (const clock of Object.values(CLOCKS)) {
    const startTime = char.getFlag("lostlands", clock.startFlag);
    if ( startTime == null || startTime > time ) {

      if (clock.alwaysOn) await char.setFlag("lostlands", clock.startFlag, time);
      else await char.unsetFlag("lostlands", clock.startFlag);
    }
  }

  // diseases
  const charDiseases = char.getFlag("lostlands", "diseases");
  let setDiseases = false;

  if (!charDiseases) {
    charDiseases = {};
    setDiseases = true;
  }

  for (const [disease, data] of Object.entries(charDiseases)) {
    const startTime = data.startTime;
    if ( startTime == null || startTime > time ) {
      delete charDiseases[disease];
      setDiseases = true;
    }
  }

  if (!setDiseases) return;
  await char.unsetFlag("lostlands", "diseases");
  await char.setFlag("lostlands", "diseases", charDiseases);
}

async function syncConditions(char, time) {
  const isConscious = Number(char.data.data.hp.value) > 0;

  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {

    const warningInterval = clock.warningInterval; // TODO dynamic calculation for cold damage -- use function above
    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const condition = clock.condition;
    const startTime = char.getFlag("lostlands", clock.startFlag);
    if (isNaN(startTime)) continue;

    const warningTime = startTime + warningIntervalInSeconds;
    if (time < warningTime) {
      Util.removeCondition(condition, char);
      continue;
    }

    const hasCondition = game.cub.hasCondition(condition, char);
    if (hasCondition) continue;

    await Util.addCondition(condition, char);

    if (!isConscious) continue;

    const token = Util.getTokenFromActor(char);
    const flavor = Util.upperCaseFirst(type);
    const content = `feels ${condition.toLowerCase()}...`;
    await Util.macroChatMessage(token, char, { content, flavor }, false);

    if (!clock.warningSound) continue;

    if ( Object.values(Constant.VOICE_MOODS).includes(warningSound) ) {
      Util.playVoiceSound(clock.warningSound, char, token, {push: true, bubble: true, chance: 1});
    } else {
      Util.playSound(clock.warningSound, token, {push: true, bubble: true});
    }
  }

  // diseases
  const charDiseases = char.getFlag("lostlands", "diseases") || {};
  const diseased = !!Object.values(charDiseases).find(d => d.confirmed);

  if (diseased) await Util.addCondition("Diseased", char);
  else await Util.removeCondition("Diseased", char);
}

async function syncDamageClocks(char, time, resetClocks=false) {
  const actorId = char.id;

  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {

    // if event is already scheduled, continue
    let intervalId = char.getFlag("lostlands", clock.intervalFlag);
    if ( intervalId && !resetClocks ) continue;

    // if there is a start time defined, start the clock
    const startTime = char.getFlag("lostlands", clock.startFlag);
    if (isNaN(startTime)) continue;

    const interval = clock.damageInterval;
    const fromTime = Util.prevTime(interval, startTime, time);
    const scope = {actorId, type};
    const macro = await Util.getMacroByCommand(`${FATIGUE_DAMAGE_COMMAND}`, `return game.lostlands.Macro.${FATIGUE_DAMAGE_COMMAND};`);
    intervalId = await TimeQ.doEvery(interval, fromTime, macro.id, scope);

    await char.setFlag("lostlands", clock.intervalFlag, intervalId);
  }

  // diseases
  const charDiseases = char.getFlag("lostlands", "diseases") || {};

  let setDiseases = false;
  for (const [disease, data] of Object.entries(charDiseases)) {

    if ( data.intervalId && !resetClocks ) continue;

    const startTime = data.startTime;
    if (isNaN(startTime)) continue;

    const interval = DISEASES[disease].damageInterval;
    const fromTime = Util.prevTime(interval, startTime, time);
    const scope = {actorId, disease};
    const macro = await Util.getMacroByCommand(`${DISEASE_DAMAGE_COMMAND}`, `return game.lostlands.Macro.${DISEASE_DAMAGE_COMMAND};`);
    const intervalId = await TimeQ.doEvery(interval, fromTime, macro.id, scope);

    data.intervalId = intervalId
    setDiseases = true;
  }

  if (!setDiseases) return;

  await char.unsetFlag("lostlands", "diseases");
  await char.setFlag("lostlands", "diseases", charDiseases);
}
