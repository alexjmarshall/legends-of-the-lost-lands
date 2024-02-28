import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../../actor-helper.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class HalfOgre extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: 3,
    [ABILITIES.DEX]: 0,
    [ABILITIES.CON]: 0,
    [ABILITIES.INT]: -2,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: -3,
  };

  static description = 'Foul-tempered and individualistic. Relishes mortal combat.';

  static featureDescriptions = [
    '+3 Strength, -2 Intelligence, -3 Charisma.',
    'Can consume raw meat, rotten food or unclean water without risk of disease.',
    "60' infravision.",
    '+4 to intimidation and -2 penalty to reaction rolls.',
    'Size Large.',
  ];

  static features = Object.freeze([features.IRON_STOMACH, features.INFRAVISION, features.FELL_COUNTENANCE]);

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

  static allowedClasses = Object.freeze([
    CLASS.Fighter.name,
    CLASS.Barbarian.name,
    CLASS.Cleric.name,
    CLASS.Thief.name,
  ]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Thief.name],
    [CLASS.Fighter.name, CLASS.Cleric.name],
    [CLASS.Barbarian.name, CLASS.Thief.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
        return 15 + rollDice('d4');
      case CLASS.Cleric.name:
        return 20 + rollDice('d4');
      case CLASS.Thief.name:
        return 18 + rollDice('d4');
      case CLASS.Barbarian.name:
        return 14 + rollDice('d4');
      default:
        return 15 + rollDice('d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(HalfOgre);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(HalfOgre, gender, str);
  }
}
