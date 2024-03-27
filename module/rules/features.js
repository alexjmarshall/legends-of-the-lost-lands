export const FEATURE_SOURCE = Object.freeze({
  CLASS: 'class',
  RACE: 'race',
});

export class FeatureConfig {
  constructor(feature, reqLvl, options = { usesPerDay: undefined, changes: [] }) {
    const { usesPerDay, changes } = options;
    this.feature = {
      ...feature,
      usesPerDay,
      effectData: {
        ...effectData,
        changes,
      },
    };
    this.reqLvl = reqLvl;
  }
}

export const FEATURE_TYPE = {
  INHERENT: 'inherent',
  ABILITY: 'ability',
  LIMITED_USE_ABILITY: 'limited use ability',
};

export const features = Object.freeze({
  CHAIN_ATTACK: {
    name: 'Chain Attack',
    type: FEATURE_TYPE.ABILITY,
  },
  MULTIATTACK: {
    name: 'Multiattack',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Multiattack',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.derived.attacks',
          mode: 4,
          value: 2,
        },
      ],
    },
  },
  BERSERK: {
    // TODO +2 HP/level reduces to +1 after name level
    name: 'Berserk',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  TURN_UNDEAD: {
    name: 'Turn Undead',
    type: FEATURE_TYPE.ABILITY,
  },
  CAST_MAGIC_SPELLS: {
    name: 'Cast Magic Spells',
    type: FEATURE_TYPE.ABILITY,
  },
  READ_MAGIC_SCROLLS: {
    name: 'Read Magic Scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  SCRIBE_MAGIC_SCROLLS: {
    name: 'Scribe Magic Scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  CAST_CLERIC_SPELLS: {
    name: 'Cast Cleric Spells',
    type: FEATURE_TYPE.ABILITY,
  },
  READ_CLERIC_SCROLLS: {
    name: 'Read Cleric Scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  SCRIBE_CLERIC_SCROLLS: {
    name: 'Scribe Cleric scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  CAST_DRUID_SPELLS: {
    name: 'Cast Druid Spells',
    type: FEATURE_TYPE.ABILITY,
  },
  RUNE_MAGIC: {
    name: 'Rune Magic',
    type: FEATURE_TYPE.ABILITY,
  },
  BACKSTAB: {
    name: 'Backstab',
    type: FEATURE_TYPE.ABILITY,
  },
  ASSASSINATE: {
    name: 'Assassinate',
    type: FEATURE_TYPE.ABILITY,
  },
  DUELLIST: {
    name: 'Duellist',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Duellist',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attributes.base_ac.value',
          mode: 2,
          value: 1,
        },
        {
          key: 'data.derived.riposte_to_hit_mod',
          mode: 2,
          value: 1,
        },
        {
          key: 'data.derived.riposte_dmg_mod',
          mode: 2,
          value: 1,
        },
        {
          key: 'data.derived.counter_to_hit_mod',
          mode: 2,
          value: 1,
        },
        {
          key: 'data.derived.counter_dmg_mod',
          mode: 2,
          value: 1,
        },
      ],
    },
  },
  STEAL_SPELL: {
    name: 'Steal Spell',
    type: FEATURE_TYPE.ABILITY,
  },
  SENSE_SPELL: {
    name: 'Sense Spell',
    type: FEATURE_TYPE.ABILITY,
  },
  SENSE_MEMORIZED_SPELLS: {
    name: 'Sense Memorized Spells',
    type: FEATURE_TYPE.ABILITY,
  },
  SENSE_MAGIC: {
    name: 'Sense Magic',
    type: FEATURE_TYPE.ABILITY,
  },
  DRAIN_MAGIC: {
    name: 'Drain Magic',
    type: FEATURE_TYPE.ABILITY,
  },
  SPECIALIST_FOCUS: {
    name: 'Specialist Focus',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Specialist Focus',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.abjuration.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  FEARLESS: {
    name: 'Fearless',
    type: FEATURE_TYPE.INHERENT,
  },
  FLEET_FOOTED: {
    name: 'Fleet-Footed',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Fleet-Footed',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attributes.base_mv.value',
          mode: 4,
          value: 15,
        },
      ],
    },
  },
  WIZARD_SLAYER: {
    name: 'Wizard Slayer',
    type: FEATURE_TYPE.ABILITY,
  },
  SENSE_DANGER: {
    // roll Listen
    name: 'Sense Danger',
    type: FEATURE_TYPE.INHERENT,
  },
  NATURAL_TOUGHNESS: {
    name: 'Natural Toughness',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Natural Toughness',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attributes.base_ac.value',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  FIRST_ATTACK_FEROCITY: {
    name: 'First Attack Ferocity',
    type: FEATURE_TYPE.ABILITY,
  },
  KILLER_INSTINCT: {
    // TODO code in attack macro
    name: 'Killer Instinct',
    type: FEATURE_TYPE.INHERENT,
  },
  LAY_ON_HANDS: {
    // TODO +2 HP/level reduces to +1 after name level
    name: 'Lay on Hands',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  HOLY_PROTECTION: {
    // +2 AC, +2 saves, immune to disease and fear
    // TODO
    name: 'Holy Protection',
    type: FEATURE_TYPE.INHERENT,
  },
  ASCETIC: {
    name: 'Ascetic',
    type: FEATURE_TYPE.INHERENT,
  },
  DETECT_EVIL: {
    name: 'Detect Evil',
    type: FEATURE_TYPE.INHERENT,
  },
  DETECT_LIE: {
    name: 'Detect Lie',
    type: FEATURE_TYPE.INHERENT,
  },
  DISPEL_MAGIC: {
    name: 'Dispel Magic',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  REBUKE_UNDEAD: {
    // requires holy sword
    name: 'Rebuke Undead',
    type: FEATURE_TYPE.ABILITY,
  },
  PALADIN_STEED: {
    name: "Paladin's Steed",
    type: FEATURE_TYPE.ABILITY,
  },
  AURA_OF_PROTECTION: {
    // requires holy sword
    name: 'Aura of Protection',
    type: FEATURE_TYPE.INHERENT,
  },
  BANISH_EVIL: {
    // requires holy sword
    name: 'Banish Evil',
    type: FEATURE_TYPE.ABILITY,
  },
  TRUE_SIGHT: {
    name: 'True Sight',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  ANCIENT_HATRED: {
    name: 'Ancient Hatred',
    type: FEATURE_TYPE.INHERENT,
  },
  ALERT: {
    name: 'Alert',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Alert',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.passive_perception',
          mode: 2,
          value: 4,
        },
      ],
    },
  },
  RELUCTANT_LEADER: {
    name: 'Reluctant Leader',
    type: FEATURE_TYPE.INHERENT,
  },
  MASTERY_OF_THE_STONE: {
    name: 'Mastery of the Stone',
    type: FEATURE_TYPE.INHERENT,
  },
  ENERGY_DRAIN_RESISTANCE: {
    name: 'Energy Drain Resistance',
    type: FEATURE_TYPE.INHERENT,
  },
  IMPROVED_EVASION: {
    name: 'Improved Evasion',
    type: FEATURE_TYPE.INHERENT,
  },
  IDENTIFY_PURE_WATER: {
    name: 'Identify Pure Water',
    type: FEATURE_TYPE.INHERENT,
  },
  PASS_WITHOUT_TRACE: {
    name: 'Pass Without Trace',
    type: FEATURE_TYPE.INHERENT,
  },
  SYLVAN_CHARM_IMMUNITY: {
    name: 'Sylvan Charm Immunity',
    type: FEATURE_TYPE.INHERENT,
  },
  ANIMAL_FORM: {
    name: 'Animal Form',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  QUICK_TO_MASTER: {
    name: 'Quick to Master',
    type: FEATURE_TYPE.INHERENT,
  },
  COMMANDING: {
    name: 'Commanding',
    type: FEATURE_TYPE.INHERENT,
  },
  INFRAVISION: {
    name: 'Infravision',
    type: FEATURE_TYPE.INHERENT,
  },
  BRUTAL: {
    name: 'Brutal',
    type: FEATURE_TYPE.INHERENT,
  },
  BEASTMARKED: {
    name: 'Beastmarked',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Beastmarked',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.persuasion.lvl',
          mode: 2,
          value: -2,
        },
        {
          key: 'data.skills.intimidation.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  GRACILE: {
    name: 'Gracile',
    type: FEATURE_TYPE.INHERENT,
  },
  ENIGMATIC_MIND: {
    name: 'Enigmatic Mind',
    type: FEATURE_TYPE.INHERENT,
  },
  KEEN_SIGHT: {
    name: 'Keen Sight',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Keen Sight',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.searching.lvl',
          mode: 2,
          value: 4,
        },
      ],
    },
  },
  PARTING_GIFT: {
    name: 'Parting Gift',
    type: FEATURE_TYPE.INHERENT,
  },
  WORLDBOUND: {
    name: 'Worldbound',
    type: FEATURE_TYPE.INHERENT,
  },
  HARDY: {
    name: 'Hardy',
    type: FEATURE_TYPE.INHERENT,
  },
  DUNGEON_NAVIGATOR: {
    name: 'Dungeon Navigator',
    type: FEATURE_TYPE.INHERENT,
  },
  ANCESTRAL_TREASURE: {
    name: 'Ancestral Treasure',
    type: FEATURE_TYPE.INHERENT,
  },
  SMALL_ARMS: {
    name: 'Small Arms',
    type: FEATURE_TYPE.INHERENT,
  },
  UNCANNY_SHOT: {
    name: 'Uncanny Shot',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Uncanny Shot',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.missile_atk_bonus',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  DIMINUTIVE: {
    name: 'Diminutive',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Diminuitive',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.hiding.lvl',
          mode: 2,
          value: 4,
        },
      ],
    },
  },
  STOUTHEARTED: {
    name: 'Stouthearted',
    type: FEATURE_TYPE.INHERENT,
  },
  IRON_STOMACH: {
    name: 'Iron Stomach',
    type: FEATURE_TYPE.INHERENT,
  },
  FELL_COUNTENANCE: {
    name: 'Fell Countenance',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Fell Countenance',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.persuasion.lvl',
          mode: 2,
          value: -4,
        },
        {
          key: 'data.skills.intimidation.lvl',
          mode: 2,
          value: 4,
        },
      ],
    },
  },
  SUPPLE_MIND: {
    name: 'Supple Mind',
    type: FEATURE_TYPE.INHERENT,
  },
  SHARP_SIGHT: {
    name: 'Sharp Sight',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Sharp Sight',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.searching.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  PIXIE_DUST: {
    name: 'Pixie Dust',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  NATURAL_INVISIBILITY: {
    name: 'Natural Invisibility',
    type: FEATURE_TYPE.INHERENT,
  },
  NATURAL_FLIGHT: {
    name: 'Natural Flight',
    type: FEATURE_TYPE.INHERENT,
  },
});
