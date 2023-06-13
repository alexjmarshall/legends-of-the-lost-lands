export function buildEnum(obj) {
  return Object.freeze(
    Object.fromEntries(Object.keys(obj).map((key) => [[key.replace(/\s|-/g, '_').toUpperCase()], key]))
  );
}

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
