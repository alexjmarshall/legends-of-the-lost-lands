import { allSpellSkills, SKILLS } from '../skills.js';
import { saveBases } from '../saves.js';
import { FeatureConfig, features } from '../features.js';
import { BaseClass } from './base-class.js';
import { ABILITIES } from '../abilities.js';
import { deepFreeze } from '../../helper.js';
import { WEAPON_CLASS } from '../weapons.js';

export class Mage extends BaseClass {
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
    [2],
    [3],
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
    new FeatureConfig(features.CAST_MAGIC_SPELLS, 1),
    new FeatureConfig(features.READ_MAGIC_SCROLLS, 1),
    new FeatureConfig(features.SCRIBE_MAGIC_SCROLLS, 1),
  ]);

  static specializedSkills = Object.freeze([...allSpellSkills]);

  static untrainedSkills = Object.freeze([SKILLS.DAGGER, SKILLS.SLING, SKILLS.STAFF]);

  static saveProgressions = saveBases.mage;

  static firstLvlHp = 'd4+1';
  static fpReserve = 5;
  static hitDie = 'd4';
  static afterNameHp = 1;
  static description = 'A master of magical energies who devotes much of their time to spell research.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Requires Intelligence 9+',
  ]);
  static shieldsDescription = 'none';
  static armorDescription = 'none';
  static weaponDescription = 'daggers, slings and staffs';
  static weaponClass = WEAPON_CLASS.SIMPLE;

  static abilityReqs = [
    {
      name: ABILITIES.INT,
      min: 9,
    },
  ];

  static primeReqs = [ABILITIES.INT];

  constructor(lvl, origin, Class = Mage) {
    super(lvl, origin, Class);
    this.armors = [];
    this.shields = [];
  }
}

export class Incantatrix extends Mage {
  static description = 'A mage with the uncanny ability to steal spells from other minds.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 fewer slot per level)',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Steal spell',
    'Sense spell (level 3)',
    'Sense memorized spells (level 5)',
    'Sense magic (level 7)',
    'Drain magic (level 11)',
  ]);

  static featuresConfig = deepFreeze([
    ...super.featuresConfig,
    new FeatureConfig(features.STEAL_SPELL, 1),
    new FeatureConfig(features.SENSE_SPELL, 3),
    new FeatureConfig(features.SENSE_MEMORIZED_SPELLS, 5),
    new FeatureConfig(features.SENSE_MAGIC, 7),
    new FeatureConfig(features.DRAIN_MAGIC, 11),
  ]);

  static MAGIC_SPELL_SLOTS = Object.freeze([
    [1],
    [2],
    [3],
    [3, 1],
    [3, 2],
    [3, 2, 1],
    [3, 2, 2],
    [3, 2, 2, 1],
    [3, 2, 2, 2],
    [3, 3, 2, 2, 1],
    [3, 3, 3, 2, 2],
    [3, 3, 3, 3, 3],
    [4, 4, 4, 3, 3, 1],
    [4, 4, 4, 3, 3, 2],
    [4, 4, 4, 3, 3, 3, 1],
    [4, 4, 4, 4, 4, 4, 1],
    [5, 5, 5, 4, 4, 4, 1, 1],
    [5, 5, 5, 5, 5, 5, 2, 1, 1],
    [6, 6, 6, 5, 5, 5, 2, 1, 1],
    [6, 6, 6, 6, 6, 6, 2, 2, 1],
  ]);

  constructor(lvl, origin) {
    super(lvl, origin, Incantatrix);
  }
}

class BaseSpecialist extends Mage {
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 fewer slot per level)',
    'Read magic scrolls',
    'Scribe magic scrolls',
  ]);
  static featuresConfig = deepFreeze([...super.featuresConfig, new FeatureConfig(features.SPECIALIST_FOCUS, 1)]);

  static MAGIC_SPELL_SLOTS = Object.freeze([...BaseClass.addOneSpellSlotPerLevel(Mage.MAGIC_SPELL_SLOTS)]);

  constructor(lvl, origin, Class = BaseSpecialist) {
    super(lvl, origin, Class);
  }
}

export class Abjurer extends BaseSpecialist {
  static description = 'A mage who specializes in protection and warding magics.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Abjuration skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast alteration spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Abjurer);
  }
}

export class Conjurer extends BaseSpecialist {
  static description = 'A mage who specializes in summoning creatures and creating objects.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Conjuration skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast divination spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Conjurer);
  }
}

export class Diviner extends BaseSpecialist {
  static description = 'A mage who specializes in detection and divining magics.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Divination skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast conjuration spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Diviner);
  }
}

export class Enchanter extends BaseSpecialist {
  static description = 'A mage who specializes in manipulating the minds of others.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Enchantment skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast evocation spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Enchanter);
  }
}

export class Evoker extends BaseSpecialist {
  static description = 'A mage who specializes in the manipulation of raw and elemental energies.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Evocation skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast enchantment spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Evoker);
  }
}

export class Illusionist extends BaseSpecialist {
  static description = 'A mage who specializes in creating illusions to confuse and mislead.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Illusion skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast necromancy spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Illusionist);
  }
}

export class Necromancer extends BaseSpecialist {
  static description = 'A mage who specializes in magic dealing with life and death.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Necromancy skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast illusion spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Necromancer);
  }
}

export class Transmuter extends BaseSpecialist {
  static description = 'A mage who specializes in magics that alter physical reality.';
  static featureDescriptions = Object.freeze([
    'Cast magic spells (1 additional slot per level)',
    '+2 bonus to Alteration skill',
    'Read magic scrolls',
    'Scribe magic scrolls',
    'Cannot cast abjuration spells',
  ]);
  constructor(lvl, origin) {
    super(lvl, origin, Transmuter);
  }
}
