import { ABILITIES } from './abilities.js';
import { progressions } from './helper.js';
import { deepFreeze } from '../helper.js';

const { STR, INT, WIS, DEX, CON, CHA } = ABILITIES;

/*
 * Skills are Basic or Expert.
 * Character skill proficiency levels are Specialized, Trained, Untrained
 * Class skills are usually Specialized, sometimes Trained. Skills from Origin are Trained.
 * Untrained skills include all non-Specialized/Trained Basic skills.
 * Specialized skills begin at 2, Proficient at 1, Untrained at 0.
 * If an Expert skill is attempted that is not at least Untrained, skill level is Untrained minimum -2 and no advancement points gained.
 * Martial weapons have a penalty of -3 if class is only proficient in Simple weapons.
 * Skills improve automatically with usage. Advancement points are tracked for each character skill and increased when used.
 * Advancement points required to increase the skill increases linearly with skill level: 1000 to level 1, 2000 to level 2, etc.
 * Skill advancements are checked when the character levels up.
 * If a character has accrued more than enough points to increase, the increase is automatic.
 * If the character has not accrued enough points to guarantee an increase, there is still a chance equal to points/required.
 * The number of skill advancement points accrued per use is a function of:
 *    * a base advancement value associated with the skill itself, and
 *    * how far the character's current skill level is above or below its target level
 * The target level for a character skill depends on the proficiency level (Specialized, Trained or Untrained)
 *    * Specialized skills have a target level equal to the character's level
 *    * Trained skills have a target level equal to the character's level * 2 / 3
 *    * Untrained skills have a target level equal to the character's level / 2 - untrained penalty
 * The advancement points formula is advancementBase ^ (1 + (targetLvl - currLvl) / 5)
 * Skill base factors are rated by typical frequency of usage.
 *    * Continual skills are used multiple times most sessions, e.g. combat skills - 40
 *    * Common skills are used in most sessions, e.g. adventure, thievery, spell skills - 120
 *    * Occasional skills are used in some sessions, e.g. lore, survival, craft skills - 200
 *    * Rare skills are used in few sessions, e.g. culture skills - 320
 * Skills have a minimum level based on proficiency and increase to the minimum if below it after advancement checks on level up.
 *    * Specialized skills have a minimum equal to the character's level / 2
 *    * Trained skills have a minimum equal to the character's level / 3
 *    * Untrained skills have a minimum equal to the character's level / 4 - untrained penalty
 *
 * Major Success: succeed by 5+. Major Failure: fail by > 5.
 * Critical Failure/Success = d100 <= margin of success/failure.
 * Crits override majors
 */

// TODO Monster Stats
// Intelligent monsters get 1x level mental saves, non-intelligent get 0.5x level
// detect invisibility stat from 1e MM
// Morale stat from 2e MM -- Surrender on major failure, flee on minor failure - check 1e DMG

// TODO derived data for ability checks = roll equal or over 20 - ability score + 3

/**
 * Calculates the advancement points required to reach a specific level.
 *
 * @param {number} lvl - The target level for which you want to calculate the advancement points.
 * @returns {number} The advancement points required to reach the specified level.
 */
export const getAdvancementPointsRequired = (lvl) => Math.max(1000, (Number(lvl) + 1) * 1000);

/**
 * Calculates the advancement points per use based on the given parameters.
 *
 * @param {number} advancementBase - The base advancement points.
 * @param {number} targetLvl - The target level for which to calculate advancement points.
 * @param {number} currLvl - The current level from which to calculate advancement points.
 * @returns {number} The calculated advancement points per use.
 */
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

export const SKILL_PROFS = Object.freeze({
  SPECIALIZED: 'specialized',
  PROFICIENT: 'proficient',
  UNTRAINED: 'untrained',
});

export const skillProfs = Object.freeze({
  [SKILL_PROFS.SPECIALIZED]: progressions.fast,
  [SKILL_PROFS.PROFICIENT]: progressions.medium,
  [SKILL_PROFS.UNTRAINED]: progressions.slow,
});

export const SKILL_CATEGORIES = Object.freeze({
  ADVENTURE: 'adventure',
  COMBAT: 'combat',
  CRAFT: 'craft',
  CULTURE: 'culture',
  LORE: 'lore',
  SPELLS: 'spells',
  SURVIVAL: 'survival',
  THIEVERY: 'thievery',
});
const { ADVENTURE, COMBAT, CRAFT, CULTURE, LORE, SPELLS, SURVIVAL, THIEVERY } = SKILL_CATEGORIES;

// TODO separate macros for use skill and increase skill (DM only)
// combat skills do increase automatically as long as there is a target
// or just a DM macro to DECREASE skill to counteract frivolous use
export const SKILLS = Object.freeze({
  ABJURATION: 'abjuration',
  ALTERATION: 'alteration',
  ANCIENT_LANGUAGES: 'ancient languages',
  ANIMAL_HANDLING: 'animal handling',
  APPRAISAL: 'appraisal',
  AXE: 'axe',
  BLACKSMITHING: 'blacksmithing',
  BLUDGEON: 'bludgeon',
  BOW: 'bow',
  BOWYERY: 'bowyery',
  CALLIGRAPHY: 'calligraphy',
  CLIMBING: 'climbing',
  CONJURATION: 'conjuration',
  COOKERY: 'cookery',
  CROSSBOW: 'crossbow',
  CURVED_SWORD: 'curved sword',
  DAGGER: 'dagger',
  DANCING: 'dancing',
  DECEPTION: 'deception',
  DEMONLORE: 'demonlore',
  TRAP_DISARMING: 'trap disarming',
  DISGUISE: 'disguise',
  DIVINATION: 'divination',
  ENCHANTMENT: 'enchantment',
  ETIQUETTE: 'etiquette',
  EVOCATION: 'evocation',
  FARMING: 'farming',
  FIRECRAFT: 'firecraft',
  FISHING: 'fishing',
  FORAGING: 'foraging',
  FORGERY: 'forgery',
  HAND_TO_HAND: 'hand-to-hand',
  // HANDGONNE: 'handgonne',
  HERALDRY: 'heraldry',
  HERBALISM: 'herbalism',
  HERBLORE: 'herblore',
  HIDING: 'hiding',
  HISTORY: 'history',
  HUNTING: 'hunting',
  ILLUSION: 'illusion',
  INTIMIDATION: 'intimidation',
  LEATHERWORKING: 'leatherworking',
  LISTENING: 'listening',
  MAGICA: 'magica',
  MUSIC: 'music',
  NAVIGATION: 'navigation',
  NECROMANCY: 'necromancy',
  PERSUASION: 'persuasion',
  PHYSICA: 'physica',
  LOCKPICKING: 'lockpicking',
  PICKPOCKETING: 'pickpocketing',
  POETRY: 'poetry',
  POISONLORE: 'poisonlore',
  POISON_HANDLING: 'poison handling',
  POLEARM: 'polearm',
  RELIGION: 'religion',
  RIDING: 'riding',
  RUNNING: 'running',
  RUNECARVING: 'runecarving',
  RUNELORE: 'runelore',
  SAILING: 'sailing',
  SEARCHING: 'searching',
  SLING: 'sling',
  SNEAKING: 'sneaking',
  SPEAR: 'spear',
  STAFF: 'staff',
  STONEWORKING: 'stoneworking',
  STRAIGHT_SWORD: 'straight sword',
  SWIMMING: 'swimming',
  TAILORING: 'tailoring',
  TRACKING: 'tracking',
  TRADING: 'trading',
  WHIP: 'whip',
  WOODWORKING: 'woodworking',
  WOUND_TREATMENT: 'wound treatment',
});

export const PENALTY_MULTIPLIERS = Object.freeze({
  ONE_TIMES: 1,
  TWO_TIMES: 2,
});

const { ONE_TIMES, TWO_TIMES } = PENALTY_MULTIPLIERS;

export const skills = deepFreeze({
  [SKILLS.ABJURATION]: {
    ability: WIS,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.ALTERATION]: {
    ability: INT,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.ANCIENT_LANGUAGES]: {
    ability: INT,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.ANIMAL_HANDLING]: {
    ability: WIS,
    expert: false,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.APPRAISAL]: {
    ability: INT,
    expert: true,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  [SKILLS.AXE]: {
    ability: STR,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.BLACKSMITHING]: {
    ability: STR,
    expert: true,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.BLUDGEON]: {
    ability: STR,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.BOW]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.BOWYERY]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.CALLIGRAPHY]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.CLIMBING]: {
    ability: DEX,
    expert: false,
    armorPenalty: ONE_TIMES,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.CONJURATION]: {
    ability: WIS,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.COOKERY]: {
    ability: WIS,
    expert: false,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.CROSSBOW]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.DANCING]: {
    ability: DEX,
    expert: false,
    armorPenalty: ONE_TIMES,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.DECEPTION]: {
    ability: CHA,
    expert: false,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.DEMONLORE]: {
    ability: INT,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.TRAP_DISARMING]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  [SKILLS.DISGUISE]: {
    ability: INT,
    expert: true,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  [SKILLS.DIVINATION]: {
    ability: WIS,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.ENCHANTMENT]: {
    ability: INT,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.ETIQUETTE]: {
    ability: CHA,
    expert: true,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.EVOCATION]: {
    ability: INT,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.FARMING]: {
    ability: WIS,
    expert: false,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.FIRECRAFT]: {
    ability: WIS,
    expert: false,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.FISHING]: {
    ability: WIS,
    expert: false,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.FORAGING]: {
    ability: WIS,
    expert: false,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.FORGERY]: {
    ability: INT,
    expert: true,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.HAND_TO_HAND]: {
    ability: STR,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  // [SKILLS.HANDGONNE]: {
  //   ability: DEX,
  //   expert: true,
  //   armorPenalty: ONE_TIMES,
  //   category: COMBAT,
  //   advancementBase: CONTINUAL,
  // },
  [SKILLS.HERALDRY]: {
    ability: INT,
    expert: true,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.HERBALISM]: {
    ability: WIS,
    expert: true,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.HERBLORE]: {
    ability: INT,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.HIDING]: {
    ability: DEX,
    expert: false,
    armorPenalty: ONE_TIMES,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.HISTORY]: {
    ability: INT,
    expert: true,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.HUNTING]: {
    ability: WIS,
    expert: false,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.ILLUSION]: {
    ability: INT,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.INTIMIDATION]: {
    ability: STR,
    expert: false,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.LEATHERWORKING]: {
    ability: INT,
    expert: true,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.LISTENING]: {
    ability: INT,
    expert: false,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.MAGICA]: {
    ability: INT,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.PHYSICA]: {
    ability: WIS,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.MUSIC]: {
    ability: CHA,
    expert: false,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.NAVIGATION]: {
    ability: WIS,
    expert: false,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.NECROMANCY]: {
    ability: WIS,
    expert: true,
    category: SPELLS,
    advancementBase: COMMON,
  },
  [SKILLS.PERSUASION]: {
    ability: CHA,
    expert: false,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.LOCKPICKING]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  [SKILLS.PICKPOCKETING]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  [SKILLS.POETRY]: {
    ability: CHA,
    expert: true,
    category: CULTURE,
    advancementBase: RARE,
  },
  [SKILLS.POISONLORE]: {
    ability: INT,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.POISON_HANDLING]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.POLEARM]: {
    ability: STR,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.RELIGION]: {
    ability: WIS,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.RIDING]: {
    ability: CON,
    expert: false,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.RUNNING]: {
    ability: CON,
    expert: false,
    armorPenalty: ONE_TIMES,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.RUNECARVING]: {
    ability: WIS,
    expert: true,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.RUNELORE]: {
    ability: INT,
    expert: true,
    category: LORE,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.SAILING]: {
    ability: WIS,
    expert: true,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.SEARCHING]: {
    ability: INT,
    expert: false,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.SLING]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.SNEAKING]: {
    ability: DEX,
    expert: false,
    armorPenalty: ONE_TIMES,
    category: THIEVERY,
    advancementBase: COMMON,
  },
  [SKILLS.STAFF]: {
    ability: STR,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.STONEWORKING]: {
    ability: STR,
    expert: true,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.STRAIGHT_SWORD]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.CURVED_SWORD]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.SWIMMING]: {
    ability: CON,
    expert: false,
    armorPenalty: TWO_TIMES,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
  [SKILLS.TAILORING]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.TRACKING]: {
    ability: WIS,
    expert: true,
    category: SURVIVAL,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.TRADING]: {
    ability: CHA,
    expert: false,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.WHIP]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.DAGGER]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.SPEAR]: {
    ability: DEX,
    expert: true,
    armorPenalty: ONE_TIMES,
    category: COMBAT,
    advancementBase: CONTINUAL,
  },
  [SKILLS.WOODWORKING]: {
    ability: STR,
    expert: true,
    category: CRAFT,
    advancementBase: OCCASIONAL,
  },
  [SKILLS.WOUND_TREATMENT]: {
    ability: WIS,
    expert: false,
    category: ADVENTURE,
    advancementBase: COMMON,
  },
});

export const allSkills = Object.keys(skills);

export const allCombatSkills = Object.keys(skills).filter((s) => skills[s].category === COMBAT);

export const WEAPON_SKILLS = Object.fromEntries(
  Object.keys(SKILLS)
    .filter((s) => skills[SKILLS[s]].category === COMBAT && s !== 'RIDING')
    .map((s) => [s, SKILLS[s]])
);

export const allSurvivalSkills = Object.keys(skills).filter((s) => skills[s].category === SURVIVAL);

export const allMissileWeaponSkills = [SKILLS.BOW, SKILLS.CROSSBOW, SKILLS.SLING]; //SKILLS.HANDGONNE

export const allMeleeWeaponSkills = Object.keys(skills).filter(
  (s) => skills[s].category === COMBAT && !allMissileWeaponSkills.includes(s) && s !== SKILLS.RIDING
);

export const allSpellSkills = Object.keys(skills).filter((s) => skills[s].category === SPELLS);

export const allThieverySkills = Object.keys(skills).filter((s) => skills[s].category === THIEVERY);

export const allBasicSkills = Object.keys(skills).filter((s) => skills[s].expert === false);

/*
Minigames:

Lockpicking:
 - Each lock requires a specific combination of actions: either twist, tap or turn, none of which are used consecutively.
 - Locks are divided into types, each type has the same combination required.
 - When they first pick a wrong action, it causes the lock to feel stiff. 
 - If a wrong action is performed on a stiff lock, the lock is jammed.
 - Instead of selecting an action, the Thief can "probe" -- roll Thief skill to attempt to determine next correct action.
   - Critical success: the lock opens immediately.
   - Major success: identify correct action.
   - Success: eliminate one incorrect action.
   - Failure: don't make progress.
   - Major failure: lock becomes stiff or jams if already stiff.
   - Critical failure: lock jams immediately.

  Difficulty Levels:
   - 2 tumblers "simple" - DC 12
   - 3 tumblers "normal" - DC 15
   - 4 tumblers "complex" - DC 15

  Difficulty Modifiers: 
   - "corroded" - first wrong action jams lock, +3 DC
   - "cracked" - only one incorrect action first step, -3 DC

  Lock Types:
   - Tin - turn, twist, tap, twist - 4 HP
   - Copper - tap, twist, tap, turn - 6 HP
   - Bronze - tap, turn, twist, tap - 8 HP
   - Brass - tap, turn, tap, twist - 10 HP
   - Iron - turn, twist, turn, tap - 12 HP
   - Steel - turn, tap, twist, turn - 14 HP
   - Mithril - twist, tap, twist, turn - 16 HP
   - Adamantine - twist, turn, tap, twist - 18 HP

Disarm Trap:
 - Similar to lockpicking but works slightly differently: actions are depress, hook, pry.
 - At each step, the listed action is the WRONG one.
 - The first wrong action causes a "click".
 - The second wrong action causes the trap to fire.
 - One of the other two actions does nothing, and one decreases the the trap's DC by 3.
 - If the trap is primed, PC cannot disengage without firing it.
 - At any time, the PC can attempt the remove check vs. the DC.
   - Success: the trap is disabled.
   - Failure: trap becomes primed or fires if already primed.

   // TODO trap types

Pickpocketing:
  - Each pocket has a difficulty rating.
  - The Thief rolls a d20 and adds their Thief skill.
    - On a critical success, they choose any of the NPC's items.
    - On a success, the DM chooses an item.
    - On a failure, they get nothing.
    - On a critical failure, they are caught and must flee or talk their way out of it.




*/
