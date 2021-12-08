import * as Util from "./utils.js";
import { TimeQ } from './time-queue.js';

// TODO make rest mode individual condition, with rest dice an individual flag
// how to handle to events that occur to inactive/offscreen characters? -- put in individual rest mode
//
// update reqClo setting on season change and weather change
// do cold damage using first additive method here
// compare worn clo to required clo, and add cold? condition
// use clo diff and number of times certain thresholds have passed, e.g. minutes, hours to calculate how much damage to do
// only apply cold damage if PC is alive


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
const FATIGUE_CLOCKS = {
  "hunger": {
    warningInterval: { hour: 18 },
    damageInterval: { day: 3 },
    startFlag: "last_eat_time",
    warningCommand: "addHungry",
    damageCommand: "applyHunger",
    intervalFlag: "hunger_interval_id",
    condition: "Hungry",
    alwaysOn: true
  },
  "thirst": {
    warningInterval: { hour: 12 },
    damageInterval: { day: 1 },
    startFlag: "last_drink_time",
    warningCommand: "addThirsty",
    damageCommand: "applyThirst",
    intervalFlag: "thirst_interval_id",
    condition: "Thirsty",
    alwaysOn: true
  },
  "exhaustion": {
    warningInterval: { hour: 18 },
    damageInterval: { day: 1 },
    startFlag: "last_sleep_time",
    warningCommand: "addSleepy",
    damageCommand: "applyExhaustion",
    intervalFlag: "exhaustion_interval_id",
    condition: "Sleepy",
    alwaysOn: true
  },
  "cold": {
    warningInterval: {}, // immediate
    damageInterval: {}, // varies based on difference between worn and required Clo
    startFlag: "cold_start_time",
    warningCommand: "addCold",
    damageCommand: "applyCold",
    intervalFlag: "cold_interval_id",
    condition: "Cold",
    alwaysOn: false
  },
  "rest": {
    warningInterval: {},
    damageInterval: {},
    startFlag: "last_rest_time",
    warningCommand: "",
    damageCommand: "",
    intervalFlag: "",
    condition: "",
    alwaysOn: false
  },
};
export const DISEASES = {
  "grippe": {
    symptoms: ["cough", "headache", "fatigue"],
    virulence: "d3",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
  "dysentery": {
    symptoms: ["diarrhea", "abdominal pain", "fatigue"],
    virulence: "d4",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
  "typhoid": {
    symptoms: ["fever", "abdominal pain", "rash"],
    virulence: "d4",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
  "gangrene": {
    symptoms: ["numbness", "black tissue"],
    virulence: "d6",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
  "malaria": {
    symptoms: ["paroxysms", "vomiting", "fever"],
    virulence: "d6",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
  "spotted fever": {
    symptoms: ["rash", "headache", "confusion"],
    virulence: "d8",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
  "plague": {
    symptoms: ["black tissue", "headache", "fever"],
    virulence: "d8",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
  "leprosy": {
    symptoms: ["black tissue", "numbness", "rash"],
    virulence: "d10",
    warningInterval: {day: 1},
    damageInterval: { day: 1 },
    startFlag: "startTime",
    warningCommand: "confirmDisease",
    damageCommand: "applyDisease",
    intervalFlag: "intervalId",
    condition: "Diseased",
  },
};

export async function resetFatigueType(actor, type, time=Util.now()) {
  let {warningInterval, startFlag, warningCommand, intervalFlag, condition} = FATIGUE_CLOCKS[type];
  const startTime = actor.getFlag("lostlands", startFlag);
  startTime != time && await actor.setFlag("lostlands", startFlag, time);
  condition && await Util.removeCondition(condition, actor, {warn: false});

  const intervalId = actor.getFlag("lostlands", intervalFlag);
  intervalId && await TimeQ.cancel(intervalId);

  return scheduleOnce(actor, intervalFlag, warningCommand, warningInterval, time);
}

export function reqClo() {
  // change game setting of required clo when season changes
  // then GM can alter with macro for daily weather
  const season = SimpleCalendar.api.getCurrentSeason()?.name.toLowerCase();
  const reqClo = Constant.REQ_CLO_BY_SEASON[season];
  return reqClo;
}

export async function restartFatigueClocks(time) {

  const allChars = game.actors.filter(a => a.type === 'character');

  for (const char of allChars) {
    
    await resetDiseases(char, time);

    await resetClocks(char, time);
  }

}

// TODO how to handle clock restart for cold damage from here?
// TODO TEST

async function resetClocks(char, time) {
  // 1) stop the clock using stored interval Id
  // 2) if start time is invalid, set to undefined or given time for 'always on' clocks
  // 3) if there is a start time defined, start the clock
  //    3a) Compare start time to now: if within warning event interval, schedule warning event
  //    3b) otherwise, schedule damage event

  const actorId = char.isToken ? char.token.id : char.id;
  for (const clock of Object.values(FATIGUE_CLOCKS)) {

    // 1
    const id = actor.getFlag("lostlands", clock.intervalFlag);
    id && await TimeQ.cancel(id);
    
    // 2
    const lastTime = char.getFlag("lostlands", clock.startFlag);
    if (lastTime > time) { 

      if (clock.alwaysOn) char.setFlag("lostlands", clock.startFlag, time);
      else char.unsetFlag("lostlands", clock.startFlag);
    }

    // 3
    const startTime = char.getFlag("lostlands", clock.startFlag);
    if (!startTime) continue;

    const warningIntervalInSeconds = Util.intervalInSeconds(clock.warningInterval);
    const warningTime = startTime + warningIntervalInSeconds;
    const scheduleWarning = warningTime > time;
    const argsString = 'actorId, execTime, newTime, oldTime';
    const scope = {actorId};
    
    if (scheduleWarning) {

      const intervalId = await scheduleOnce(clock.warningCommand, argsString, warningTime, scope);
      await char.setFlag("lostlands", clock.intervalFlag, intervalId);
      continue;
    }

      const damageInterval = clock.damageInterval;
      const intervalId = await scheduleRecurring(damageInterval, clock.damageCommand, argsString, startTime, time, scope);
      await char.setFlag("lostlands", clock.intervalFlag, intervalId);
  }
}


async function resetDiseases(char, time) {
  // 1) stop the clock using stored interval Id
  // 2) if start time is invalid, delete disease
  // 3) start the clock
  //    3a) Compare disease start time to given time: if within warning event interval, schedule warning event
  //    3b) otherwise, schedule damage event

  const actorId = char.isToken ? char.token.id : char.id;

  let charDiseases = char.getFlag("lostlands", "diseases");

  if (!charDiseases) {
    charDiseases = {};
  }

  for (const [disease, data] of Object.entries(charDiseases)) {

    // 1
    await TimeQ.cancel(data.intervalId);  // TODO addDisease does create a disease on character, with intervalId stored from doAt
    
    // 2
    const startTime = data.startTime;
    if (startTime > time) {
      delete charDiseases[disease];
    }

    // 3a
    const warningInterval = DISEASES[disease].warningInterval;
    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const warningTime = startTime + warningIntervalInSeconds;
    const scheduleWarning = warningTime > time;
    const argsString = 'actorId, disease, execTime, newTime, oldTime';
    const scope = {actorId, disease};

    if (scheduleWarning) {
      data.intervalId = await scheduleOnce('confirmDisease', argsString, warningTime, scope);
      continue;
    }

    // 3b
    const damageInterval = DISEASES[k].damageInterval;
    data.intervalId = await scheduleRecurring(damageInterval, 'applyDisease', argsString, startTime, time, scope);
  }

  await char.unsetFlag("lostlands", "diseases");
  return char.setFlag("lostlands", "diseases", charDiseases);
}

async function scheduleOnce(command, args, time, scope={}) {
  const macro = await Util.getMacroByCommand(`${command}`, `return game.lostlands.Macro.${command}(${args});`);
  const intervalId = await TimeQ.doAt(time, macro.id, scope);

  return intervalId;
}

async function scheduleRecurring(interval, command, args, startTime, currentTime, scope={}) {
  const macro = await Util.getMacroByCommand(`${command}`, `return game.lostlands.Macro.${command}(${args});`);
  const startTime = Util.prevTime(interval, startTime, currentTime);
  const intervalId = await TimeQ.doEvery(interval, nextTime, macro.id, scope);

  return intervalId;
}
