import { allArmorsArray, allShieldsArray } from '../armors';
import { allCombatSkillsArray, skillsEnum } from '../skills';
import { saveModGroups } from '../saves';
import { ClassFeature, featuresEnum } from '../features';
import { BaseClass } from './base-class';
import { abilitiesEnum } from '../abilities';
import { deepFreeze } from '../helper';

export class Fighter extends BaseClass {
  static XP_REQS = Object.freeze([
    1000,
    3000,
    7000,
    15000,
    30000,
    60000,
    120000,
    240000,
    400000,
    560000,
    720000,
    880000,
    1040000,
    Infinity,
  ]);

  static TITLES = Object.freeze([
    'Veteran',
    'Warrior',
    'Swordsman',
    'Hero',
    'Gladiator',
    'Dominator',
    'Champion',
    'Super Hero',
    'Lord',
    'Lord (10th)',
    'Lord (11th)',
    'Lord (12th)',
    'Lord (13th)',
    'Lord (14th)',
  ]);

  static features = deepFreeze([
    new ClassFeature(featuresEnum.CHAIN_ATTACK, 1, (lvl) => ({
      maxAttacks: lvl,
    })),
    new ClassFeature(featuresEnum.MULTIATTACK, 7, (lvl) => ({
      extraAttacks: BaseClass.onePerNLevelsAfterFirst(lvl, 6),
    })),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkillsArray]);
  static proficientSkills = [];

  static saveMods = saveModGroups.fighter;

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl, Fighter);
    this.primeReqs = [abilitiesEnum.STR];
    this.hitDie = 'd8';
    this.reqXp = Fighter.XP_REQS[lvl - 1];
    this.title = Fighter.TITLES[lvl - 1];
    this.armors = [...allArmorsArray];
    this.shields = [...allShieldsArray];
    this.abilityReqs = {
      [abilitiesEnum.STR]: {
        min: 9,
      },
    };
  }
}

export class Berserker extends Fighter {
  static features = deepFreeze([
    new ClassFeature(featuresEnum.BERSERK, 1, (lvl) => ({
      usesPerDay: BaseClass.onePlusOnePerFourLevels(lvl),
    })),
    new ClassFeature(featuresEnum.MULTIATTACK, 7, (lvl) => ({
      extraAttacks: BaseClass.onePerNLevelsAfterFirst(lvl, 6),
    })),
  ]);

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl);
    this.abilityReqs = {
      [abilitiesEnum.STR]: {
        min: 9,
      },
      [abilitiesEnum.WIS]: {
        max: 12,
      },
    };
    this.buildFeatures(Berserker, lvl);
  }
}
