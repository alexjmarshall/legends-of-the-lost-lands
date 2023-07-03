import { buildEnum, deepFreeze } from './helper';

// macro: macro code associated with feature for player to activate TODO
// active_effects: active effect definitions associated with feature TODO

// TODO any feature that has an active effect needs to be unique to a source
export const sourceEnum = Object.freeze({
  CLASS: 'class',
  RACE: 'race',
});

class Feature {
  constructor(source, name, reqLvl, derivedData) {
    this.source = source;
    this.name = name;
    this.reqLvl = reqLvl;
    this.derivedData = derivedData;
  }
}

export class ClassFeature extends Feature {
  constructor(name, reqLvl, derivedData = null) {
    super(sourceEnum.CLASS, name, reqLvl, derivedData);
  }
}

export class RaceFeature extends Feature {
  constructor(name, reqLvl, derivedData) {
    super(sourceEnum.RACE, name, reqLvl, derivedData);
  }
}

export const featuresEnum = Object.freeze({
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
  ELEMENTAL_FOCUS: 'elemental focus',
  ELEMENTAL_SURGE: 'elemental surge',
  FEARLESS: 'fearless',
  FLEET_FOOTED: 'fleet-footed',
  WIZARD_SLAYER: 'wizard slayer',
  SENSE_DANGER: 'sense danger',
  NATURAL_TOUGHNESS: 'natural toughness',
  FIRST_ATTACK_FEROCITY: 'first attack ferocity',
});
