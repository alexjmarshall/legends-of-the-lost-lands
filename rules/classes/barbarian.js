import { allArmorsArray, lightArmorsArray, mediumArmorsArray, allShieldsArray } from '../armors';
import { allCombatSkillsArray, skillsEnum } from '../skills';
import { savesEnum } from '../saves';
import { classFeaturesEnum } from '../features';
import { BaseClass } from './base-class';
import { alignmentsEnum } from '../alignments';
import { abilitiesEnum } from '../abilities';

const chaoticAlignments = [alignmentsEnum.CG, alignmentsEnum.CE];

export class Barbarian extends BaseClass {
  static XP_REQS = Object.freeze([
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

  static TITLES = Object.freeze([
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

  static features = {
    [classFeaturesEnum.NATURAL_TOUGHNESS]: {
      reqLvl: 1,
    },
    [classFeaturesEnum.SENSE_DANGER]: {
      reqLvl: 1,
    },
    [classFeaturesEnum.FEARLESS]: {
      reqLvl: 1,
    },
    [classFeaturesEnum.FLEET_FOOTED]: {
      reqLvl: 1,
    },
    [classFeaturesEnum.WIZARD_SLAYER]: {
      reqLvl: 1,
    },
    [classFeaturesEnum.FIRST_ATTACK_FEROCITY]: {
      reqLvl: 1,
    },
    [classFeaturesEnum.MULTIATTACK]: {
      reqLvl: 8,
      derivedData: (lvl) => ({
        extraAttacks: BaseClass.oneAtEightAndTwoAtFourteen(lvl),
      }),
    },
  };

  static specializedSkills = allCombatSkillsArray;

  static proficientSkills = [skillsEnum.CLIMB];

  static saveMods = Object.freeze({
    [savesEnum.RESOLVE]: -1,
    [savesEnum.EVASION]: 1,
    [savesEnum.RESILIENCE]: 1,
    [savesEnum.LUCK]: -1,
  });

  getArmorsByLevel(lvl) {
    if (lvl < 4) return [];
    if (lvl < 8) return lightArmorsArray;
    if (lvl < 13) return [...lightArmorsArray, ...mediumArmorsArray];
    return allArmorsArray;
  }

  constructor(lvl) {
    super(lvl, Barbarian);
    this.primeReqs = [abilitiesEnum.STR, abilitiesEnum.CON];
    this.hitDie = 'd10';
    this.reqXp = Barbarian.XP_REQS[lvl - 1];
    this.title = Barbarian.TITLES[lvl - 1];
    this.armors = this.getArmorsByLevel(lvl);
    this.shields = allShieldsArray;
    this.alignments = chaoticAlignments;
    this.abilityReqs = {
      [abilitiesEnum.CON]: 15,
      [abilitiesEnum.STR]: 14,
      [abilitiesEnum.DEX]: 13,
    };
  }
}
