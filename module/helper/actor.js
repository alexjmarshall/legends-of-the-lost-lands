import * as CLASSES from '../rules/classes/index.js';
import * as RACES from '../rules/races/index.js';
import { cloneItem } from '../helper/item.js';
import { getAdvancementPointsRequired } from '../rules/skills.js';

export const SIZES = {
  TINY: 'T',
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L',
  HUGE: 'H',
  GARGANTUAN: 'G',
  COLOSSAL: 'C',
};

export const SIZE_VALUES = {
  [SIZES.TINY]: 1, // tiny
  [SIZES.SMALL]: 2, // small
  [SIZES.MEDIUM]: 3, // medium
  [SIZES.LARGE]: 4, // large
  [SIZES.HUGE]: 5, // huge
  [SIZES.GARGANTUAN]: 6, // gargantuan
  [SIZES.COLOSSAL]: 7, // colossal
  default: 2,
};

/**
 * Adjusts the size of a value based on the provided character size.
 * @param {number} val - The value to adjust.
 * @param {number} charSize - The character size factor.
 * @returns {number} - The adjusted size.
 */
export function sizeMulti(val, charSize) {
  if (charSize > 2) {
    // If charSize is greater than 2, increase the size by 50%.
    return (val * 3) / 2;
  } else if (charSize === 1) {
    // If charSize is 1, decrease the size by 1/3.
    return (val * 2) / 3;
  } else if (charSize < 1) {
    // If charSize is less than 1, decrease the size by 50%.
    return val / 2;
  } else {
    // For other cases, return the original size.
    return val;
  }
}

export function getTokenFromActor(actor) {
  const token = actor?.isToken
    ? actor.token.data
    : canvas.tokens?.objects?.children.find((t) => t.actor?._id === actor?._id && t.name == actor?.name);
  return token;
}

export async function updateLevel(actor, actorUpdates, itemUpdates) {
  console.log('updateLevel', actor, actorUpdates, itemUpdates);
  // delete all features on this actor
  const featureIds = actor.data.items.filter((i) => i.type === 'feature').map((i) => i._id);
  await actor.deleteEmbeddedDocuments('Item', featureIds);
  await actor.createEmbeddedDocuments('Item', itemUpdates);
  return actor.update(actorUpdates);
}

export function getLevelUpdates(actor, lvl, className, race, origin) {
  console.log('getLevelUpdates', actor, lvl, className, race, origin);
  className = className || actor.data.data.class;
  race = race || actor.data.data.race;
  origin = origin || actor.data.data.origin;

  // get class, race and origin data
  const actorClass = CLASSES[className];
  const classObj = new actorClass(lvl, origin);
  const actorRace = RACES[race];

  // for each feature, add a feature item to this actor
  // get the base feature from the existing one, and modify it according to class feature config data
  const classFeatures = classObj.features;
  const raceFeatures = actorRace.features;
  const features = [...classFeatures, ...raceFeatures];
  const createFeatureUpdates = [];
  for (const feature of features) {
    const featureItem = game.items.getName(feature.name);
    if (!featureItem) {
      ui.notifications.error(`Could not find ${feature.name} in game items!`);
      continue;
    }
    const createData = cloneItem(featureItem);
    if (feature.usesPerDay) {
      createData.data.attributes.uses_per_day.value = feature.usesPerDay;
      createData.data.attributes.uses_per_day.max = feature.usesPerDay;
    }
    createFeatureUpdates.push(createData);
  }

  // update lvl, xp_req value and xp_req max
  const leftoverXp = Math.max(0, actor.data.data.xp_req.value - actor.data.data.xp_req.max);
  const actorUpdates = {
    'data.lvl': lvl,
    'data.xp_req.value': leftoverXp,
    'data.xp_req.max': classObj.reqXp,
  };

  // update skills
  const allSkills = Object.values(classObj.skills).flat();
  const skillUpdates = {};
  for (const skill of allSkills) {
    const skillUpdate = foundry.utils.deepClone(actor.data.data.skills[skill.name]);
    if (!skillUpdate) {
      ui.notifications.error(`Could not find ${skill.name} in actor skills!`);
      continue;
    }
    if (actor.data.data.attributes.admin.use_target_skill_lvl.value) {
      skillUpdate.lvl = skill.target;
    } else {
      while (skillUpdate.adv_req.value >= skillUpdate.adv_req.max) {
        skillUpdate.adv_req.value -= skillUpdate.adv_req.max;
        skillUpdate.lvl++;
        skillUpdate.adv_req.max = getAdvancementPointsRequired(skillUpdate.lvl);
      }
      const chanceOfIncrease = skillUpdate.adv_req.value / skillUpdate.adv_req.max;
      if (Math.random() < chanceOfIncrease) {
        skillUpdate.lvl++;
        skillUpdate.adv_req.value = 0;
      }
    }
    if (skillUpdate.lvl < skill.min) {
      skillUpdate.lvl = skill.min;
    }
    skillUpdate.adv_req.max = getAdvancementPointsRequired(skillUpdate.lvl);
    skillUpdates[`${skill.name}`] = skillUpdate;
  }
  actorUpdates['data.skills'] = skillUpdates;

  // update HP
  if (lvl > 1 && lvl === actor.data.data.lvl + 1) {
    const rolledHp = rollDice(`${classObj.hitDie}`);
    const maxHpUpdate = actor.data.data.hp.max + rolledHp;
    const hpUpdate = actor.data.data.hp.value + rolledHp;
    actorUpdates['data.hp.max'] = maxHpUpdate;
    actorUpdates['data.hp.value'] = hpUpdate;
  }

  return {
    actor: actorUpdates,
    item: createFeatureUpdates,
  };
}
