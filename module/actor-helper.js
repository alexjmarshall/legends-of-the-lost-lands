import * as CLASSES from './rules/classes/index.js';
import * as RACES from './rules/races/index.js';
import { cloneItem } from './item-helper.js';
import { getAdvancementPointsRequired, skills } from './rules/skills.js';
import { getScoreMod, FULL_ABILITIES } from './rules/abilities.js';
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
    if (feature.virtual) {
      continue;
    }
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

function handleSkillsIncreases(skill, skillUpdate, min) {
  min = min ?? skill.min;
  while (skillUpdate.adv_req.value >= skillUpdate.adv_req.max) {
    skillUpdate.adv_req.value -= skillUpdate.adv_req.max;
    skillUpdate.lvl++;
    skillUpdate.adv_req.max = getAdvancementPointsRequired(skillUpdate.lvl);
  }

  const chanceOfIncrease = skillUpdate.adv_req.value / skillUpdate.adv_req.max;

  if (chanceOfIncrease > 0 && Math.random() < chanceOfIncrease) {
    skillUpdate.lvl++;
    skillUpdate.adv_req.value = 0;
  }

  if (skillUpdate.lvl < min) {
    skillUpdate.lvl = min;
    skillUpdate.adv_req.max = getAdvancementPointsRequired(skillUpdate.lvl);
  }
}

const addSkills = (updateData, actor, classInstance) => {
  const allSkills = Object.values(classInstance.skills).flat();
  for (const skill of allSkills) {
    // use the _source value for the current skill lvl, to avoid active effects
    const actorSkill = actor.data._source.data.skills[skill.name];
    if (!actorSkill) {
      ui.notifications.error(`Could not find ${skill.name} in actor skills!`);
      continue;
    }
    const skillUpdate = foundry.utils.deepClone(actorSkill);
    skillUpdate.target = skill.target;
    if (actor.data.data.attributes.admin.use_target_skill_lvl.value) {
      skillUpdate.lvl = skill.target;
      skillUpdate.adv_req.max = getAdvancementPointsRequired(skillUpdate.lvl);
    } else {
      handleSkillsIncreases(skill, skillUpdate);
    }

    if (skillUpdate.lvl > actorSkill.lvl) {
      updateData[`data.skills.${skill.name}`] = skillUpdate;
    }
  }
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

const addHpAndFp = (actorUpdates, classInstance, actor) => {
  const actorData = actor.data.data;
  const rolledHp = rollDice(`${classInstance.thisLevelHp}`);
  const conMod = getConMod(actor, actorUpdates);
  const hpUpdate = Math.max(1, conMod + rolledHp);
  actorUpdates['data.hp.max'] = actorData.hp.max + hpUpdate;
  actorUpdates['data.hp.value'] = actorData.hp.value + hpUpdate;
  actorUpdates['data.fp.max'] = actorData.fp.max + hpUpdate;
  actorUpdates['data.fp.value'] = actorData.fp.value + hpUpdate;
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
  addSaves(actorUpdates, classInstance);
  addSkills(actorUpdates, actor, classInstance);

  if (lvl > 1 && lvl === actorData.lvl + 1) {
    addHpAndFp(actorUpdates, classInstance, actor);
    addAbilityScores(actorUpdates, actor);
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

function addAbilityScores(actorUpdates, actor) {
  for (const [name, ability] of Object.entries(actor.data._source.data.attributes.ability_scores)) {
    const abilityData = foundry.utils.deepClone(ability);

    const min = actor.data.data.attributes.ability_scores[name].min;

    // count ability "skill" improvements
    handleSkillsIncreases(ability, abilityData, min);
    let skillsIncreases = abilityData.lvl - ability.lvl;

    // count this ability's skill improvements
    const skillsImproved = getSkillsImproved(actorUpdates, actor);
    for (const skill of skillsImproved) {
      const ability = skills[skill.name]?.ability;
      if (!ability || ability !== name) {
        continue;
      }
      skillsIncreases += skill.newValue - skill.oldValue;
    }

    // improve ability scores based on skill improvements
    // improve score if chanceImprove is met and a d20 roll is equal or greater than the old value
    const chanceImprove = 1 - Math.pow(0.5, skillsIncreases);

    if (Math.random() < chanceImprove && rollDice('d20') >= ability.value) {
      abilityData.value = ability.value + 1;
    }

    if (skillsIncreases > 0 || abilityData.value > ability.value) {
      actorUpdates[`data.attributes.ability_scores.${name}`] = abilityData;
    }
  }
}

function getSkillsImproved(actorUpdates, actor) {
  const skillsImproved = [];

  for (const [skillName, skill] of Object.entries(actor.data._source.data.skills)) {
    const oldValue = skill.lvl;
    const newValue = actorUpdates[`data.skills.${skillName}`]?.lvl;
    if (oldValue < newValue) {
      skillsImproved.push({
        name: skillName,
        oldValue,
        newValue,
      });
    }
  }

  return skillsImproved;
}

function getAbilityScoresImproved(actorUpdates, actor) {
  const abilityScoresImproved = [];

  for (const [abilityName, ability] of Object.entries(actor.data._source.data.attributes.ability_scores)) {
    const oldValue = ability.value;
    const newValue = actorUpdates[`data.attributes.ability_scores.${abilityName}`]?.value;
    if (oldValue < newValue) {
      abilityScoresImproved.push({
        name: abilityName,
        oldValue,
        newValue,
      });
    }
  }

  return abilityScoresImproved;
}

function getConMod(actor, actorUpdates) {
  const conScore = actor.data._source.data.attributes.ability_scores.con.value;
  let conMod = getScoreMod(conScore);
  if (actorUpdates['data.attributes.ability_scores.con.value'] != null) {
    const newCon = conScore + 1;
    conMod = getScoreMod(newCon);
  }
  return conMod;
}

function showLevelUpNotice(actor, actorUpdates, itemUpdates) {
  // find better word to distinguish between short term and long term exhaustion
  // use the max hp for sheet -- non editable, same as max XP required
  // real level drain? decrease skills/hp proportionately to level -- or could save the increases as data attached to actor and then remove
  // for monster xp, use Delta EHD * 100
  // fists/cestus 2 attacks for 1d2 / 1d4 damage each and reach 0. Kick is 1d3 damage reach 0. Improvised weapon is 1d3 damage with reach 1.
  // melee weapons have length which determines initiative when tied. Min and max length are derived props.
  // Max length is Math.ceil(length / 5).
  // Min length is Math.round(length / 5).
  // Can use while grappling if weapon size is T.
  // check magic item slot max before applying magic item effect on wear
  const actorData = actor.data.data;

  const featuresGained = itemUpdates.create.map((i) => i.name);

  const skillsImproved = getSkillsImproved(actorUpdates, actor);

  const abilityScoresImproved = getAbilityScoresImproved(actorUpdates, actor);

  const hpGained = actorUpdates['data.hp.max'] - actorData.hp.max;

  // TODO move into dialogs file
  new Dialog({
    title: `Level Gained`,
    content: `
      <p style="text-align:center;">${actor.name} grows stronger...</p>
      <div style="display:flex;"><p style="width:50%">Level: ${actorUpdates['data.lvl']}</p>
      <p>HP: +${hpGained}</p></div>
      ${featuresGained.length ? `<p>Features: ${featuresGained.map((f) => `${f}`).join(', ')}</p>` : ''}
      <div style="display:flex;">${
        skillsImproved.length
          ? `<div style="width:50%"><p>Skills:</p>
      <ul>
        ${skillsImproved.map((s) => `<li>${s.name}: ${s.oldValue} > ${s.newValue}</li>`).join('')}
      </ul></div>`
          : ''
      }
      ${
        abilityScoresImproved.length
          ? `<div><p>Ability Scores:</p>
      <ul> 
        ${abilityScoresImproved
          .map((a) => `<li>${FULL_ABILITIES[a.name]}: ${a.oldValue} > ${a.newValue}</li>`)
          .join('')}
      </ul></div>`
          : ''
      }</div>
    `,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: 'OK',
      },
    },
  }).render(true);
}

export async function updateLevel(actor, actorUpdates, itemUpdates) {
  if (actorUpdates['data.lvl'] > 1) {
    showLevelUpNotice(actor, actorUpdates, itemUpdates);
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
