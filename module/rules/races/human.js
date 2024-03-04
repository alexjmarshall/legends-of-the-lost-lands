import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../size.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../dice.js';
import { BaseRace } from './base-race.js';

export class Human extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: 1,
    [ABILITIES.DEX]: 0,
    [ABILITIES.CON]: 0,
    [ABILITIES.INT]: 0,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: 1,
  };

  static description = 'Ardent for power and dominion. The heralds of a new age.';

  static featureDescriptions = ['+1 Strength, +1 Charisma.', 'Prime requisite XP bonus.', 'Size Medium.'];

  static features = Object.freeze([features.QUICK_TO_MASTER]);

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 20,
    [AGE_CATEGORIES.MATURE]: 40,
    [AGE_CATEGORIES.MIDDLE_AGED]: 60,
    [AGE_CATEGORIES.OLD]: 90,
    [AGE_CATEGORIES.VENERABLE]: 120,
  });

  static averageHeight = {
    M: 69,
    F: 64,
  };

  static weightModifier = 1;

  static size = () => SIZES.MEDIUM;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(Human, abilityScores);
  }

  static allowedClasses = [
    CLASS.Cleric.name,
    CLASS.Druid.name,
    CLASS.CloisteredCleric.name,
    CLASS.Fighter.name,
    CLASS.Berserker.name,
    CLASS.Paladin.name,
    CLASS.Inquisitor.name,
    CLASS.Runepriest.name,
    CLASS.Ranger.name,
    CLASS.VampireHunter.name,
    CLASS.Thief.name,
    CLASS.Assassin.name,
    CLASS.Swashbuckler.name,
    CLASS.Barbarian.name,
    CLASS.Mage.name,
    CLASS.Incantatrix.name,
    CLASS.Abjurer.name,
    CLASS.Conjurer.name,
    CLASS.Diviner.name,
    CLASS.Enchanter.name,
    CLASS.Evoker.name,
    CLASS.Illusionist.name,
    CLASS.Necromancer.name,
    CLASS.Transmuter.name,
  ];

  static allowedMultiClasses = [];

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Cleric.name:
      case CLASS.Druid.name:
      case CLASS.CloisteredCleric.name:
        return 18 + rollDice('d4');
      case CLASS.Fighter.name:
      case CLASS.Berserker.name:
        return 15 + rollDice('d4');
      case CLASS.Paladin.name:
      case CLASS.Inquisitor.name:
      case CLASS.Runepriest.name:
        return 17 + rollDice('d4');
      case CLASS.Ranger.name:
      case CLASS.VampireHunter.name:
        return 20 + rollDice('d4');
      case CLASS.Thief.name:
      case CLASS.Swashbuckler.name:
        return 18 + rollDice('d4');
      case CLASS.Assassin.name:
        return 20 + rollDice('d4');
      case CLASS.Barbarian.name:
        return 14 + rollDice('d4');
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
        return 20 + rollDice('2d6');
      default:
        return 16 + rollDice('d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(Human);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(Human, gender, str);
  }
}
