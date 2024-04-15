import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../size.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class Elf extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: 0,
    [ABILITIES.DEX]: 1,
    [ABILITIES.CON]: -2,
    [ABILITIES.INT]: 1,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: 0,
  };

  static description = 'An ancient race, aloof and preoccupied by their fate.';

  static features = Object.freeze([
    features.GRACILE,
    features.ENIGMATIC_MIND,
    features.KEEN_SIGHT,
    features.PARTING_GIFT,
    features.WORLDBOUND,
  ]);

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 175,
    [AGE_CATEGORIES.MATURE]: 550,
    [AGE_CATEGORIES.MIDDLE_AGED]: 875,
    [AGE_CATEGORIES.OLD]: 1200,
    [AGE_CATEGORIES.VENERABLE]: 1600,
  });

  static averageHeight = {
    M: 71,
    F: 67,
  };

  static weightModifier = 0.91;

  static encModifier = 0.94;

  static size = () => SIZES.MEDIUM;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(Elf, abilityScores);
  }

  static allowedClasses = Object.freeze([
    CLASS.Fighter.name,
    CLASS.Cleric.name,
    CLASS.Mage.name,
    CLASS.Thief.name,
    CLASS.Assassin.name,
  ]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Mage.name],
    [CLASS.Cleric.name, CLASS.Mage.name],
    [CLASS.Mage.name, CLASS.Thief.name],
    [CLASS.Fighter.name, CLASS.Mage.name, CLASS.Thief.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
        return 130 + rollDice('5d6');
      case CLASS.Cleric.name:
        return 200 + rollDice('5d10');
      case CLASS.Mage.name:
      case CLASS.Incantatrix.name:
        return 150 + rollDice('5d6');
      case CLASS.Thief.name:
      case CLASS.Assassin.name:
        return 100 + rollDice('5d6');
      default:
        return 130 + rollDice('5d6');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(Elf);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(Elf, gender, str);
  }
}
