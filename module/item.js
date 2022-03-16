import {EntitySheetHelper} from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class SimpleItem extends Item {

  /* item template attributes:
  * spells:
  * lvl: number
  * range: number in feet
  * duration: string
  * area: string
  * 
  * items:
  * value: number in gp
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
    const acMods = Constant.ARMOR_VS_DMG_TYPE[material];
    const coverage = itemData.attributes.coverage?.value || '';
    const locations = [...new Set(coverage.split(',').map(l => l.toLowerCase().trim()).filter(l => Object.keys(Constant.HIT_LOCATIONS).includes(l)))];
    if (!!acMods && locations.length) {
      itemData.ac = {
        locations,
        blunt: {
          ac: Constant.AC_MIN + acMods.base_AC + acMods.blunt.ac,
          dr: acMods.blunt.dr
        },
        piercing: {
          ac: Constant.AC_MIN + acMods.base_AC + acMods.piercing.ac,
          dr: acMods.piercing.dr
        },
        slashing: {
          ac: Constant.AC_MIN + acMods.base_AC + acMods.slashing.ac,
          dr: acMods.slashing.dr
        },
      };
    }

    // armor/clothing warmth/weight
    const warmthAndWeight = Constant.MATERIAL_WARMTH_WEIGHT[material];
    if (!!warmthAndWeight && locations.length) {
      const totalLocationWeight = locations.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[0], 0); // index 0 for centre swing
      itemData.weight = Math.round(warmthAndWeight.weight / 100 * totalLocationWeight * 10) / 10;
      const totalLocationWarmth = locations.reduce((sum, l) => sum + Constant.HIT_LOCATIONS[l].weights[1], 0); // index 0 for centre thrust
      itemData.warmth = Math.round(warmthAndWeight.warmth / 100 * totalLocationWarmth * 10) / 10;
    }

    // TODO weights can have 1 decimal place, update weights shown on actor sheet, also update MV calculation so every MV is possible from 12 to 1

    // update item if any update data is different than existing data
    // for (const key of Object.keys(updateData)) {
    //   if(foundry.utils.fastDeepEqual(updateData[key], itemData[key])) {
    //     delete updateData[key];
    //   }
    // }
    // if (this._id && Object.keys(updateData).length) {
    //   Object.assign(itemData,updateData);
    //   await Util.wait(200);
    //   await this.update({data: updateData});
    // }
  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data={}, options={}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }
}
