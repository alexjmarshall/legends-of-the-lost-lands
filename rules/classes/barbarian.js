import { allArmorsArray, lightArmorsArray, mediumArmorsArray, allShieldsArray } from '../armors';
import { allCombatSkillsArray, skillsEnum } from '../skills';
import { saveModGroups } from '../saves';
import { ClassFeature, featuresEnum } from '../features';
import { BaseClass } from './base-class';
import { alignmentsEnum } from '../alignments';
import { abilitiesEnum } from '../abilities';
import { deepFreeze } from '../helper';

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

  static features = deepFreeze([
    new ClassFeature(featuresEnum.NATURAL_TOUGHNESS, 1),
    new ClassFeature(featuresEnum.SENSE_DANGER, 1),
    new ClassFeature(featuresEnum.FEARLESS, 1),
    new ClassFeature(featuresEnum.FLEET_FOOTED, 1),
    new ClassFeature(featuresEnum.WIZARD_SLAYER, 1),
    new ClassFeature(featuresEnum.FIRST_ATTACK_FEROCITY, 1),
    new ClassFeature(featuresEnum.MULTIATTACK, 8, (lvl) => ({
      extraAttacks: BaseClass.oneAtEightAndTwoAtFourteen(lvl),
    })),
  ]);

  static specializedSkills = Object.freeze([...allCombatSkillsArray]);
  static proficientSkills = Object.freeze([skillsEnum.CLIMB]);

  static saveMods = saveModGroups.fighter;

  #getArmorsByLevel(lvl) {
    if (lvl < 4) return [];
    if (lvl < 8) return lightArmorsArray;
    if (lvl < 13) return [...lightArmorsArray, ...mediumArmorsArray];
    return allArmorsArray;
  }

  constructor(lvl) {
    lvl = Number(lvl);
    super(lvl, Barbarian);
    this.primeReqs = [abilitiesEnum.STR, abilitiesEnum.CON];
    this.hitDie = 'd10';
    this.reqXp = Barbarian.XP_REQS[lvl - 1];
    this.title = Barbarian.TITLES[lvl - 1];
    this.armors = this.#getArmorsByLevel(lvl);
    this.shields = allShieldsArray;
    this.alignments = chaoticAlignments;
    this.abilityReqs = {
      [abilitiesEnum.CON]: {
        min: 15,
      },
      [abilitiesEnum.STR]: {
        min: 14,
      },
      [abilitiesEnum.DEX]: {
        min: 13,
      },
    };
  }
}
