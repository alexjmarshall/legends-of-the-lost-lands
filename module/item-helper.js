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

export const NON_PHYSICAL_ITEM_TYPES = Object.freeze([
  ITEM_TYPES.DISEASE,
  ITEM_TYPES.FEATURE,
  ITEM_TYPES.GRAPPLING_MANEUVER,
  ITEM_TYPES.HIT_LOCATION,
  ITEM_TYPES.INJURY,
  ITEM_TYPES.NATURAL_MISSILE_WEAPON,
  ITEM_TYPES.NATURAL_WEAPON,
  ITEM_TYPES.RECIPE,
  ITEM_TYPES.RUNE,
  ITEM_TYPES.SPELL,
]);

export function sortEquipmentByType(items) {
  const equipment = {};
  const isMagic = (i) => i.data?.data?.attributes?.admin?.magic?.value;
  const isConsumable = (i) => i.data?.data?.attributes?.admin?.consumable?.value;
  const isWeapon = (i) =>
    [ITEM_TYPES.MELEE_WEAPON, ITEM_TYPES.MISSILE_WEAPON, ITEM_TYPES.BOW, ITEM_TYPES.MISSILE].includes(i.type);
  const isArmor = (i) => [ITEM_TYPES.ARMOR, ITEM_TYPES.SHIELD, ITEM_TYPES.HELM].includes(i.type);
  const isClothing = (i) => i.type === ITEM_TYPES.CLOTHING;
  const isGemOrJewelry = (i) => [ITEM_TYPES.GEM, ITEM_TYPES.JEWELRY].includes(i.type);
  const isCurrency = (i) => i.type === ITEM_TYPES.CURRENCY;
  const isMiscItem = (i) => !isWeapon(i) && !isArmor(i) && !isClothing(i) && !isGemOrJewelry(i) && !isCurrency(i);

  const types = [
    {
      title: 'Weapons',
      condition: isWeapon,
    },
    {
      title: 'Armor',
      condition: isArmor,
    },
    {
      title: 'Clothing',
      condition: isClothing,
    },
    {
      title: 'Gems & Jewelry',
      condition: isGemOrJewelry,
    },
    {
      title: 'Currency',
      condition: isCurrency,
    },
    {
      title: 'Potions',
      condition: (i) => isMagic(i) && isConsumable(i) && isMiscItem(i),
    },
    {
      title: 'Misc. Magic',
      condition: (i) => isMagic(i) && !isConsumable(i) && isMiscItem(i),
    },
    {
      title: 'Other Items',
      condition: (i) => !isMagic(i) && isMiscItem(i),
    },
  ];

  types.forEach((t) => {
    const equipItems = items.filter(t.condition).map((i) => ({
      item: i,
      holdable: i.data.attributes.admin?.holdable?.value,
      wearable: i.data.attributes.admin?.wearable?.value,
    }));

    if (!equipItems.length) return;

    equipment[t.title] = equipItems;
  });

  return equipment;
}
