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

export const abilities = Object.freeze(Object.values(ABILITIES));

export const getScoreMod = (score) => {
  return Math.round((score - 10) / 3);
};

export const getFullScoreMod = (score) => {
  return score - 10;
};

export const getNumExtraLanguages = (int) => {
  return Math.max(0, getScoreMod(int));
};

// TODO other ability related rules, literacy, max retainers, bonus spells, etc.
