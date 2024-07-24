import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../size.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class Pixie extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: -3,
    [ABILITIES.DEX]: 3,
    [ABILITIES.CON]: 0,
    [ABILITIES.INT]: 0,
    [ABILITIES.WIS]: -2,
    [ABILITIES.CHA]: 0,
  };

  static description = 'Mischievous and naive. Fascinated by things novel or intricate.';

  static features = Object.freeze([
    features.FLIGHTY,
    features.PIXIE_DUST,
    features.NATURAL_INVISIBILITY,
    features.NATURAL_FLIGHT,
  ]);

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 60,
    [AGE_CATEGORIES.MATURE]: 150,
    [AGE_CATEGORIES.MIDDLE_AGED]: 260,
    [AGE_CATEGORIES.OLD]: 375,
    [AGE_CATEGORIES.VENERABLE]: 490,
  });

  static averageHeight = {
    M: 25,
    F: 23,
  };

  static weightModifier = 1.2;

  static size = () => SIZES.TINY;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(Pixie, abilityScores);
  }

  static allowedClasses = Object.freeze([
    CLASS.Fighter.name,
    CLASS.Mage.name,
    CLASS.Illusionist.name,
    CLASS.Druid.name,
    CLASS.Thief.name,
  ]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Thief.name],
    [CLASS.Fighter.name, CLASS.Mage.name],
    [CLASS.Mage.name, CLASS.Thief.name],
    [CLASS.Druid.name, CLASS.Mage.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
        return 30 + rollDice('3d4');
      case CLASS.Mage.name:
      case CLASS.Illusionist.name:
        return 40 + rollDice('2d8');
      case CLASS.Druid.name:
        return 45 + rollDice('2d4');
      case CLASS.Thief.name:
        return 28 + rollDice('3d8');
      default:
        return 30 + rollDice('3d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(Pixie);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(Pixie, gender, str);
  }
}
