import { ABILITIES_ENUM } from './abilities';
import { buildEnum, buildStats, deepFreeze } from './helper';

const { STR, INT, WIS, DEX, CON, CHA } = ABILITIES_ENUM;

/*
 * Skills are Basic or Expert
 * * Skill rolls apply partial ability score modifier + skill bonus
 * * Basic skills have an Basic penalty of -2
 * * All charactes have all Basic skills, and only Proficient/Specialized Expert skills
 * Character skills can be Specialized, Proficient or Basic
 * * Skills improve with level and by spending skill points
 * * Specialized skills improve at 1/2 level and cap is 1.5x level
 * * Proficient skills improve at 1/3 level and cap is 1x level
 * * Basic skills improve at 1/4 level and cap is 3/4 level

Non-weapon Class skills are Specialized
Weapon skills can be Specialized, Proficient or Basic, depending on class
Background skills are Proficient for characters with the background

Character skill points per level equals
 * (number of Specialized skills) / 2 + (Proficient skills / 3) + (Basic skills / 4)

Major Failure/Success = fail/succeed by 5+. Critical Failure/Success = d100 <= margin of success
 * Crits override majors
*/

// Intelligence is non, semi or intelligent
//   0.5x, 1x or 1.5x level to mental saves and to Listen/Search checks/PP
// Stealth is non, somewhat or very
//  no Hide/Move Silently, 3/4x or 1.5x level
// Morale is Cowardly, Steady or Fearless
//   0.5x, 1x or 1.5x level to morale checks

export const SKILL_BUILDERS = deepFreeze({
  specialized: (lvl) => ({
    baseBonus: Math.floor(lvl / 2),
    cap: Math.min(lvl + 4, Math.floor(lvl * 1.5)),
  }),
  proficient: (lvl) => ({
    baseBonus: Math.floor(lvl / 3),
    cap: Math.floor(lvl),
  }),
  basic: (lvl) => ({
    baseBonus: Math.floor(lvl / 4),
    cap: Math.max(lvl - 4, Math.floor((lvl * 3) / 4)),
  }),
});

export const SKILL_PROGRESSIONS_ENUM = Object.freeze({
  SPECIALIZED: 'specialized',
  PROFICIENT: 'proficient',
  BASIC: 'basic',
});

export const SKILL_POINTS = (numSpecialized, numProficient, numBasic) => {
  return Math.floor(numSpecialized / 2 + numProficient / 3 + numBasic / 4);
};

export const CATEGORIES_ENUM = Object.freeze({
  ADVENTURE: 'adventure',
  CULTURE: 'culture',
  LORE: 'lore',
  OCCUPATION: 'occupation',
  SPELL_SCHOOL: 'spell school',
  SURVIVAL: 'survival',
  THIEVERY: 'thievery',
  WEAPON: 'weapon',
});

const { ADVENTURE, CULTURE, LORE, OCCUPATION, SPELL_SCHOOL, SURVIVAL, THIEVERY, WEAPON } = CATEGORIES_ENUM;

export const SKILLS = deepFreeze({
  abjuration: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  alteration: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  appraise: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: THIEVERY,
  },
  magicka: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  axe: {
    ability: STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  blacksmith: {
    ability: STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: OCCUPATION,
  },
  bludgeon: {
    ability: STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  bow: {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'bowyer/fletcher': {
    ability: DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: OCCUPATION,
  },
  calligraphy: {
    ability: DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CULTURE,
  },
  carpentry: {
    ability: STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: OCCUPATION,
  },
  'carve rune': {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CULTURE,
  },
  climb: {
    ability: DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: ADVENTURE,
  },
  conjuration: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  cook: {
    ability: WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: OCCUPATION,
  },
  crossbow: {
    ability: DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'curved greatsword': {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'curved sword': {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  dagger: {
    ability: DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  demonlore: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  disguise: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: THIEVERY,
  },
  'distance run': {
    ability: CON,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: SURVIVAL,
  },
  divination: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  enchantment: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  etiquette: {
    ability: CHA,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CULTURE,
  },
  evocation: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  'disarm trap': {
    ability: DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: THIEVERY,
  },
  firecraft: {
    ability: WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: SURVIVAL,
  },
  forgery: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: THIEVERY,
  },
  greatsword: {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  hammer: {
    ability: STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'hand-to-hand': {
    ability: STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  handgonne: {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'handle animal': {
    ability: WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SURVIVAL,
  },
  heraldry: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CULTURE,
  },
  herblore: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  hide: {
    ability: DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: ADVENTURE,
  },
  history: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CULTURE,
  },
  'hunt/forage': {
    ability: WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: SURVIVAL,
  },
  illusion: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  leathercraft: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: OCCUPATION,
  },
  listen: {
    ability: INT,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: ADVENTURE,
  },
  masonry: {
    ability: STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: OCCUPATION,
  },
  medicine: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  navigate: {
    ability: WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SURVIVAL,
  },
  necromancy: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SPELL_SCHOOL,
  },
  'open lock': {
    ability: DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: THIEVERY,
  },
  persuade: {
    ability: CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: ADVENTURE,
  },
  'pick pocket': {
    ability: DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: THIEVERY,
  },
  'piercing sword': {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'poetry/music': {
    ability: CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CULTURE,
  },
  poisonlore: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  polearm: {
    ability: STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'read language': {
    // TODO min req INT 9
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  religion: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  ride: {
    ability: WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CULTURE,
  },
  runelore: {
    ability: INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: LORE,
  },
  sail: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: OCCUPATION,
  },
  search: {
    ability: INT,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: ADVENTURE,
  },
  sling: {
    ability: DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  sneak: {
    ability: DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: ADVENTURE,
  },
  spear: {
    ability: DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'spiked bludgeon': {
    ability: STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  staff: {
    ability: STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  'straight sword': {
    ability: DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  swim: {
    ability: CON,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: ADVENTURE,
  },
  tailor: {
    ability: DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: OCCUPATION,
  },
  throw: {
    ability: DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
  track: {
    ability: WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: SURVIVAL,
  },
  trade: {
    ability: CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: OCCUPATION,
  },
  'treat wound': {
    ability: WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: ADVENTURE,
  },
  whip: {
    ability: DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: WEAPON,
  },
});

export const ALL_SKILLS = Object.keys(SKILLS);

export const SKILLS_ENUM = buildEnum(ALL_SKILLS);

export const ALL_WEAPONS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === WEAPON);

// export const WEAPON_SKILLS_ENUM = buildEnum(ALL_WEAPONS);

export const ALL_SPELL_SCHOOLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === SPELL_SCHOOL);

// export const SPELL_SCHOOLS_ENUM = buildEnum(ALL_SPELL_SCHOOLS);

export const ALL_THIEVERY_SKILLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === THIEVERY);

export function buildSkills(skillProgressions, lvl) {
  const { progressions, mod } = skillProgressions;

  return buildStats(SKILL_BUILDERS, lvl, progressions, mod);
}
