export const FEATURE_SOURCE = Object.freeze({
  CLASS: 'class',
  RACE: 'race',
});

export class FeatureConfig {
  constructor(feature, reqLvl = 1, options = { usesPer: {}, changes: [] }) {
    const { usesPer, changes } = options;
    this.feature = {
      ...feature,
      usesPer: {
        ...feature.usesPer,
        ...usesPer,
      },
      effectData: {
        ...feature.effectData,
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
  ABJURATION_SPECIALIZATION: {
    name: 'Abjuration Specialization',
    description: ['+2 to Abjuration', 'Cannot learn or cast Alteration spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Abjuration Specialization',
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
  CONJURATION_SPECIALIZATION: {
    name: 'Conjuration Specialization',
    description: ['+2 to Conjuration', 'Cannot learn or cast Divination spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Conjuration Specialization',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.conjuration.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  DIVINATION_SPECIALIZATION: {
    name: 'Divination Specialization',
    description: ['+2 to Divination', 'Cannot learn or cast Conjuration spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Divination Specialization',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.divination.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  ENCHANTMENT_SPECIALIZATION: {
    name: 'Enchantment Specialization',
    description: ['+2 to Enchantment', 'Cannot learn or cast Evocation spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Enchantment Specialization',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.enchantment.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  EVOCATION_SPECIALIZATION: {
    name: 'Evocation Specialization',
    description: ['+2 to Evocation', 'Cannot learn or cast Enchantment spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Evocation Specialization',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.evocation.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  ILLUSION_SPECIALIZATION: {
    name: 'Illusion Specialization',
    description: ['+2 to Illusion', 'Cannot learn or cast Necromancy spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Illusion Specialization',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.illusion.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  NECROMANCY_SPECIALIZATION: {
    name: 'Necromancy Specialization',
    description: ['+2 to Necromancy', 'Cannot learn or cast Illusion spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Necromancy Specialization',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.necromancy.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  ALTERATION_SPECIALIZATION: {
    name: 'Alteration Specialization',
    description: ['+2 to Alteration', 'Cannot learn or cast Abjuration spells'],
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Alteration Specialization',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.alteration.lvl',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  CHAIN_ATTACK: {
    name: 'Chain Attack',
    description: 'Extra attack after slaying an enemy',
    type: FEATURE_TYPE.ABILITY,
  },
  MULTIATTACK: {
    name: 'Multiattack',
    description: 'Multiattack',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Multiattack',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attacks',
          mode: 4,
          value: 2,
        },
      ],
    },
  },
  BERSERK: {
    // TODO +2 HP/level reduces to +1 after name level and immune to bleeding
    name: 'Berserk',
    description: 'Berserk rage (+2 to-hit, damage & AC, +4 to mental saving throws, 5 + 2/level temporary HP)',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  TURN_UNDEAD: {
    name: 'Turn Undead',
    description: 'Turn the undead by holding aloft a Holy Symbol',
    type: FEATURE_TYPE.ABILITY,
  },
  REBUKE_UNDEAD: {
    name: 'Rebuke Undead',
    description: 'Turn the undead by striking them with a Holy Sword',
    type: FEATURE_TYPE.ABILITY,
  },
  CAST_MAGIC_SPELLS: {
    name: 'Cast Magic Spells',
    description: 'Cast magic spells',
    type: FEATURE_TYPE.ABILITY,
  },
  READ_MAGIC_SCROLLS: {
    name: 'Read Magic Scrolls',
    description: 'Read magic scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  SCRIBE_MAGIC_SCROLLS: {
    name: 'Scribe Magic Scrolls',
    description: 'Scribe magic scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  CAST_CLERIC_SPELLS: {
    name: 'Cast Cleric Spells',
    description: 'Cast cleric spells',
    type: FEATURE_TYPE.ABILITY,
  },
  READ_CLERIC_SCROLLS: {
    name: 'Read Cleric Scrolls',
    description: 'Read cleric scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  SCRIBE_CLERIC_SCROLLS: {
    name: 'Scribe Cleric scrolls',
    description: 'Scribe cleric scrolls',
    type: FEATURE_TYPE.ABILITY,
  },
  BLUNT_DAMAGE_ONLY: {
    // TODO code in attack macro
    name: 'Blunt Damage Only',
    description: 'Inflicts blunt weapon damage only',
    type: FEATURE_TYPE.INHERENT,
  },
  CAST_DRUID_SPELLS: {
    name: 'Cast Druid Spells',
    description: 'Cast druid spells',
    type: FEATURE_TYPE.ABILITY,
  },
  RUNE_MAGIC: {
    name: 'Rune Magic',
    description: 'Shape magic runes',
    type: FEATURE_TYPE.ABILITY,
  },
  BACKSTAB: {
    name: 'Backstab',
    description: 'Backstab unaware foes for x2 damage (+1 multiple every 4 levels)',
    type: FEATURE_TYPE.ABILITY,
  },
  ASSASSINATE: {
    name: 'Assassinate',
    description: 'Assassinate surprised foes',
    type: FEATURE_TYPE.ABILITY,
  },
  DUELLIST: {
    name: 'Duellist',
    description: '+1 to-hit, damage & AC every 4 levels',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Duellist',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.base_ac',
          mode: 2,
          value: 1,
        },
        {
          key: 'data.melee_to_hit_mod',
          mode: 2,
          value: 1,
        },
        {
          key: 'data.melee_dmg_mod',
          mode: 2,
          value: 1,
        },
      ],
    },
  },
  STEAL_SPELL: {
    name: 'Steal Spell',
    description: 'Steal a memorized spell',
    type: FEATURE_TYPE.ABILITY,
  },
  SENSE_SPELL: {
    name: 'Sense Spell',
    description: 'Sense a spell being cast',
    type: FEATURE_TYPE.ABILITY,
  },
  FORGET: {
    name: 'Forget',
    description: 'Cause others to forget recent events',
    type: FEATURE_TYPE.ABILITY,
  },
  SENSE_MEMORIZED_SPELLS: {
    name: 'Sense Memorized Spells',
    description: 'Sense all spells memorized by another',
    type: FEATURE_TYPE.ABILITY,
  },
  DETECT_MAGIC: {
    name: 'Detect Magic',
    description: 'Detect magic',
    type: FEATURE_TYPE.ABILITY,
  },
  READ_THOUGHTS: {
    name: 'Read Thoughts',
    description: 'Read the surface thoughts of others',
    type: FEATURE_TYPE.ABILITY,
  },
  DRAIN_MAGIC: {
    name: 'Drain Magic',
    description: 'Drain magical energy to restore HP',
    type: FEATURE_TYPE.ABILITY,
  },
  ENHANCED_SPELLCASTING: {
    name: 'Enhanced Spellcasting',
    description: '1 additional spell slot at each level',
    type: FEATURE_TYPE.INHERENT,
  },
  DIMINISHED_SPELLCASTING: {
    name: 'Diminished Spellcasting',
    description: '1 fewer spell slot at each level',
    type: FEATURE_TYPE.INHERENT,
  },
  FEARLESS: {
    name: 'Fearless',
    description: 'Fear causes the Barbarian to attack in fury rather than flee',
    type: FEATURE_TYPE.INHERENT,
  },
  FLEET_FOOTED: {
    name: 'Fleet-Footed',
    description: 'Enhanced move (15)',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Fleet-Footed',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.base_mv',
          mode: 4,
          value: 15,
        },
      ],
    },
  },
  WIZARD_SLAYER: {
    name: 'Wizard Slayer',
    description: 'Free attack against spellcasting enemies within melee range',
    type: FEATURE_TYPE.ABILITY,
  },
  SENSE_DANGER: {
    // roll Listen
    name: 'Sense Danger',
    description: 'Sixth sense warns of danger',
    type: FEATURE_TYPE.INHERENT,
  },
  NATURAL_TOUGHNESS: {
    name: 'Natural Toughness',
    description: '+2 natural AC, +2 Healing',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Natural Toughness',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.base_ac',
          mode: 2,
          value: 2,
        },
        {
          key: 'data.healing_mod',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  FIRST_ATTACK_FEROCITY: {
    // TODO implement in alt/ctrl attack dialog?
    name: 'First Attack Ferocity',
    description: '+1-5 to-hit and x1-5 damage when attacking with initiative in melee',
    type: FEATURE_TYPE.ABILITY,
  },
  KILLER_INSTINCT: {
    // TODO code in attack macro
    name: 'Killer Instinct',
    description: '+2 to hit injured or bleeding opponents',
    type: FEATURE_TYPE.INHERENT,
  },
  LAY_ON_HANDS_HEALING: {
    // TODO +2 HP/level reduces to +1 after name level
    name: 'Lay on Hands (Healing)',
    description: 'Lay on hands to heal 2 HP/level (1/day)',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
    usesPer: {
      uses: 1,
      interval: 'day',
    },
  },
  LAY_ON_HANDS_CURE_DISEASE: {
    // TODO +2 HP/level reduces to +1 after name level
    name: 'Lay on Hands (Healing)',
    description: 'Lay on hands to cure disease (1/week)',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
    usesPer: {
      uses: 1,
      interval: 'week',
    },
  },
  HOLY_PROTECTION: {
    name: 'Holy Protection',
    description: '+2 to saving throws and AC',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Holy Protection',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.base_ac',
          mode: 2,
          value: 2,
        },
        {
          key: 'data.saves.physical',
          mode: 2,
          value: 2,
        },
        {
          key: 'data.saves.mental',
          mode: 2,
          value: 2,
        },
        {
          key: 'data.saves.evasion',
          mode: 2,
          value: 2,
        },
      ],
    },
  },
  DISEASE_IMMUNITY: {
    name: 'Disease Immunity',
    description: 'Immune to disease',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Disease Immunity',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attributes.immunities.immune_disease.value',
          mode: 5,
          value: true,
        },
      ],
    },
  },
  BACKSTAB_IMMUNITY: {
    name: 'Backstab Immunity',
    description: 'Cannot be backstabbed',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Backstab Immunity',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attributes.immunities.immune_backstab.value',
          mode: 5,
          value: true,
        },
      ],
    },
  },
  BLEED_IMMUNITY: {
    name: 'Bleed Immunity',
    description: 'Wounds do not bleed heavily',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Bleed Immunity',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attributes.immunities.immune_bleed.value',
          mode: 5,
          value: true,
        },
      ],
    },
  },
  ASCETIC: {
    name: 'Ascetic',
    description: 'Must tithe at least 20% of treasure gained to a temple',
    type: FEATURE_TYPE.INHERENT,
  },
  HARD_LEADER_PALADIN: {
    name: 'Hard Leader (Paladin)',
    description: 'Will accept only Lawful Good retainers',
    type: FEATURE_TYPE.INHERENT,
  },
  HARD_LEADER_INQUISITOR: {
    name: 'Hard Leader (Inquisitor)',
    description: 'Will accept only Lawful retainers',
    type: FEATURE_TYPE.INHERENT,
  },
  DETECT_EVIL: {
    name: 'Detect Evil',
    description: 'Detect evil creatures and enchantments',
    type: FEATURE_TYPE.ABILITY,
  },
  DETECT_LIE: {
    name: 'Detect Lie',
    description: 'Detect lies',
    type: FEATURE_TYPE.ABILITY,
  },
  DISPEL_MAGIC: {
    // TODO at 1.5x level?
    name: 'Dispel Magic',
    description: 'Dispel Magic 1/day every 4 levels',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  PALADIN_STEED: {
    name: "Paladin's Steed",
    description: 'Summon an intelligent warhorse',
    type: FEATURE_TYPE.ABILITY,
  },
  AURA_OF_PROTECTION: {
    name: 'Aura of Protection',
    description: "+2 to saving throws & AC and +4 to morale for allies in a 10' radius by holding aloft a Holy Sword",
    type: FEATURE_TYPE.INHERENT,
  },
  BANISH_EVIL: {
    name: 'Banish Evil',
    description: 'Banish evil summoned/extraplanar creatures by striking them with a Holy Sword',
    type: FEATURE_TYPE.ABILITY,
  },
  TRUE_SIGHT: {
    name: 'True Sight',
    description: 'True Sight 1/day every 4 levels',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
  },
  ANCIENT_HATRED: {
    name: 'Ancient Hatred',
    description: '+1 damage every 3 levels against evil humanoids',
    type: FEATURE_TYPE.INHERENT, // TODO program in attack macro
    effectData: {
      label: 'Damage Bonus vs. Humanoids',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.dmg_bonus_humanoid',
          mode: 2,
          value: 1,
        },
      ],
    },
  },
  ANCIENT_HATRED_UNDEAD: {
    name: 'Ancient Hatred',
    description: '+1 damage every 3 levels against the undead',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Damage Bonus vs. Undead',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.dmg_bonus_undead',
          mode: 2,
          value: 1,
        },
      ],
    },
  },
  ALERT: {
    name: 'Alert',
    description: "Reduces the party's chance of being surprised",
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Listening Bonus',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.skills.listening.lvl',
          mode: 2,
          value: 4,
        },
      ],
    },
  },
  NEUTRALIZE_POISON: {
    name: 'Neutralize Poison',
    description: 'Apply a magic poultice to neutralize poison 1/day',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
    usesPer: {
      uses: 1,
      interval: 'day',
    },
  },
  RESTORE_ENERGY_DRAIN: {
    name: 'Reastore Energy Drain',
    description: "Cleanse a victim's blood to restore energy drain 1/week",
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
    usesPer: {
      uses: 1,
      interval: 'week',
    },
  },
  AMBIDEXTROUS: {
    // TODO derive in actor.js from ability scores if have this feature
    name: 'Ambidextrous', // TODO use derived penalties in attack macro
    description: 'Halved two-weapon fighting penalties',
    type: FEATURE_TYPE.INHERENT,
  },
  RELUCTANT_LEADER: {
    name: 'Reluctant Leader',
    description: 'Cannot lead retainers or followers until level 8',
    excludeReqLvlFromDesc: true,
    type: FEATURE_TYPE.INHERENT,
  },
  MASTERY_OF_THE_STONE: {
    name: 'Mastery of the Stone',
    description: 'Employ magic items pertaining to clairaudience, clairvoyance and telepathy',
    type: FEATURE_TYPE.ABILITY,
  },
  ENERGY_DRAIN_RESISTANCE: {
    name: 'Energy Drain Resistance',
    description: '+4 to saving throws vs. energy drain',
    type: FEATURE_TYPE.INHERENT,
  },
  IMPROVED_EVASION: {
    name: 'Improved Evasion',
    description: '+3 to evasion saving throws',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Improved Evasion',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.attributes.save_evasion.value',
          mode: 2,
          value: 3,
        },
      ],
    },
  },
  IDENTIFY_PURE_WATER: {
    name: 'Identify Pure Water',
    description: 'Identify pure water',
    type: FEATURE_TYPE.ABILITY,
  },
  PASS_WITHOUT_TRACE: {
    name: 'Pass Without Trace',
    description: 'Pass without trace through woodland areas',
    type: FEATURE_TYPE.ABILITY,
  },
  SYLVAN_CHARM_IMMUNITY: {
    name: 'Sylvan Charm Immunity',
    description: 'Immune to charm by sylvan creatures',
    type: FEATURE_TYPE.INHERENT,
  },
  ANIMAL_FORM: {
    name: 'Animal Form',
    description: 'Transform into a reptile, bird or mammal',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
    usesPer: {
      uses: 3,
      interval: 'day',
    },
  },
  QUICK_TO_MASTER: {
    name: 'Quick to Master',
    description: 'Prime requisite XP bonus (+10% if score is 16+, +20% if 18+)',
    type: FEATURE_TYPE.INHERENT,
  },
  COMMANDING: {
    name: 'Commanding',
    description: '+1 Strength, +1 Charisma',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  DELICATE: {
    name: 'DELICATE',
    description: '+1 Charisma, -1 Constitution',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  INFRAVISION: {
    name: 'Infravision',
    description: "Infravision 60'",
    type: FEATURE_TYPE.INHERENT,
  },
  BRUTAL: {
    name: 'Brutal',
    description: '+1 Strength, -1 Intelligence',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  BEASTMARKED: {
    name: 'Beastmarked',
    description: '-1 to Reaction',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Beastmarked',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.reaction_mod',
          mode: 2,
          value: -1,
        },
      ],
    },
  },
  COMELY: {
    name: 'COMELY',
    description: '+1 to Reaction',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Beastmarked',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.reaction_mod',
          mode: 2,
          value: 1,
        },
      ],
    },
  },
  GRACILE: {
    name: 'Gracile',
    description: '+1 Dexterity, +1 Intelligence, -2 Constitution',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  ENIGMATIC_MIND: {
    name: 'Enigmatic Mind',
    description: "Immune to magical sleep, charm and ghoul's paralysis",
    type: FEATURE_TYPE.INHERENT,
  },
  KEEN_SIGHT: {
    name: 'Keen Sight',
    description: '+4 to Searching and passively notices secret doors',
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
    // TODO implement this
    name: 'Parting Gift',
    description: 'Begins with a valuable item',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  WORLDBOUND: {
    name: 'Worldbound',
    description: 'Cannot be raised from the dead',
    type: FEATURE_TYPE.INHERENT,
  },
  HARDY: {
    name: 'Hardy',
    description: '+4 to saving throws vs. poison and petrification',
    type: FEATURE_TYPE.INHERENT,
  },
  STOLID: {
    name: 'Stolid',
    description: '+2 Constitution, -2 Charisma',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  DUNGEON_NAVIGATOR: {
    name: 'Dungeon Navigator',
    description: 'Senses their depth underground and passively notices stonework traps',
    type: FEATURE_TYPE.INHERENT,
  },
  ANCESTRAL_TREASURE: {
    name: 'Ancestral Treasure',
    description: 'Ancestral Treasure',
    type: FEATURE_TYPE.INHERENT,
  },
  SMALL_ARMS: {
    name: 'Small Arms', // TODO cannot wield size H swords or bows
    description: ['Cannot wield greatswords or longbows', 'Maximum 9 move'],
    type: FEATURE_TYPE.INHERENT,
  },
  UNCANNY_SHOT: {
    name: 'Uncanny Shot',
    description: '+3 to hit with missile weapons',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Uncanny Shot',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.missile_to_hit_mod',
          mode: 2,
          value: 3,
        },
      ],
    },
  },
  DIMINUTIVE: {
    name: 'Diminutive',
    description: '+4 to Hiding',
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
    description: '+4 to saving throws vs. fear',
    type: FEATURE_TYPE.INHERENT,
  },
  LITTLE_FINGERS: {
    name: 'Little fingers',
    description: '+2 Dexterity, -2 Strength',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  IRON_STOMACH: {
    name: 'Iron Stomach',
    description: 'Can consume raw meat, rotten food or unclean water without risk of disease',
    type: FEATURE_TYPE.INHERENT,
  },
  MONSTROUS: {
    name: 'Monstrous',
    description: '+3 Strength, -2 Dexterity, -3 Charisma',
    type: FEATURE_TYPE.INHERENT,
    virtual: true,
  },
  FELL_COUNTENANCE: {
    name: 'Fell Countenance',
    description: '-2 to Reaction',
    type: FEATURE_TYPE.INHERENT,
    effectData: {
      label: 'Fell Countenance',
      icon: 'icons/svg/aura.svg',
      changes: [
        {
          key: 'data.reaction_mod',
          mode: 2,
          value: -2,
        },
      ],
    },
  },
  SUPPLE_MIND: {
    name: 'Supple Mind',
    description: '+4 to saving throws vs. magical sleep and charm',
    type: FEATURE_TYPE.INHERENT,
  },
  SHARP_SIGHT: {
    name: 'Sharp Sight',
    description: '+2 to Searching',
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
    description:
      'Thrice per day, can blow magic dust upon a creature to make them either: invisible for 1 turn, fly for 1d4 rounds, or fall asleep',
    type: FEATURE_TYPE.LIMITED_USE_ABILITY,
    usesPer: {
      uses: 3,
      interval: 'day',
    },
  },
  NATURAL_INVISIBILITY: {
    name: 'Natural Invisibility',
    description: 'Can become invisible at will',
    type: FEATURE_TYPE.ABILITY,
  },
  FLIGHTY: {
    name: 'Flighty',
    description: '+3 Dexterity, -2 Wisdom, -3 Strength',
    type: FEATURE_TYPE.ABILITY,
    virtual: true,
  },
  NATURAL_FLIGHT: {
    name: 'Natural Flight',
    description: 'Can fly at will',
    type: FEATURE_TYPE.ABILITY,
  },
});
