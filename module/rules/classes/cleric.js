import { allArmors, allShields } from '../armors.js';
import { allSpellSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { deepFreeze } from '../helper.js';
import { WEAPON_CLASS } from '../weapons.js';

export class Cleric extends BaseClass {
  static XP_REQS = Object.freeze([800, 2400, 5600, 12000, 25000, 55000, 110000]);

  static XP_REQ_AFTER_NAME_LVL = 120000;

  static TITLES = Object.freeze([
    'Initiate',
    'Adept',
    'Curate',
    'Vicar',
    'Priest',
    'Hierophant',
    'Hierarch',
    'High Priest',
  ]);

  static SPELL_SLOTS_BY_LEVEL = deepFreeze([
    [1],
    [2],
    [2, 1],
    [2, 2],
    [2, 2, 1],
    [2, 2, 2, 1],
    [3, 3, 2, 2],
    [3, 3, 3, 2, 1],
    [3, 3, 3, 3, 2],
    [4, 4, 3, 3, 2],
    [4, 4, 4, 4, 2, 1],
    [5, 5, 4, 4, 3, 2],
    [5, 5, 5, 5, 3, 2],
    [6, 6, 5, 5, 3, 2],
    [6, 6, 6, 6, 4, 3, 1],
    [7, 7, 6, 6, 4, 3, 2],
    [7, 7, 7, 7, 4, 3, 2],
    [8, 8, 7, 7, 5, 4, 2],
    [8, 8, 8, 8, 5, 4, 3],
    [9, 9, 8, 8, 5, 4, 3],
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.TURN_UNDEAD, 1),
    new FeatureConfig(features.CAST_CLERIC_SPELLS, 1),
    new FeatureConfig(features.READ_CLERIC_SCROLLS, 1),
  ]);

  static specializedSkills = Object.freeze([...allSpellSkills]);

  static proficientSkills = Object.freeze([
    SKILLS.BLUDGEON,
    SKILLS.HAND_TO_HAND,
    SKILLS.SLING,
    SKILLS.STAFF,
    SKILLS.WHIP,
  ]);

  static saveProgressions = saveBases.cleric;

  static firstLvlHp = 'd4+2';
  static hitDie = 'd6';
  static description = 'A holy warrior of the divine.';
  static featureDescriptions = Object.freeze([
    'Turn undead with holy symbol',
    'Cast cleric spells',
    'Read cleric scrolls',
    'Can inflict blunt weapon damage only',
    'Requires Wisdom 9+',
  ]);

  static shieldsDescription = 'any';
  static armorDescription = 'any';
  static weaponDescription = 'simple bludgeons, slings, staffs and whips';
  static weaponClass = WEAPON_CLASS.SIMPLE;

  static abilityReqs = [
    {
      name: ABILITIES.WIS,
      min: 9,
    },
  ];

  static primeReqs = [ABILITIES.WIS];

  constructor(lvl, Class = Cleric) {
    super(lvl, Class);
    this.armors = [...allArmors];
    this.shields = [...allShields];
  }
}

export class CloisteredCleric extends Cleric {
  static specializedSkills = Object.freeze([...super.specializedSkills, SKILLS.ANCIENT_LANGUAGES]);

  static featuresConfig = deepFreeze([...super.featuresConfig, new FeatureConfig(features.SCRIBE_CLERIC_SCROLLS, 1)]);

  static SPELL_SLOTS_BY_LEVEL = Object.freeze([...BaseClass.addOneSpellSlotPerLevel(Cleric.SPELL_SLOTS_BY_LEVEL)]);

  static description = 'A scholar of the divine, who studies the ancient texts and languages of the gods.';
  static featureDescriptions = Object.freeze([
    'Turn undead with holy symbol',
    'Cast cleric spells (1 additional slot per level)',
    'Read cleric scrolls',
    'Scribe cleric scrolls',
    'Can inflict blunt weapon damage only',
    'Requires Wisdom 9+ and Intelligence 9+',
  ]);
  static shieldsDescription = 'none';
  static armorDescription = 'none';

  static abilityReqs = [
    {
      name: ABILITIES.WIS,
      min: 9,
    },
    {
      name: ABILITIES.INT,
      min: 9,
    },
  ];

  constructor(lvl) {
    super(lvl, CloisteredCleric);
    this.armors = [];
    this.shields = [];
  }
}
