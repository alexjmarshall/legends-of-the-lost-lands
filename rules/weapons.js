export const weaponSpecialPropsEnum = Object.freeze({
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

export const ammoTypesEnum = Object.freeze({
  STONE: 'stone',
  BULLET: 'bullet',
  SHOT: 'shot',
  QUARREL: 'quarrel',
  ARROW: 'arrow',
});
const { STONE, BULLET, SHOT, QUARREL, ARROW } = ammoTypesEnum;

export const crossbowAmmoTypesArray = [QUARREL];

export const bowAmmoTypesArray = [ARROW];

export const gunAmmoTypesArray = [BULLET, SHOT];

export const slingAmmoTypesArray = [BULLET, STONE];
