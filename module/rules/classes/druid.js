import { allShields, lightArmors } from '../armors.js';
import { allSpellSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { deepFreeze } from '../helper.js';
import { LANGUAGES } from '../languages.js';
import { ALIGNMENTS } from '../alignments.js';
import { WEAPON_CLASS } from '../weapons.js';

export class Druid extends BaseClass {
  static XP_REQS = Object.freeze([
    900, 3200, 7000, 11000, 20000, 35000, 60000, 90000, 130000, 200000, 300000, 450000, 675000,
  ]);

  static TITLES = Object.freeze([
    'Aspirant',
    'Ovate',
    'Initiate of the 1st Circle',
    'Initiate of the 2nd Circle',
    'Initiate of the 3rd Circle',
    'Initiate of the 4th Circle',
    'Initiate of the 5th Circle',
    'Initiate of the 6th Circle',
    'Initiate of the 7th Circle',
    'Initiate of the 8th Circle',
    'Initiate of the 9th Circle',
    'Druid',
    'Archdruid',
    'The Great Druid',
  ]);

  static SPELL_SLOTS_BY_LEVEL = deepFreeze([
    [2],
    [2, 1],
    [3, 2, 1],
    [4, 2, 2],
    [4, 3, 2],
    [4, 3, 2, 1],
    [4, 4, 3, 1],
    [4, 4, 3, 2],
    [5, 4, 3, 2, 1],
    [5, 4, 3, 3, 2],
    [5, 5, 3, 3, 2, 1],
    [5, 5, 4, 4, 3, 2, 1],
    [6, 5, 5, 5, 4, 3, 2],
    [6, 6, 6, 6, 5, 4, 3],
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.CAST_DRUID_SPELLS, 1),
    new FeatureConfig(features.IDENTIFY_PURE_WATER, 3),
    new FeatureConfig(features.PASS_WITHOUT_TRACE, 3),
    new FeatureConfig(features.SYLVAN_CHARM_IMMUNITY, 7),
    new FeatureConfig(features.ANIMAL_FORM, 7, 3),
  ]);

  static specializedSkills = Object.freeze([...allSpellSkills, SKILLS.HERBLORE, SKILLS.ANIMAL_HANDLING]);

  static proficientSkills = Object.freeze([
    SKILLS.ONE_HANDED_CURVED_SWORD,
    SKILLS.TWO_HANDED_CURVED_SWORD,
    SKILLS.POLEARM,
    SKILLS.BLUDGEON,
    SKILLS.HAND_TO_HAND,
    SKILLS.SLING,
    SKILLS.STAFF,
    SKILLS.DAGGER,
    SKILLS.SPEAR,
    SKILLS.HERBALISM,
  ]);

  static saveProgressions = saveBases.cleric;

  static languages = [LANGUAGES.DRUIDIC];

  static firstLvlHp = 'd4+2';
  static hitDie = 'd6';
  static description = 'Serves the forces of nature and balance.';
  static featureDescriptions = Object.freeze([
    'Cast druid spells',
    'Identify pure water (level 3)',
    'Pass through woodland areas without a trail (level 3)',
    'Immune to charm by sylvan creatures (level 7)',
    'Transform into an animal (level 7, 3/day)',
    'Requires Wisdom 12+ and Charisma 13+',
  ]);
  static shieldsDescription = 'non-metal only';
  static armorDescription = 'non-metal only';
  static weaponDescription = 'simple curved swords, polearms, slings, staffs, daggers and spears';
  static weaponClass = WEAPON_CLASS.SIMPLE;

  static abilityReqs = [
    {
      name: ABILITIES.WIS,
      min: 12,
    },
    {
      name: ABILITIES.CHA,
      min: 13,
    },
  ];

  static primeReqs = [ABILITIES.WIS, ABILITIES.CHA];

  static alignments = [ALIGNMENTS.N];

  constructor(lvl, Class = Druid) {
    super(lvl, Class);
    this.armors = [...lightArmors];
    this.shields = [allShields.medium];
  }
}
