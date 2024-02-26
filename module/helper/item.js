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
