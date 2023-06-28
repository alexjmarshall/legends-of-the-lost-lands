import { abilitiesEnum } from './abilities';
import { buildEnum, deepFreeze } from './helper';

const { STR, INT, WIS, DEX, CON, CHA } = abilitiesEnum;

/*
 * Skills are Basic or Expert
 * Character skill proficiency levels are Specialized, Proficient or Untrained
 * Class skills are usually Specialized, sometimes Proficient. Skills from Origin are Proficient.
 * Basic skills have an Untrained penalty of -2, Expert -5.
 * Skills improve automatically with usage. Advancement points are tracked for each character skill and increased when used.
 * Advancement points required to increase the skill increases linearly with skill level: 1000 to level 1, 2000 to level 2, etc.
 * Skill advancements are checked when the character levels up.
 * If the character has not accrued enough points to guarantee an increase, there is still a chance equal to points/required.
 * If a character has accrued more than enough points to increase, the increase is automatic, 
 * and the chance of a second increase is equal to the excess points/required, and so on 
 * until the check to increase is failed and points are reset to 0.
 * The number of skill advancement points accrued per use is a function of:
 *    * a base advancement value associated with the skill itself, and
 *    * how far the character's current skill level is above or below the target level
 * The target level for a character skill depends on the proficiency level (Specialized, Proficient or Untrained)
 *    * Specialized skills have a target level equal to the character's level
 *    * Proficient skills have a target level equal to the character's level * 2 / 3
 *    * Untrained skills have a target level equal to the character's level / 2 - expertise penalty
 * The advancement points formula is advancementBase ^ (1 + (targetLvl - currLvl) / 5)
 * Skill base factors are rated by typical frequency of usage.
 *    * Continual skills are used multiple times most sessions, e.g. combat skills - 40
 *    * Common skills are used in most sessions, e.g. adventure, thievery, spell skills - 120
 *    * Occasional skills are used in some sessions, e.g. lore, survival, craft skills - 200
 *    * Rare skills are used in few sessions, e.g. culture skills - 320
 * Skills have a minimum level based on proficiency and increase to the minimum if below it after advancement checks on level up.
 *    * Specialized skills have a minimum equal to the character's level / 2
 *    * Proficient skills have a minimum equal to the character's level / 3
 *    * Untrained skills have a minimum equal to the character's level / 4 - expertise penalty


Major Failure/Success = fail/succeed by 5+. Critical Failure/Success = d100 <= margin of success
 * Crits override majors
*/

// TODO Monster Stats
// Intelligent monsters get 1x level resolve saves, non-intelligent get 0.5x level
// detect invisibility stat from 1e MM
// Morale stat from 2e MM

export const DEFAULT_SKILL_LEVEL = 18;

export const getAdvancementPointsRequired = (lvl) => Number(lvl) * 1000;

export const getCurrentSkillLevel = (min, gained) => DEFAULT_SKILL_LEVEL - Number(min) - Number(gained);

export const getAdvancementPointsPerUse = (advancementBase, targetLvl, currLvl) => {
  return Math.max(1, Math.floor(Number(advancementBase) ** (1 + (Number(targetLvl) - Number(currLvl)) / 5)));
};

export const advancementBases = Object.freeze({
  CONTINUAL: 40,
  COMMON: 120,
  OCCASIONAL: 200,
  RARE: 320,
});
const { CONTINUAL, COMMON, OCCASIONAL, RARE } = advancementBases;

export const skillProfBasesAndTargets = Object.freeze({
  specialized: (lvl) => ({
    min: Math.max(lvl - 4, Math.floor(lvl / 2)),
    target: lvl,
  }),
  proficient: (lvl) => ({
    min: Math.max(lvl - 6, Math.floor(lvl / 3)),
    target: Math.max(lvl - 3, Math.floor((lvl * 2) / 3)),
  }),
  untrained: (lvl, expertise) => ({
    min: Math.max(
      lvl - 8 - skillExpertisePenalties[expertise],
      Math.floor(lvl / 4) - skillExpertisePenalties[expertise]
    ),
    target: Math.max(
      lvl - 4 - skillExpertisePenalties[expertise],
      Math.floor(lvl / 2) - skillExpertisePenalties[expertise]
    ),
  }),
});

export const skillProfsEnum = buildEnum(skillProfBasesAndTargets);

export const skillCategoriesEnum = Object.freeze({
  ADVENTURE: 'adventure',
  COMBAT: 'combat',
  CRAFT: 'craft',
  CULTURE: 'culture',
  LORE: 'lore',
  SPELLS: 'spells',
  SURVIVAL: 'survival',
  THIEVERY: 'thievery',
});

const { ADVENTURE, COMBAT, CRAFT, CULTURE, LORE, SPELLS, SURVIVAL, THIEVERY } = skillCategoriesEnum;

export const skillExpertisePenalties = Object.freeze({
  EXPERT: -5,
  BASIC: -2,
});

export const armorPenaltyFactors = Object.freeze({
  FALSE: 0,
  TRUE: 1,
  DOUBLE: 2,
});
const { FALSE, TRUE, DOUBLE } = armorPenaltyFactors;

export const skills = deepFreeze({
  abjuration: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  alteration: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  'animal handling': {
    ability: WIS,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  appraise: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  axe: {
    ability: STR,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  blacksmithing: {
    ability: STR,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  bludgeon: {
    ability: STR,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  bow: {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  'bowyer/fletcher': {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: TRUE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  calligraphy: {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: TRUE,
    category: CULTURE,
    advancementBase: RARE,
  },
  climb: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: TRUE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  conjuration: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  cookery: {
    ability: WIS,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  crossbow: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  dagger: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  demonlore: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  'disarm trap': {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: TRUE,
    nonProficientArmorPenalty: TRUE,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  disguise: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  'distance running': {
    ability: CON,
    expert: false,
    proficientArmorPenalty: TRUE,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  divination: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  enchantment: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  etiquette: {
    ability: CHA,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CULTURE,
    advancementBase: RARE,
  },
  evocation: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  farming: {
    ability: WIS,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  firecraft: {
    ability: WIS,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  'flail/whip': {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  forgery: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  'hand-to-hand': {
    ability: STR,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  // handgonne: {
  //   ability: DEX,
  //   expert: false,
  //   proficientArmorPenalty: FALSE,
  //   nonProficientArmorPenalty: TRUE,
  //   category: COMBAT,
  //   advancementBase: CONTINUAL,
  // },
  heraldry: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CULTURE,
    advancementBase: RARE,
  },
  herblore: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  hide: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: TRUE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  history: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CULTURE,
    advancementBase: RARE,
  },
  'hunting/foraging': {
    ability: WIS,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  illusion: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  intimidate: {
    ability: STR,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  leatherworking: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  listen: {
    ability: INT,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  magicka: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  medicine: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  navigation: {
    ability: WIS,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  necromancy: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SPELLS,
    advancementBase: COMMON,
  },
  'one-handed sword': {
    ability: STR,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  persuade: {
    ability: CHA,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  'pick lock': {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: TRUE,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  'pick pocket': {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: TRUE,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  'poetry/music': {
    ability: CHA,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CULTURE,
    advancementBase: RARE,
  },
  poisonlore: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  polearm: {
    ability: STR,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  'read languages': {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  religion: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  riding: {
    ability: CON,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  runecarving: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  runelore: {
    ability: INT,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  sailing: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  search: {
    ability: INT,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  sling: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  sneak: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: TRUE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  spear: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  staff: {
    ability: STR,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  stoneworking: {
    ability: STR,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  swim: {
    ability: CON,
    expert: false,
    proficientArmorPenalty: DOUBLE,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  tailoring: {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: TRUE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  throw: {
    ability: DEX,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  tracking: {
    ability: WIS,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  trading: {
    ability: CHA,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  'two-handed sword': {
    ability: DEX,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  woodworking: {
    ability: STR,
    expert: true,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: TRUE,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  'wound treatment': {
    ability: WIS,
    expert: false,
    proficientArmorPenalty: FALSE,
    nonProficientArmorPenalty: FALSE,
    category: ADVENTURE,
  },
});

export const allSkillsArray = Object.keys(skills);

export const skillsEnum = buildEnum(skills);

export const allCombatSkillsArray = Object.keys(skills).filter((s) => skills[s].category === COMBAT);

export const allSpellSkillsArray = Object.keys(skills).filter((s) => skills[s].category === SPELLS);

export const allThieverySkillsArray = Object.keys(skills).filter((s) => skills[s].category === THIEVERY);

export const allBasicSkillsArray = Object.keys(skills).filter((s) => skills[s].expert === false);
