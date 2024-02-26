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
  if (!score) return 0;
  if (score <= 2) return score - 3 + -3;
  if (score <= 3) return -3;
  if (score <= 5) return -2;
  if (score <= 8) return -1;
  if (score <= 11) return 0;
  if (score <= 14) return 1;
  if (score <= 17) return 2;
  if (score <= 18) return 3;
  return score - 18 + 3;
};

// TODO other ability related rules, literacy, max retainers, bonus spells, etc.
