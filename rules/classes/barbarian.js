import { ALL_ARMORS, LIGHT_ARMORS, MEDIUM_ARMORS, ALL_SHIELDS } from '../armors';
import { ALL_WEAPONS, SKILL_PROGRESSIONS_ENUM, BASIC_SKILLS, SKILLS_ENUM, buildSkills } from '../skills';
import { SAVES_ENUM, SAVE_PROGRESSIONS_ENUM, buildSaves } from '../saves';
import { buildFeatures, FEATURES_ENUM } from '../features';
import { BaseClass } from './base-class';
import { CLASSES_ENUM } from './classes-enum';
import { deepFreeze } from '../helper';

const { SPECIALIZED, BASIC } = SKILL_PROGRESSIONS_ENUM;
const { CLIMB } = SKILLS_ENUM;
const { GOOD, POOR } = SAVE_PROGRESSIONS_ENUM;
const { RESILIENCE, RESOLVE, EVASION, LUCK } = SAVES_ENUM;
const { NATURAL_TOUGHNESS, FEARLESS, FLEET_FOOTED, DANGER_SENSE, WIZARD_SLAYER, FIRST_ATTACK_FEROCITY, EXTRA_ATTACK } =
  FEATURES_ENUM;

export class Barbarian extends BaseClass {
  #XP_REQS = Object.freeze([
    700,
    2000,
    5000,
    10000,
    25000,
    45000,
    90000,
    150000,
    230000,
    380000,
    530000,
    680000,
    830000,
    Infinity,
  ]);

  #TITLES = Object.freeze([
    'Savage',
    'Tribesman',
    'Clansman',
    'Hunter',
    'Raider',
    'Brave',
    'Hetman',
    'Destroyer',
    'Conqueror',
    'Chieftain',
    'Chieftain (11th)',
    'Chieftain (12th)',
    'Chieftain (13th)',
    'Chieftain (14th)',
  ]);

  #SAVES = deepFreeze({
    progressions: {
      [GOOD]: [RESILIENCE, EVASION],
      [POOR]: [RESOLVE, LUCK],
    },
  });

  _SKILLS = deepFreeze({
    progressions: {
      [SPECIALIZED]: [...ALL_WEAPONS, CLIMB],
      [BASIC]: BASIC_SKILLS.filter(this.notSpecializedOrProficient),
    },
  });

  #oneAfterEightTwoAfterFourteen = (lvl) => {
    if (lvl < 8) return 0;
    if (lvl < 14) return 1;
    return 2;
  };

  features = {
    [NATURAL_TOUGHNESS]: {
      reqLvl: 1,
    },
    [DANGER_SENSE]: {
      reqLvl: 1,
    },
    [FEARLESS]: {
      reqLvl: 1,
    },
    [FLEET_FOOTED]: {
      reqLvl: 1,
      activeEffect: {}, // TODO implement
    },
    [WIZARD_SLAYER]: {
      // TODO ???
      reqLvl: 1,
    },
    [FIRST_ATTACK_FEROCITY]: {
      reqLvl: 1,
    },
    [EXTRA_ATTACK]: {
      reqLvl: 7,
      derivedData: {
        extraAttacks: this.#oneAfterEightTwoAfterFourteen(this.lvl),
      },
    },
  };

  #getArmorsByLevel(lvl) {
    if (lvl < 4) return [];
    if (lvl < 8) return LIGHT_ARMORS;
    if (lvl < 13) return [...LIGHT_ARMORS, ...MEDIUM_ARMORS];
    return ALL_ARMORS;
  }

  constructor(lvl) {
    super(lvl);
    this.hit_die = 'd10';
    this.hp_bonus = '2d10';
    this.req_xp = this.#XP_REQS[lvl - 1];
    this.title = this.#TITLES[lvl - 1];
    this.armors = this.#getArmorsByLevel(lvl);
    this.shields = ALL_SHIELDS;
    this.saves = buildSaves(this.#SAVES, lvl);
    this.skills = buildSkills(this._SKILLS, lvl);
  }
}
