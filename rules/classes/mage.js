import { allSpellSkillsArray, skillsEnum } from '../skills';
import { saveModGroups } from '../saves';
import { ClassFeature, featuresEnum } from '../features';
import { BaseClass } from './base-class';
import { abilitiesEnum } from '../abilities';
import { deepFreeze } from '../helper';

export class Mage extends BaseClass {
  static XP_REQS = Object.freeze([
    1200,
    3600,
    8400,
    18000,
    35000,
    50000,
    75000,
    100000,
    200000,
    300000,
    500000,
    700000,
    900000,
    Infinity,
  ]);

  static TITLES = Object.freeze([
    'Medium',
    'Seer',
    'Conjurer',
    'Theurgist',
    'Thaumaturgist',
    'Occultist',
    'Magickian',
    'Enchanter',
    'Sorcerer',
    'Necromancer',
    'Wizard',
    'Wizard (12th)',
    'Wizard (13th)',
    'Wizard (14th)',
  ]);

  static SPELL_SLOTS_BY_LEVEL = deepFreeze([
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
  ]);

  static features = deepFreeze([
    new ClassFeature(featuresEnum.CAST_MAGICK_SPELLS, 1),
    new ClassFeature(featuresEnum.READ_MAGICK_SCROLLS, 1),
    new ClassFeature(featuresEnum.SCRIBE_MAGICK_SCROLLS, 1),
  ]);

  static specializedSkills = Object.freeze([...allSpellSkillsArray]);
  static proficientSkills = Object.freeze([skillsEnum.DAGGER, skillsEnum.SLING, skillsEnum.STAFF, skillsEnum.THROW]);

  static saveMods = saveModGroups.mage;

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl, Mage);
    this.primeReqs = [abilitiesEnum.INT];
    this.hitDie = 'd4';
    this.reqXp = Mage.XP_REQS[lvl - 1];
    this.title = Mage.TITLES[lvl - 1];
    this.spellSlots = Mage.SPELL_SLOTS_BY_LEVEL[lvl - 1];
    this.abilityReqs = {
      [abilitiesEnum.INT]: {
        min: 9,
      },
    };
    this.buildSkills(Mage);
    this.buildSaves(Mage);
    this.buildFeatures(Mage, lvl);
  }
}

export class Incantatrix extends Mage {
  static features = deepFreeze([
    ...super.features,
    new ClassFeature(featuresEnum.STEAL_SPELL, 1),
    new ClassFeature(featuresEnum.SENSE_SPELL, 3),
    new ClassFeature(featuresEnum.SENSE_MEMORIZED_SPELLS, 5),
    new ClassFeature(featuresEnum.SENSE_MAGICK, 7),
    new ClassFeature(featuresEnum.DRAIN_MAGICK, 11),
  ]);

  static SPELL_SLOTS_BY_LEVEL = Object.freeze([...BaseClass.removeOneSpellSlotPerLevel(Mage.SPELL_SLOTS_BY_LEVEL)]);

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl);
    this.spellSlots = Incantatrix.SPELL_SLOTS_BY_LEVEL[lvl - 1];
    this.buildFeatures(Incantatrix, lvl);
  }
}

class BaseElementalist extends Mage {
  static features = deepFreeze([
    ...super.features,
    new ClassFeature(featuresEnum.ELEMENTAL_SURGE, 1),
    new ClassFeature(featuresEnum.ELEMENTAL_FOCUS, 1),
  ]);
  // TODO the element type will be derived data of feature item based on class name

  static SPELL_SLOTS_BY_LEVEL = Object.freeze([...BaseClass.addOneSpellSlotPerLevel(Mage.SPELL_SLOTS_BY_LEVEL)]);

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl);
    this.spellSlots = BaseElementalist.SPELL_SLOTS_BY_LEVEL[lvl - 1];
    this.buildFeatures(BaseElementalist, lvl);
  }
}

export class AirElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
  }
}

export class FireElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
  }
}

export class EarthElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
  }
}

export class WaterElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
  }
}
