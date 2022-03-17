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
  * ac_mod, magic, material, coverage, wearable, bulky, st_mod
  */

  /** @inheritdoc */
  async prepareDerivedData() {
    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const itemData = this.data.data;
    // const updateData = {};

    // AC mods
    const material = String(itemData.attributes.material?.value).toLowerCase().trim();
    const materialAcMods = Constant.ARMOR_VS_DMG_TYPE[material];
    const coverage = itemData.attributes.coverage?.value || '';
    const acMod = +itemData.attributes.ac_mod?.value || 0;
    const isMagic = !!itemData.attributes.magic?.value;
    const locations = [...new Set(coverage.split(',').map(l => l.toLowerCase().trim()).filter(l => Object.keys(Constant.HIT_LOCATIONS).includes(l)))];
    if (!!materialAcMods && locations.length) {
      let baseAc = Constant.AC_MIN + materialAcMods.base_AC;
      let mdr = 0;
      let mac = 0;
      // if non-magical, add acMod to base AC, if magical, store in separate field as mdr and mac
      if (isMagic) {
        mdr = acMod;
        mac = acMod;
      } else {
        baseAc += acMod;
      }

      itemData.ac = {
        locations,
        mdr,
        mac,
        blunt: {
          ac: baseAc + materialAcMods.blunt.ac,
          dr: materialAcMods.blunt.dr
        },
        piercing: {
          ac: baseAc + materialAcMods.piercing.ac,
          dr: materialAcMods.piercing.dr
        },
        slashing: {
          ac: baseAc + materialAcMods.slashing.ac,
          dr: materialAcMods.slashing.dr
        },
      };
    }

    // armor/clothing warmth, weight and max Dex mod
    const warmthAndWeight = Constant.MATERIAL_WARMTH_WEIGHT[material];
    if (!!warmthAndWeight && locations.length) {
      // weight
      const totalLocationWeight = locations.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[0], 0); // index 0 for centre swing
      itemData.weight = Math.round(warmthAndWeight.weight / 10 * totalLocationWeight) / 10;
      // if magic item, halve weight
      if (isMagic) itemData.weight = Math.round(itemData.weight / 2 * 10) / 10;

      // warmth
      itemData.warmth = warmthAndWeight.warmth;

      // spell failure, skill check penalty and max dex mod penalty
      const isArmor = Constant.ARMOR_VS_DMG_TYPE[material];
      if (isArmor) {
        const padded = material === 'padded';
        const spellFailure = padded ? warmthAndWeight.weight * 5 : warmthAndWeight.weight * 5 / 2;
        itemData.ac.spell_failure = Math.round(spellFailure * totalLocationWeight) / 100;
        if (isMagic) itemData.ac.spell_failure = Math.round(itemData.ac.spell_failure / 2 * 100) / 100;

        const skillPenalty = spellFailure / 5 - 2;
        itemData.ac.skill_penalty = Math.round(skillPenalty * totalLocationWeight) / 100;
        if (isMagic) itemData.ac.skill_penalty = Math.round(itemData.ac.skill_penalty / 2 * 100) / 100;

        const maxDexWeight = padded ? warmthAndWeight.weight * 2 : warmthAndWeight.weight;
        itemData.ac.max_dex_penalty = Math.round((4 - Math.min(0, 6 - Math.floor(maxDexWeight / 3))) * totalLocationWeight) / 100;
        if (isMagic) itemData.ac.max_dex_penalty = Math.round(itemData.ac.max_dex_penalty / 2 * 100) / 100;
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data={}, options={}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }
}
