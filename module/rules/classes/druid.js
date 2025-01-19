import { lightArmors } from '../armor-and-clothing.js';
import { nonMetalShields } from '../helms-and-shields.js';
import { allSpellSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { deepFreeze } from '../../helper.js';
import { RARE_LANGUAGES } from '../languages.js';
import { ALIGNMENTS } from '../alignment.js';
import { WEAPON_CLASS } from '../weapons.js';

export class Druid extends BaseClass {
  static description = 'A follower of the Old Ways who serves as mystic conduit to the forces of nature.';

  static XP_REQS = Object.freeze([
    0, 900, 2700, 6000, 12000, 20000, 35000, 60000, 90000, 130000, 200000, 300000, 450000, 670000,
  ]);

  static MULTICLASS_XP_AFTER_NAME_LVL = 220000;

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

  static DRUID_SPELL_SLOTS = deepFreeze([
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
    [6, 6, 6, 6, 5, 4, 3],
    [6, 6, 6, 6, 5, 4, 3],
    [6, 6, 6, 6, 5, 4, 3],
    [6, 6, 6, 6, 5, 4, 3],
    [6, 6, 6, 6, 5, 4, 3],
    [6, 6, 6, 6, 5, 4, 3],
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.CAST_DRUID_SPELLS),
    new FeatureConfig(features.IDENTIFY_PURE_WATER, 3),
    new FeatureConfig(features.PASS_WITHOUT_TRACE, 3),
    new FeatureConfig(features.SYLVAN_CHARM_IMMUNITY, 7),
    new FeatureConfig(features.ANIMAL_FORM, 7),
  ]);

  static specializedSkills = Object.freeze([...allSpellSkills, SKILLS.HERBLORE, SKILLS.ANIMAL_HANDLING]);

  static proficientSkills = Object.freeze([
    SKILLS.DAGGER,
    SKILLS.HAND_TO_HAND,
    SKILLS.SLING,
    SKILLS.STAFF,
    SKILLS.SPEAR,
    SKILLS.HERBALISM,
  ]);

  static saveProgressions = saveBases.cleric;

  static languages = [RARE_LANGUAGES.DRUIDIC];

  static firstLvlHp = 'd4+2';
  static fpReserve = 10;
  static hitDie = 'd6';
  static afterNameHp = 0;
  static shieldsDescription = 'non-metal only';
  static armorDescription = 'non-metal only';
  static weaponDescription = 'sickles, scythes, slings, staffs, daggers and spears';
  static weaponClass = WEAPON_CLASS.SIMPLE;

  static abilityReqs = [
    {
      name: ABILITIES.WIS,
      min: 11,
    },
    {
      name: ABILITIES.CHA,
      min: 13,
    },
  ];

  static primeReqs = [ABILITIES.WIS, ABILITIES.CHA];

  static alignments = [ALIGNMENTS.N];

  constructor(lvl, origin) {
    super(lvl, origin, Druid);
    this.armors = [...lightArmors];
    this.shields = [...nonMetalShields];
  }
}

// TODO Witch subclass?
