import { EntitySheetHelper } from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class SimpleActor extends Actor {

  /* character template attributes:
  * bab
  * lvl
  * lvl_title
  * class
  * race
  * ability_scores.str, int, wis, dex, con, cha
  * spell_cleric.lvl_1, spell_magic.lvl_1, etc.: resource, min 0 value and max spell slots
  * st
  * 
  * optional:
  * max_mv
  * 
  */

  /** @inheritdoc */
  async prepareDerivedData() {

    // actor types: character, monster, container, merchant

    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const items = this.data.items;
    const actorData = this.data.data;
    const attributes = actorData.attributes;
    // const updateData = {};
    const type = this.data.type;
    const hasPlayerOwner = this.hasPlayerOwner;
    const updateData = {};
    const charSize = Constant.SIZE_VALUES[attributes?.size?.value] ?? 2;

    // level up sound
    if (type === 'character') {
      if (actorData.xp?.value >= actorData.xp?.max && !actorData.is_level_up) {
        Util.playSound('level_up', null, {push: false, bubble: false});
        updateData.is_level_up = true;
      } else if (actorData.xp?.max > actorData.xp?.value && actorData.is_level_up !== false) {
        updateData.is_level_up = false;
      }
    }

    // encumbrance
    updateData.enc = Math.round(items.filter(i => i.data.type === 'item').reduce((a, b) => a + (+b.data.data.quantity * +b.data.data.weight  || 0), 0) * 10) / 10;

    // derive mv and speed from encumbrance
    if ( type === 'character' || type === 'monster' ) {
      let str = attributes.ability_scores?.str?.value || 0;
      str = Math.round( Util.sizeMulti(str, charSize) );
      let mv = 12 - Math.floor(Math.max(0, updateData.enc - str) / str * 3);
      mv = Math.max(0, mv) || 0;
      const maxMv = attributes.max_mv?.value;
      mv = maxMv ? Math.round(mv * maxMv / 12) : mv;
      mv = attributes.mv?.value ?? mv;
      updateData.mv = mv;
      updateData.speed = mv * 5 || 0;
    }

    // encumbrance for containers
    if (this.data.type === 'container') {
      const otherActors = game.actors?.filter(a => a.name !== this.name && a.hasPlayerOwner) || [];
      for (let otherActor of otherActors) {
        let container = otherActor.items.find(item => item.name === this.name);
        if (container && container._id) {
          const containerWeight = Math.floor(updateData.enc / (attributes.factor?.value || 1)) || 1;
          const containerUpdateData = { _id: container._id, "data.weight": containerWeight };
        if (containerWeight !== container.data.data.weight) {
          await otherActor.updateEmbeddedDocuments("Item", [containerUpdateData]);
        }
          break;
        }
      }
    }

    // ability score modifiers
    if ( type === 'character' || type === 'monster' ) {
      updateData.str_mod = Math.floor(attributes.ability_scores?.str?.value / 3 - 3) || 0;
      updateData.int_mod = Math.floor(attributes.ability_scores?.int?.value / 3 - 3) || 0;
      updateData.wis_mod = Math.floor(attributes.ability_scores?.wis?.value / 3 - 3) || 0;
      updateData.dex_mod = Math.floor(attributes.ability_scores?.dex?.value / 3 - 3) || 0;
      updateData.con_mod = Math.floor(attributes.ability_scores?.con?.value / 3 - 3) || 0;
      updateData.cha_mod = Math.floor(attributes.ability_scores?.cha?.value / 3 - 3) || 0;
    }

    /* AC
    slots:
    - coif
    - hat
    - cloak
    - armored_shirt
    - cuirass
    - quiver
    - under_shirt (shift)
    - tunic (dress)
    - breeches
    - pants
    - bracers
    - greaves
    - gloves
    - ring
    - belt
    - boots (shoes)
    */
    // ac, st mods and worn clo
    if ( type === 'character' || type === 'monster' ) {
      const naturalAc = attributes.ac?.value || Constant.AC_MIN;
      const naturalDr = attributes.dr?.value || 0;
      const ac_mod = +attributes.ac_mod?.value || 0;

      const naturalArmorMaterial = Constant.ARMOR_VS_DMG_TYPE[attributes.material?.value] ? attributes.material?.value : "none";
      const wornOrHeldItems = items.filter(i => (i.data.data.worn || i.data.data.held_left || i.data.data.held_right));
      const parryItem =  wornOrHeldItems.filter(i => Util.stringMatch(i.data.data.atk_mode,'parry'))
        .reduce((a,b) => +b?.data.data.attributes.parry_bonus?.value || 0 > +a?.data.data.attributes.parry_bonus?.value || 0 ? b : a, undefined);
      const parryBonus = +parryItem?.data.data.attributes.parry_bonus?.value || 0;
      const parry = {
        parry_item_id: parryItem?._id,
        parry_bonus: parryBonus,
      };

      // spell failure, skill check penalty and max dex mod
      const sf = Math.round(wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.spell_failure || 0), 0));
      const sp = Math.round(wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.skill_penalty || 0), 0));
      const maxDexPenalty = wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.max_dex_penalty || 0), 0);
      const max_dex_mod = Math.round(4 - maxDexPenalty);
      const dexAcBonus = Math.min(updateData.dex_mod, max_dex_mod);

      // class bonus        
      // const isBarbarian = attributes.class?.value.toLowerCase().includes('barbarian');
      // const isSwashbuckler = attributes.class?.value.toLowerCase().includes('swashbuckler') &&
      //                        max_dex_mod >= 4;
      // const level = +attributes.lvl?.value || 1;
      // isBarbarian ? 1 :
      //                    isSwashbuckler ? Math.floor((level - 1) / 4) + 1 || 0 : 0;

      const touch_ac = Constant.AC_MIN + dexAcBonus + ac_mod;

      const ac = { touch_ac, sf, sp, parry, max_dex_mod, mdr:0, mr:0, total: {} };
      for (const dmgType of Constant.DMG_TYPES) {
        ac.total[dmgType] = {
          ac: naturalAc + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac + dexAcBonus + ac_mod + parryBonus,
          dr: naturalDr + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr,
        }
      }

      // ac and dr for every body location
      if ( type === 'character' || attributes.type?.value === 'humanoid' ) {
        for (const dmgType of Constant.DMG_TYPES) {
          ac.total[dmgType] = {
            ac: 0,
            dr: 0,
          }
        }

        updateData.clo = 0;

        for (const [k,v] of Object.entries(Constant.HIT_LOCATIONS)) {
          ac[k] = {};
          const coveringItems = wornOrHeldItems.filter(i => i.data.data.locations?.includes(k));
          const garments =  coveringItems.filter(i => !i.data.data.attributes.shield?.value);
          const armor = garments.filter(i => Object.keys(i.data.data.ac || {}).length);
          
          // can only wear one shield and one rigid armor
          const shield = coveringItems.find(i => i.data.data.attributes.shield?.value);
          const rigidArmor = armor.find(i => i.data.data.attributes.rigid?.value);
          const nonRigidArmor = armor.filter(i => !i.data.data.attributes.rigid?.value);

          // worn clo -- sort the layers by descending warmth, then second layer adds 1/2 its full warmth, third layer 1/4, and so on
          const wornWarmthVals = garments.map(i => (+i.data.data.warmth || 0) / 100 * v.weights[1]); // index 1 for centre thrust
          wornWarmthVals.sort((a,b) => b - a);
          const locWarmth = Math.round(wornWarmthVals.reduce((sum, val, index) => sum + val/Math.pow(2,index), 0));
          updateData.clo += locWarmth;

          // magic damage reduction
          const mdr = coveringItems.reduce((sum, i) => sum + +i.data.data.ac?.mdr || 0, 0);
          ac.mdr += (mdr * v.weights[0] + mdr * v.weights[1]) / 200;

          // worn ac & dr
          for (const dmgType of Constant.DMG_TYPES) {
            let sorted_armor_ids = nonRigidArmor.sort((a,b) => (+b.data.data.ac[dmgType]?.ac || 0) - (+a.data.data.ac[dmgType]?.ac || 0))
              .map(i => i._id);
            if (rigidArmor?._id) sorted_armor_ids = [rigidArmor._id, ...sorted_armor_ids];
            if (shield?._id) sorted_armor_ids = [shield._id, ...sorted_armor_ids];

            const shieldAcBonus = shield?.data.data.ac?.[dmgType]?.ac || 0;
            const shieldDrBonus = shield?.data.data.ac?.[dmgType]?.dr || 0;

            const unarmoredAc = naturalAc + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac;
            const unarmoredDr = Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr;

            const wornAc = Math.max(0, ...armor.map(i => +i.data.data.ac?.[dmgType]?.ac || 0));
            const locAc = Math.max(unarmoredAc, wornAc) + shieldAcBonus + dexAcBonus + ac_mod + parryBonus;
            // max dr is 2
            const locDr = Math.min(2, unarmoredDr + armor.reduce((sum, i) => sum + +i.data.data.ac?.[dmgType]?.dr || 0, 0) + shieldDrBonus);

            ac[k][dmgType] = { ac: locAc, dr: locDr, sorted_armor_ids, shield_bonus: shieldAcBonus };
            ac.total[dmgType].ac += (locAc * v.weights[0] + locAc * v.weights[1]) / 200;
            ac.total[dmgType].dr += (locDr * v.weights[0] + locDr * v.weights[1]) / 200;
          }
        }

        // round ac
        for (const v of Object.values(ac.total)) {
          v.ac = (Math.round(v.ac) || touch_ac);
          v.dr = Math.round(v.dr);
        }
        ac.mdr = Math.round(ac.mdr);
      }

      // magic resistance
      ac.mr = +attributes.mr?.value || 0;

      // add AC to updateData
      actorData.ac = ac;

      // weap profs
      updateData.weap_profs = Util.getArrFromCSL(attributes.weap_profs?.value || '').map(p => p.toLowerCase());
      if (updateData.weap_profs.some(p => !Constant.WEAPON_PROFICIENCY_CATEGORIES.includes(p))) {
        ui.notifications.error(`Invalid weapon proficiency specified for ${this.name}`);
      }

      // st
      const stItems = wornOrHeldItems.filter(i => i.data.data.attributes.st_mod?.value);
      const st_mod = stItems.reduce((a, b) => a + (+b.data.data.attributes.st_mod?.value || 0), 0) + (+attributes.st_mod?.value || 0);
      updateData.st = (+attributes.st?.value + st_mod) || 0; // saving NaN here is what caused race condition!!!

    }
    
    // attitude map
    if (type !== 'container') {
      updateData.attitude_map = actorData.attitude_map || {};
    }

    // update actor if any update data is different than existing data
    for (const key of Object.keys(updateData)) {
      if(foundry.utils.fastDeepEqual(updateData[key], actorData[key])) {
        delete updateData[key];
      }
    }
    
    if (this._id && Object.keys(updateData).length) {
      await Util.wait(200);
      this.update({data: updateData});
    }

  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data={}, options={}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }

  /* -------------------------------------------- */
  /*  Roll Data Preparation                       */
  /* -------------------------------------------- */

  /** @inheritdoc */
  getRollData() {

    // Copy the actor's system data
    const data = this.toObject(false).data;
    const shorthand = game.settings.get("lostlands", "macroShorthand");
    const formulaAttributes = [];
    const itemAttributes = [];

    // Handle formula attributes when the short syntax is disabled.
    this._applyShorthand(data, formulaAttributes, shorthand);

    // Map all items data using their slugified names
    this._applyItems(data, itemAttributes, shorthand);

    // Evaluate formula replacements on items.
    this._applyItemsFormulaReplacements(data, itemAttributes, shorthand);

    // Evaluate formula attributes after all other attributes have been handled, including items.
    this._applyFormulaReplacements(data, formulaAttributes, shorthand);

    // Remove the attributes if necessary.
    if ( !!shorthand ) {
      delete data.attributes;
      delete data.attr;
      delete data.abil;
      delete data.groups;
    }
    return data;
  }


  /* -------------------------------------------- */

  /**
   * Apply shorthand syntax to actor roll data.
   * @param {Object} data The actor's data object.
   * @param {Array} formulaAttributes Array of attributes that are derived formulas.
   * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
   */
  _applyShorthand(data, formulaAttributes, shorthand) {
    // Handle formula attributes when the short syntax is disabled.
    for ( let [k, v] of Object.entries(data.attributes || {}) ) {
      // Make an array of formula attributes for later reference.
      if ( v.dtype === "Formula" ) formulaAttributes.push(k);
      // Add shortened version of the attributes.
      if ( !!shorthand ) {
        if ( !(k in data) ) {
          // Non-grouped attributes.
          if ( v.dtype ) {
            data[k] = v.value;
          }
          // Grouped attributes.
          else {
            data[k] = {};
            for ( let [gk, gv] of Object.entries(v) ) {
              data[k][gk] = gv.value;
              if ( gv.dtype === "Formula" ) formulaAttributes.push(`${k}.${gk}`);
            }
          }
        }
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Add items to the actor roll data object. Handles regular and shorthand
   * syntax, and calculates derived formula attributes on the items.
   * @param {Object} data The actor's data object.
   * @param {string[]} itemAttributes
   * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
   */
  _applyItems(data, itemAttributes, shorthand) {
    // Map all items data using their slugified names
    data.items = this.items.reduce((obj, item) => {
      const key = item.name.slugify({strict: true});
      const itemData = item.toObject(false).data;

      // Add items to shorthand and note which ones are formula attributes.
      for ( let [k, v] of Object.entries(itemData.attributes) ) {
        // When building the attribute list, prepend the item name for later use.
        if ( v.dtype === "Formula" ) itemAttributes.push(`${key}..${k}`);
        // Add shortened version of the attributes.
        if ( !!shorthand ) {
          if ( !(k in itemData) ) {
            // Non-grouped item attributes.
            if ( v.dtype ) {
              itemData[k] = v.value;
            }
            // Grouped item attributes.
            else {
              if ( !itemData[k] ) itemData[k] = {};
              for ( let [gk, gv] of Object.entries(v) ) {
                itemData[k][gk] = gv.value;
                if ( gv.dtype === "Formula" ) itemAttributes.push(`${key}..${k}.${gk}`);
              }
            }
          }
        }
        // Handle non-shorthand version of grouped attributes.
        else {
          if ( !v.dtype ) {
            if ( !itemData[k] ) itemData[k] = {};
            for ( let [gk, gv] of Object.entries(v) ) {
              itemData[k][gk] = gv.value;
              if ( gv.dtype === "Formula" ) itemAttributes.push(`${key}..${k}.${gk}`);
            }
          }
        }
      }

      // Delete the original attributes key if using the shorthand syntax.
      if ( !!shorthand ) {
        delete itemData.attributes;
      }
      obj[key] = itemData;
      return obj;
    }, {});
  }

  /* -------------------------------------------- */

  _applyItemsFormulaReplacements(data, itemAttributes, shorthand) {
    for ( let k of itemAttributes ) {
      // Get the item name and separate the key.
      let item = null;
      let itemKey = k.split('..');
      item = itemKey[0];
      k = itemKey[1];

      // Handle group keys.
      let gk = null;
      if ( k.includes('.') ) {
        let attrKey = k.split('.');
        k = attrKey[0];
        gk = attrKey[1];
      }

      let formula = '';
      if ( !!shorthand ) {
        // Handle grouped attributes first.
        if ( data.items[item][k][gk] ) {
          formula = data.items[item][k][gk].replace('@item.', `@items.${item}.`);
          data.items[item][k][gk] = Roll.replaceFormulaData(formula, data);
        }
        // Handle non-grouped attributes.
        else if ( data.items[item][k] ) {
          formula = data.items[item][k].replace('@item.', `@items.${item}.`);
          data.items[item][k] = Roll.replaceFormulaData(formula, data);
        }
      }
      else {
        // Handle grouped attributes first.
        if ( data.items[item]['attributes'][k][gk] ) {
          formula = data.items[item]['attributes'][k][gk]['value'].replace('@item.', `@items.${item}.attributes.`);
          data.items[item]['attributes'][k][gk]['value'] = Roll.replaceFormulaData(formula, data);
        }
        // Handle non-grouped attributes.
        else if ( data.items[item]['attributes'][k]['value'] ) {
          formula = data.items[item]['attributes'][k]['value'].replace('@item.', `@items.${item}.attributes.`);
          data.items[item]['attributes'][k]['value'] = Roll.replaceFormulaData(formula, data);
        }
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Apply replacements for derived formula attributes.
   * @param {Object} data The actor's data object.
   * @param {Array} formulaAttributes Array of attributes that are derived formulas.
   * @param {Boolean} shorthand Whether or not the shorthand syntax is used.
   */
  _applyFormulaReplacements(data, formulaAttributes, shorthand) {
    // Evaluate formula attributes after all other attributes have been handled, including items.
    for ( let k of formulaAttributes ) {
      // Grouped attributes are included as `group.attr`, so we need to split them into new keys.
      let attr = null;
      if ( k.includes('.') ) {
        let attrKey = k.split('.');
        k = attrKey[0];
        attr = attrKey[1];
      }
      // Non-grouped attributes.
      if ( data.attributes[k]?.value ) {
        data.attributes[k].value = Roll.replaceFormulaData(data.attributes[k].value, data);
      }
      // Grouped attributes.
      else if ( attr ) {
        data.attributes[k][attr].value = Roll.replaceFormulaData(data.attributes[k][attr].value, data);
      }

      // Duplicate values to shorthand.
      if ( !!shorthand ) {
        // Non-grouped attributes.
        if ( data.attributes[k]?.value ) {
          data[k] = data.attributes[k].value;
        }
        // Grouped attributes.
        else {
          if ( attr ) {
            // Initialize a group key in case it doesn't exist.
            if ( !data[k] ) {
              data[k] = {};
            }
            data[k][attr] = data.attributes[k][attr].value;
          }
        }
      }
    }
  }
}
