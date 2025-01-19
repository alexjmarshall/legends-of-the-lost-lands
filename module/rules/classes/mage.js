import { allSpellSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { deepFreeze } from '../../helper.js';
import { WEAPON_CLASS } from '../weapons.js';

export class Mage extends BaseClass {
  static description = 'A loremaster who derives great power from their study of arcane mysteries.';

  static XP_REQS = Object.freeze([0, 1200, 3600, 8400, 18000, 35000, 50000, 75000, 100000, 200000, 300000]);

  static XP_REQ_AFTER_NAME_LVL = 100000;

  static TITLES = Object.freeze([
    'Medium',
    'Seer',
    'Conjurer',
    'Theurgist',
    'Thaumaturgist',
    'Occultist',
    'Magician',
    'Enchanter',
    'Sorcerer',
    'Necromancer',
    'Wizard',
  ]);

  static MAGIC_SPELL_SLOTS = deepFreeze([
    [1],
    [2],
    [3, 1],
    [4, 2],
    [4, 2, 1],
    [4, 2, 2],
    [4, 3, 2, 1],
    [4, 3, 3, 2],
    [4, 3, 3, 2, 1],
    [4, 4, 3, 3, 2],
    [4, 4, 4, 3, 3],
    [4, 4, 4, 4, 4, 1],
    [5, 5, 5, 4, 4, 2],
    [5, 5, 5, 4, 4, 3, 1],
    [5, 5, 5, 4, 4, 4, 2],
    [5, 5, 5, 5, 5, 5, 2, 1],
    [6, 6, 6, 5, 5, 5, 2, 2],
    [6, 6, 6, 6, 6, 6, 2, 2, 1],
    [7, 7, 7, 6, 6, 6, 3, 2, 2],
    [7, 7, 7, 7, 7, 7, 3, 3, 2],
  ]);

  static featuresConfig = deepFreeze([
    new FeatureConfig(features.CAST_MAGIC_SPELLS),
    new FeatureConfig(features.READ_MAGIC_SCROLLS),
    new FeatureConfig(features.SCRIBE_MAGIC_SCROLLS),
  ]);

  static specializedSkills = Object.freeze([...allSpellSkills]);

  static untrainedSkills = Object.freeze([SKILLS.DAGGER, SKILLS.SLING, SKILLS.STAFF]);

  static saveProgressions = saveBases.mage;

  static firstLvlHp = 'd4+1';
  static fpReserve = 5;
  static hitDie = 'd4';
  static afterNameHp = 1;
  static shieldsDescription = 'none';
  static armorDescription = 'none';
  static weaponDescription = 'daggers, slings and staffs';
  static weaponClass = WEAPON_CLASS.SIMPLE;

  static primeReqs = [ABILITIES.INT];

  constructor(lvl, origin, Class = Mage) {
    super(lvl, origin, Class);
    this.armors = [];
    this.shields = [];
  }
}

export class Incantatrix extends Mage {
  static description = 'A mage with the uncanny ability to steal spells from the minds of others.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.DIMINISHED_SPELLCASTING),
    new FeatureConfig(features.READ_THOUGHTS),
    new FeatureConfig(features.DETECT_MAGIC),
    new FeatureConfig(features.SENSE_SPELL),
    new FeatureConfig(features.FORGET, 2),
    new FeatureConfig(features.SENSE_MEMORIZED_SPELLS, 2),
    new FeatureConfig(features.TRIGGER_SPELL, 3),
    new FeatureConfig(features.STEAL_SPELL, 5),
    new FeatureConfig(features.DRAIN_MAGIC, 11),
  ]);

  static MAGIC_SPELL_SLOTS = Object.freeze([...BaseClass.removeOneSpellSlotPerLevel(Mage.MAGIC_SPELL_SLOTS)]);

  static abilityReqs = [
    {
      name: ABILITIES.CHA,
      min: 13,
    },
  ];

  constructor(lvl, origin) {
    super(lvl, origin, Incantatrix);
  }
}

class BaseSpecialist extends Mage {
  static MAGIC_SPELL_SLOTS = Object.freeze([...BaseClass.addOneSpellSlotPerLevel(Mage.MAGIC_SPELL_SLOTS)]);

  static abilityReqs = [
    {
      name: ABILITIES.INT,
      min: 9,
    },
  ];

  constructor(lvl, origin, Class = BaseSpecialist) {
    super(lvl, origin, Class);
  }
}

export class Abjurer extends BaseSpecialist {
  static description = 'A specialist in protection and warding magics.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.ABJURATION_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Abjurer);
  }
}

export class Conjurer extends BaseSpecialist {
  static description = 'A specialist in magics to summmon beings and conjure objects.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.CONJURATION_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Conjurer);
  }
}

export class Diviner extends BaseSpecialist {
  static description = 'A specialist in magics to forewarn and foretell.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.DIVINATION_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Diviner);
  }
}

export class Enchanter extends BaseSpecialist {
  static description = 'A specialist in the manipulation of the minds of others.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.ENCHANTMENT_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Enchanter);
  }
}

export class Evoker extends BaseSpecialist {
  static description = 'A specialist in the manipulation of raw and elemental energies.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.EVOCATION_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Evoker);
  }
}

export class Illusionist extends BaseSpecialist {
  static description = 'A specialist in magics to dazzle and mislead.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.ILLUSION_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Illusionist);
  }
}

export class Necromancer extends BaseSpecialist {
  static description = 'A specialist in the magics of life and death.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.NECROMANCY_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Necromancer);
  }
}

export class Transmuter extends BaseSpecialist {
  static description = 'A specialist in magics that alter physical reality.';

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.ENHANCED_SPELLCASTING),
    new FeatureConfig(features.ALTERATION_SPECIALIZATION),
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Transmuter);
  }
}
