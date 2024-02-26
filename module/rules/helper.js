/**
 * Builds and returns a set of statistics based on the provided builders, level, progressions, and modifier.
 * @param {Object.<string, Function>} builders - An object mapping progression names to builder functions.
 * @param {number} lvl - The character's level to calculate the statistics for.
 * @param {Object.<string, Array<string>>} progressions - An object mapping progression names to an array of statistic names.
 * @param {number} [mod=0] - An optional modifier to be applied to the statistics.
 * @returns {Object.<string, Object>} An object representing the calculated statistics with progression information.
 */
export function buildStats(builders, lvl, progressions, mod = 0) {
  if (!progressions) return {};

  const statMapper =
    (builder, progression, mod = 0) =>
    (stat) =>
      [stat, { ...builder(lvl, mod), progression }];

  const statProgressionMapper =
    (builders, mod) =>
    ([progression, stats]) =>
      stats.map(statMapper(builders[progression], progression, mod));

  return Object.fromEntries(Object.entries(progressions).flatMap(statProgressionMapper(builders, mod)));
}

/**
 * Recursively freezes all properties of an object, making it immutable.
 * This function deeply freezes an object by freezing all of its properties,
 * including nested objects and functions.
 *
 * @param {Object} object - The object to deep freeze.
 * @returns {Object} - The deeply frozen object.
 *
 * @example
 * const myObject = { a: 1, b: { c: 2 } };
 * const frozenObject = deepFreeze(myObject);
 *
 * // Attempting to modify a property on the frozenObject will throw an error:
 * // frozenObject.a = 3; // Throws an error
 * // frozenObject.b.c = 4; // Throws an error
 */
export function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === 'object') || typeof value === 'function') {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}

// remove duplicates from an array
export function removeDuplicates(array) {
  return [...new Set(array)];
}

export const progressions = Object.freeze({
  fast: (lvl) => ({
    min: Math.max(lvl - 3, Math.floor((lvl + 1) / 2), 2),
    target: lvl + 1,
  }),
  medium: (lvl) => ({
    min: Math.max(lvl - 6, Math.round(lvl / 3), 1),
    target: Math.max(lvl - 3, Math.round((lvl * 2) / 3), 1),
  }),
  slow: (lvl) => ({
    min: Math.max(lvl - 8, Math.floor(lvl / 4)),
    target: Math.max(lvl - 5, Math.floor(lvl / 2)),
  }),
});
