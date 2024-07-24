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

export const equipmentTypes = () => {
  const isMagic = (i) => i.data?.data?.attributes?.admin?.magic?.value;
  const isConsumable = (i) => i.data?.data?.attributes?.admin?.consumable?.value;
  const isWeapon = (i) =>
    [ITEM_TYPES.MELEE_WEAPON, ITEM_TYPES.MISSILE_WEAPON, ITEM_TYPES.BOW, ITEM_TYPES.MISSILE].includes(i.type);
  const isArmor = (i) => [ITEM_TYPES.ARMOR, ITEM_TYPES.SHIELD, ITEM_TYPES.HELM].includes(i.type);
  const isClothing = (i) => i.type === ITEM_TYPES.CLOTHING;
  const isGemOrJewelry = (i) => [ITEM_TYPES.GEM, ITEM_TYPES.JEWELRY].includes(i.type);
  const isCurrency = (i) => i.type === ITEM_TYPES.CURRENCY;
  const isMiscItem = (i) =>
    !NON_PHYSICAL_ITEM_TYPES.includes(i.type) &&
    !isWeapon(i) &&
    !isArmor(i) &&
    !isClothing(i) &&
    !isGemOrJewelry(i) &&
    !isCurrency(i);

  return [
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
};

export function sortEquipmentByType(items) {
  const equipment = {};

  const types = equipmentTypes();
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

export function isSameEquipmentType(item1, item2) {
  const types = equipmentTypes();
  for (const type of types) {
    if (type.condition(item1) && type.condition(item2)) return true;
  }
  return false;
}

export const ITEM_TYPE_ICONS = Object.freeze({
  [ITEM_TYPES.ITEM]: 'icons/svg/item-bag.svg',
  [ITEM_TYPES.ARMOR]: 'systems/brigandine/assets/icons/armor-vest.svg',
  [ITEM_TYPES.BOW]: 'systems/brigandine/assets/icons/bow-and-arrow.svg',
  [ITEM_TYPES.CLOTHING]: 'systems/brigandine/assets/icons/shirt.svg',
  [ITEM_TYPES.CURRENCY]: 'icons/svg/coins.svg',
  [ITEM_TYPES.DISEASE]: 'systems/brigandine/assets/icons/disease.svg',
  [ITEM_TYPES.FEATURE]: 'systems/brigandine/assets/icons/starburst.svg',
  [ITEM_TYPES.FOOD]: 'systems/brigandine/assets/icons/food-restaurant.svg',
  [ITEM_TYPES.GEM]: 'systems/brigandine/assets/icons/gem.svg',
  [ITEM_TYPES.GRAPPLING_MANEUVER]: 'systems/brigandine/assets/icons/grab.svg',
  [ITEM_TYPES.HELM]: 'systems/brigandine/assets/icons/helm.svg',
  [ITEM_TYPES.HIT_LOCATION]: 'systems/brigandine/assets/icons/target.svg',
  [ITEM_TYPES.INGREDIENT]: 'systems/brigandine/assets/icons/flask.svg',
  [ITEM_TYPES.INJURY]: 'systems/brigandine/assets/icons/injured.svg',
  [ITEM_TYPES.JEWELRY]: 'systems/brigandine/assets/icons/jewelry.svg',
  [ITEM_TYPES.MELEE_WEAPON]: 'systems/brigandine/assets/icons/axe.svg',
  [ITEM_TYPES.MISSILE]: 'systems/brigandine/assets/icons/quiver.svg',
  [ITEM_TYPES.MISSILE_WEAPON]: 'systems/brigandine/assets/icons/crossbow.svg',
  [ITEM_TYPES.NATURAL_MISSILE_WEAPON]: 'systems/brigandine/assets/icons/rock.svg',
  [ITEM_TYPES.NATURAL_WEAPON]: 'systems/brigandine/assets/icons/claw.svg',
  [ITEM_TYPES.RECIPE]: 'systems/brigandine/assets/icons/recipe-book.svg',
  [ITEM_TYPES.RUNE]: 'systems/brigandine/assets/icons/rune.svg',
  [ITEM_TYPES.SCROLL]: 'systems/brigandine/assets/icons/scroll.svg',
  [ITEM_TYPES.SHIELD]: 'systems/brigandine/assets/icons/shield.svg',
  [ITEM_TYPES.SPELL]: 'systems/brigandine/assets/icons/hex.svg',
  [ITEM_TYPES.STORAGE]: 'icons/svg/barrel.svg',
  [ITEM_TYPES.TRADE_GOOD]: 'systems/brigandine/assets/icons/mine-wagon.svg',
});

export const getItemIconByType = (type) => ITEM_TYPE_ICONS[type] || ITEM_TYPE_ICONS[ITEM_TYPES.ITEM];
