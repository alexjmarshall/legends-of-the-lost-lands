import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../size.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class HalfOgre extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: 3,
    [ABILITIES.DEX]: -2,
    [ABILITIES.CON]: 0,
    [ABILITIES.INT]: 0,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: -3,
  };

  static description = 'Foul-tempered and individualistic. Relishes mortal combat.';

  static features = Object.freeze([
    features.MONSTROUS,
    features.INFRAVISION,
    features.IRON_STOMACH,
    features.FELL_COUNTENANCE,
  ]);

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 18,
    [AGE_CATEGORIES.MATURE]: 40,
    [AGE_CATEGORIES.MIDDLE_AGED]: 80,
    [AGE_CATEGORIES.OLD]: 110,
    [AGE_CATEGORIES.VENERABLE]: 140,
  });

  static averageHeight = {
    M: 88,
    F: 80,
  };

  static weightModifier = 1.07;

  static size = () => SIZES.LARGE;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(HalfOgre, abilityScores);
  }

  static allowedClasses = Object.freeze([CLASS.Fighter.name, CLASS.Barbarian.name, CLASS.Thief.name]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Thief.name],
    [CLASS.Barbarian.name, CLASS.Thief.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
        return 16 + rollDice('d4');
      case CLASS.Thief.name:
        return 18 + rollDice('d4');
      case CLASS.Barbarian.name:
        return 15 + rollDice('d4');
      default:
        return 16 + rollDice('d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(HalfOgre);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(HalfOgre, gender, str);
  }
}
