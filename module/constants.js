export const ASSETS_PATH = 'systems/brigandine/assets';
export const ATTRIBUTE_TYPES = ['String', 'Number', 'Boolean', 'Formula', 'Resource'];
export const SECONDS_IN_DAY = 86400;
export const SECONDS_IN_HOUR = 3600;
export const MIN_BLEED_DMG = 6; // TODO need? min knockdown dmg?
export const BASE_IMPALE_CHANCE = 30; // TODO need?
export const ATTITUDES = {
  HOSTILE: 'hostile',
  DISMISSIVE: 'dismissive',
  UNCERTAIN: 'uncertain',
  ACCEPTING: 'accepting',
  HELPFUL: 'helpful',
};
export const STORAGE_MATERIALS = {
  WOOD: 'wood',
  LEATHER: 'leather',
  BRASS: 'brass',
  IVORY: 'ivory',
  JADE: 'jade',
};
export const SCROLL_MATERIALS = {
  PAPYRUS: 'papyrus',
  LINEN: 'linen paper',
  PARCHMENT: 'parchment',
  VELLUM: 'vellum',
};
export const ATTITUDE_SELL_ADJ = {
  [ATTITUDES.HOSTILE]: 1.5,
  [ATTITUDES.DISMISSIVE]: 1.15,
  [ATTITUDES.UNCERTAIN]: 1,
  [ATTITUDES.ACCEPTING]: 0.95,
  [ATTITUDES.HELPFUL]: 0.85,
};
export const ATTITUDE_BUY_ADJ = {
  [ATTITUDES.HOSTILE]: 0.5,
  [ATTITUDES.DISMISSIVE]: 0.85,
  [ATTITUDES.UNCERTAIN]: 1,
  [ATTITUDES.ACCEPTING]: 1.05,
  [ATTITUDES.HELPFUL]: 1.15,
};

export const GARMENT_MATERIALS = {
  bone: {
    weight: 40,
    clo: 10,
    value: 180,
  },
  wood: {
    weight: 40,
    clo: 10,
    value: 120,
  },
  burlap: {
    weight: 8,
    clo: 5,
    value: 6,
  },
  linen: {
    weight: 4,
    clo: 8,
    value: 60,
  },
  wool: {
    weight: 8,
    clo: 16,
    value: 144,
  },
  silk: {
    weight: 2,
    clo: 11,
    value: 1080,
  },
  fur: {
    weight: 20,
    clo: 32,
    value: 600,
  },
  leather: {
    weight: 16,
    clo: 10,
    value: 300,
    metal: false,
    bulky: false,
  },
  padded: {
    weight: 16,
    clo: 18,
    value: 240,
    metal: false,
    bulky: false,
  },
  'cuir bouilli': {
    weight: 24,
    clo: 9,
    value: 360,
    metal: false,
    bulky: true,
  },
  brigandine: {
    weight: 80,
    clo: 16,
    value: 1200,
    metal: true,
    bulky: true,
  },
  scale: {
    weight: 88,
    clo: 13,
    value: 960,
    metal: true,
    bulky: false,
  },
  mail: {
    weight: 48,
    clo: 2,
    value: 1800,
    metal: true,
    bulky: false,
  },
  'elven mail': {
    weight: 24,
    clo: 1,
    value: 18000,
    metal: true,
    bulky: false,
  },
  'plated mail': {
    weight: 60,
    clo: 4,
    value: 2400,
    metal: true,
    bulky: false,
  },
  lamellar: {
    weight: 88,
    clo: 11,
    value: 1440,
    metal: true,
    bulky: true,
  },
  splint: {
    weight: 72,
    clo: 14,
    value: 1920,
    metal: true,
    bulky: true,
  },
  'iron plate': {
    weight: 80,
    clo: 10,
    value: 2880,
    metal: true,
    bulky: true,
  },
  'steel plate': {
    weight: 72,
    clo: 8,
    value: 7200,
    metal: true,
    bulky: true,
  },
};

const ranChoice = (choices) => {
  const ranInd = Math.floor(Math.random() * choices.length);
  return choices[ranInd];
};

/* TODO
0.5x STR mod on Thrusts
-1 to-hit for pre-attack maneuevers
order armor listed in inventory rows is order it is layered when worn
weapon must be balanced to riposte after parry
give some weapons a +1 parry bonus
attack bonus on riposte??? a +2 might be balanced now considering chance of overcoming parry
flex blades more durable but need to be half-sworded to avoid 1/2 damage on blunted thrust
half-swording also eliminates bonus damage vs. Large
saber/scimitar needs to do slightly more damage -- 1d9 or 2d4
OR scimitars can have expanded reach range and never get stuck
can list special weapon properties as a comma separated list on the weapon item
*/
export const ranAnnoyedMerchant = () =>
  ranChoice([
    'The merchant purses their lips.',
    'The merchant rubs the bridge of their nose.',
    'The merchant closes their eyes and sighs.',
    'The merchant clucks their tongue.',
    'The merchant looks upward.',
  ]); // CONTINUE

export const STANCE_MODS = {
  // TODO move this to combat file
  power: {
    ac_mod: -2,
    atk_mod: -2,
    dmg_mod: (weap) => Math.floor(weap.data.data.attributes.impact?.value / 2) || 0,
    str_dmg_mod: (char) => Math.floor(Math.max(0, char.data.data.str_mod) / 2) || 0, // TODO don't need
    impact_mod: (weap) => Math.floor(weap.data.data.attributes.impact?.value / 2) || 0,
    speed_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.speed?.value / 2) || 0,
  },
  fluid: {
    ac_mod: 1,
    atk_mod: 2,
    dmg_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.impact?.value / 2) || 0,
    str_dmg_mod: (char) => 0 - Math.ceil(Math.max(0, char.data.data.str_mod) / 2) || 0,
    impact_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.impact?.value / 2) || 0,
    speed_mod: (weap) => Math.floor(weap.data.data.attributes.speed?.value / 2) || 0,
    shield_dr_mod: 1,
    shield_ac_mod: 1,
    shield_atk_mod: -2,
  },
  counter: {
    ac_mod: -2,
  },
};
export const PREP_MODS = {
  feint: {
    atk_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.impact?.value / 2) || 0,
    speed_mod: (weap) => 0 - Math.ceil(weap.data.data.attributes.speed?.value / 2) || 0,
  },
};
export const WEAP_BREAK_CHANCE = 5;

export const MERCHANT_SUBTYPES = [
  'apothecary',
  'magic',
  'armorer',
  'clothier',
  'jeweller',
  'innkeeper',
  'general',
  'trader',
  'weaponsmith',
  'bowyer',
];

export const HUMANOID_TYPES = ['character', 'humanoid'];
export const NONCOMBATANT_TYPES = ['container', 'merchant'];
// CONST.ACTIVE_EFFECT_MODES = { CUSTOM: 0, MULTIPLY: 1, ADD: 2, DOWNGRADE: 3, UPGRADE: 4, OVERRIDE: 5 }
// top level prop transfer: true for item active effects to affect actors
// TODO add active effects sheet tabs to items/actors
export const STATUS_EFFECTS = [
  { id: 'dead', label: 'EFFECT.StatusDead', icon: 'icons/svg/skull.svg' },
  { id: 'unconscious', label: 'EFFECT.StatusUnconscious', icon: 'icons/svg/unconscious.svg' },
  { id: 'sleep', label: 'EFFECT.StatusAsleep', icon: 'icons/svg/sleep.svg' },
  {
    id: 'stun',
    label: 'EFFECT.StatusStunned',
    icon: 'icons/svg/daze.svg',
    duration: {
      rounds: null,
      seconds: 600,
      startRound: null, // item subtype?
      startTime: null,
      startTurn: null,
      turns: null,
    },
    changes: [
      {
        key: 'data.hp.max',
        mode: 2,
        value: '-9',
      },
    ],
  },
  { id: 'prone', label: 'EFFECT.StatusProne', icon: 'icons/svg/falling.svg' },
  { id: 'restrain', label: 'EFFECT.StatusRestrained', icon: 'icons/svg/net.svg' },
  { id: 'paralysis', label: 'EFFECT.StatusParalysis', icon: 'icons/svg/paralysis.svg' },
  { id: 'fly', label: 'EFFECT.StatusFlying', icon: 'icons/svg/wing.svg' },
  { id: 'blind', label: 'EFFECT.StatusBlind', icon: 'icons/svg/blind.svg' },
  { id: 'deaf', label: 'EFFECT.StatusDeaf', icon: 'icons/svg/deaf.svg' },
  { id: 'silence', label: 'EFFECT.StatusSilenced', icon: 'icons/svg/silenced.svg' },
  { id: 'fear', label: 'EFFECT.StatusFear', icon: 'icons/svg/terror.svg' },
  { id: 'burning', label: 'EFFECT.StatusBurning', icon: 'icons/svg/fire.svg' },
  { id: 'frozen', label: 'EFFECT.StatusFrozen', icon: 'icons/svg/frozen.svg' },
  { id: 'shock', label: 'EFFECT.StatusShocked', icon: 'icons/svg/lightning.svg' },
  { id: 'corrode', label: 'EFFECT.StatusCorrode', icon: 'icons/svg/acid.svg' },
  { id: 'bleeding', label: 'EFFECT.StatusBleeding', icon: 'icons/svg/blood.svg' },
  { id: 'disease', label: 'EFFECT.StatusDisease', icon: 'icons/svg/biohazard.svg' },
  { id: 'poison', label: 'EFFECT.StatusPoison', icon: 'icons/svg/poison.svg' },
  { id: 'radiation', label: 'EFFECT.StatusRadiation', icon: 'icons/svg/radiation.svg' },
  { id: 'regen', label: 'EFFECT.StatusRegen', icon: 'icons/svg/regen.svg' },
  { id: 'degen', label: 'EFFECT.StatusDegen', icon: 'icons/svg/degen.svg' },
  { id: 'upgrade', label: 'EFFECT.StatusUpgrade', icon: 'icons/svg/upgrade.svg' },
  { id: 'downgrade', label: 'EFFECT.StatusDowngrade', icon: 'icons/svg/downgrade.svg' },
  { id: 'target', label: 'EFFECT.StatusTarget', icon: 'icons/svg/target.svg' },
  { id: 'eye', label: 'EFFECT.StatusMarked', icon: 'icons/svg/eye.svg' },
  { id: 'curse', label: 'EFFECT.StatusCursed', icon: 'icons/svg/sun.svg' },
  { id: 'bless', label: 'EFFECT.StatusBlessed', icon: 'icons/svg/angel.svg' },
  { id: 'fireShield', label: 'EFFECT.StatusFireShield', icon: 'icons/svg/fire-shield.svg' },
  { id: 'coldShield', label: 'EFFECT.StatusIceShield', icon: 'icons/svg/ice-shield.svg' },
  { id: 'magicShield', label: 'EFFECT.StatusMagicShield', icon: 'icons/svg/mage-shield.svg' },
  { id: 'holyShield', label: 'EFFECT.StatusHolyShield', icon: 'icons/svg/holy-shield.svg' },
];
export const HIDDEN_GROUPS = ['admin', 'dmg_mods', 'immunities'];
export const MAGIC_GROUPS = ['magic_dmg', 'magic_mods'];
export const GEM_BASE_VALUE = {
  ornamental: 60, // e.g. agate, lapis lazuli, obsidian, turquoise, malachite
  'semi-precious': 1200, // e.g. peridot, topaz, garnet, pearl, amethyst
  precious: 12000, // e.g. diamond, ruby, sapphire, emerald, opal
};
export const GEM_DEFAULT_WEIGHT = 0.1;
export const GEM_QUALITY_ADJ = {
  AAA: 4,
  AA: 2.8,
  A: 2,
  B: 1.4,
  C: 1,
};
export const GEM_WEIGHT_ADJ = (ratio) => ratio ** 2;
