import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../size.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class HalfElf extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: 0,
    [ABILITIES.DEX]: 0,
    [ABILITIES.CON]: -1,
    [ABILITIES.INT]: 0,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: 1,
  };

  static description = 'A restive wanderlust makes them natural explorers.';

  static features = Object.freeze([features.COMELY, features.SUPPLE_MIND, features.SHARP_SIGHT]);

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 40,
    [AGE_CATEGORIES.MATURE]: 100,
    [AGE_CATEGORIES.MIDDLE_AGED]: 175,
    [AGE_CATEGORIES.OLD]: 250,
    [AGE_CATEGORIES.VENERABLE]: 325,
  });

  static averageHeight = {
    M: 70,
    F: 65,
  };

  static weightModifier = 0.94;

  static size = () => SIZES.MEDIUM;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(HalfElf, abilityScores);
  }

  static allowedClasses = Object.freeze([
    CLASS.Fighter.name,
    CLASS.Ranger.name,
    CLASS.VampireHunter.name,
    CLASS.Cleric.name,
    CLASS.Mage.name,
    CLASS.Druid.name,
    CLASS.Thief.name,
    CLASS.Swashbuckler.name,
    CLASS.Assassin.name,
  ]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Thief.name],
    [CLASS.Fighter.name, CLASS.Mage.name],
    [CLASS.Mage.name, CLASS.Thief.name],
    [CLASS.Cleric.name, CLASS.Mage.name],
    [CLASS.Cleric.name, CLASS.Thief.name],
    [CLASS.Cleric.name, CLASS.Ranger.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
        return 22 + rollDice('3d4');
      case CLASS.Cleric.name:
      case CLASS.Ranger.name:
      case CLASS.VampireHunter.name:
      case CLASS.Druid.name:
        return 30 + rollDice('2d4');
      case CLASS.Thief.name:
      case CLASS.Swashbuckler.name:
      case CLASS.Assassin.name:
        return 22 + rollDice('3d8');
      case CLASS.Mage.name:
      case CLASS.Incantatrix.name:
        return 30 + rollDice('2d8');
      default:
        return 22 + rollDice('3d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(HalfElf);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(HalfElf, gender, str);
  }
}
