export const CURRENCY_MATERIAL_VALUE_PER_POUND = {
  copper: 20,
  brass: 40, // weight 0.1 (10 per pound) for Brass Piece worth 4
  silver: 960, // weight 0.5 for Silver Mark ingot worth 480
  electrum: 8400, // weight 0.0154 (65 per pound) for Electrum Piece worth 96
  gold: 12000, // weight 0.5 for Gold Mark ingot worth 6000
};

export const COINS_OF_ACCOUNT = {
  cp: {
    weight: 0.05, // 20 per pound
    value: 1,
    name: 'Copper Piece',
    abbr: 'CP',
  },
  sp: {
    weight: 0.0125, // 80 per pound
    value: 12,
    name: 'Silver Piece',
    abbr: 'SP',
  },
  gp: {
    weight: 0.02, // 50 per pound
    value: 240,
    name: 'Gold Piece',
    abbr: 'GP',
  },
};
