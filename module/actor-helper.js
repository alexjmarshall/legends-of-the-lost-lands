import * as CLASSES from './rules/classes/index.js';
import * as RACES from './rules/races/index.js';
import { cloneItem } from './item-helper.js';
import { getAdvancementPointsRequired } from './rules/skills.js';
import { getExtraLanguages } from './rules/languages.js';
import { getClericSpellsKnown, getDruidSpellsKnown, getStartingMagicSpellsKnown, SPELL_TYPES } from './rules/spells.js';
import { getStartingRunesKnown } from './rules/runes.js';
import { getStartingRecipesKnown } from './rules/recipes.js';
import { features as rulesFeatures } from './rules/features.js';
import { rollDice } from './dice.js';

export function getTokenFromActor(actor) {
  const token = actor?.isToken
    ? actor.token.data
    : canvas.tokens?.objects?.children.find((t) => t.actor?._id === actor?._id && t.name === actor?.name);
  return token;
}

function getClassInstance(className, lvl, origin) {
  if (className.includes('/')) {
    const classes = className.split('/').map((c) => CLASSES[c]);
    return new CLASSES.MultiClass(classes, lvl, origin);
  }
  const actorClass = CLASSES[className];
  return new actorClass(lvl, origin);
}

function addFeatures(itemData, classInstance, race, actor) {
  const classFeatures = classInstance.features ?? [];
  const raceFeatures = race.features ?? [];
  const features = [...classFeatures, ...raceFeatures];

  for (const feature of features) {
    const featureFinder = (i) => i.type === 'feature' && i.name === feature.name;
    const featureItem = game.items.find(featureFinder);
    if (!featureItem) {
      ui.notifications.error(`Could not find ${feature.name} in game items!`);
      continue;
    }
    // if actor, check whether they already have this feature
    const actorFeature = actor?.data.items.find(featureFinder);
    if (actorFeature) {
      const actorFeatureData = actorFeature?.data.data;
      // if the feature type is inherent or limited use ability, delete the old feature
      if (
        feature.usesPerDay &&
        actorFeatureData.attributes.uses_per_day.value !== feature.usesPerDay &&
        actorFeatureData.attributes.uses_per_day.value !== feature.usesPerDay
      ) {
        itemData.update.push({
          _id: actorFeature._id,
          'data.attributes.uses_per_day.value': feature.usesPerDay,
          'data.attributes.uses_per_day.max': feature.usesPerDay,
        });
      }
    } else {
      // check if the feature already has a feature with the same baseName
      // this means the feature must be *replaced* with the new version
      // probably because it's not possible to update an embedded feature's activeEffects
      // add the old feature's id to the delete list
      const baseName = feature.baseName;
      if (baseName) {
        const otherFeaturesWithBaseName = Object.values(rulesFeatures).filter(
          (f) => f.baseName === baseName && f.name !== feature.name
        );
        for (const otherFeature of otherFeaturesWithBaseName) {
          const otherFeatureItem = actor?.data.items.find((i) => i.type === 'feature' && i.name === otherFeature.name);
          if (otherFeatureItem) {
            itemData.delete.push(otherFeatureItem._id);
          }
        }
      }

      const featureData = cloneItem(featureItem);
      if (feature.usesPerDay) {
        featureData.data.attributes.uses_per_day.value = feature.usesPerDay;
        featureData.data.attributes.uses_per_day.max = feature.usesPerDay;
      }
      itemData.create.push(featureData);
    }
  }
}

const addSkills = (updateData, actor, classInstance) => {
  const allSkills = Object.values(classInstance.skills).flat();
  const skillUpdates = {};
  for (const skill of allSkills) {
    // use the _source value for the current skill lvl, to avoid active effects
    const skillUpdate = foundry.utils.deepClone(actor.data._source.data.skills[skill.name]);
    if (!skillUpdate) {
      ui.notifications.error(`Could not find ${skill.name} in actor skills!`);
      continue;
    }
    skillUpdate.target = skill.target;
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
  updateData['data.skills'] = skillUpdates;
};

const addSpellsKnown = (itemData, classInstance, actor) => {
  let clericSpellsKnown = getClericSpellsKnown(classInstance);
  let druidSpellsKnown = getDruidSpellsKnown(classInstance);
  let magicSpellsKnown = getStartingMagicSpellsKnown(classInstance);

  // remove spells that the actor already knows
  if (actor) {
    const actorSpells = actor.data.items.filter((i) => i.type === 'spell');
    const actorSpellNames = actorSpells.map((i) => i.name);
    clericSpellsKnown = clericSpellsKnown.filter((spell) => !actorSpellNames.includes(spell));
    druidSpellsKnown = druidSpellsKnown.filter((spell) => !actorSpellNames.includes(spell));
    magicSpellsKnown = magicSpellsKnown.filter((spell) => !actorSpellNames.includes(spell));
  }

  // get the game spell items matching the name of the spells known
  const spellFinder = (spellType, spell) => (i) =>
    i.type === 'spell' && i.data.data.attributes.type.value === spellType && i.name === spell;
  const clericSpellItems = clericSpellsKnown
    .map((spell) => game.items.find(spellFinder(SPELL_TYPES.CLERIC, spell)))
    .filter((i) => i);
  const druidSpellItems = druidSpellsKnown
    .map((spell) => game.items.find(spellFinder(SPELL_TYPES.DRUID, spell)))
    .filter((i) => i);
  const magicSpellItems = magicSpellsKnown
    .map((spell) => game.items.find(spellFinder(SPELL_TYPES.MAGIC, spell)))
    .filter((i) => i);
  const clonedItems = [...clericSpellItems, ...druidSpellItems, ...magicSpellItems].map((i) => cloneItem(i));
  itemData.create.push(...clonedItems);
};

const addRecipesKnown = (itemData, classInstance) => {
  const recipesKnown = getStartingRecipesKnown(classInstance);
  const recipeItems = recipesKnown.map((recipe) => game.items.find((i) => i.type === 'recipe' && i.name === recipe));
  const recipeData = recipeItems.map((i) => cloneItem(i));
  itemData.create.push(...recipeData);
};

const addRunesKnown = (itemData, classInstance) => {
  const runesKnown = getStartingRunesKnown(classInstance);
  const runeItems = runesKnown.map((rune) => game.items.find((i) => i.type === 'rune' && i.name === rune));
  const runeData = runeItems.map((r) => cloneItem(r));
  itemData.create.push(...runeData);
};

const addSpellSlotsToSpellType = (updateData, spellSlots, spellType) => {
  for (let i = 0; i < spellSlots.length; i++) {
    const slots = spellSlots[i];
    const lvl = i + 1;
    updateData[`data.attributes.spellcasting_${spellType}.lvl_${lvl}.value`] = slots;
    updateData[`data.attributes.spellcasting_${spellType}.lvl_${lvl}.max`] = slots;
  }
};

const addSpellSlots = (updateData, classInstance, wisScore) => {
  let magicSpellSlots = classInstance.magicSpellSlots;
  let clericSpellSlots = classInstance.clericSpellSlots;
  let druidSpellSlots = classInstance.druidSpellSlots;

  const bonusClericSpellSlots = [];
  if (wisScore >= 18) {
    bonusClericSpellSlots.push([1, 1, 1]);
  } else if (wisScore >= 16) {
    bonusClericSpellSlots.push([1, 1]);
  } else if (wisScore >= 13) {
    bonusClericSpellSlots.push([1]);
  }
  // add bonus cleric spell slots
  for (const slots of bonusClericSpellSlots) {
    clericSpellSlots = clericSpellSlots.map((s, i) => s + (slots[i] ?? 0));
  }

  addSpellSlotsToSpellType(updateData, magicSpellSlots, 'magic');
  addSpellSlotsToSpellType(updateData, clericSpellSlots, 'cleric');
  addSpellSlotsToSpellType(updateData, druidSpellSlots, 'druid');
};

const addLanguages = (updateData, classInstance, int) => {
  const currentLang = classInstance.languages;
  const updateLang = getExtraLanguages(currentLang, int);
  updateData['data.attributes.languages.value'] = updateLang.join(', ').trim();
};

export function getLevelUpdates(actor, lvl, formData = {}) {
  const actorData = actor.data.data;
  const className = formData['data.class'] ?? actorData.class;
  const race = formData['data.race'] ?? actorData.race;
  const origin = formData['data.origin'] ?? actorData.origin;
  const classInstance = getClassInstance(className, lvl, origin);
  const int = formData['data.attributes.ability_scores.int.value'] ?? actorData.attributes.ability_scores.int.value;
  const wis = formData['data.attributes.ability_scores.wis.value'] ?? actorData.attributes.ability_scores.wis.value;
  const actorRace = RACES[race];
  const itemData = {
    create: [],
    update: [],
    delete: [],
  };

  const leftoverXp = Math.max(0, actorData.xp_req.value - actorData.xp_req.max);
  const actorUpdates = {
    'data.lvl': lvl,
    'data.xp_req.value': leftoverXp,
    'data.xp_req.max': classInstance.reqXp,
  };
  addSkills(actorUpdates, actor, classInstance);

  // update HP & FP if the character is past first level and incrementing level
  if (lvl > 1 && lvl === actorData.lvl + 1) {
    const rolledHp = rollDice(`${classInstance.thisLevelHp}`);
    actorUpdates['data.hp.max'] = actorData.hp.max + rolledHp;
    actorUpdates['data.hp.value'] = actorData.hp.value + rolledHp;
    actorUpdates['data.fp.max'] = actorData.fp.max + rolledHp;
    actorUpdates['data.fp.value'] = actorData.fp.value + rolledHp;
  }

  // add starting languages, recipes and runes if the character is being created
  if (lvl === 1) {
    addLanguages(actorUpdates, classInstance, int);
    addRecipesKnown(itemData, classInstance);
    addRunesKnown(itemData, classInstance);
  }

  addFeatures(itemData, classInstance, actorRace, actor);
  addSpellsKnown(itemData, classInstance, actor);
  addSpellSlots(actorUpdates, classInstance, wis);

  return {
    actor: actorUpdates,
    item: itemData,
  };
}

export async function updateLevel(actor, actorUpdates, itemUpdates) {
  await actor.update(actorUpdates);
  if (itemUpdates.delete.length > 0) {
    await actor.deleteEmbeddedDocuments('Item', itemUpdates.delete);
  }
  if (itemUpdates.update.length > 0) {
    await actor.updateEmbeddedDocuments('Item', itemUpdates.update);
  }
  if (itemUpdates.create.length > 0) {
    await actor.createEmbeddedDocuments('Item', itemUpdates.create);
  }
}
