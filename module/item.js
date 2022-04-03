import {EntitySheetHelper} from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class SimpleItem extends Item {

  /*attributes:
  * spells:
  * lvl: number
  * range: number in feet
  * duration: string
  * area: string
  * 
  * value: number in gp
  * 
  * held items:
  * atk_mod, dmg, dmg_mod, holdable, reach, size, speed
  * 
  * worn items:
  * ac_mod, magic, material, coverage, wearable, rigid, st_mod
  */

  /** @inheritdoc */
  async prepareDerivedData() {
    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const itemData = this.data.data;
    // const updateData = {};

    // populate shield values from constants
    const isShield = itemData.attributes.shield?.value;
    if (isShield) {
      const sizes = {L: "large", M: "medium"};
      const size = sizes[itemData.attributes.size?.value];
      if (itemData.attributes.material?.value) {
        itemData.attributes.material.value = Constant.SHIELD_TYPES[size].material;
      }
      if (itemData.attributes.coverage?.value) {
        itemData.attributes.coverage.value = Constant.SHIELD_TYPES[size].coverage;
      }
    }

    // AC mods
    // TODO how to handle non-armor magic AC items?
    const material = String(itemData.attributes.material?.value).toLowerCase().trim();
    const materialAcMods = Constant.ARMOR_VS_DMG_TYPE[material];
    const materialProps = Constant.MATERIAL_PROPS[material];
    const coverage = itemData.attributes.coverage?.value || '';
    const acMod = +itemData.attributes.ac_mod?.value || 0;
    const isMagic = !!itemData.attributes.magic?.value;
    const locations = Util.getArrFromCSL(coverage).filter(l => Object.keys(Constant.HIT_LOCATIONS).includes(l.toLowerCase()));

    itemData.locations = locations;

    // armor values
    if (!!materialAcMods && locations.length) {
      let baseAc = materialAcMods.base_AC + acMod;
      let mdr = 0;
      // if magical, add acMod to mdr
      if (isMagic) {
        mdr = acMod;
      }

      // infer max base ac, metal and rigid property values from material
      if (itemData.attributes.base_ac?.max !== undefined) {
        itemData.attributes.base_ac.max = baseAc;
        baseAc = itemData.attributes.base_ac.value ?? baseAc;
      }
      if (materialProps.metal && itemData.attributes.metal) {
        itemData.attributes.metal.value = materialProps.metal;
      }
      if (materialProps.rigid && itemData.attributes.rigid) {
        itemData.attributes.rigid.value = materialProps.rigid;
      }

      let acBonus = isShield ? baseAc : Constant.AC_MIN + baseAc;

      itemData.ac = {
        mdr,
        blunt: {
          ac: acBonus + materialAcMods.blunt.ac,
          dr: materialAcMods.blunt.dr
        },
        piercing: {
          ac: acBonus + materialAcMods.piercing.ac,
          dr: materialAcMods.piercing.dr
        },
        slashing: {
          ac: acBonus + materialAcMods.slashing.ac,
          dr: materialAcMods.slashing.dr
        },
      };
    }

    // derive weight from size for weapons
    const isWeapon = !!itemData.attributes.atk_modes;
    const size = Constant.SIZE_VALUES[itemData.attributes.size?.value];
    if (isWeapon && size != null) {
      itemData.weight = Math.max(0.5, size);
    }

    // armor/clothing warmth, weight and max Dex mod
    if (materialProps && locations.length) {
      // weight -- use swing weightings (index 0) if worn, otherwise thrust weightings (index 1)
      const isWorn = !!itemData.worn;
      const weightingsIndex = isWorn ? 0 : 1;
      const totalLocationWeight = locations.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[weightingsIndex], 0);
      let weight = Math.round(materialProps.weight * totalLocationWeight) / 100;
      // if magic item, halve weight
      if (isMagic) weight = Math.round(weight / 2 * 10) / 10;
      // adjust garment weight by owner size
      const ownerData = this.actor?.data?.data;
      const isGarment = !itemData.attributes.shield?.value;
      if (ownerData && isGarment) {
        const charSize = Constant.SIZE_VALUES[ownerData.attributes?.size?.value] ?? 2;
        weight = Math.round( Util.sizeMulti(weight, charSize) * 10 ) / 10;
      }
      itemData.weight = weight;

      // warmth
      itemData.warmth = materialProps.warmth;

      // spell failure, skill check penalty and max dex mod penalty
      const isArmor = Constant.ARMOR_VS_DMG_TYPE[material];
      if (isArmor) {
        const padded = material === 'padded';
        const spellFailure = padded ? materialProps.weight * 5 : materialProps.weight * 5 / 2;
        itemData.ac.spell_failure = Math.round(spellFailure * totalLocationWeight) / 100;
        if (isMagic) itemData.ac.spell_failure = Math.round(itemData.ac.spell_failure / 2 * 100) / 100;

        const skillPenalty = spellFailure / 5 - 2;
        itemData.ac.skill_penalty = Math.round(skillPenalty * totalLocationWeight) / 100;
        if (isMagic) itemData.ac.skill_penalty = Math.round(itemData.ac.skill_penalty / 2 * 100) / 100;

        const maxDexWeight = padded ? materialProps.weight * 2 : materialProps.weight;
        itemData.ac.max_dex_penalty = Math.round((4 - (6 - Math.floor(maxDexWeight / 3))) * totalLocationWeight) / 100;
        if (isMagic) itemData.ac.max_dex_penalty = Math.round(itemData.ac.max_dex_penalty / 2 * 100) / 100;
      }

      // derive gp value from material and weight
      if (materialProps.gp_value && itemData.attributes.gp_value) {
        const maxWeight = materialProps.weight;
        const ratio = weight / maxWeight;
        // round to nearest even number, 2 decimal places
        const baseValue = 2 * Math.round(materialProps.gp_value * ratio * 50) / 100;
        itemData.attributes.gp_value.value = baseValue;
        // TODO take magic bonus into account
      }

    }
  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data={}, options={}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }
}
