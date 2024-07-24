export const ABILITIES = {
  STR: 'str',
  INT: 'int',
  WIS: 'wis',
  DEX: 'dex',
  CON: 'con',
  CHA: 'cha',
};

export const FULL_ABILITIES = Object.freeze({
  [ABILITIES.STR]: 'Strength',
  [ABILITIES.INT]: 'Intelligence',
  [ABILITIES.WIS]: 'Wisdom',
  [ABILITIES.DEX]: 'Dexterity',
  [ABILITIES.CON]: 'Constitution',
  [ABILITIES.CHA]: 'Charisma',
});

export const ABILITIES_LIST = Object.freeze(Object.values(ABILITIES));

export const getScoreMod = (score) => {
  if (score > 17) return 3;
  if (score > 15) return 2;
  if (score > 12) return 1;
  if (score > 9) return 0;
  if (score > 6) return -1;
  if (score > 3) return -2;
  return -3;
};

export const getFullScoreMod = (score) => {
  let mod = score - 10;
  if (mod < 1) mod--;
  return mod;
};

export const getNumExtraLanguages = (int) => {
  return Math.max(0, getScoreMod(int));
};

// TODO other ability related rules, literacy, max retainers, bonus spells, etc.
