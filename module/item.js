import { EntitySheetHelper, getArrFromCSV, roundToDecimal } from './helper.js';
import * as Constant from './constants.js';
import { SIZE_VALUES, sizeMulti } from './rules/size.js';
import { SHIELD_COVERAGE, SHIELD_WEIGHT_WORN_MULTI, FIXED_HELM_WEIGHT_WORN_MULTI } from './rules/helms-and-shields.js';
import { HIT_LOCATION_LIST, hitLocations, HIT_LOC_WEIGHT_INDEXES } from './rules/hit-locations.js';
import { garmentMaterials, armorVsDmgType } from './rules/armor-and-clothing.js';
import { PHYSICAL_DMG_TYPES_LIST } from './rules/attack-and-damage.js';
import { ITEM_TYPES } from './item-helper.js';
import { ATK_MODES } from './rules/attack-and-damage.js';

/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class BrigandineItem extends Item {
  /** @override*/
  prepareBaseData() {
    super.prepareBaseData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};

    const itemData = this.data;
    this._addCoverage(itemData);
    this._addDurability(itemData);
  }

  /** @inheritdoc */
  async prepareDerivedData() {
    super.prepareDerivedData();
    const itemData = this.data;

    this._prepareItemData(itemData);

    // armor, clothing, shield, helm
    this._prepareGarmentData(itemData);

    // melee weapon
    this._prepareMeleeWeaponData(itemData);

    // missile weapon, bow
    // this._prepareMissileWeaponData(itemData);

    // // spell_magic, spell_cleric, spell_druid
    // this._prepareSpellData(itemData);
    // this._prepareCurrencyData(itemData);
    // this._prepareGemData(itemData);

    // this._prepareSkillData(itemData);
  }

  _addTotalWeight(data) {
    if (data.quantity == null || data.weight == null) return;
    const emptyWeight = data.attributes.empty_weight?.value || 0;
    data.total_weight = Math.max(0.1, roundToDecimal(data.weight * data.quantity, 1)) + emptyWeight;
  }

  _prepareItemData(itemData) {
    const { data } = itemData;
    this._addTotalWeight(data);

    if (itemData.data.attributes.size) {
      const size = itemData.data.attributes.size.value;
      data.size_val = SIZE_VALUES[size] || SIZE_VALUES.default;
    }
  }

  _getShieldCoverage(itemData) {
    if (itemData.type !== ITEM_TYPES.SHIELD) return '';
    const data = itemData.data;
    const shape = data.attributes.shape.value;
    const size = data.attributes.size.value;
    return SHIELD_COVERAGE[shape]?.[size]?.mid || '';
  }

  _addCoverage(itemData) {
    if ([ITEM_TYPES.ARMOR, ITEM_TYPES.HELM, ITEM_TYPES.SHIELD, ITEM_TYPES.CLOTHING].includes(itemData.type) === false) {
      return;
    }
    const data = itemData.data;
    const isShield = itemData.type === ITEM_TYPES.SHIELD;
    let coverageArr = [];
    if (isShield) {
      coverageArr = this._getShieldCoverage(itemData);
    } else {
      coverageArr =
        getArrFromCSV(data.attributes.coverage?.value)
          .map((a) => a.toLowerCase().replace(' ', ''))
          .filter((l) => HIT_LOCATION_LIST.includes(l)) || [];
    }
    data.coverage = coverageArr;
  }

  _addWeight(itemData) {
    const data = itemData.data;
    const isShield = itemData.type === ITEM_TYPES.SHIELD;
    const isFixedHelm = itemData.type === ITEM_TYPES.HELM && data.attributes.fixed.value;
    const material = data.attributes.material.value;
    const isMagic = data.attributes.admin?.magic.value;
    let materialWgt = garmentMaterials[material]?.weight || 0;
    if (isMagic) materialWgt = Math.round(materialWgt / 2);
    const size = data.attributes.size.value;
    const sizeVal = SIZE_VALUES[size] || SIZE_VALUES.default;

    // unworn weight
    const idx = HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN;
    const unwornWgtProportion = data.coverage.reduce((sum, l) => sum + hitLocations[l].weights[idx], 0) / 100;
    let unwornWeight = sizeMulti(materialWgt * unwornWgtProportion, sizeVal);
    if (isShield) {
      // divide weight in half since a shield only covers half the body
      unwornWeight = Math.round(unwornWeight / 2);
      const shape = data.attributes.shape.value;
      const weightMulti = SHIELD_COVERAGE[shape]?.[size]?.weight_multi || 1;
      unwornWeight *= weightMulti;
    }
    data.derived = data.derived || {};
    data.derived.weight = roundToDecimal(unwornWeight, 1);

    // worn weight
    if (isShield) {
      data.worn_weight = roundToDecimal(data.weight * SHIELD_WEIGHT_WORN_MULTI, 1);
    } else if (isFixedHelm) {
      data.worn_weight = roundToDecimal(data.weight * FIXED_HELM_WEIGHT_WORN_MULTI, 1);
    } else {
      const idx = HIT_LOC_WEIGHT_INDEXES.WEIGHT_WORN;
      const wornWgtProportion = data.coverage.reduce((sum, l) => sum + hitLocations[l].weights[idx], 0) / 100;
      const wornWeight = sizeMulti(materialWgt * wornWgtProportion, sizeVal);
      data.worn_weight = roundToDecimal(wornWeight, 1);
    }

    // total weight
    const isWorn = !!data.worn;
    const totalWeight = isWorn ? data.worn_weight * data.quantity : data.weight * data.quantity;
    data.total_weight = roundToDecimal(totalWeight, 1);

    // penalty weight
    data.penalty_weight = 0;
    if (isWorn) {
      data.penalty_weight = totalWeight;
    }
  }

  _addValue(itemData) {
    const data = itemData.data;
    const material = data.attributes.material.value;
    const materialMaxValue = garmentMaterials[material]?.value || 0;
    const maxWeight = garmentMaterials[material]?.weight || 1;
    const weightProportion = data.weight / maxWeight;
    const materialValue = Math.round(materialMaxValue * weightProportion);

    const value = data.attributes.value;
    value.derived = value.derived || {};
    value.derived.value = materialValue;
  }

  _addClo(itemData) {
    const data = itemData.data;
    const material = data.attributes.material.value;
    data.clo = garmentMaterials[material]?.clo || 0;
  }

  _addACandDR(itemData) {
    if ([ITEM_TYPES.ARMOR, ITEM_TYPES.HELM, ITEM_TYPES.SHIELD].includes(itemData.type) === false) {
      return;
    }

    const data = itemData.data;
    const material = data.attributes.material.value;
    const materialAcMods = armorVsDmgType[material] || {};

    const acMod = +data.attributes.ac_mod.value || 0;
    const baseAc = (materialAcMods.baseAc || 0) + acMod;

    data.ac = { baseAc };
    PHYSICAL_DMG_TYPES_LIST.forEach((dmgType) => {
      data.ac[dmgType] = { ...materialAcMods[dmgType] };
      data.ac[dmgType].ac += baseAc;
      // add 1 AC & DR if Shield
      if (itemData.type === ITEM_TYPES.SHIELD) {
        data.ac[dmgType].ac += 1;
        data.ac[dmgType].dr += 1;
      }
    });
  }

  _addDurability(itemData) {
    if ([ITEM_TYPES.ARMOR, ITEM_TYPES.HELM, ITEM_TYPES.SHIELD, ITEM_TYPES.CLOTHING].includes(itemData.type) === false) {
      return;
    }

    const data = itemData.data;
    const material = data.attributes.material.value;
    const materialProps = garmentMaterials[material];
    const maxDurability = materialProps?.durability || 0;
    const coverageWeight =
      data.coverage.reduce(
        (sum, l) =>
          sum +
          hitLocations[l].weights[HIT_LOC_WEIGHT_INDEXES.SWING] +
          hitLocations[l].weights[HIT_LOC_WEIGHT_INDEXES.THRUST],
        0
      ) / 200;
    const durability = Math.max(1, Math.round(maxDurability * coverageWeight));

    data.durability = durability;
    const hp = data.attributes.hp;
    hp.derived = hp.derived || {};
    hp.derived.max = durability;
  }

  // TODO list of critical effects with mods for defender saving throw
  // on critical, auto roll the defender's save, and show the valid effect choices to the attacker!!
  // start with fumble results, remove fumble rolls

  _prepareGarmentData(itemData) {
    if ([ITEM_TYPES.ARMOR, ITEM_TYPES.HELM, ITEM_TYPES.SHIELD, ITEM_TYPES.CLOTHING].includes(itemData.type) === false) {
      return;
    }

    this._addWeight(itemData);
    this._addValue(itemData);
    this._addClo(itemData);
    this._addACandDR(itemData);

    // TODO weapons get stuck if they impale and do >= max weapon damage as rolled impale damage
    // TODO Rapier is Reach 1 but does have a lunge attack -- step forward and back
  }

  _prepareMeleeWeaponData(itemData) {
    if (itemData.type !== ITEM_TYPES.MELEE_WEAPON) return;

    const { data } = itemData;
    const attrs = data.attributes;

    const atkModes = getArrFromCSV(attrs.atk_modes.value)
      .map((a) => a.toLowerCase().replace(' ', ''))
      .filter((a) => Object.keys(ATK_MODES).includes(a));

    const currMode = atkModes.includes(data.atk_mode) ? data.atk_mode : '';
    data.atk_mode = currMode || atkModes[0] || '';

    // suggest derived reach from weapon length
    const length = attrs.length.value;
    const minReach =
      length < 2 ? 'G' : length < 3 ? '0' : length < 8 ? '1' : length < 13 ? '2' : length < 20 ? '3' : '4';
    let maxReach = length < 6 ? '1' : length < 13 ? '2' : length < 20 ? '3' : '4';
    const reach = attrs.reach;
    reach.derived = reach.derived || {};
    reach.derived.value = `${minReach}${maxReach === minReach ? '' : `/${maxReach}`}`;

    // TODO test this and missileData with weapon/missile weapon item
  }

  _prepareMissileWeaponData(itemData) {
    if (itemData.type !== ITEM_TYPES.MISSILE_WEAPON || itemData.type !== ITEM_TYPES.BOW) return;

    const { data } = itemData;
    const ownerItems = this.actor?.data?.items || [];

    const beltedAmmo = ownerItems
      .filter((i) => i.data.data.belted && i.data.type === ITEM_TYPES.MISSILE)
      .map((i) => i.name);

    const currAmmo = beltedAmmo.includes(data.ammo) ? data.ammo : '';
    const ranWornAmmo = beltedAmmo[0]?.name;

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
