import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../../actor-helper.js';
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

  static featureDescriptions = [
    '+3 Dexterity, -2 Wisdom, -3 Strength.',
    'Thrice per day, can blow magic dust upon a creature to make them either: invisible for 1 turn, fly for 1d4 rounds, or fall asleep.',
    'Chooses which creatures may see them.',
    'Can fly at will at their normal movement rate.',
    'Size Tiny.',
  ];

  static features = Object.freeze([
    { ...features.PIXIE_DUST, usesPerDay: 3 },
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
    M: 32,
    F: 30,
  };

  static weightModifier = 1.2;

  static size = () => SIZES.TINY;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(Pixie, abilityScores);
  }

  static allowedClasses = Object.freeze([
    CLASS.Fighter.name,
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
  ]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Thief.name],
    [CLASS.Fighter.name, CLASS.Mage.name],
    [CLASS.Mage.name, CLASS.Thief.name],
    [CLASS.Mage.name, CLASS.Swashbuckler.name],
    [CLASS.Druid.name, CLASS.Mage.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
        return 30 + rollDice('3d4');
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
        return 40 + rollDice('2d8');
      case CLASS.Druid.name:
        return 45 + rollDice('2d4');
      case CLASS.Thief.name:
      case CLASS.Swashbuckler.name:
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
