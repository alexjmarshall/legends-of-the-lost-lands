import { ALL_ARMORS, ALL_SHIELDS } from '../armors';
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

const { SPECIALIZED, PROFICIENT, BASIC } = SKILL_PROGRESSIONS_ENUM;
const { GOOD, POOR } = SAVE_PROGRESSIONS_ENUM;
const { RESILIENCE, RESOLVE, EVASION, LUCK } = SAVES_ENUM;
const { BLUDGEON, HAMMER, HAND_TO_HAND, SLING, STAFF, THROW, WHIP } = WEAP_SKILLS_ENUM;
const { CLERIC, CLOISTERED_CLERIC } = CLASSES_ENUM;

export class Cleric extends BaseClass {
  #XP_REQS = Object.freeze([
    800,
    2400,
    5600,
    12000,
    25000,
    50000,
    100000,
    200000,
    350000,
    400000,
    550000,
    700000,
    8500000,
    Infinity,
  ]);

  #TITLES = Object.freeze([
    'Acolyte',
    'Adept',
    'Curate',
    'Vicar',
    'Priest',
    'Bishop',
    'Lama',
    'Hierarch',
    'High Priest',
    'High Priest (10th)',
    'High Priest (11th)',
    'High Priest (12th)',
    'High Priest (13th)',
    'High Priest (14th)',
  ]);

  _SPELL_SLOTS_BY_LEVEL = deepFreeze([
    [0],
    [1],
    [2],
    [2, 1],
    [2, 2],
    [2, 2, 1],
    [2, 2, 2, 1],
    [2, 2, 2, 2, 1],
    [3, 3, 3, 2, 2],
    [3, 3, 3, 3, 3],
    [4, 4, 4, 3, 3],
    [4, 4, 4, 4, 4, 1],
    [5, 5, 5, 4, 4, 2],
    [5, 5, 5, 5, 5, 3],
  ]);

  #SKILLS = deepFreeze({
    progressions: {
      [SPECIALIZED]: ALL_SPELL_SCHOOLS,
      [PROFICIENT]: [BLUDGEON, HAMMER, HAND_TO_HAND, SLING, STAFF, THROW, WHIP],
      [BASIC]: BASIC_SKILLS_EXCL_WEAPON,
    },
  });

  #SAVES = deepFreeze({
    mod: 1,
    progressions: {
      [GOOD]: [RESILIENCE, RESOLVE],
      [POOR]: [EVASION, LUCK],
    },
  });

  constructor(lvl) {
    super(lvl);
    this.hitDie = 'd6';
    this.xpRequired = this.#XP_REQS[lvl - 1];
    this.title = this.#TITLES[lvl - 1];
    this.spellSlots = this.SPELL_SLOTS_BY_LEVEL[lvl - 1];
    this.armors = ALL_ARMORS;
    this.shields = ALL_SHIELDS;
    this.skills = buildSkills(this.#SKILLS, lvl);
    this.saves = buildSaves(this.#SAVES, lvl);
    this.features = buildFeatures(CLERIC, lvl);
  }
}

export class CloisteredCleric extends Cleric {
  constructor(lvl) {
    super(lvl);
    this.armors = [];
    this.shields = [];
    this.spellSlots = super.addOneSpellSlotPerLevel(super._SPELL_SLOTS_BY_LEVEL);
    this.features = buildFeatures(CLOISTERED_CLERIC, lvl);
  }
}
