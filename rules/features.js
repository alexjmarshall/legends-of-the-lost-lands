import { buildEnum, deepFreeze } from './helper';

// macro: macro code associated with feature for player to activate TODO
// active_effects: active effect definitions associated with feature TODO

// TODO any feature that has an active effect needs to be unique to a source
export const classFeaturesEnum = Object.freeze({
  CHAIN_ATTACK: 'chain attack',
  MULTIATTACK: 'multiattack',
  BERSERK: 'berserk',
  TURN_UNDEAD: 'turn undead',
  CAST_MAGICK_SPELLS: 'cast magick spells',
  READ_MAGICK_SCROLLS: 'read magick scrolls',
  SCRIBE_MAGICK_SCROLLS: 'scribe magick scrolls',
  CAST_CLERIC_SPELLS: 'cast cleric spells',
  READ_CLERIC_SCROLLS: 'read cleric scrolls',
  SCRIBE_CLERIC_SCROLLS: 'scribe cleric scrolls',
  CAST_WITCH_SPELLS: 'cast witch spells',
  READ_WITCH_SCROLLS: 'read witch scrolls',
  SCRIBE_WITCH_SCROLLS: 'scribe witch scrolls',
  RUNE_MAGICK: 'rune magick',
  BACKSTAB: 'backstab',
  ASSASSINATE: 'assassinate',
  DUELLIST: 'duellist',
  STEAL_SPELL: 'steal spell',
  SENSE_SPELL: 'sense spell',
  SENSE_MEMORIZED_SPELLS: 'sense memorized spells',
  SENSE_MAGICK: 'sense magick',
  DRAIN_MAGICK: 'drain magick',
  AIR_ELEMENTAL_FOCUS: 'air elemental focus',
  EARTH_ELEMENTAL_FOCUS: 'earth elemental focus',
  FIRE_ELEMENTAL_FOCUS: 'fire elemental focus',
  WATER_ELEMENTAL_FOCUS: 'water elemental focus',
  ELEMENTAL_SURGE: 'elemental surge',
  FEARLESS: 'fearless',
  FLEET_FOOTED: 'fleet-footed',
  WIZARD_SLAYER: 'wizard slayer',
  SENSE_DANGER: 'sense danger',
  NATURAL_TOUGHNESS: 'natural toughness',
  FIRST_ATTACK_FEROCITY: 'first attack ferocity',
});

// TODO remove all below

// export function buildFeatures(source, lvl) {
//   {
//     const sourceFeatures = Object.keys(features).filter((key) => features[key].reqLvl?.[source] <= lvl);
//     const features = {};
//     sourceFeatures.forEach((key) => {
//       features[key] = buildFeature(key, source, lvl);
//     });

//     return features;
//   }
// }

// export function buildFeature(key, source, lvl) {
//   const feature = { ...features[key] };
//   feature.reqLvl = feature.reqLvl[source];
//   Object.entries(feature.derivedData ?? {}).forEach(([k, v]) => {
//     if (v[source] && typeof v[source] === 'function') {
//       feature.derivedData = { ...feature.derivedData, [k]: v[source](lvl) };
//     }
//   });

//   return feature;
// }
