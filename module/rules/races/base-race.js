import { rollDice } from '../../helper/dice.js';
import { AGE_CATEGORIES } from '../age.js';

export class BaseRace {
  static randomMaxAge(Race) {
    const roll = rollDice('d100');
    const oldNum = Race.ageCategoryMaxes[AGE_CATEGORIES.OLD] - Race.ageCategoryMaxes[AGE_CATEGORIES.MIDDLE_AGED];
    const oldNumThird = Math.floor(oldNum / 3);
    const venerableNum = Race.ageCategoryMaxes[AGE_CATEGORIES.VENERABLE] - Race.ageCategoryMaxes[AGE_CATEGORIES.OLD];
    const venerableNumThird = Math.floor(venerableNum / 3);
    if (roll <= 60) {
      return (
        Race.ageCategoryMaxes[AGE_CATEGORIES.MIDDLE_AGED] +
        Math.min(rollDice(`d${oldNum}`), rollDice(`d${oldNum}`), rollDice(`d${oldNum}`))
      );
    }
    if (roll <= 80) {
      return Race.ageCategoryMaxes[AGE_CATEGORIES.MIDDLE_AGED] + rollDice(`3d${oldNumThird}`);
    }
    if (roll <= 90) {
      return (
        Race.ageCategoryMaxes[AGE_CATEGORIES.MIDDLE_AGED] +
        Math.max(rollDice(`d${oldNum}`), rollDice(`d${oldNum}`), rollDice(`d${oldNum}`))
      );
    }
    if (roll <= 96) {
      return (
        Race.ageCategoryMaxes[AGE_CATEGORIES.OLD] +
        Math.min(rollDice(`d${venerableNum}`), rollDice(`d${venerableNum}`), rollDice(`d${venerableNum}`))
      );
    }
    if (roll <= 99) {
      return Race.ageCategoryMaxes[AGE_CATEGORIES.OLD] + rollDice(`3d${venerableNumThird}`);
    }
    return (
      Race.ageCategoryMaxes[AGE_CATEGORIES.OLD] +
      Math.max(rollDice(`d${venerableNum}`), rollDice(`d${venerableNum}`), rollDice(`d${venerableNum}`))
    );
  }

  static randomHeightWeight(Race, gender, str) {
    const avgHeight = Race.averageHeight[gender];
    let height = avgHeight;

    // adjust height by random variation
    const heightRoll = rollDice('d1000');
    switch (true) {
      case heightRoll <= 5:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight - avgHeight * ((12 + rollDice('d4')) / 100));
        } else {
          height = Math.round(avgHeight - avgHeight * ((9 + rollDice('d3')) / 100));
        }
        break;
      case heightRoll <= 25:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight - avgHeight * ((8 + rollDice('d4')) / 100));
        } else {
          height = Math.round(avgHeight - avgHeight * ((6 + rollDice('d3')) / 100));
        }
        break;
      case heightRoll <= 150:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight - avgHeight * ((4 + rollDice('d4')) / 100));
        } else {
          height = Math.round(avgHeight - avgHeight * ((3 + rollDice('d3')) / 100));
        }
        break;
      case heightRoll <= 350:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight - avgHeight * (rollDice('d4') / 100));
        } else {
          height = Math.round(avgHeight - avgHeight * (rollDice('d3') / 100));
        }
        break;
      case heightRoll <= 650:
        if (Race.name === 'Human') {
          height = avgHeight + (rollDice('d5') - 3);
        } else {
          height = avgHeight + (rollDice('d3') - 2);
        }
        break;
      case heightRoll <= 850:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight + avgHeight * (rollDice('d4') / 100));
        } else {
          height = Math.round(avgHeight + avgHeight * (rollDice('d3') / 100));
        }
        break;
      case heightRoll <= 975:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight + avgHeight * ((4 + rollDice('d4')) / 100));
        } else {
          height = Math.round(avgHeight + avgHeight * ((3 + rollDice('d3')) / 100));
        }
        break;
      case heightRoll <= 995:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight + avgHeight * ((8 + rollDice('d4')) / 100));
        } else {
          height = Math.round(avgHeight + avgHeight * ((6 + rollDice('d3')) / 100));
        }
        break;
      case heightRoll <= 1000:
        if (Race.name === 'Human') {
          height = Math.round(avgHeight + avgHeight * ((12 + rollDice('d4')) / 100));
        } else {
          height = Math.round(avgHeight + avgHeight * ((9 + rollDice('d3')) / 100));
        }
        break;
    }

    // adjust height by strength
    switch (true) {
      case str <= 3:
        height = Math.round(height * 0.91);
        break;
      case str <= 4:
        height = Math.round(height * 0.94);
        break;
      case str <= 5:
        height = Math.round(height * 0.97);
        break;
      case str <= 15:
        height = Math.round(height * 1);
        break;
      case str <= 16:
        height = Math.round(height * 1.03);
        break;
      case str <= 17:
        height = Math.round(height * 1.06);
        break;
      case str <= 18:
        height = Math.round(height * 1.09);
        break;
      default:
        height = Math.round(height * 1.12);
        break;
    }

    const weightByHeight = {
      117: 744,
      116: 727,
      115: 710,
      114: 693,
      113: 676,
      112: 659,
      111: 642,
      110: 625,
      109: 608,
      108: 592,
      107: 575,
      106: 559,
      105: 544,
      104: 528,
      103: 513,
      102: 498,
      101: 484,
      100: 470,
      99: 456,
      98: 442,
      97: 429,
      96: 415,
      95: 403,
      94: 390,
      93: 378,
      92: 366,
      91: 354,
      90: 342,
      89: 331,
      88: 320,
      87: 309,
      86: 299,
      85: 288,
      84: 278,
      83: 268,
      82: 259,
      81: 250,
      80: 240,
      79: 232,
      78: 223,
      77: 214,
      76: 206,
      75: 198,
      74: 190,
      73: 183,
      72: 175,
      71: 168,
      70: 161,
      69: 154,
      68: 148,
      67: 141,
      66: 135,
      65: 129,
      64: 123,
      63: 117,
      62: 112,
      61: 107,
      60: 101,
      59: 96,
      58: 92,
      57: 87,
      56: 82,
      55: 78,
      54: 74,
      53: 70,
      52: 66,
      51: 62,
      50: 59,
      49: 55,
      48: 52,
      47: 49,
      46: 46,
      45: 43,
      44: 40,
      43: 37,
      42: 35,
      41: 33,
      40: 31,
      39: 30,
      38: 29,
      37: 28,
      36: 27,
      35: 26,
      34: 25,
      33: 24,
      32: 23,
      31: 22,
      30: 21,
      29: 20,
      28: 20,
      27: 19,
      26: 18,
      25: 18,
      24: 17,
      23: 16,
      22: 16,
      21: 15,
      20: 14,
      19: 14,
    };

    // determine weight by height and race
    let weight = weightByHeight[height] * Race.weightModifier;

    // adjust weight by random variation
    const weightRoll = rollDice('d1000');
    switch (true) {
      case weightRoll <= 5:
        if (Race.name === 'Human') {
          weight = Math.round(weight - weight * ((24 + rollDice('d8')) / 100));
        } else {
          weight = Math.round(weight - weight * ((18 + rollDice('d6')) / 100));
        }
        break;
      case weightRoll <= 25:
        if (Race.name === 'Human') {
          weight = Math.round(weight - weight * ((16 + rollDice('d8')) / 100));
        } else {
          weight = Math.round(weight - weight * ((12 + rollDice('d6')) / 100));
        }
        break;
      case weightRoll <= 150:
        if (Race.name === 'Human') {
          weight = Math.round(weight - weight * ((8 + rollDice('d8')) / 100));
        } else {
          weight = Math.round(weight - weight * ((6 + rollDice('d6')) / 100));
        }
        break;
      case weightRoll <= 350:
        if (Race.name === 'Human') {
          weight = Math.round(weight - weight * (rollDice('d8') / 100));
        } else {
          weight = Math.round(weight - weight * (rollDice('d6') / 100));
        }
        break;
      case weightRoll <= 650:
        if (Race.name === 'Human') {
          weight = weight + (rollDice('2d6') - 7);
        } else {
          weight = weight + (rollDice('2d4') - 5);
        }
        break;
      case weightRoll <= 850:
        if (Race.name === 'Human') {
          weight = Math.round(weight + weight * (rollDice('d8') / 100));
        } else {
          weight = Math.round(weight + weight * (rollDice('d6') / 100));
        }
        break;
      case weightRoll <= 975:
        if (Race.name === 'Human') {
          weight = Math.round(weight + weight * ((8 + rollDice('d8')) / 100));
        } else {
          weight = Math.round(weight + weight * ((6 + rollDice('d6')) / 100));
        }
        break;
      case weightRoll <= 995:
        if (Race.name === 'Human') {
          weight = Math.round(weight + weight * ((16 + rollDice('d8')) / 100));
        } else {
          weight = Math.round(weight + weight * ((12 + rollDice('d6')) / 100));
        }
        break;
      case weightRoll <= 1000:
        if (Race.name === 'Human') {
          weight = Math.round(weight + weight * ((24 + rollDice('d8')) / 100));
        } else {
          weight = Math.round(weight + weight * ((18 + rollDice('d6')) / 100));
        }
        break;
    }

    // adjust weight by strength
    switch (true) {
      case str <= 3:
        weight = Math.round(weight * 0.8);
        break;
      case str <= 4:
        weight = Math.round(weight * 0.84);
        break;
      case str <= 5:
        weight = Math.round(weight * 0.88);
        break;
      case str <= 6:
        weight = Math.round(weight * 0.92);
        break;
      case str <= 7:
        weight = Math.round(weight * 0.96);
        break;
      case str <= 13:
        weight = Math.round(weight * 1);
        break;
      case str <= 14:
        weight = Math.round(weight * 1.04);
        break;
      case str <= 15:
        weight = Math.round(weight * 1.08);
        break;
      case str <= 16:
        weight = Math.round(weight * 1.12);
        break;
      case str <= 17:
        weight = Math.round(weight * 1.16);
        break;
      case str <= 18:
        weight = Math.round(weight * 1.2);
        break;
      default:
        weight = Math.round(weight * 1.24);
        break;
    }

    return {
      height,
      weight,
    };
  }

  /**
   * Calculate modified ability scores based on the provided array of ability score objects.
   * @static
   * @param {Array<{name: string, value: number}>} abilityScores
   * @returns {Array<{name: string, value: number}>}
   */
  static modifiedAbilityScores(Race, abilityScores) {
    return abilityScores.map((score) => ({
      name: score.name,
      value: score.value + Race.abilityScoreModifiers[score.name],
    }));
  }
}
