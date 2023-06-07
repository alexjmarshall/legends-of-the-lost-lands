import {
  WEAP_SKILLS_ENUM,
  ALL_SPELL_SCHOOLS,
  SKILL_PROGRESSIONS_ENUM,
  BASIC_SKILLS_EXCL_WEAPON,
  buildSkills,
} from '../skills.js';
import { SAVES_ENUM, SAVE_PROGRESSIONS_ENUM, buildSaves } from '../saves';
import { buildFeatures } from '../features';
import { BaseClass } from './base-class';
import { CLASSES_ENUM } from './classes-enum';
import { deepFreeze } from '../helper';

const { SPECIALIZED, BASIC } = SKILL_PROGRESSIONS_ENUM;
const { GOOD, POOR } = SAVE_PROGRESSIONS_ENUM;
const { RESILIENCE, RESOLVE, EVASION, LUCK } = SAVES_ENUM;
const { DAGGER, SLING, STAFF, THROW } = WEAP_SKILLS_ENUM;
const { MAGE, INCANTATRIX, AIR_ELEMENTALIST, FIRE_ELEMENTALIST, EARTH_ELEMENTALIST, WATER_ELEMENTALIST } = CLASSES_ENUM;

export class Mage extends BaseClass {
  #XP_REQS = Object.freeze([
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
    450000,
    600000,
    750000,
    Infinity,
  ]);

  #TITLES = Object.freeze([
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

  _SPELL_SLOTS_BY_LEVEL = deepFreeze([
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

  #SKILLS = deepFreeze({
    progressions: {
      [SPECIALIZED]: ALL_SPELL_SCHOOLS,
      [BASIC]: [...BASIC_SKILLS_EXCL_WEAPON, DAGGER, SLING, STAFF, THROW],
    },
  });

  #SAVES = deepFreeze({
    mod: -1,
    progressions: {
      [GOOD]: [RESOLVE, EVASION],
      [POOR]: [RESILIENCE, LUCK],
    },
  });

  constructor(lvl) {
    super(lvl);
    this.hitDie = 'd4';
    this.xpRequired = this.#XP_REQS[lvl - 1];
    this.title = this.#TITLES[lvl - 1];
    this.spellSlots = this.SPELL_SLOTS_BY_LEVEL[lvl - 1];
    this.skills = buildSkills(this.#SKILLS, lvl);
    this.saves = buildSaves(this.#SAVES, lvl);
    this.features = buildFeatures(MAGE, lvl);
  }
}

export class Incantatrix extends Mage {
  constructor(lvl) {
    super(lvl);
    this.spellSlots = super.removeOneSpellSlotPerLevel(super._SPELL_SLOTS_BY_LEVEL);
    this.features = buildFeatures(INCANTATRIX, lvl);
  }
}

class BaseElementalist extends Mage {
  constructor(lvl) {
    super(lvl);
    this.spellSlots = super.addOneSpellSlotPerLevel(super._SPELL_SLOTS_BY_LEVEL);
  }
}

export class AirElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
    this.features = buildFeatures(AIR_ELEMENTALIST, lvl);
  }
}

export class FireElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
    this.features = buildFeatures(FIRE_ELEMENTALIST, lvl);
  }
}

export class EarthElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
    this.features = buildFeatures(EARTH_ELEMENTALIST, lvl);
  }
}

export class WaterElementalist extends BaseElementalist {
  constructor(lvl) {
    super(lvl);
    this.features = buildFeatures(WATER_ELEMENTALIST, lvl);
  }
}
