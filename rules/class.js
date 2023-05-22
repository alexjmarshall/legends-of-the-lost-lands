// base_mv (race), size (race)
// TODO ALWAYS ROUND DOWN
import { ALL_ARMORS, NON_METAL_ARMORS, LIGHT_ARMORS } from './armors';
import {
  ALL_WEAPONS,
  WEAP_SKILLS_ENUM,
  ALL_SPELL_SCHOOLS,
  SPELL_SCHOOLS_ENUM,
  ALL_ADVENTURE_SKILLS,
  BASIC_SKILLS_EXCL_WEAPON_SKILLS,
  ALL_THIEVERY_SKILLS,
  BASIC_SKILLS_EXCL_WEAPON_AND_THIEVERY,
} from './skills';
import FEATURES from './features';
import CLASSES_ENUM from './classes/classes-enum';
import * as CLASSES from './classes';
import { buildEnum, deepFreeze } from './helper';

export const DEFAULT_BASE_AC = 10;
const { FIGHTER, BERSERKER, CLERIC, CLOISTERED_CLERIC } = CLASSES_ENUM;

// const BASE_MAGE_FEATURES = [FEATURES['magick spell casting'], FEATURES['scribe magick scrolls']];

// const allSpellSchoolsExcept = (...args) => {
//   return ALL_SPELL_SCHOOLS.filter((s) => !args.includes(s));
// };

// TODO also show features that are essentially derived stats (e.g. num attacks, max chain attacks, backstab multi) on derived stats tab
// TODO level -based bonus to healing spells
// TODO give monsters a detect invisibility rating, like Magick Resistance?
// TODO monster special hit locations as non-physical items
// TODO make a class for each class, with a constructor by level
// TODO aura of reach-threat around character
// TODO go back to 3 steps per change in modifier for ability scores
// TODO add detection of invisibility derived chance for monsters
// TODO skills for fighting styles -- take 2 points each, but twice as good?
// TODO use phys/evas/ment saves -- 3 progressions, con/dex/wis
// TODO both poison and bleed do damage every 1 minute real time
// TODO dodge gives 2x Dex AC mod (includes swashbuckler's bonus) + 1, and roll to adjacent square
// TODO make sure all const objects/arrays are frozen, and references to them in class constructors are new with ... operator
// TODO Magickal Research from the beginning as well
// TODO back to weapon specialization and specialist mages instead of weap/spell school skills?
//  --- can go back to swings being Str and thrusts being Dex
//  --- if not, remove Specialist mage and go back to Incantatrix variant
// TODO parry value for weapon is added to height area where it is held, but only as another 'layer'
// TODO use "hurl" instead of "throw" for attack mode
// TODO must use swing for chain attack, must use thrust for reach
//  --- thrust +1 speed, -1 impact?
// TODO no cleric slashing, piercing OK?
// TODO capstone abilities for every class at name level?
// CONTINUE -- Thief has Cant feature, Cloistered Cleric has Read Languages SKILL specialized--Thief proficient
// read scrolls iS NOT a Skill, it's an Int check if unable to memorize the spell level -- use AD&D math! combined probabilities
// TODO scaling of Evasion save depends on Size, just as Mental save depends on Intelligent
// TODO in UI show Specialized/Proficient/Basic skills as green 1/2/3 plusses
// TODO Rune item type and carve macro, like a spell
// TODO put derived data for ANY object in a derived prop??
// CONTINUE features have a function to return derived data that takes class and level?
export default deepFreeze({
  [FIGHTER]: {
    class: CLASSES.Fighter,
    variants: {
      [BERSERKER]: {
        class: CLASSES.Berserker,
      },
    },
  },
  [CLERIC]: {
    class: CLASSES.Cleric,
    variants: {
      [CLOISTERED_CLERIC]: {
        class: CLASSES.CloisteredCleric,
      },
    },
  },
  // mage: {
  //   class: CLASS_LIST.Mage,
  //   variants: [
  //     {
  //       name: 'abjurer',
  //       class: CLASS_LIST.Abjurer,
  //     },
  //     {
  //       name: 'conjurer',
  //       class: CLASS_LIST.Conjurer,
  //     },
  //     {
  //       name: 'diviner',
  //       class: CLASS_LIST.Diviner,
  //     },
  //     {
  //       name: 'enchanter',
  //       class: CLASS_LIST.Enchanter,
  //     },
  //     {
  //       name: 'evoker',
  //       class: CLASS_LIST.Evoker,
  //     },
  //     {
  //       name: 'illusionist',
  //       class: CLASS_LIST.Illusionist,
  //     },
  //     {
  //       name: 'necromancer',
  //       class: CLASS_LIST.Necromancer,
  //     },
  //     {
  //       name: 'transmuter',
  //       class: CLASS_LIST.Transmuter,
  //     },
  //   ],
  // },
  // thief: {
  //   variants: {
  //     ASSASSIN: {
  //       name: 'assassin',
  //       allowed_weap_skills: [
  //         WEAPON_SKILLS.CROSSBOW,
  //         WEAPON_SKILLS.DAGGER,
  //         WEAPON_SKILLS.BLUDGEON,
  //         WEAPON_SKILLS.HAND_TO_HAND,
  //         WEAPON_SKILLS.SLING,
  //         WEAPON_SKILLS.CURVED_SWORD,
  //         WEAPON_SKILLS.PIERCING_SWORD,
  //         WEAPON_SKILLS.STRAIGHT_SWORD,
  //       ],
  //       class_skill_points: (lvl) => Math.max(0, (lvl - 2) * 8),
  //       class_skills: [...COMMON_SKILLS, 'open locks', 'find/remove traps', 'disguise', 'compound poison'],
  //       features: ['assassinate'],
  //       alignments: [ALIGNMENTS.LE, ALIGNMENTS.CE],
  //       ability_reqs: {
  //         int: 12,
  //         dex: 9,
  //       },
  //     },
  //     SWASHBUCKLER: {
  //       name: 'swashbuckler',
  //       features: ['tumble'],
  //       ability_reqs: {
  //         str: 9,
  //         dex: 9,
  //       },
  //     },
  //   },
  // },
  // paladin: {
  //   // TODO revise abilities tied to holy sword?
  //   hit_die: 'd8',
  //   xp_requirements: [0, 1300, 4000, 9000, 18000, 35000, 70000, 140000, 270000, 400000, 530000, 660000, 790000, 920000],
  //   titles: [
  //     'Gallant',
  //     'Keeper',
  //     'Protector',
  //     'Defender',
  //     'Cavalier',
  //     'Sentinel',
  //     'Crusader',
  //     'Justiciar',
  //     'Paladin',
  //     'Paladin (10th',
  //     'Paladin (11th)',
  //     'Paladin (12th)',
  //     'Paladin (13th)',
  //     'Paladin (14th)',
  //   ],
  //   bab: (lvl) => Math.floor(Number(lvl)),
  //   base_ac: DEFAULT_BASE_AC + 2, // TODO subtract 2 AC if opponent is not evil
  //   base_sv: (lvl) => Number(lvl) + 2,
  //   allowed_weap_skills: ALL_WEAPONS,
  //   allowed_weap_classes: ALL_WEAP_CLASS_LIST,
  //   allowed_armors: ALL_ARMORS,
  //   shield_use: true,
  //   features: [
  //     'lay on hands',
  //     'holy protection',
  //     'detect evil',
  //     'ascetic',
  //     'rebuke undead',
  //     "paladin's steed",
  //     'aura of protection',
  //     'banish evil',
  //     'extra attack',
  //   ],
  //   class_skills: [],
  //   alignments: [ALIGNMENTS.LG],
  //   ability_reqs: {
  //     // TODO odds on 3d6 DTL
  //     str: 9,
  //     wis: 12,
  //     cha: 17,
  //   },
  //   variants: {
  //     name: 'inquisitor',
  //     features: [
  //       'detect lie',
  //       'holy protection',
  //       'detect evil',
  //       'ascetic',
  //       'dispel magick',
  //       "paladin's steed",
  //       'aura of protection',
  //       'banish evil',
  //       'extra attack',
  //     ],
  //     alignments: [ALIGNMENTS.LG, ALIGNMENTS.LE],
  //   },
  // },
  // ranger: {
  //   hit_die: 'd8',
  //   hp_bonus: 'd8',
  //   xp_requirements: [0, 1300, 4000, 9000, 18000, 35000, 70000, 140000, 270000, 400000, 530000, 660000, 790000, 920000],
  //   titles: [
  //     'Gallant',
  //     'Keeper',
  //     'Protector',
  //     'Defender',
  //     'Cavalier',
  //     'Sentinel',
  //     'Crusader',
  //     'Justiciar',
  //     'Paladin',
  //     'Paladin (10th',
  //     'Paladin (11th)',
  //     'Paladin (12th)',
  //     'Paladin (13th)',
  //     'Paladin (14th)',
  //   ],
  //   bab: (lvl) => Math.floor(Number(lvl)),
  //   base_ac: DEFAULT_BASE_AC + 2, // TODO subtract 2 AC if opponent is not evil
  //   base_sv: (lvl) => Number(lvl) + 2,
  //   allowed_weap_skills: ALL_WEAPONS,
  //   allowed_weap_classes: ALL_WEAP_CLASS_LIST,
  //   allowed_armors: ALL_ARMORS,
  //   shield_use: true,
  //   features: [
  //     'lay on hands',
  //     'holy protection',
  //     'detect evil',
  //     'ascetic',
  //     'rebuke undead',
  //     "paladin's steed",
  //     'aura of protection',
  //     'banish evil',
  //     'extra attack',
  //   ],
  //   class_skills: [],
  //   alignments: [ALIGNMENTS.LG],
  //   ability_reqs: {
  //     str: 9,
  //     wis: 12,
  //     cha: 17,
  //   },
  //   variants: {
  //     name: 'inquisitor',
  //     features: [
  //       'detect lie',
  //       'holy protection',
  //       'detect evil',
  //       'ascetic',
  //       'dispel magick',
  //       "paladin's steed",
  //       'aura of protection',
  //       'banish evil',
  //       'extra attack',
  //     ],
  //     alignments: [ALIGNMENTS.LG, ALIGNMENTS.LE],
  //   },
  // },
});
