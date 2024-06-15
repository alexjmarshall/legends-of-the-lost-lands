export const NON_PHYSICAL_ITEM_TYPES = Object.freeze([
  'spell',
  'feature',
  'skill',
  'natural_weapon',
  'natural_missile_weapon',
  'hit_location',
]);

export function cloneItem(item) {
  const itemData = {
    data: foundry.utils.deepClone(item.data.data),
    img: item.data.img,
    name: item.data.name,
    type: item.data.type,
    effects: [...item.data.effects._source],
    flags: foundry.utils.deepClone(item.data.flags),
  };
  return itemData;
}

export const ITEM_TYPES = Object.freeze({
  ITEM: 'item',
  ARMOR: 'armor',
  BOW: 'bow',
  CLOTHING: 'clothing',
  CONTAINER: 'container',
  CURRENCY: 'currency',
  DISEASE: 'disease',
  FEATURE: 'feature',
  FOOD: 'food',
  GEM: 'gem',
  GRAPPLING_MANEUVER: 'grappling_maneuver',
  HELM: 'helm',
  HIT_LOCATION: 'hit_location',
  INGREDIENT: 'ingredient',
  INJURY: 'injury',
  JEWELRY: 'jewelry',
  MELEE_WEAPON: 'melee_weapon',
  MISSILE: 'missile',
  MISSILE_WEAPON: 'missile_weapon',
  NATURAL_MISSILE_WEAPON: 'natural_missile_weapon',
  NATURAL_WEAPON: 'natural_weapon',
  RECIPE: 'recipe',
  RUNE: 'rune',
  SCROLL: 'scroll',
  SHIELD: 'shield',
  SPELL: 'spell',
  STORAGE: 'storage',
  TRADE_GOOD: 'trade_good',
});
