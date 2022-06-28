import {EntitySheetHelper} from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class SimpleItem extends Item {

  /** @inheritdoc */
  async prepareDerivedData() {

    // item types: 
    //  armor, clothing, shield
    //  spell_magic, spell_cleric, spell_witch, feature
    //  melee_weapon, missile_weapon, ammo
    //  potion, charged_item, currency, item

    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const itemData = this.data;

    this._prepareGarmentData(itemData);

    return;

    if (this.data.type === 'item') {
      this.prepareItem(itemData)
    }
  }

  _prepareGarmentData(itemData) {
    if ( itemData.type !== 'armor' && itemData.type !== 'clothing' && itemData.type !== 'shield' ) return;

    const attrs = itemData.attributes;
    const material = attrs.material.value.toLowerCase().trim();
    const materialAcMods = Constant.ARMOR_VS_DMG_TYPE[material] || {};
    if (!Object.keys(materialAcMods).length) ui.notifications.error(`${itemData.name} has an incorrect material specified`);
    const materialProps = Constant.MATERIAL_PROPS[material] || {};
    const acMod = +attrs.ac_mod?.value || 0;
    const isMagic = !!attrs.magic?.value;
    const size = attrs.size.value.toUpperCase();
    if (!Constant.SIZE_VALUES[size]) ui.notifications.error(`${itemData.name} has an incorrect size specified`);
    const sizeVal = Constant.SIZE_VALUES[size] ?? 2;
    const isShield = itemData.type === 'shield';


    // coverage
    let coverage = "";
    if (isShield) {
      const shape = attrs.shield_shape.value.toLowerCase();
      const height = itemData.shield_height;
      coverage = Constant.SHIELD_TYPES[shape]?.[size]?.[height] || "";
    } else {
      coverage = itemData.attributes.coverage?.value || "";
    }
    itemData.coverage = Util.getArrFromCSL(coverage).filter( l => Object.keys(Constant.HIT_LOCATIONS).includes( l.toLowerCase() ) ) || [];


    // AC mods
    const baseAc = (materialAcMods.base_AC || 0) + acMod;
    const mdr = isMagic ? acMod : 0;
    itemData.metal = !!materialProps.metal;
    itemData.bulky = !!materialProps.bulky;

    itemData.ac = { mdr, base_ac: baseAc };
    Constant.DMG_TYPES.forEach( dmgType => {
      itemData.ac[dmgType] = {
        ac: baseAc + (materialAcMods[dmgType]?.ac || 0),
        dr: materialAcMods[dmgType]?.dr
      }
    });


    // weight TODO make weight field uneditable on item sheet for armor/shield/clothing //TODO use worn_weight if applicable on actor sheet and enc calc
    const isWorn = !!itemData.worn;
    const getLocationWgt = index => itemData.coverage.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[index], 0);
    const locUnwornWgt = getLocationWgt(Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN);
    const locWornWgt = getLocationWgt(Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_WORN);
    const materialBaseWgt = materialProps.weight || 1;
    let materialWgt = isMagic ? Math.ceil(materialBaseWgt / 2) : materialBaseWgt;
     
    if (isShield) {
      materialWgt = Math.round(materialWgt / 2 * 10) / 10;
      if (sizeVal >= Constant.SIZE_VALUES.L) materialWgt = Math.round(materialWgt * Constant.SHIELD_WEIGHT_MULTI.large * 10) / 10;
      if (isWorn) materialWgt = Math.round(materialWgt * Constant.SHIELD_WEIGHT_MULTI.worn * 10) / 10;
    }

    const getTotalWeight = locWgt => Math.ceil( Util.sizeMulti(materialWgt * locWgt, sizeVal) ) / 100;
    const unwornWeight = getTotalWeight(locUnwornWgt);
    itemData.weight = unwornWeight;
    itemData.worn_weight = getTotalWeight(locWornWgt);

    // clo
    itemData.clo = materialProps.clo;


    // sp value
    const materialValue = materialProps.sp_value || 0;
    const maxWeight = materialProps.weight || unwornWeight;
    const ratio = unwornWeight / maxWeight;
    const baseValue = Math.round(materialValue * ratio * 100) / 100;
    itemData.base_value = baseValue;
    if (attrs.sp_value?.value == null) {
      attrs.sp_value?.value = baseValue;
    }

    // spell failure, skill check penalty and max dex mod penalty
    // for armor and shield
    if (itemData.type === 'clothing') return;

    const paddedOrWood = material === 'padded' || material === 'wood';
    const spellFailure = paddedOrWood ? materialWgt * 5 : materialWgt * 5 / 2;
    itemData.spell_failure = Math.round(spellFailure * locWornWgt) / 100;

    const skillPenalty = spellFailure / 5 - 2;
    itemData.skill_penalty = Math.round(skillPenalty * locWornWgt) / 100;

    const maxDexWeight = paddedOrWood ? materialWgt * 2 : materialWgt;
    itemData.max_dex_penalty = Math.round((4 - (6 - Math.floor(maxDexWeight / 3))) * locWornWgt) / 100; // TODO fix this

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
