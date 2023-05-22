import { ABILITIES } from './abilities';
import { buildEnum, buildStats, deepFreeze } from './helper';

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

export const SKILL_PROGRESSIONS_ENUM = deepFreeze({
  SPECIALIZED: 'specialized',
  PROFICIENT: 'proficient',
  BASIC: 'basic',
});

export const SKILL_POINTS = (numSpecialized, numProficient, numBasic) => {
  return Math.floor(numSpecialized / 2 + numProficient / 3 + numBasic / 4);
};

export const CATEGORIES_ENUM = deepFreeze({
  ADVENTURE: 'adventure',
  CULTURE: 'culture',
  LORE: 'lore',
  OCCUPATION: 'occupation',
  SPELL_SCHOOL: 'spell school',
  SURVIVAL: 'survival',
  THIEVERY: 'thievery',
  WEAPON: 'weapon',
});

export const SKILLS = deepFreeze({
  abjuration: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  alteration: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  appraise: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.THIEVERY,
  },
  magicka: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  axe: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  blacksmith: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  bludgeon: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'bowyer/fletcher': {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  calligraphy: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.CULTURE,
  },
  carpentry: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  'carve rune': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.CULTURE,
  },
  climb: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  conjuration: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  cook: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  crossbow: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'curved greatsword': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'curved sword': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  dagger: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  demonlore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  disguise: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.THIEVERY,
  },
  'distance run': {
    ability: ABILITIES.CON,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.SURVIVAL,
  },
  divination: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  enchantment: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  etiquette: {
    ability: ABILITIES.CHA,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.CULTURE,
  },
  evocation: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  'disarm trap': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.THIEVERY,
  },
  firecraft: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.SURVIVAL,
  },
  forgery: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.THIEVERY,
  },
  greatsword: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  hammer: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'hand-to-hand': {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  handgonne: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'handle animal': {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SURVIVAL,
  },
  heraldry: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.CULTURE,
  },
  herblore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  hide: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  history: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.CULTURE,
  },
  'hunt/forage': {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.SURVIVAL,
  },
  illusion: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  leathercraft: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  listen: {
    ability: ABILITIES.INT,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  longbow: {
    // TODO minimum STR 12 needed
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  masonry: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  medicine: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  navigate: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SURVIVAL,
  },
  necromancy: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SPELL_SCHOOL,
  },
  'open lock': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.THIEVERY,
  },
  persuade: {
    ability: ABILITIES.CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  'pick pocket': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.THIEVERY,
  },
  'piercing sword': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'poetry/music': {
    ability: ABILITIES.CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.CULTURE,
  },
  poisonlore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  polearm: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'read language': {
    // TODO min req INT 9
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  religion: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  ride: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.CULTURE,
  },
  runelore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.LORE,
  },
  sail: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  search: {
    ability: ABILITIES.INT,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  shortbow: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  sling: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  sneak: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  spear: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'spiked bludgeon': {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  staff: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  'straight sword': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
  swim: {
    ability: ABILITIES.CON,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  tailor: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  track: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.SURVIVAL,
  },
  trade: {
    ability: ABILITIES.CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES_ENUM.OCCUPATION,
  },
  'treat wound': {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.ADVENTURE,
  },
  whip: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES_ENUM.WEAPON,
  },
});

export const ALL_WEAPONS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES_ENUM.WEAPON);

export const WEAPON_SKILLS_ENUM = buildEnum(ALL_WEAPONS);

export const ALL_SPELL_SCHOOLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES_ENUM.SPELL_SCHOOL);

export const SPELL_SCHOOLS_ENUM = buildEnum(ALL_SPELL_SCHOOLS);

export const ALL_ADVENTURE_SKILLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES_ENUM.ADVENTURE);

export const BASIC_SKILLS_EXCL_WEAPON = Object.keys(SKILLS).filter(
  (s) => !SKILLS[s].expert && SKILLS[s].category !== CATEGORIES_ENUM.WEAPON
);

export const ALL_THIEVERY_SKILLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES_ENUM.THIEVERY);

export const BASIC_SKILLS_EXCL_WEAPON_AND_THIEVERY = Object.keys(SKILLS).filter(
  (s) =>
    !SKILLS[s].expert &&
    SKILLS[s].category !== CATEGORIES_ENUM.WEAPON &&
    SKILLS[s].category !== CATEGORIES_ENUM.THIEVERY
);

export function buildSkills(skillProgressions, lvl) {
  const { progressions, mod } = skillProgressions;
  return buildStats(SKILL_BUILDERS, lvl, progressions, mod);
}
