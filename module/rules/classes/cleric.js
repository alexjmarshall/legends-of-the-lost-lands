import { allArmors, lightArmors, mediumArmors } from '../armor-and-clothing.js';
import { allShields } from '../shields.js';
import { allSpellSkills, SKILLS, allCombatSkills } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { deepFreeze } from '../../helper.js';
import { WEAPON_CLASS } from '../weapons.js';

export class Cleric extends BaseClass {
  static description = 'A holy warrior who wields divine power to mend wounds and smite foes.';

  static XP_REQS = Object.freeze([0, 800, 2400, 5600, 12000, 25000, 55000, 110000]);

  static XP_REQ_AFTER_NAME_LVL = 110000;

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

  static CLERIC_SPELL_SLOTS = deepFreeze([
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
    new FeatureConfig(features.BLUNT_DAMAGE_ONLY, 1),
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
  static fpReserve = 10;
  static hitDie = 'd6';
  static afterNameHp = 2;
  static weaponDescription = 'bludgeons, slings, staffs and whips';
  static weaponClass = WEAPON_CLASS.SIMPLE;
  static primeReqs = [ABILITIES.WIS];

  constructor(lvl, origin, Class = Cleric) {
    super(lvl, origin, Class);
    this.armors = [...allArmors];
    this.shields = [...allShields];
  }
}

export class CloisteredCleric extends Cleric {
  static description = 'A scholar of the divine who studies the ancient texts of the gods.';
  static specializedSkills = Object.freeze([...super.specializedSkills, SKILLS.ANCIENT_LANGUAGES]);
  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.SCRIBE_CLERIC_SCROLLS, 1),
    new FeatureConfig(features.ENHANCED_SPELLCASTING, 1),
  ]);
  static CLERIC_SPELL_SLOTS = Object.freeze([...BaseClass.addOneSpellSlotPerLevel(Cleric.CLERIC_SPELL_SLOTS)]);
  static shieldsDescription = 'none';
  static armorDescription = 'none';
  static abilityReqs = [
    {
      name: ABILITIES.INT,
      min: 11,
    },
  ];

  constructor(lvl, origin) {
    super(lvl, origin, CloisteredCleric);
    this.armors = [];
    this.shields = [];
  }
}

export class Runepriest extends Cleric {
  static description = 'A worshipper of Wotan who shapes magic runes to channel divine will.';
  static armorDescription = 'medium';
  static featuresConfig = deepFreeze([new FeatureConfig(features.RUNE_MAGIC, 1)]);
  static specializedSkills = Object.freeze([SKILLS.RUNELORE, SKILLS.RUNECARVING]);
  static proficientSkills = Object.freeze([...allCombatSkills]);
  static weaponDescription = 'any';
  static abilityReqs = [
    {
      name: ABILITIES.INT,
      min: 9,
    },
    {
      name: ABILITIES.WIS,
      min: 11,
    },
  ];

  constructor(lvl, origin) {
    super(lvl, origin, Runepriest);
    this.armors = [...lightArmors, ...mediumArmors];
    this.weapons = [...allCombatSkills];
  }
}
