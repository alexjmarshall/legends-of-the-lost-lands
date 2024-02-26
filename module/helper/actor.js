export const SIZES = {
  TINY: 'T',
  SMALL: 'S',
  MEDIUM: 'M',
  LARGE: 'L',
  HUGE: 'H',
  GARGANTUAN: 'G',
  COLOSSAL: 'C',
};

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

/**
 * Adjusts the size of a value based on the provided character size.
 * @param {number} val - The value to adjust.
 * @param {number} charSize - The character size factor.
 * @returns {number} - The adjusted size.
 */
export function sizeMulti(val, charSize) {
  if (charSize > 2) {
    // If charSize is greater than 2, increase the size by 50%.
    return (val * 3) / 2;
  } else if (charSize === 1) {
    // If charSize is 1, decrease the size by 1/3.
    return (val * 2) / 3;
  } else if (charSize < 1) {
    // If charSize is less than 1, decrease the size by 50%.
    return val / 2;
  } else {
    // For other cases, return the original size.
    return val;
  }
}

export function getTokenFromActor(actor) {
  const token = actor?.isToken
    ? actor.token.data
    : canvas.tokens?.objects?.children.find((t) => t.actor?._id === actor?._id && t.name == actor?.name);
  return token;
}
