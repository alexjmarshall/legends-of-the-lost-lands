import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../../helper/actor.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../helper/dice.js';
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

  static featureDescriptions = [
    '+1 Charisma, -1 Constitution.',
    '+4 to saving throws vs. magical sleep and charm.',
    '+2 to searching.',
    'Size Medium.',
  ];

  static features = Object.freeze([features.SUPPLE_MIND, features.SHARP_SIGHT]);

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
    CLASS.Abjurer.name,
    CLASS.Conjurer.name,
    CLASS.Diviner.name,
    CLASS.Enchanter.name,
    CLASS.Evoker.name,
    CLASS.Illusionist.name,
    CLASS.Necromancer.name,
    CLASS.Transmuter.name,
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
      case CLASS.Abjurer.name:
      case CLASS.Conjurer.name:
      case CLASS.Diviner.name:
      case CLASS.Enchanter.name:
      case CLASS.Evoker.name:
      case CLASS.Illusionist.name:
      case CLASS.Necromancer.name:
      case CLASS.Transmuter.name:
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
