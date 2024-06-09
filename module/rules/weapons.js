// TODO double blade costs

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
  SWEEP: 'sweep', // TODO Sweep cleaves on any hit, not just kill!!
  UNWIELDY: 'unwieldy',
  VOLATILE: 'volatile', // needed?
});

export const AMMO_TYPES = Object.freeze({
  STONE: 'stone',
  BULLET: 'bullet',
  SHOT: 'shot',
  QUARREL: 'quarrel',
  ARROW: 'arrow',
});
const { STONE, BULLET, SHOT, QUARREL, ARROW } = AMMO_TYPES;

export const crossbowAmmoTypes = [QUARREL];

export const bowAmmoTypes = [ARROW];

export const gunAmmoTypes = [BULLET, SHOT];

export const slingAmmoTypes = [BULLET, STONE];

export const WEAPON_CLASS = Object.freeze({
  SIMPLE: 'simple',
  MARTIAL: 'martial',
});
// TODO resin effects might have to be applied to character, but can remove if weapon is changed -- add all dmg bonuses as fields to char base derived data so active effects can boost it
// also add base mv, attack bonus, size, vision, num attacks, dmg bonus and base ac to these base derived stats for chars
// for monsters, derive base attack bonus from HD -- nah go back and add them to template json except atk bonus and dmg bonus
// handle poisoning like disease, and note damage with dice and interval like 1d6/1 round (roll 1 and spontaneously resolves)
// have to come up with a COMPLETE list of weapon special properties, including those for m agic weapons like life stealer, level drain, severing, etc.
