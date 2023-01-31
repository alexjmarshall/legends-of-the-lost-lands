export const WEAPON_TIERS = ['martial', 'simple'];
export const WEAPON_SPECIAL_PROPS = Object.freeze({
  BACK_RANK: 'back rank', // TODO needed? or only spears
  BALANCED: 'balanced', // TODO needed?
  CONCEALABLE: 'concealable',
  CURVED: 'curved', // TODO needed?
  FLEXIBLE: 'flexible',
  FRAGILE: 'fragile',
  HOOK: 'hook',
  LOUD: 'loud',
  MOUNTED_CHARGE: 'mounted charge',
  QUICK_DRAW: 'quick draw',
  QUICK_SLASH: 'quick slash', // TODO remove
  SET_VS_CHARGE: 'set vs. charge',
  SILENT: 'silent',
  SILVERED: 'silvered',
  SWEEP: 'sweep',
  UNWIELDY: 'unwieldy',
  VOLATILE: 'volatile', // needed?
});
export const WEAPON_CATEGORIES = Object.freeze({
  AXE: 'axe',
  BLUDGEON: 'bludgeon',
  BOW: 'bow',
  CROSSBOW: 'crossbow',
  CURVED_SWORD: 'curved sword',
  DAGGER: 'dagger',
  DOUBLE_ENDED_POLEARM: 'double-ended polearm', // good clerics limited to weapons with Bleed 0 (not necessarily blunt)
  HAMMER: 'hammer',
  HAND_TO_HAND: 'hand-to-hand',
  GREATSWORD: 'greatsword',
  PIERCING_SWORD: 'piercing sword',
  POLEARM: 'polearm',
  SLING: 'sling', // TODO combine with whip?
  SPEAR: 'spear',
  STRAIGHT_SWORD: 'straight sword',
  WHIP: 'whip', // TODO spiked scourge, regular scourge has Bleed 0
});
export const AMMO_TYPES = Object.freeze({
  STONE: 'stone',
  BULLET: 'bullet',
  BALL: 'ball',
  SHOT: 'shot',
  QUARREL: 'quarrel',
  ARROW: 'arrow',
});
export const CROSSBOW_AMMO_TYPES = [
  AMMO_TYPES.QUARREL,
];
export const BOW_AMMO_TYPES = [
  AMMO_TYPES.ARROW,
];
export const GUN_AMMO_TYPES = [
  AMMO_TYPES.BULLET,
  AMMO_TYPES.BALL,
  AMMO_TYPES.SHOT,
];
export const ALLOWED_WEAP_TIERS = {
  SIMPLE: ['simple'],
  MARTIAL: ['simple', 'martial'],
};
export const ALLOWED_WEAP_PROFS = {
  ANY: Object.values(WEAPON_CATEGORIES),
};
