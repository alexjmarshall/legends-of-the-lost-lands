import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../size.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class Halfling extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: -2,
    [ABILITIES.DEX]: 2,
    [ABILITIES.CON]: 0,
    [ABILITIES.INT]: 0,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: 0,
  };

  static description = 'Often underestimated and capable of great bravery.';

  static features = Object.freeze([
    features.LITTLE_FINGERS,
    features.UNCANNY_SHOT,
    features.DIMINUTIVE,
    features.STOUTHEARTED,
  ]);

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 33,
    [AGE_CATEGORIES.MATURE]: 68,
    [AGE_CATEGORIES.MIDDLE_AGED]: 101,
    [AGE_CATEGORIES.OLD]: 144,
    [AGE_CATEGORIES.VENERABLE]: 199,
  });

  static averageHeight = {
    M: 38,
    F: 35,
  };

  static weightModifier = 1.7;

  static size = () => SIZES.SMALL;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(Halfling, abilityScores);
  }

  static allowedClasses = Object.freeze([CLASS.Fighter.name, CLASS.Thief.name]);

  static allowedMultiClasses = Object.freeze([[CLASS.Fighter.name, CLASS.Thief.name]]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
        return 20 + rollDice('3d4');
      case CLASS.Thief.name:
        return 30 + rollDice('3d4');
      default:
        return 20 + rollDice('3d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(Halfling);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(Halfling, gender, str);
  }
}
