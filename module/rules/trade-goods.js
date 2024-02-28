import { deepFreeze } from '../helper.js';

// TODO item save types and save targets by attack form
// item saving throw macro that opens screen with modifier like char saving throws
// checkboxes for each of the character's items (macro allows only one char selected)
// also checkbox to select/deselect all items

export const TRADE_GOODS = Object.freeze({
  SPICES: 'spices',
  CLOTH: 'cloth',
  FURS: 'furs',
  METALS: 'metals',
  GRAIN: 'grain',
  DYE: 'dye',
  TIMBER: 'timber',
  POTTERY: 'pottery',
  SALT_MEAT: 'salt meat',
});

// TODO system for calculating value by type and subtype and weight
// similar logic to gems

export const TRADE_GOOD_MATERIALS = deepFreeze({
  [TRADE_GOODS.SPICES]: {
    cinnamon: { value: 1 },
    clove: { value: 2 },
    ginger: { value: 3 },
    pepper: { value: 4 },
    saffron: { value: 5 },
  },
  [TRADE_GOODS.CLOTH]: {
    cotton: { value: 1 },
    flax: { value: 2 },
    hemp: { value: 3 },
    silk: { value: 4 },
    wool: { value: 5 },
  },
  [TRADE_GOODS.FURS]: {
    leather: { value: 1 },
    fur: { value: 2 },
    hide: { value: 3 },
    skin: { value: 4 },
  },
  [TRADE_GOODS.METALS]: {
    copper: { value: 1 },
    iron: { value: 2 },
    silver: { value: 3 },
    gold: { value: 4 },
    platinum: { value: 5 },
  },
  [TRADE_GOODS.GRAIN]: {
    barley: { value: 1 },
    corn: { value: 2 },
    oats: { value: 3 },
    rice: { value: 4 },
    rye: { value: 5 },
    wheat: { value: 6 },
  },
  [TRADE_GOODS.DYE]: {
    indigo: { value: 1 },
    madder: { value: 2 },
    safflower: { value: 3 },
    turmeric: { value: 4 },
    weld: { value: 5 },
  },
  [TRADE_GOODS.TIMBER]: {
    ash: { value: 1 },
    birch: { value: 2 },
    cedar: { value: 3 },
    elm: { value: 4 },
    oak: { value: 5 },
    pine: { value: 6 },
    walnut: { value: 7 },
    willow: { value: 8 },
  },
  [TRADE_GOODS.POTTERY]: {
    brick: { value: 1 },
    pottery: { value: 2 },
    tile: { value: 3 },
  },
  [TRADE_GOODS.SALT_MEAT]: {
    beef: { value: 1 },
    fish: { value: 2 },
    pork: { value: 3 },
    salt: { value: 4 },
  },
});
