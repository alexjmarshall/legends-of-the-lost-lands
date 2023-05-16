import { ABILITIES } from './abilities';
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

export const SKILL_BUILDERS = {
  specialized: (lvl) => ({
    baseBonus: Math.floor(lvl / 2),
    cap: Math.floor(lvl * 1.5),
  }),
  proficient: (lvl) => ({
    baseBonus: Math.floor(lvl / 3),
    cap: Math.floor(lvl),
  }),
  basic: (lvl) => ({
    baseBonus: Math.floor(lvl / 4),
    cap: Math.floor((lvl * 3) / 4),
  }),
};

export const SKILL_PROGRESSIONS_ENUM = {
  SPECIALIZED: 'specialized',
  PROFICIENT: 'proficient',
  BASIC: 'basic',
};

export const SKILL_POINTS = (numSpecialized, numProficient, numBasic) => {
  return Math.floor(numSpecialized / 2 + numProficient / 3 + numBasic / 4);
};

export const CATEGORIES = {
  ADVENTURE: 'adventure',
  CULTURE: 'culture',
  LORE: 'lore',
  OCCUPATION: 'occupation',
  SPELL_SCHOOL: 'spell school',
  SURVIVAL: 'survival',
  THIEVERY: 'thievery',
  WEAPON: 'weapon',
};

export const SKILLS = {
  abjuration: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  alteration: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  appraise: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.THIEVERY,
  },
  magicka: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  axe: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  blacksmith: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.OCCUPATION,
  },
  bludgeon: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  'bowyer/fletcher': {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.OCCUPATION,
  },
  calligraphy: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.CULTURE,
  },
  carpentry: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.OCCUPATION,
  },
  'carve rune': {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.CULTURE,
  },
  climb: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.ADVENTURE,
  },
  conjuration: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  cook: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.OCCUPATION,
  },
  crossbow: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  curved_greatsword: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  curved_sword: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  dagger: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  demonlore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  disguise: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.THIEVERY,
  },
  distance_run: {
    ability: ABILITIES.CON,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.SURVIVAL,
  },
  divination: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  enchantment: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  etiquette: {
    ability: ABILITIES.CHA,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.CULTURE,
  },
  evocation: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  disarm_trap: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.THIEVERY,
  },
  firecraft: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.SURVIVAL,
  },
  forgery: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.THIEVERY,
  },
  greatsword: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  hammer: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  hand_to_hand: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  handgonne: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  handle_animal: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SURVIVAL,
  },
  heraldry: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.CULTURE,
  },
  herblore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  hide: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.ADVENTURE,
  },
  history: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.CULTURE,
  },
  'hunt/forage': {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.SURVIVAL,
  },
  illusion: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  leathercraft: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.OCCUPATION,
  },
  listen: {
    ability: ABILITIES.INT,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.ADVENTURE,
  },
  longbow: {
    // TODO minimum STR 12 needed
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  masonry: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.OCCUPATION,
  },
  medicine: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  navigate: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SURVIVAL,
  },
  necromancy: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SPELL_SCHOOL,
  },
  open_lock: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.THIEVERY,
  },
  persuade: {
    ability: ABILITIES.CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.ADVENTURE,
  },
  pick_pocket: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.THIEVERY,
  },
  piercing_sword: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  'poetry/music': {
    ability: ABILITIES.CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.CULTURE,
  },
  poisonlore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  polearm: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  'read language': {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  religion: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  ride: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.CULTURE,
  },
  runelore: {
    ability: ABILITIES.INT,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.LORE,
  },
  sail: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.OCCUPATION,
  },
  search: {
    ability: ABILITIES.INT,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.ADVENTURE,
  },
  shortbow: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  sling: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  sneak: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.ADVENTURE,
  },
  spear: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  spiked_bludgeon: {
    ability: ABILITIES.STR,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  staff: {
    ability: ABILITIES.STR,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  straight_sword: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
  swim: {
    ability: ABILITIES.CON,
    expert: false,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.ADVENTURE,
  },
  tailor: {
    ability: ABILITIES.DEX,
    expert: true,
    armor_check_penalty: true,
    movement_penalty: true,
    category: CATEGORIES.OCCUPATION,
  },
  track: {
    ability: ABILITIES.WIS,
    expert: true,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.SURVIVAL,
  },
  trade: {
    ability: ABILITIES.CHA,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: false,
    category: CATEGORIES.OCCUPATION,
  },
  treat_wound: {
    ability: ABILITIES.WIS,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.ADVENTURE,
  },
  whip: {
    ability: ABILITIES.DEX,
    expert: false,
    armor_check_penalty: false,
    movement_penalty: true,
    category: CATEGORIES.WEAPON,
  },
};

export const ALL_WEAPONS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES.WEAPON);

export const WEAP_SKILLS_ENUM = {
  AXE: 'axe',
  BLUDGEON: 'bludgeon',
  CROSSBOW: 'crossbow',
  CURVED_GREATSWORD: 'curved greatsword',
  CURVED_SWORD: 'curved sword',
  DAGGER: 'dagger',
  GREATSWORD: 'greatsword',
  HAMMER: 'hammer',
  HANDGONNE: 'handgonne',
  HAND_TO_HAND: 'hand-to-hand',
  LONGBOW: 'longbow',
  PIERCING_SWORD: 'piercing sword',
  POLEARM: 'polearm',
  SHORTBOW: 'shortbow',
  SLING: 'sling',
  SPEAR: 'spear',
  SPIKED_BLUDGEON: 'spiked bludgeon',
  STAFF: 'staff',
  STRAIGHT_SWORD: 'straight sword',
  WHIP: 'whip',
};

export const ALL_SPELL_SCHOOLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES.SPELL_SCHOOL);

export const SPELL_SCHOOLS_ENUM = {
  ABJURATION: 'abjuration',
  ALTERATION: 'alteration',
  CONJURATION: 'conjuration',
  DIVINATION: 'divination',
  ENCHANTMENT: 'enchantment',
  EVOCATION: 'evocation',
  ILLUSION: 'illusion',
  NECROMANCY: 'necromancy',
};

export const ALL_ADVENTURE_SKILLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES.ADVENTURE);

export const BASIC_SKILLS_EXCL_WEAPON = Object.keys(SKILLS).filter(
  (s) => !SKILLS[s].expert && !SKILLS[s].category === CATEGORIES.WEAPON
);

export const ALL_THIEVERY_SKILLS = Object.keys(SKILLS).filter((s) => SKILLS[s].category === CATEGORIES.THIEVERY);

export const BASIC_SKILLS_EXCL_WEAPON_AND_THIEVERY = Object.keys(SKILLS).filter(
  (s) => !SKILLS[s].expert && !SKILLS[s].category === CATEGORIES.WEAPON && !SKILLS[s].category === CATEGORIES.THIEVERY
);
