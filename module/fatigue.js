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

export async function stopClock(actor, intervalFlag) {
  const id = actor.getFlag("lostlands", intervalFlag);
  id && await TimeQ.cancel(id);
}

export async function startClock(actor, intervalFlag, command, interval, startTime) {
  const actorId = actor.isToken ? actor.token.id : actor.id;
  const macro = await getMacroByCommand(command, `return game.lostlands.Macro.${command}(actorId, execTime, newTime, oldTime);`);
  const intervalId = await TimeQ.doEvery(interval, startTime, macro.id, {actorId});
  return actor.setFlag("lostlands", intervalFlag, intervalId);
}

async function restartClock(actor, intervalFlag, command, interval, startTime) {
  await stopClock(actor, intervalFlag);
  return startClock(actor, intervalFlag, command, interval, startTime);
}

export async function resetFatigueType(actor, type, startTime) {
  let {interval, lastFlag, command, intervalFlag, condition} = Constant.FATIGUE_CLOCKS[type];
  const lastTime = actor.getFlag("lostlands", lastFlag);
  lastTime != startTime && await actor.setFlag("lostlands", lastFlag, startTime);
  condition && await removeCondition(condition, actor, {warn: false});
  await restartClock(actor, intervalFlag, command, interval, startTime);
}

export async function resetHunger(actor, startTime=now()) {
  await resetFatigueType(actor, "hungry", startTime);
  await resetFatigueType(actor, "hunger", startTime);
}

export async function resetThirst(actor, startTime=now()) {
  await resetFatigueType(actor, "thirsty", startTime);
  await resetFatigueType(actor, "thirst", startTime);
}

export async function resetSleep(actor, startTime=now()) {
  await resetFatigueType(actor, "sleepy", startTime);
  await resetFatigueType(actor, "exhaustion", startTime);
}

export function reqClo() {
  // weather?
  const season = SimpleCalendar.api.getCurrentSeason()?.name.toLowerCase();
  const reqClo = Constant.REQ_CLO_BY_SEASON[season];
  return reqClo;
}

export async function restartFatigueClocks(time) {
  // for each clock and character disease
  // 1) stop the clock using interval Id
  // 2) if start time is invalid, set to undefined or given time for 'always on' clocks
  // 3) if there is a start time defined, start the clock
  //    -- Compare start time to now: if within warning event interval, schedule warning event, otherwise schedule damage event
  // NOTE: don't schedule events for current time exactly -- next valid time is 1s after current time

  const allChars = game.actors.filter(a => a.type === 'character');
  

  for (const char of allChars) {
    
    await resetDiseases(char, time);

    await resetClocks(char, time);
  }

}

// TODO DRY up comments and code for stopping clocks and starting warning/damage clocks
// TODO how to handle clock restart for cold damage from here?
// TODO TEST

async function resetClocks(char, time) {
  // 1) stop the clock using interval Id
  // 2) if start time is invalid, set to undefined or given time for 'always on' clocks
  // 3) if there is a start time defined, start the clock
  //    -- Compare start time to now: if within warning event interval, schedule warning event, otherwise schedule damage event
  // NOTE: don't schedule events for current time exactly -- next valid time is 1s after current time

  const actorId = char.isToken ? char.token.id : char.id;
  for (const clock of Object.values(FATIGUE_CLOCKS)) {

    // 1
    const id = actor.getFlag("lostlands", clock.intervalFlag);
    id && await TimeQ.cancel(id);
    

    const lastTime = char.getFlag("lostlands", clock.startFlag);

    if (lastTime > time) { // 2

      if (clock.alwaysOn) char.setFlag("lostlands", clock.startFlag, time);
      else char.unsetFlag("lostlands", clock.startFlag);
    }

    const startTime = char.getFlag("lostlands", clock.startFlag);
    if (!startTime) continue;

    const warningIntervalInSeconds = Util.intervalInSeconds(clock.warningInterval);
    const warningTime = startTime + warningIntervalInSeconds;
    const scheduleWarning = warningTime > time;

    if (scheduleWarning) { // 3

      const actorId = char.isToken ? char.token.id : char.id;
      const macro = await getMacroByCommand(clock.warningCommand, `return game.lostlands.Macro.${clock.warningCommand}(actorId, execTime, newTime, oldTime);`);
      const intervalId = await TimeQ.doAt(warningTime, macro.id, {actorId});
      await char.setFlag("lostlands", clock.intervalFlag, intervalId);
    } else {

      const damageInterval = clock.damageInterval;
      const damageIntervalInSeconds = Util.intervalInSeconds(damageInterval);
      const macro = await Util.getMacroByCommand(clock.damageCommand, `return game.lostlands.Macro.${clock.damageCommand}(actorId, execTime, newTime, oldTime);`);
      const nextTime = Util.nextTime(damageInterval, startTime, time) - damageIntervalInSeconds;
      const intervalId = await TimeQ.doEvery(damageInterval, nextTime, macro.id, {actorId});
      await char.setFlag("lostlands", clock.intervalFlag, intervalId);
    }
  }
}


async function resetDiseases(char, time) {
  // 1) stop the clock using interval Id
  // 2) if start time is invalid, set to undefined or given time for 'always on' clocks
  // 3) if there is a start time defined, start the clock
  //    -- Compare start time to now: if within warning event interval, schedule warning event, otherwise schedule damage event
  // NOTE: don't schedule events for current time exactly -- next valid time is 1s after current time

  const actorId = char.isToken ? char.token.id : char.id;

  let charDiseases = char.getFlag("lostlands", "diseases");

  if (!charDiseases) {
    charDiseases = {};
  }

  for (const [disease, data] of Object.entries(charDiseases)) {

    await TimeQ.cancel(data.intervalId); //1 // TODO addDisease does create a disease on character, with intervalId stored from doAt
    const startTime = data.startTime;

    if (startTime > time) {  //2
      delete charDiseases[disease];
    }

    const warningInterval = DISEASES[disease].warningInterval;
    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const warningTime = startTime + warningIntervalInSeconds;
    const scheduleWarning = warningTime > time;

    if (scheduleWarning) {
      const macro = await Util.getMacroByCommand(`confirmDisease`, `return game.lostlands.Macro.confirmDisease(actorId, disease, execTime, newTime, oldTime);`);
      data.intervalId = await TimeQ.doAt(warningTime, macro.id, {actorId, disease});
      continue;
    }

    const damageInterval = DISEASES[k].damageInterval;
    const damageIntervalInSeconds = Util.intervalInSeconds(damageInterval);
    const macro = await Util.getMacroByCommand(`applyDisease`, `return game.lostlands.Macro.applyDisease(actorId, disease, execTime, newTime, oldTime);`);
    const nextTime = Util.nextTime(damageInterval, startTime, time) - damageIntervalInSeconds;
    data.intervalId = await TimeQ.doEvery(damageInterval, nextTime, macro.id, {actorId, disease});
  }

  await char.unsetFlag("lostlands", "diseases");
  return char.setFlag("lostlands", "diseases", charDiseases);
}
