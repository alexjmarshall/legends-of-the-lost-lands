// rouncy, courser, destrier, palfrey, draughthorse, pony, mule.
// rouncy/courser/destrier are light/medium/heavy warhorses. Will attack and charge in battle. Destrier will pull wagons.
// palfrey is a riding horse, will not battle or pull wagons.
// carthorse is a draft horse, will pull carts/wagons but not battle.
// pony is a light riding horse, suitable for T/S characters. Will not battle or pull wagons.
// mule is a pack animal, will not battle or pull wagons but will enter dungeons/caves.

// each has reqFoodMod, reqWaterMod, reqCloMod, weight
export const PACK_ANIMALS = Object.freeze({
  rouncy: {
    baseMv: 18,
    reqFoodMod: 1,
    reqWaterMod: 1,
    reqCloMod: 1,
    encMod: 1,
    weight: 1000,
  },
  courser: {
    baseMv: 18,
    reqFoodMod: 1,
    reqWaterMod: 1,
    reqCloMod: 1,
    encMod: 1,
    weight: 1250,
  },
  destrier: {
    baseMv: 16,
    reqFoodMod: 1,
    reqWaterMod: 1,
    reqCloMod: 1,
    encMod: 1,
    weight: 1500,
  },
  palfrey: {
    baseMv: 20,
    reqFoodMod: 1.1,
    reqWaterMod: 1.1,
    reqCloMod: 1,
    encMod: 0.9,
    weight: 1000,
  },
  draughthorse: {
    baseMv: 14,
    reqFoodMod: 1,
    reqWaterMod: 1,
    reqCloMod: 0.9,
    encMod: 1,
    weight: 1500,
  },
  pony: {
    baseMv: 16,
    reqFoodMod: 1,
    reqWaterMod: 1,
    reqCloMod: 1,
    encMod: 1,
    weight: 600,
  },
  mule: {
    baseMv: 14,
    reqFoodMod: 0.9,
    reqWaterMod: 0.9,
    reqCloMod: 1.1,
    encMod: 1.3,
    weight: 800,
  },
});
