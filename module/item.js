import {EntitySheetHelper} from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class SimpleItem extends Item {

  /** @inheritdoc */
  async prepareDerivedData() {console.log(`updatin item ${this.data.name}`)

    // item types: 
    //  armor, clothing, shield, helmet, jewelry
    //  spell_magic, spell_cleric, spell_witch
    //  feature, skill, natural_weapon, grapple_maneuver
    //  melee_weapon, missile_weapon, ammo
    //  potion, charged_item, currency, item

    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const itemData = this.data;

    // armor, clothing, shield, helmet
    this._prepareGarmentData(itemData);
    // spell_magic, spell_cleric, spell_witch
    this._prepareSpellData(itemData);
    //  feature, skill, natural_weapon, grapple_maneuver

    return;

    if (this.data.type === 'item') {
      this.prepareItem(itemData)
    }
  }

  _prepareSpellData(itemData) {
    if (itemData.type !== 'spell_magic' && itemData.type !== 'spell_cleric' && itemData.type !== 'spell_witch') return;

    const data = itemData.data;
    const attrs = data.attributes;

    // sound default = school
    const school = attrs.school.value.toLowerCase().trim();
    if (!Constant.SPELL_SCHOOLS.includes(school)) ui.notifications.error(`${school} is not a valid spell school.`);
    const sound = attrs.sound?.value;
    data.sound = sound || school;

    // animation default = school
    const animation = attrs.animation?.value;
    data.animation = animation || school;
  }

  _prepareGarmentData(itemData) {
    if ( itemData.type !== 'armor' && itemData.type !== 'helmet' && itemData.type !== 'clothing' && itemData.type !== 'shield' ) return;

    const data = itemData.data;
    const attrs = data.attributes;
    const material = attrs.material.value.toLowerCase().trim();
    const materialAcMods = Constant.ARMOR_VS_DMG_TYPE[material] || {};
    const materialProps = Constant.MATERIAL_PROPS[material] || {};
    if (!Object.keys(materialAcMods).length && !Object.keys(materialProps).length) {
      ui.notifications.error(`${itemData.name} has an incorrect material specified`);
    } 
    const isMagic = !!attrs.magic?.value;
    const acMod = isMagic ? (+attrs.ac_mod?.value || 0) : 0;
    const isShield = itemData.type === 'shield';

    // size
    const size = Constant.SIZE_VALUES[attrs.size.value.toUpperCase().trim()] ?? Constant.SIZE_VALUES.default;
    data.size = size;

    // coverage
    let coverage = "";
    if (isShield) {
      const shape = attrs.shield_shape.value.toLowerCase();
      const height = data.shield_height;
      coverage = Constant.SHIELD_TYPES[shape]?.[size]?.[height] || coverage;
    } else {
      coverage = attrs.coverage?.value || coverage;
    }
    const coverageArr = Util.getArrFromCSL(coverage).filter( l => Object.keys(Constant.HIT_LOCATIONS).includes( l.toLowerCase() ) ) || [];
    data.coverage = coverageArr;
    

    // AC mods if not clothing
    if (itemData.type !== 'clothing') {
      const baseAc = (materialAcMods.base_AC || 0) + acMod;
      const mdr = isMagic ? acMod : 0;
      data.metal = !!materialProps.metal;
      data.bulky = !!materialProps.bulky;

      data.ac = { mdr, base_ac: baseAc };
      Constant.DMG_TYPES.forEach( dmgType => {
        data.ac[dmgType] = {
          ac: baseAc + (materialAcMods[dmgType]?.ac || 0),
          dr: materialAcMods[dmgType]?.dr
        }
      });
    }


    // weight
    const isWorn = !!data.worn;
    const getLocationWgt = index => data.coverage.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[index], 0);
    const locUnwornWgt = getLocationWgt(Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN);
    const baseLocWornWgt = getLocationWgt(Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_WORN);
    let locWornWgt = attrs.attached?.value ? Math.ceil(baseLocWornWgt / 2) : baseLocWornWgt;
    const materialBaseWgt = materialProps.weight || 1;
    
    if (isShield) {
      materialBaseWgt = Math.round(materialBaseWgt / 2 * 10) / 10;
      if (size >= Constant.SIZE_VALUES.L) materialBaseWgt = Math.round(materialBaseWgt * Constant.SHIELD_WEIGHT_MULTI.large * 10) / 10;
      if (isWorn) locWornWgt = Math.round(locWornWgt * Constant.SHIELD_WEIGHT_MULTI.worn * 10) / 10;
    }
    
    const materialWgt = isMagic ? Math.ceil(materialBaseWgt / 2) : materialBaseWgt;

    const getTotalWeight = (locWgt, matWgt) => Math.ceil( Util.sizeMulti(matWgt * locWgt, size) / 10) / 10;
    const unwornWeight = getTotalWeight(locUnwornWgt, materialWgt);
    data.weight = unwornWeight;
    const wornWeight = getTotalWeight(locWornWgt, materialWgt);
    const qty = data.quantity || 0;
    const totalWeight = isWorn ? wornWeight * qty : unwornWeight * qty;
    data.total_weight = totalWeight;
    const paddedOrWood = material === 'padded' || material === 'wood';
    data.penalty_weight = !isWorn ? 0 : paddedOrWood ? totalWeight * 2 : totalWeight;


    // clo
    data.clo = materialProps.clo;


    // sp value
    const materialValue = materialProps.sp_value || 0;
    const valueWgt = getTotalWeight(locUnwornWgt, materialBaseWgt);
    const maxWeight = materialProps.weight || valueWgt || 1;
    const ratio = valueWgt / maxWeight;
    const baseValue = Math.round(materialValue * ratio * 10) / 10;
    data.base_value = baseValue;
    if (!attrs.sp_value.value) attrs.sp_value.value = baseValue;
  }

  prepareItem(itemData) {
    // populate shield values from constants
    // const isShield = !!itemData.attributes.shield_shape?.value;
    // if (isShield) {
    //   const shape = (itemData.attributes.shield_shape?.value || '').toLowerCase();
    //   const size = (itemData.attributes.size?.value || '').toUpperCase();
    //   if (itemData.attributes.coverage) {
    //     const stance = itemData.shield_height || 'mid';
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
      

      // const totalLocationWeight = locations.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[weightingsIndex], 0);// TODO fix sp_value changing with worn weight...do totalLocWeight Transformation last
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
      // const isGarment = !itemData.attributes.shield_shape?.value;
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
  static async createDialog(data={}, options={}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }
}
