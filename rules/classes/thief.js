import {
  WEAP_SKILLS_ENUM,
  ALL_THIEVERY_SKILLS,
  BASIC_SKILLS_EXCL_WEAPON_AND_THIEVERY,
  SKILL_PROGRESSIONS_ENUM,
  buildSkills,
  ALL_WEAPONS,
  SKILLS_ENUM,
} from '../skills';
import { SAVES_ENUM, SAVE_PROGRESSIONS_ENUM, buildSaves } from '../saves';
import { buildFeatures } from '../features';
import { ALL_ALIGNMENTS, ALIGNMENTS_ENUM } from '../alignments';
import { LIGHT_ARMORS } from '../armors';
import { BaseClass } from './base-class';
import { CLASSES_ENUM } from './classes-enum';
import { deepFreeze } from '../helper';
import { ALL_SHIELDS } from '../armors';

const { SPECIALIZED, PROFICIENT, BASIC } = SKILL_PROGRESSIONS_ENUM;
const { GOOD, POOR } = SAVE_PROGRESSIONS_ENUM;
const { RESILIENCE, RESOLVE, EVASION, LUCK } = SAVES_ENUM;
const { BLUDGEON, HAND_TO_HAND, SLING, CURVED_SWORD, PIERCING_SWORD, STRAIGHT_SWORD, SHORTBOW, CROSSBOW, STAFF, WHIP } =
  WEAP_SKILLS_ENUM;
const { THIEF, ASSASSIN, SWASHBUCKLER } = CLASSES_ENUM;
const { POISONLORE, PICK_POCKET } = SKILLS_ENUM;

const allAlignmentsExceptLG = ALL_ALIGNMENTS.filter((a) => a !== ALIGNMENTS_ENUM.LG);

const thiefWeapons = [
  BLUDGEON,
  HAND_TO_HAND,
  SLING,
  CURVED_SWORD,
  PIERCING_SWORD,
  STRAIGHT_SWORD,
  SHORTBOW,
  CROSSBOW,
  STAFF,
  WHIP,
];

// TODO only use ALL CAPS for compile-time enums, not run-time enums (composed of other enums)

export class Thief extends BaseClass {
  #XP_REQS = Object.freeze([
    600,
    1800,
    4200,
    9600,
    20000,
    40000,
    60000,
    90000,
    125000,
    250000,
    435000,
    620000,
    745000,
    930000,
    Infinity,
  ]);

  #TITLES = [
    'Apprentice',
    'Footpad',
    'Cutpurse',
    'Robber',
    'Burglar',
    'Filcher',
    'Pilferer',
    'Magsman',
    'Thief',
    'Master Thief',
    'Master Thief (11th)',
    'Master Thief (12th)',
    'Master Thief (13th)',
    'Master Thief (14th)',
  ];

  #SKILLS = deepFreeze({
    progressions: {
      [SPECIALIZED]: ALL_THIEVERY_SKILLS,
      [PROFICIENT]: thiefWeapons,
      [BASIC]: BASIC_SKILLS_EXCL_WEAPON_AND_THIEVERY,
    },
  });

  #SAVES = deepFreeze({
    progressions: {
      [GOOD]: [EVASION, LUCK],
      [POOR]: [RESILIENCE, RESOLVE],
    },
  });

  constructor(lvl) {
    super(lvl);
    this.hitDie = 'd4';
    this.xpRequired = this.#XP_REQS[lvl - 1];
    this.title = this.#TITLES[lvl - 1];
    this.armors = LIGHT_ARMORS;
    this.shields = [];
    this.skills = buildSkills(this.#SKILLS, lvl);
    this.saves = buildSaves(this.#SAVES, lvl);
    this.features = buildFeatures(THIEF, lvl);
    this.alignments = allAlignmentsExceptLG;
  }
}

export class Assassin extends Thief {
  #SKILLS = deepFreeze({
    progressions: {
      [PROFICIENT]: [...ALL_THIEVERY_SKILLS.filter((s) => s !== PICK_POCKET), ...ALL_WEAPONS, POISONLORE],
      [BASIC]: BASIC_SKILLS_EXCL_WEAPON_AND_THIEVERY,
    },
  });

  constructor(lvl) {
    super(lvl);
    this.shields = ALL_SHIELDS;
    this.skills = buildSkills(this.#SKILLS, lvl);
    this.features = buildFeatures(ASSASSIN, lvl);
    this.alignments = [ALIGNMENTS_ENUM.LE, ALIGNMENTS_ENUM.CE];
  }
}

export class Swashbuckler extends Thief {
  #SKILLS = deepFreeze({
    [PROFICIENT]: [...thiefWeapons, ...ALL_THIEVERY_SKILLS],
    [BASIC]: BASIC_SKILLS_EXCL_WEAPON_AND_THIEVERY,
  });

  constructor(lvl) {
    super(lvl);
    this.skills = buildSkills(this.#SKILLS, lvl);
    this.features = buildFeatures(SWASHBUCKLER, lvl);
  }
}
