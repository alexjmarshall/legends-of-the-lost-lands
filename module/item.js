import { EntitySheetHelper } from './helper.js';
import * as Util from './utils.js';
import * as Constant from './constants.js';

/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class SimpleItem extends Item {
  /** @override*/
  prepareBaseData() {
    super.prepareBaseData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
  }

  /** @inheritdoc */
  async prepareDerivedData() {
    // item types:
    /*
      "item",
      "storage",
      "container",
      "scroll",
      "armor",
      "helm",
      "clothing",
      "gem",
      "trade_good",
      "food",
      "recipe",
      "herb",
      "rune",
      "jewelry",
      "shield",
      "melee_weapon",
      "missile_weapon",
      "bow",
      "missile",
      "currency",
      "spell",
      "feature",
      "natural_weapon",
      "natural_missile_weapon",
      "grappling_maneuver",
      "hit_location",
      "injury",
      "disease"
      */

    super.prepareDerivedData();
    const itemData = this.data;

    this._prepareItemData(itemData);

    // armor, clothing, shield, helm
    this._prepareGarmentData(itemData);
    // // spell_magic, spell_cleric, spell_druid
    // this._prepareSpellData(itemData);
    // this._prepareCurrencyData(itemData);
    // this._prepareGemData(itemData);
    // this._prepareMeleeWeaponData(itemData);
    // this._prepareMissileWeaponData(itemData);
    // this._prepareSkillData(itemData);
  }

  _addTotalWeight(itemData) {
    if (itemData.quantity == null || itemData.weight == null) return;
    itemData.total_weight = Math.round(itemData.weight * itemData.quantity * 10) / 10;
  }

  _prepareItemData(itemData) {
    const { data } = itemData;
    this._addTotalWeight(data);
  }

  _prepareSkillData(itemData) {
    if (itemData.type !== 'skill') return;

    // derived ST
    const { data } = itemData;
    const attrs = data.attributes;
    const baseSt = attrs.base_st?.value;
    const modAttr = attrs.mod_attr?.value;

    const { actor } = itemData.document;
    if (!actor) return;

    const actorData = actor.data;
    const encPenalty = +actorData?.data.armor_check_penalty || 0;
    const attrVal = +actorData?.data.attributes.ability_scores?.[modAttr]?.value || 0;
    const attrMod = Math.floor(attrVal / 3 - 3);
    const st = Math.max(Constant.MIN_SAVE_TARGET, baseSt - attrMod + encPenalty) || 0;

    data.st = st;
  }

  _prepareMeleeWeaponData(itemData) {
    if (itemData.type !== 'melee_weapon' || itemData.type !== 'throw_weapon') return;

    const { data } = itemData;
    const attrs = data.attributes;

    const atkModes = Util.getArrFromCSL(attrs.atk_modes.value)
      .map((a) => a.toLowerCase().replace(' ', ''))
      .filter((a) => Object.keys(Constant.ATK_MODES).includes(a));

    const currMode = atkModes.includes(data.atk_mode) ? data.atk_mode : '';

    data.atk_mode = currMode || atkModes[0] || '';
  }

  _prepareMissileWeaponData(itemData) {
    if (itemData.type !== 'missile_weapon' || itemData.type !== 'bow') return;

    const { data } = itemData;
    const attrs = data.attributes;
    const proficiency = attrs.proficiency.value;
    const ownerItems = this.actor?.data?.items || [];

    const wornAmmo = ownerItems
      .filter((i) => i.data.data.worn && Util.stringMatch(i.data.data.attributes.proficiency?.value, proficiency))
      .map((i) => i.name);

    const currAmmo = wornAmmo.includes(data.ammo) ? data.ammo : '';
    const ranWornAmmo = wornAmmo[0]?.name;

    data.ammo = currAmmo || ranWornAmmo || '';
  }

  _prepareGemData(itemData) {
    if (itemData.type !== 'gem') return;

    const { data } = itemData;
    const attrs = data.attributes;
    const { isGM } = game.user;

    // select menu options
    attrs.gem_type.options = Object.keys(Constant.GEM_BASE_VALUE); // TODO in item-sheet.js instead?
    if (isGM && attrs.gem_type.options.length) {
      attrs.gem_type.isSelect = true;
    }
    attrs.quality.options = Object.keys(Constant.GEM_QUALITY_ADJ);
    if (isGM && attrs.quality.options.length) {
      attrs.quality.isSelect = true;
    }

    const deriveAttrFromValue = attrs.admin.derive_from_value;
    if (deriveAttrFromValue) {
      // derive gem type, weight and quality from value
      const value = +data.value;
      const gemType =
        Object.entries(Constant.GEM_BASE_VALUE).reduce((a, b) => (value >= b[1] ? b[0] : a), null) || 'ornamental';
      const ranNum = Math.ceil(Math.random() * 112);
      const quality = ranNum < 11 ? 'AAA' : ranNum < 25 ? 'AA' : ranNum < 45 ? 'A' : ranNum < 73 ? 'B' : 'C';
      const baseValue = Constant.GEM_BASE_VALUE[gemType];
      const qualityValue = baseValue * Constant.GEM_QUALITY_ADJ[quality];
      const weightAdj = value / qualityValue;
      const weightRatio = Math.sqrt(weightAdj);
      const weight = Math.round(weightRatio * Constant.GEM_DEFAULT_WEIGHT * 100) / 100;

      data.weight = weight;
      attrs.gem_type.value = gemType;
      attrs.quality.value = quality;
    } else {
      // derive value from gem type, weight and quality
      const gemType = attrs.gem_type.value?.trim().toLowerCase();
      const weight = +data.weight;
      const quality = attrs.quality.value?.trim().toUpperCase();

      const baseValue = Constant.GEM_BASE_VALUE[gemType];
      const weightFactor = Constant.GEM_WEIGHT_ADJ(weight / Constant.GEM_DEFAULT_WEIGHT);
      const qualityFactor = Constant.GEM_QUALITY_ADJ[quality];

      const value = Math.round(baseValue * weightFactor * qualityFactor) || 0;
      data.value = data.value || value;
    }
  }

  _prepareCurrencyData(itemData) {
    if (itemData.type !== 'currency') return;

    const { data } = itemData;
    const attrs = data.attributes;

    // value by material and weight
    const material = attrs.material.value;
    const weight = +data.weight;
    const valuePerPound = +Constant.CURRENCY_MATERIAL_VALUE_PER_POUND[material];
    const baseValue = Math.round(weight * valuePerPound) || 0;
    data.value = data.value || baseValue;
  }

  _prepareSpellData(itemData) {
    if (itemData.type !== 'spell_magic' && itemData.type !== 'spell_cleric' && itemData.type !== 'spell_druid') return;

    const { data } = itemData;
    const attrs = data.attributes;

    // sound default = school
    const school = attrs.school.value.toLowerCase().trim();
    if (!Constant.SPELL_SCHOOLS.includes(school)) {
      console.log(`${itemData.name} has an invalid spell school specified`);
      ui.notifications?.error(`${itemData.name} has an invalid spell school specified`);
    }
    const sound = attrs.sound?.value;
    data.sound = sound || school;

    // animation default = school
    const animation = attrs.animation?.value;
    data.animation = animation || school;
  }

  _prepareGarmentData(itemData) {
    // CONTINUE
    // TODO increase ability scores on level up based on skill increases
    // show dialog notifying new features, improved features (uses per day or effect data), hp rolled, skill and ability score increases
    if (
      itemData.type !== 'armor' &&
      itemData.type !== 'helm' &&
      itemData.type !== 'clothing' &&
      itemData.type !== 'shield'
    )
      return;

    const { data } = itemData;
    const attrs = data.attributes;
    const material = attrs.material.value.toLowerCase().trim();
    const materialAcMods = Constant.armorVsDmgType[material] || {};
    const materialProps = Constant.GARMENT_MATERIALS[material] || {};
    if (!Object.keys(materialAcMods).length && !Object.keys(materialProps).length) {
      console.log(`${itemData.name} has an incorrect material specified`);
      ui.notifications?.error(`${itemData.name} has an incorrect material specified`);
    }
    const isMagic = !!attrs.admin?.magic.value;
    const acMod = isMagic ? +attrs.magic_mods?.ac_mod.value || 0 : 0;
    const isShield = itemData.type === 'shield';

    // size
    const size = Constant.SIZE_VALUES[attrs.size.value.toUpperCase().trim()] ?? Constant.SIZE_VALUES.default;
    data.size = size;

    // coverage
    let coverage = '';
    if (isShield) {
      const shape = attrs.shape.value.toLowerCase();
      const height = data.held_height;
      coverage = Constant.SHIELD_TYPES[shape]?.[size]?.[height] || coverage;
    } else {
      coverage = attrs.coverage?.value || coverage;
    }
    const coverageArr =
      Util.getArrFromCSL(coverage).filter((l) => Object.keys(Constant.HIT_LOCATIONS).includes(l.toLowerCase())) || [];
    data.coverage = coverageArr;

    // AC mods if not clothing
    if (itemData.type !== 'clothing') {
      const baseAc = (materialAcMods.base_AC || 0) + acMod;
      const mdr = isMagic ? acMod : 0;
      data.metal = !!materialProps.metal;
      data.bulky = !!materialProps.bulky;

      data.ac = { mdr, base_ac: baseAc };
      Constant.DMG_TYPES.forEach((dmgType) => {
        data.ac[dmgType] = {
          ac: baseAc + (materialAcMods[dmgType]?.ac || 0),
          dr: materialAcMods[dmgType]?.dr,
        };
      });
    }

    // weight
    const isWorn = !!data.worn;
    const getLocationWgt = (index) =>
      data.coverage.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[index], 0);
    const locUnwornWgt = getLocationWgt(Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN);
    const baseLocWornWgt = getLocationWgt(Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_WORN);
    let locWornWgt = attrs.fixed?.value ? Math.round(baseLocWornWgt / 2) : baseLocWornWgt;
    const materialBaseWgt = materialProps.weight || 1;

    if (isShield) {
      materialBaseWgt = Math.round((materialBaseWgt / 2) * 10) / 10;
      if (size >= Constant.SIZE_VALUES.L)
        materialBaseWgt = Math.round(materialBaseWgt * Constant.SHIELD_WEIGHT_MULTI.large * 10) / 10;
      if (isWorn) locWornWgt = Math.round(locWornWgt * Constant.SHIELD_WEIGHT_MULTI.worn * 10) / 10;
    }

    const materialWgt = isMagic ? Math.round(materialBaseWgt / 2) : materialBaseWgt;

    const getTotalWeight = (locWgt, matWgt) => Math.round(Util.sizeMulti(matWgt * locWgt, size) / 10) / 10;
    const unwornWeight = getTotalWeight(locUnwornWgt, materialWgt);
    const wornWeight = getTotalWeight(locWornWgt, materialWgt);
    const qty = +data.quantity || 0;
    const totalWeight = isWorn ? wornWeight * qty : unwornWeight * qty;

    const currWeight = data.weight;
    data.weight = currWeight || unwornWeight;
    data.total_weight = currWeight ? Math.round(((totalWeight * currWeight) / unwornWeight) * 10) / 10 : totalWeight;

    const paddedOrWood = material === 'padded' || material === 'wood';
    data.penalty_weight = !isWorn ? 0 : paddedOrWood ? totalWeight * 2 : totalWeight;

    // clo
    data.clo = materialProps.clo;

    // value
    const materialValue = materialProps.value || 0;
    const valueWgt = getTotalWeight(locUnwornWgt, materialBaseWgt);
    const maxWeight = materialProps.weight || valueWgt || 1;
    const ratio = valueWgt / maxWeight;
    const baseValue = Math.round(materialValue * ratio);
    data.value = data.value || baseValue;
  }

  prepareItem(itemData) {
    // populate shield values from constants
    // const isShield = !!itemData.attributes.shape?.value;
    // if (isShield) {
    //   const shape = (itemData.attributes.shape?.value || '').toLowerCase();
    //   const size = (itemData.attributes.size?.value || '').toUpperCase();
    //   if (itemData.attributes.coverage) {
    //     const stance = itemData.held_height || 'mid';
    //     itemData.attributes.coverage.value = Constant.SHIELD_TYPES[shape]?.[size]?.[stance] || '';
    //   }
    // }

    // AC mods
    // TODO how to handle non-armor magic AC items? e.g. cloak of protection

    // armor values
    // if (!!materialAcMods && locations.length) {
    //   let baseAc = materialAcMods.base_AC + acMod;
    //   const mdr = isMagic ? acMod : 0;

    //   // infer max base ac, metal and bulky property values from material
    //   if (itemData.attributes.base_ac?.max !== undefined) {
    //     itemData.attributes.base_ac.max = baseAc;
    //     baseAc = itemData.attributes.base_ac.value ?? baseAc;
    //   }
    //   if (itemData.attributes.metal) {
    //     itemData.attributes.metal.value = materialProps.metal;
    //   }
    //   if (itemData.attributes.bulky) {
    //     itemData.attributes.bulky.value = materialProps.bulky;
    //   }

    //   let acBonus = isShield ? baseAc : Constant.DEFAULT_BASE_AC + baseAc;

    // } else {
    //   itemData.ac = {};
    // }

    // derive weight from size for weapons
    // const isWeapon = !!itemData.attributes.atk_modes;
    // const size = Constant.SIZE_VALUES[itemData.attributes.size?.value];
    // if (isWeapon && size != null) {
    //   itemData.weight = Math.max(0.5, size);
    // }

    // armor/clothing clo, weight and max Dex mod
    if (materialProps && locations.length) {
      // const totalLocationWeight = locations.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[weightingsIndex], 0);// TODO fix value changing with worn weight...do totalLocWeight Transformation last
      // let weight = Math.round(materialProps.weight * totalLocationWeight) / 100;
      // if (isShield) {
      //   weight = Math.round(weight / 2 * 10) / 10;
      //   if (size >= Constant.SIZE_VALUES.L) weight = Math.round(weight * Constant.SHIELD_WEIGHT_MULTI.large * 10) / 10;
      //   if (isWorn) weight = Math.round(weight * Constant.SHIELD_WEIGHT_MULTI.worn * 10) / 10;
      // }
      // // if magic item, halve weight
      // if (isMagic) weight = Math.round(weight / 2 * 10) / 10;
      // // adjust garment weight by owner size
      // const ownerData = this.actor?.data?.data;
      // const isGarment = !itemData.attributes.shape?.value;
      // if (ownerData && isGarment) {
      //   const charSize = Constant.SIZE_VALUES[ownerData.attributes?.size?.value] ?? 2;
      //   weight = Math.round( Util.sizeMulti(weight, charSize) * 10 ) / 10;
      // }
      // itemData.weight = weight;
      // // clo
      // itemData.clo = materialProps.clo;
    }
  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data = {}, options = {}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }
}
