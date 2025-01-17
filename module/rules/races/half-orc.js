import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../size.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class HalfOrc extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: 1,
    [ABILITIES.DEX]: 0,
    [ABILITIES.CON]: 0,
    [ABILITIES.INT]: -1,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: 0,
  };

  static description = 'Some resist and some embrace their bestial nature.';

  static features = Object.freeze([
    features.BRUTAL,
    features.INFRAVISION,
    features.KILLER_INSTINCT,
    features.BEASTMARKED,
  ]);

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 15,
    [AGE_CATEGORIES.MATURE]: 30,
    [AGE_CATEGORIES.MIDDLE_AGED]: 45,
    [AGE_CATEGORIES.OLD]: 60,
    [AGE_CATEGORIES.VENERABLE]: 80,
  });

  static averageHeight = {
    M: 66,
    F: 61,
  };

  static weightModifier = 1.18;

  static size = () => SIZES.MEDIUM;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(HalfOrc, abilityScores);
  }

  static allowedClasses = Object.freeze([
    CLASS.Fighter.name,
    CLASS.Berserker.name,
    CLASS.Runepriest.name,
    CLASS.Thief.name,
    CLASS.Assassin.name,
    CLASS.Barbarian.name,
    CLASS.Paladin.name,
    CLASS.Cleric.name,
  ]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Thief.name],
    [CLASS.Fighter.name, CLASS.Cleric.name],
    [CLASS.Cleric.name, CLASS.Assassin.name],
    [CLASS.Barbarian.name, CLASS.Thief.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
      case CLASS.Berserker.name:
      case CLASS.Runepriest.name:
        return 15 + rollDice('d4');
      case CLASS.Thief.name:
      case CLASS.Paladin.name:
        return 17 + rollDice('d4');
      case CLASS.Assassin.name:
        return 18 + rollDice('d4');
      case CLASS.Barbarian.name:
        return 14 + rollDice('d4');
      case CLASS.Cleric.name:
        return 20 + rollDice('d4');
      default:
        return 15 + rollDice('d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(HalfOrc);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(HalfOrc, gender, str);
  }
}
