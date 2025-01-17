import * as Util from './utils.js';
import { TimeQ } from './time-queue.js';
import * as Constant from './constants.js';

// TODO update rules doc
// TODO if total of max HP damage > max HP, MV halved (use condition/effect)
// TODO button to level up char, add level/HD to top bar of actor sheet, allow players to click this button, shows chat msg and rolls HP based on HD in attributes
// TODO XP progressions for basic attributes, and button on charsheet, allow players to click. don't allow players to edit HP or XP
// TODO d6 skills like swimming/climbing in features or attributes?
// TODO macro for morale check
// TODO macro for award XP
// TODO sounds for spells
// TODO convert all mp3s to ogg
// TODO record all actor attributes by type in actor.js, and item attributes by type in item.js
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
//  Exhaustiond

export const EXHAUSTION_DAMAGE_COMMAND = 'applyExhaustion(actorId, type, execTime, newTime)';
export const DISEASE_DAMAGE_COMMAND = 'applyDisease(actorId, disease, execTime, newTime)'; // TODO move combat constants to combat.js

export const REST_TYPES = {
  Rough: null,
  Peasant: 'd4',
  Merchant: 'd6',
  Noble: 'd8',
  Royal: 'd10',
};
const REQ_CLO_BY_SEASON = {
  summer: 6,
  fall: 16,
  spring: 16,
  winter: 26,
};
export function diffClo(char) {
  const temp = game.settings.get('brigandine', 'temp');
  const requiredClo = 36 - 10 - temp;
  const wornClo = Number(char.data.data.clo);
  const diff = wornClo - requiredClo;
  return diff || 0;
}
export const CLOCKS = {
  hunger: {
    warningInterval: { day: 1 },
    warningSound: 'stomach_rumble',
    damageInterval: { day: 3 },
    damageDice: 'd3',
    condition: 'Hungry',
    warnCondition: (date) => date.second === 0 && date.minute === 0 && date.hour % 4 === 0,
  },
  thirst: {
    warningInterval: { hour: 12 },
    damageInterval: { day: 1 },
    damageDice: 'd6',
    condition: 'Thirsty',
    warnCondition: (date) => date.second === 0 && date.minute === 0 && date.hour % 1 === 0,
  },
  sleep: {
    warningInterval: { hour: 18 },
    warningSound: 'sleepy',
    damageInterval: { day: 2 },
    damageDice: 'd6',
    condition: 'Sleepy',
    warnCondition: (date) => date.second === 0 && date.minute === 0 && date.hour % 2 === 0,
  },
  exposure: {
    warningInterval: { minute: 0 },
    damageInterval: { hour: 1 },
    damageDice: 'd6',
    condition: 'Hot/Cold',
    warnCondition: (date) => date.second === 0 && date.minute % 10 === 0,
  },
};

const SYMPTOMS = Object.freeze({
  COUGH: 'cough', // done
  HEADACHE: 'headache', // done
  EXHAUSTION: 'exhaustion', // done
  DIARRHEA: 'diarrhea', // done
  GUT_PAIN: 'gut pain', // done
  RASH: 'rash',
  FEVER: 'fever', // done
  PAIN: 'pain', // done
  PUS: 'pus',
  PAROXYSMS: 'paroxysms',
  VOMITING: 'vomiting', // done
  RAPID_BREATHING: 'rapid breathing',
  CONFUSION: 'confusion',
  BLACK_TISSUE: 'black tissue',
  NUMBNESS: 'numbness',
});

export const DISEASES = {
  // TODO add contagiousness value
  grippe: {
    symptoms: ['cough', 'headache', 'exhaustion'],
    virulence: 'd3',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  dysentery: {
    symptoms: ['diarrhea', 'gut pain', 'exhaustion'],
    virulence: 'd4',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  infection: {
    symptoms: ['rash', 'pain', 'pus'],
    virulence: 'd4',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  typhoid: {
    symptoms: ['fever', 'gut pain', 'rash'],
    virulence: 'd6',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  ague: {
    symptoms: ['paroxysms', 'vomiting', 'fever'],
    virulence: 'd6',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  sepsis: {
    symptoms: ['fever', 'rapid breathing', 'gut pain'],
    virulence: 'd8',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  'spotted fever': {
    symptoms: ['rash', 'headache', 'confusion'],
    virulence: 'd8',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  plague: {
    symptoms: ['black tissue', 'headache', 'fever'],
    virulence: 'd8',
    incubationPeriod: { day: 1 },
    damageInterval: { day: 1 },
  },
  leprosy: {
    symptoms: ['black tissue', 'numbness', 'rash'],
    virulence: 'd10',
    incubationPeriod: { day: 30 },
    damageInterval: { day: 30 },
  },
};

export async function resetExhaustionDamage(actor, type) {
  const data = actor.getFlag('brigandine', type) || {};
  const damage = data.maxHpDamage;
  if (damage) {
    data.maxHpDamage = 0;
    await actor.setFlag('brigandine', type, data);
    await restoreMaxHpDamage(actor, damage);
  }
  // const { condition } = CLOCKS[type];
  // condition && await Util.removeCondition(condition, actor);
}

export async function resetExhaustionClock(actor, type, time = Util.now()) {
  const data = actor.getFlag('brigandine', type) || {};
  data.startTime = time;
  const { damageInterval } = CLOCKS[type];
  data.intervalId && (await TimeQ.cancel(data.intervalId));
  const scope = { actorId: actor._id, type };
  const macro = await Util.getMacroByCommand(
    `${EXHAUSTION_DAMAGE_COMMAND}`,
    `return game.brigandine.Macro.${EXHAUSTION_DAMAGE_COMMAND};`
  );
  data.intervalId = await TimeQ.doEvery(damageInterval, time, macro._id, scope);
  await actor.setFlag('brigandine', type, data);
}

export async function resetExhaustionType(actor, type, time = Util.now()) {
  // TODO combine flag updates into one call
  await resetExhaustionClock(actor, type, time);
  await resetExhaustionDamage(actor, type);
}

export function reqClo(season) {
  season = season || SimpleCalendar.api.getCurrentSeason()?.name.toLowerCase();
  const reqClo = REQ_CLO_BY_SEASON[season];
  return reqClo;
}

export async function syncExhaustionClocks(time, resetClocks = false) {
  const allChars = game.actors.filter((a) => a.type === 'character' && a.hasPlayerOwner);

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
    const data = char.getFlag('brigandine', type) || {};
    if (invalid(data.startTime)) {
      data.startTime = time;
      await char.setFlag('brigandine', type, data);
    }
  }

  // last rest time
  const lastRestTimeFlag = 'last_rest_time';
  const lastRestTime = char.getFlag('brigandine', lastRestTimeFlag);
  if (invalid(lastRestTime)) await char.setFlag('brigandine', lastRestTimeFlag, time);

  // diseases
  const charDiseases = char.getFlag('brigandine', 'disease') || {};

  for (const [disease, data] of Object.entries(charDiseases)) {
    if (invalid(data.startTime)) {
      await deleteDisease(char, disease);
    }
  }
}

async function resetDamageAndWarn(char, time) {
  const isDead = Number(char.data.data.hp.value) < 0;
  if (isDead) return;

  const isAsleep = char.data.effects.some((e) => e.label === 'Asleep');
  const isResting = char.data.effects.some((e) => e.label === 'Rest');
  const isWarm = char.data.effects.some((e) => e.label === 'Warm');

  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {
    let { condition, warningInterval, warningSound } = clock;
    const data = char.getFlag('brigandine', type);
    const startTime = data.startTime;
    if (!warningInterval || !condition) continue;

    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const beforeWarning = time < startTime + warningIntervalInSeconds;

    let conditionString = condition.toLowerCase();
    let typeString = Util.upperCaseFirst(type);
    let resetExposure = false;
    if (type === 'exposure') {
      const diff = diffClo(char);
      conditionString = getExposureCondition(diff).desc;
      resetExposure = isWarm || conditionString === 'cool' || conditionString === 'warm';
    }

    if (isResting || beforeWarning || resetExposure) {
      await resetExhaustionDamage(char, type);
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

    if (Object.keys(Constant.VOICE_MOODS).includes(warningSound)) {
      return Util.playVoiceSound(warningSound, char, token, { push: true, bubble: true, chance: 1 });
    }

    return Util.playSound(warningSound, token, { push: true, bubble: true });
  }
}

export function getExposureCondition(diffClo) {
  if (diffClo < -30)
    return {
      desc: 'extremely cold',
      dmgMulti: 3,
    };
  if (diffClo < -20)
    return {
      desc: 'very cold',
      dmgMulti: 2,
    };
  if (diffClo < -10)
    return {
      desc: 'cold',
      dmgMulti: 1,
    };
  if (diffClo < 0)
    return {
      desc: 'cool',
      dmgMulti: 0,
    };
  if (diffClo < 10)
    return {
      desc: 'warm',
      dmgMulti: 0,
    };
  if (diffClo < 20)
    return {
      desc: 'hot',
      dmgMulti: 1,
    };
  if (diffClo < 30)
    return {
      desc: 'very hot',
      dmgMulti: 2,
    };
  return {
    desc: 'extremely hot',
    dmgMulti: 3,
  };
}

export const exposureConditions = {};

async function syncDamageClocks(char, time, override = false) {
  const actorId = char._id;

  // clocks
  for (const [type, clock] of Object.entries(CLOCKS)) {
    const { damageInterval } = clock;
    if (!damageInterval) continue;

    const data = char.getFlag('brigandine', type);

    // if event is already scheduled and override not set, continue
    const scheduled = TimeQ.find(data.intervalId);
    if (scheduled && !override) continue;

    data.intervalId && (await TimeQ.cancel(data.intervalId));
    const startTime = Util.prevTime(damageInterval, data.startTime, time);
    const scope = { actorId, type };
    const macro = await Util.getMacroByCommand(
      `${EXHAUSTION_DAMAGE_COMMAND}`,
      `return game.brigandine.Macro.${EXHAUSTION_DAMAGE_COMMAND};`
    );
    data.intervalId = await TimeQ.doEvery(damageInterval, startTime, macro._id, scope);

    await char.setFlag('brigandine', type, data);
  }

  // diseases
  const charDiseases = char.getFlag('brigandine', 'disease') || {};
  let setDiseases = false;

  for (const [disease, data] of Object.entries(charDiseases)) {
    if (data.intervalId && !override) continue;

    const damageInterval = DISEASES[disease].damageInterval;
    const startTime = Util.prevTime(damageInterval, data.startTime, time);
    const scope = { actorId, disease };
    const macro = await Util.getMacroByCommand(
      `${DISEASE_DAMAGE_COMMAND}`,
      `return game.brigandine.Macro.${DISEASE_DAMAGE_COMMAND};`
    );
    data.intervalId = await TimeQ.doEvery(damageInterval, startTime, macro._id, scope);
    setDiseases = true;
  }

  setDiseases && (await char.setFlag('brigandine', 'disease', charDiseases));
}

export async function deleteDisease(actor, disease) {
  const diseases = actor.getFlag('brigandine', 'disease');
  if (!diseases || !diseases[disease]) return;

  const intervalId = diseases[disease].intervalId;
  await TimeQ.cancel(intervalId);

  const damage = +diseases[disease].maxHpDamage || 0;
  damage && (await restoreMaxHpDamage(actor, damage));

  const newDiseases = foundry.utils.deepClone(diseases);
  delete newDiseases[disease];

  await actor.unsetFlag('brigandine', 'disease');
  if (Object.keys(newDiseases).length) {
    await actor.setFlag('brigandine', 'disease', newDiseases);
  }
}

export async function deleteAllDiseases(actor) {
  const diseases = actor.getFlag('brigandine', 'disease');
  if (!diseases) return ui.notifications.info(`${actor.name} has no diseases to remove`);

  let damage = 0;
  for (const disease of Object.values(diseases)) {
    const intervalId = disease.intervalId;
    await TimeQ.cancel(intervalId);
    damage += +disease.maxHpDamage || 0;
  }

  try {
    await actor.unsetFlag('brigandine', 'disease');
    damage && (await restoreMaxHpDamage(actor, damage));

    ui.notifications.info(`Removed all diseases from ${actor.name}`);
  } catch (error) {
    throw error;
  }
}

async function restoreMaxHpDamage(actor, damage) {
  const maxHp = Number(actor.data.data.hp.max);
  const maxMaxHp = Number(actor.data.data.attributes.max_hp?.value) || Infinity;
  const result = Math.min(maxMaxHp, maxHp + damage);
  return actor.update({ 'data.hp.max': result });
}

export async function clearMaxHpDamage(actor) {
  let totalDmg = 0;
  // clocks
  for (const type of Object.keys(CLOCKS)) {
    const data = actor.getFlag('brigandine', type) || {};
    const damage = data.maxHpDamage;
    if (damage) {
      await restoreMaxHpDamage(actor, damage);
      data.maxHpDamage = 0;
      await actor.setFlag('brigandine', type, data);
      totalDmg += damage;
    }
  }
  // diseases -- Just restores damage from diseases, doesn't eliminate the diseases
  const diseases = actor.getFlag('brigandine', 'disease');
  if (!diseases) return totalDmg;
  for (const data of Object.values(diseases)) {
    const damage = +data.maxHpDamage || 0;
    if (damage) {
      await restoreMaxHpDamage(actor, damage);
      data.maxHpDamage = 0;
      totalDmg += damage;
    }
  }
  await actor.setFlag('brigandine', 'disease', diseases);

  return totalDmg;
}
