import * as CLASSES from './rules/classes/index.js';
import * as RACES from './rules/races/index.js';
import { cloneItem } from './item-helper.js';
import { getAdvancementPointsRequired, skills } from './rules/skills.js';
import { getExtraLanguages } from './rules/languages.js';
import { getClericSpellsKnown, getDruidSpellsKnown, getStartingMagicSpellsKnown, SPELL_TYPES } from './rules/spells.js';
import { getStartingRunesKnown } from './rules/runes.js';
import { getStartingRecipesKnown } from './rules/recipes.js';
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

function addNewFeature(itemData, feature, featureItem) {
  const featureData = cloneItem(featureItem);
  if (feature.usesPerDay) {
    featureData.data.attributes.uses_per_day.value = feature.usesPerDay;
    featureData.data.attributes.uses_per_day.max = feature.usesPerDay;
  }
  if (feature.effectData?.changes?.length) {
    featureData.effects = [feature.effectData];
  }
  itemData.create.push(featureData);
}

function updateFeature(itemData, feature, actorFeature) {
  // no need to update if the feature doesn't have uses per day or effect data
  if (!feature.usesPerDay && !feature.effectData?.changes?.length) {
    return;
  }
  const featureData = {
    _id: actorFeature._id,
  };
  if (feature.usesPerDay && feature.usesPerDay !== actorFeature.data.data.attributes.uses_per_day.value) {
    featureData['data.attributes.uses_per_day.value'] = feature.usesPerDay;
    featureData['data.attributes.uses_per_day.max'] = feature.usesPerDay;
  }
  if (feature.effectData?.changes?.length) {
    featureData.effects = [feature.effectData];
  }
  itemData.update.push(featureData);
}

function addFeatures(itemData, classInstance, race, actor, removeFeatures = false) {
  const classFeatures = classInstance.features ?? [];
  const raceFeatures = race.features ?? [];
  const features = [...classFeatures, ...raceFeatures];
  const actorFeatures = actor?.data.items.filter((i) => i.type === 'feature');

  for (const feature of features) {
    const featureFinder = (i) => i.type === 'feature' && i.name === feature.name;
    const featureItem = game.items.find(featureFinder);
    if (!featureItem) {
      ui.notifications.error(`Could not find ${feature.name} in game items!`);
      continue;
    }

    const actorFeature = actorFeatures.find(featureFinder);
    if (actorFeature) {
      updateFeature(itemData, feature, actorFeature);
      continue;
    }
    addNewFeature(itemData, feature, featureItem);
  }

  if (removeFeatures) {
    // remove any features in the actor's list that aren't in the class/race list
    const featuresToDelete = actorFeatures.filter((i) => !features.some((f) => f.name === i.name));
    itemData.delete.push(...featuresToDelete.map((i) => i._id));
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

const getPrimeReqBonus = (actorData, formData, classInstance) => {
  // bonus is 1.2 if all prime reqs are > 17, 1.1 of all are > 15
  const primeReqs = CLASSES[classInstance.constructor.name].primeReqs;
  const abilityScores = actorData.attributes.ability_scores;
  if (primeReqs.length === 0) {
    return 1;
  }
  if (
    primeReqs.every((req) => (formData[`data.attributes.ability_scores.${req}.value`] ?? abilityScores[req].value) > 17)
  ) {
    return 1.2;
  }
  if (
    primeReqs.every((req) => (formData[`data.attributes.ability_scores.${req}.value`] ?? abilityScores[req].value) > 15)
  ) {
    return 1.1;
  }
  return 1;
};

const addXp = (actorData, formData, actorUpdates, classInstance, actorRace) => {
  let reqXp = classInstance.reqXp;
  if (actorRace === RACES.Human) {
    const primeReqBonus = getPrimeReqBonus(actorData, formData, classInstance);
    reqXp = Math.ceil(classInstance.reqXp / primeReqBonus);
  }
  const leftoverXp = Math.max(0, actorData.xp_req.value - actorData.xp_req.max);
  actorUpdates['data.xp_req.value'] = leftoverXp;
  actorUpdates['data.xp_req.max'] = reqXp;
};

const addHpAndFp = (actorData, actorUpdates, classInstance) => {
  const rolledHp = rollDice(`${classInstance.thisLevelHp}`);
  actorUpdates['data.hp.max'] = actorData.hp.max + rolledHp;
  actorUpdates['data.hp.value'] = actorData.hp.value + rolledHp;
  actorUpdates['data.fp.max'] = actorData.fp.max + rolledHp;
  actorUpdates['data.fp.value'] = actorData.fp.value + rolledHp;
};

const addSaves = (actorUpdates, classInstance) => {
  const saves = classInstance.saves;
  for (const save of Object.keys(saves)) {
    actorUpdates[`data.saves.${save}`] = saves[save];
  }
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

  const actorUpdates = {
    'data.lvl': lvl,
  };

  addXp(actorData, formData, actorUpdates, classInstance, actorRace);
  addSkills(actorUpdates, actor, classInstance);
  addSaves(actorUpdates, classInstance);

  // update HP & FP if the character is past first level and incrementing level
  if (lvl > 1 && lvl === actorData.lvl + 1) {
    addHpAndFp(actorData, actorUpdates, classInstance);
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

function addImprovedAbilityScores(actorUpdates, actor, skillsImproved) {
  const abilityScoresImproved = {};

  for (const [ability, score] of Object.entries(actor.data.data.attributes.ability_scores)) {
    abilityScoresImproved[ability] = {
      oldValue: score.value,
      newValue: score.value,
      skillsIncreases: 0,
    };
  }

  // count number of skill improvements for each ability
  for (const skill of skillsImproved) {
    const ability = skills[skill.name]?.ability;
    if (!ability) {
      continue;
    }
    abilityScoresImproved[ability].skillsIncreases += skill.newValue - skill.oldValue;
  }

  // improve ability scores based on skill improvements
  for (const [ability, { oldValue, skillsIncreases }] of Object.entries(abilityScoresImproved)) {
    const chanceImprove = 1 - Math.pow(0.5, skillsIncreases);

    // improve score if chanceImprove is met and a d20 roll is equal or greater than the old value
    if (Math.random() < chanceImprove && rollDice('d20') >= oldValue) {
      const newValue = oldValue + 1;
      abilityScoresImproved[ability].newValue = newValue;
      actorUpdates[`data.attributes.ability_scores.${ability}.value`] = newValue;
    }
  }

  // return only the ability scores that were improved
  return Object.entries(abilityScoresImproved)
    .map(([ability, { oldValue, newValue }]) => ({
      name: ability,
      oldValue,
      newValue,
    }))
    .filter(({ oldValue, newValue }) => newValue > oldValue);
}

export async function updateLevel(actor, actorUpdates, itemUpdates) {
  if (actorUpdates['data.lvl'] > 1) {
    // TODO split max hp into base max hp and derived attribute which adds con mod x level
    // fatigue damage affects CON not max HP
    // real level drain? decrease skills/hp proportionately to level -- or could save the increases as data attached to actor
    const featuresGained = itemUpdates.create.map((i) => i.name);

    const skillsImproved = Object.keys(actorUpdates['data.skills'])
      .map((skillName) => {
        const skill = actorUpdates['data.skills'][skillName];
        const oldSkillLevel = actor.data._source.data.skills[skillName]?.lvl ?? 0;
        const newSkillLevel = skill.lvl;
        return {
          name: skillName,
          oldValue: oldSkillLevel,
          newValue: newSkillLevel,
        };
      })
      .filter((skill) => skill.newValue > skill.oldValue);

    const abilityScoresImproved = addImprovedAbilityScores(actorUpdates, actor, skillsImproved);

    new Dialog({
      title: `Level Gained`,
      content: `
      <p style="text-align:center;">${actor.name} grows stronger...</p>
      <p>Level: ${actorUpdates['data.lvl']}</p>
      <p>HP: +${actorUpdates['data.hp.max'] - actor.data._source.data.hp.max}</p>
      ${
        featuresGained.length
          ? `<p>Features:</p>
      <ul>
        ${featuresGained.map((f) => `<li>${f}</li>`).join('')}
      </ul>`
          : ''
      }
      ${
        skillsImproved.length
          ? `<p>Skills:</p>
      <ul>
        ${skillsImproved.map((s) => `<li>${s.name}: ${s.oldValue} > ${s.newValue}</li>`).join('')}
      </ul>`
          : ''
      }
      ${
        abilityScoresImproved.length
          ? `<p>Ability Scores:</p>
      <ul> 
        ${abilityScoresImproved.map((a) => `<li>${a.name}: ${a.oldValue} > ${a.newValue}</li>`).join('')}
      </ul>`
          : ''
      }
    `,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: 'OK',
        },
      },
    }).render(true);
  }

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
