export const SIZES = {
  TINY: 'T',
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L',
  HUGE: 'H',
  GARGANTUAN: 'G',
  COLOSSAL: 'C',
};

export const sizes = Object.freeze({
  [SIZES.TINY]: {
    hpModifier: -1,
    name: 'Tiny',
  },
  [SIZES.SMALL]: {
    hpModifier: 0,
    name: 'Small',
  },
  [SIZES.MEDIUM]: {
    hpModifier: 0,
    name: 'Medium',
  },
  [SIZES.LARGE]: {
    hpModifier: 1,
    name: 'Large',
  },
  [SIZES.HUGE]: {
    hpModifier: 2,
    name: 'Huge',
  },
  [SIZES.GARGANTUAN]: {
    hpModifier: 3,
    name: 'Gargantuan',
  },
});

export const SIZE_VALUES = {
  [SIZES.TINY]: 1, // tiny
  [SIZES.SMALL]: 2, // small
  [SIZES.MEDIUM]: 3, // medium
  [SIZES.LARGE]: 4, // large
  [SIZES.HUGE]: 5, // huge
  [SIZES.GARGANTUAN]: 6, // gargantuan
  [SIZES.COLOSSAL]: 7, // colossal
  default: 2,
};

export const defaultWeight = Object.freeze({
  [SIZES.TINY]: 30,
  [SIZES.SMALL]: 50,
  [SIZES.MEDIUM]: 150,
  [SIZES.LARGE]: 300,
  [SIZES.HUGE]: 600,
  [SIZES.GARGANTUAN]: 1200,
  [SIZES.COLOSSAL]: 2400,
});

/**
 * Adjusts a value based on the provided character size.
 * @param {number} val - The value to adjust.
 * @param {number} charSize - The character size value.
 * @returns {number} - The adjusted value.
 */
export function sizeMulti(val, charSize) {
  if (charSize > SIZE_VALUES.MEDIUM) {
    // If charSize is greater than M, increase the value by half.
    return (val * 3) / 2;
  }
  if (charSize === SIZE_VALUES.SMALL) {
    // If charSize is S, decrease the value by half.
    return val / 2;
  }
  if (charSize < SIZE_VALUES.SMALL) {
    // If charSize is less than S, decrease the value by 2/3.
    return val / 3;
  }
  // For other cases, return the original size.
  return val;
}

/**
 * Adjusts a limit for encumbrance based on the provided character size.
 * @param {number} val - The limit to adjust.
 * @param {number} charSize - The character size value.
 * @returns {number} - The adjusted value.
 */
export function sizeEncMulti(val, charSize) {
  if (charSize > SIZE_VALUES.MEDIUM) {
    // If charSize is greater than M, decrease the value by a third.
    return (val * 2) / 3;
  }
  if (charSize === SIZE_VALUES.SMALL) {
    // If charSize is S, increase the value by half.
    return (val * 3) / 2;
  }
  if (charSize < SIZE_VALUES.SMALL) {
    // If charSize is less than S, double the value.
    return val * 2;
  }
  // For other cases, return the original size.
  return val;
}
