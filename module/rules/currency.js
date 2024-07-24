export const CURRENCY_MATERIAL_VALUE_PER_POUND = {
  copper: 20,
  brass: 40,
  silver: 960, // weight 0.5 for Silver Mark ingot worth 480
  electrum: 8400,
  gold: 12000, // weight 0.5 for Gold Mark ingot worth 6000
  platinum: 24000,
};

// NOTE: to convert historical prices in pence to cp, shillings to sp, and pounds to gp,
// multiply by 4
export const CURRENCY = {
  cp: {
    weight: 0.05, // 20 per pound
    value: 1,
    name: 'Copper Piece',
    abbr: 'CP',
  },
  bp: {
    weight: 0.1, // 10 per pound
    value: 4,
    name: 'Brass Piece',
    abbr: 'BP',
  },
  sp: {
    weight: 0.0125, // 80 per pound
    value: 12,
    name: 'Silver Piece',
    abbr: 'SP',
  },
  sm: {
    weight: 0.5, // 2 per pound
    value: 480,
    name: 'Silver Mark',
    abbr: 'SM',
  },
  ep: {
    weight: 0.0143, // 70 per pound
    value: 120,
    name: 'Electrum Piece',
    abbr: 'EP',
  },
  gp: {
    weight: 0.02, // 50 per pound
    value: 240,
    name: 'Gold Piece',
    abbr: 'GP',
  },
  gm: {
    weight: 0.5, // 2 per pound
    value: 6000,
    name: 'Gold Mark',
    abbr: 'GM',
  },
  pp: {
    weight: 0.025, // 40 per pound
    value: 480,
    name: 'Platinum Piece',
    abbr: 'PP',
  },
};

export const UNITS_OF_ACCOUNT = {
  cp: CURRENCY.cp,
  sp: CURRENCY.sp,
  gp: CURRENCY.gp,
};

export function expandPrice(priceInCps) {
  if (!priceInCps) return;
  const gp = Math.floor(priceInCps / UNITS_OF_ACCOUNT.gp.value);
  priceInCps -= gp * UNITS_OF_ACCOUNT.gp.value;
  const sp = Math.floor(priceInCps / UNITS_OF_ACCOUNT.sp.value);
  const cp = priceInCps - sp * UNITS_OF_ACCOUNT.sp.value;
  return { gp, sp, cp };
}

export function getPriceString(priceInCps) {
  if (!priceInCps) return;
  const priceObj = expandPrice(priceInCps);
  let priceString = '';
  for (const [unit, value] of Object.entries(priceObj)) {
    if (value) priceString += `${value} ${UNITS_OF_ACCOUNT[unit].abbr}, `;
  }
  return priceString.replace(/,\s*$/, '');
}
