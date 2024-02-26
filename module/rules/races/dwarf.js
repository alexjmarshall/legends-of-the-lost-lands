import { ABILITIES } from '../abilities.js';
import { features } from '../features.js';
import { SIZES } from '../../helper/actor.js';
import { AGE_CATEGORIES } from '../age.js';
import * as CLASS from '../classes/index.js';
import { rollDice } from '../../helper/dice.js';
import { BaseRace } from './base-race.js';

// CONTINUE
// TODO implement racial/age category ability score adjustments in level up/time advacement
// so can abide by racial score maximums, don't use active effects
// when alt/ahift/ctrl clicking rolled damage in chat, option there to choose damage type
export class Dwarf extends BaseRace {
  static abilityScoreModifiers = {
    [ABILITIES.STR]: 0,
    [ABILITIES.DEX]: 0,
    [ABILITIES.CON]: 2,
    [ABILITIES.INT]: 0,
    [ABILITIES.WIS]: 0,
    [ABILITIES.CHA]: -2,
  };

  static features = Object.freeze([
    features.HARDY,
    features.DUNGEON_NAVIGATOR,
    features.INFRAVISION,
    features.SMALL_ARMS,
  ]);

  static description = 'Dour and clannish but deeply loyal.';

  static featureDescriptions = [
    '+2 Constitution, -2 Charisma.',
    '+4 to saving throws vs. poison and petrification.',
    "Infravision 60'.",
    'Senses depth underground and passively searches for pits traps, falling blocks and shifting walls.',
    'Cannot wield greatswords or longbows.',
    'Maximum 9 movement rate.',
    'Size Medium.',
  ];

  static ageCategoryMaxes = Object.freeze({
    [AGE_CATEGORIES.YOUNG_ADULT]: 50,
    [AGE_CATEGORIES.MATURE]: 150,
    [AGE_CATEGORIES.MIDDLE_AGED]: 250,
    [AGE_CATEGORIES.OLD]: 350,
    [AGE_CATEGORIES.VENERABLE]: 450,
  });

  static averageHeight = {
    M: 52,
    F: 50,
  };

  static weightModifier = 2.2;

  static size = () => SIZES.MEDIUM;

  static modifiedAbilityScores(abilityScores) {
    return BaseRace.modifiedAbilityScores(Dwarf, abilityScores);
  }

  static allowedClasses = Object.freeze([
    CLASS.Fighter.name,
    CLASS.Berserker.name,
    CLASS.Runecaster.name,
    CLASS.Cleric.name,
    CLASS.Thief.name,
    CLASS.Assassin.name,
  ]);

  static allowedMultiClasses = Object.freeze([
    [CLASS.Fighter.name, CLASS.Cleric.name],
    [CLASS.Fighter.name, CLASS.Thief.name],
    [CLASS.Cleric.name, CLASS.Thief.name],
  ]);

  static randomStartingAge(Class) {
    switch (Class) {
      case CLASS.Fighter.name:
      case CLASS.Berserker.name:
        return 40 + rollDice('5d4');
      case CLASS.Cleric.name:
      case CLASS.Runecaster.name:
        return 100 + rollDice('2d10');
      case CLASS.Thief.name:
      case CLASS.Assassin.name:
        return 75 + rollDice('3d6');
      default:
        return 40 + rollDice('5d4');
    }
  }

  static randomMaxAge() {
    return BaseRace.randomMaxAge(Dwarf);
  }

  static randomHeightWeight(gender, str) {
    return BaseRace.randomHeightWeight(Dwarf, gender, str);
  }
}
