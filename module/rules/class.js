import * as CLASSES from './classes/index.js';

// TODO aura of reach-threat around character
// TODO skills for fighting styles -- shield, two-handed weapon, dual-wield
// TODO parry value reduce 1 to parry 1 height area away, 2 to parry 2 height areas away ???
// TODO must use swing for chain attack, must use thrust for max reach
//  --- thrust +1 speed, -1 impact?
// TODO read scrolls iS NOT a Skill, it's an Int check if unable to memorize the spell level -- use AD&D math! combined probabilities
// TODO scaling of Evasion save depends on Size, just as Mental save depends on Intelligent
// TODO in UI show Specialized/Proficient/Basic skills as green 1/2/3 plusses
// TODO Rune item type and carve macro, like a spell
// Witch worship minor gods, use Dark Gift/Mark rules from Complete Book of Necromancers -- option based on minor God?
// -- make properties on hit locations for modifier to weight/check penalty when worn!
// -- also add property to skills that reflect how many percent chance of increase at level up are added with each use
// add level 6 Cleric spells, and 1 unique spell per level based on worshipped God sphere
// consider keeping time paused in combat, and advancing clock 1 minute after each round
// -- using the Combat Tracker may be worth it if
// --- it pops out into own sidebar
// --- it auto starts music
// --- it allows group initiative
// --- it auto advances time 1 minute per round
// --- it auto rewards XP for any slain combatants
// TODO throw bonus applies when throwing a weapon, but if totally unfamiliar with it, then untrained penalty applies
// dart weapon has Throw skill
// Incantatrix steal spell allows user to choose which level of empty spell slot to spend, influences chance of success vs. level of spell to be stolen
// elemental focus: focus element spells cast as if 2 levels higher. -5 penalty to learn non-elemental spells, +5 to learn spell of element, +3 to learn neutral elements, 0 chance to learn opposing element spells and can't cast with scrolls or magic items that duplicate. conjure elemental/aerial servant no need to concentrate for control/no chance of failure
// elemental surge: once per day, elementalist can cast a spell of their element as if 1d4 levels higher
// come up with definitive list of ~20 skills, as all skills have to be defined in template.json for characters
// --- OR skills can be items, like Features
// Charging is a +2 atk bonus as pre-attack action similar to feint/beat/bind
// throwing a held weapon is a free action? maybe also firing a loaded/nocked bow
// rank the different damage types A to D for secondary effects, show this to players
// TODO code for macros is in proper module file, but all macros are registered in Macros file
export default deepFreeze({
  barbarian: {
    class: CLASSES.Barbarian,
  },
  fighter: {
    class: CLASSES.Fighter,
    variants: {
      berserker: {
        class: CLASSES.Berserker,
      },
    },
  },
  cleric: {
    class: CLASSES.Cleric,
    variants: {
      'cloistered cleric': {
        class: CLASSES.CloisteredCleric,
      },
      runepriest: {
        class: CLASSES.Runepriest,
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
  //         WEAPON_SKILLS.PIERCE_SWORD,
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
  //   allowed_armors: allArmorsArray,
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
  //       'dispel magic',
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
  //   allowed_armors: allArmorsArray,
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
  //       'dispel magic',
  //       "paladin's steed",
  //       'aura of protection',
  //       'banish evil',
  //       'extra attack',
  //     ],
  //     alignments: [ALIGNMENTS.LG, ALIGNMENTS.LE],
  //   },
  // },
});
