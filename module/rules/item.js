export const RARITY = Object.freeze({
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  VERY_RARE: 'very rare',
  LEGENDARY: 'legendary',
  ARTIFACT: 'artifact',
});

export const MAGIC_ITEM_SLOTS = Object.freeze({
  HELM: 'helm',
  CLOAK: 'cloak',
  BELT: 'belt',
  BRACERS: 'bracers',
  RINGS: 'rings',
  BOOTS: 'boots',
});

export const MAGIC_ITEM_SLOT_MAX = Object.freeze({
  [MAGIC_ITEM_SLOTS.HELM]: 1,
  [MAGIC_ITEM_SLOTS.CLOAK]: 1,
  [MAGIC_ITEM_SLOTS.BELT]: 1,
  [MAGIC_ITEM_SLOTS.BRACERS]: 1,
  [MAGIC_ITEM_SLOTS.RINGS]: 2,
  [MAGIC_ITEM_SLOTS.BOOTS]: 1,
});
