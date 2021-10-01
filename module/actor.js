import { EntitySheetHelper } from "./helper.js";

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
  * sv
  * 
  * optional:
  * touch_ac
  * max_mv
  * 
  */

  /** @inheritdoc */
  async prepareDerivedData() {
    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const items = this.data.items;
    const actorData = this.data.data;
    const attributes = actorData.attributes;
    const updateData = {};

    // level up sound
    if (actorData.xp?.value >= actorData.xp?.max && !actorData.islevelup) {
      AudioHelper.play({src: "systems/lostlands/sounds/level_up.mp3", volume: 1, loop: false}, false);
      updateData.islevelup = true;
      // await this.update({"data.islevelup": true});
    } else if (actorData.xp?.max > actorData.xp?.value && actorData.islevelup !== false) {
      updateData.islevelup = false;
      // await this.update({"data.islevelup": false});
    }

    // encumbrance and mv
    actorData.enc = items.filter(i => i.data.type === "item").reduce((a, b) => a + Math.floor((b.data.data.quantity || 0) * (b.data.data.weight || 0)), 0);
    actorData.enc = attributes.enc?.value ?? actorData.enc;
    // derive mv and speed from encumbrance for characters
    if(this.data.type === 'character') {
      const str = attributes.ability_scores?.str?.value || 0;
      const strEnc = (Math.floor(str / 3) + 1) * 3;
      let mv = (5 - Math.ceil((actorData.enc || 1) / (strEnc || 1))) * 3;
      mv = Math.clamped(mv, 0, mv);
      if(mv === 12) mv = attributes.maxmv?.value ?? mv;
      mv = attributes.mv?.value ?? mv;
      // if(this._id && mv !== actorData.mv) {
      updateData.mv = mv || 0;
      updateData.speed = mv * 5 || 0; //await this.update({"data.mv": (mv || 0), "data.speed": ((mv * 5) || 0)});
      // }
    }

    // encumbrance for containers
    if(this.data.type === 'container') {
      const otherActors = game.actors?.filter(a => a.name !== this.name) || [];
      for(let otherActor of otherActors) {
        let container = otherActor.items.find(item => item.name === this.name);
        if(container && container._id) {
          const containerWeight = Math.floor(actorData.enc / (attributes.factor?.value || 1)) || 1;
          if(containerWeight !== container.data.data.weight) {
            otherActor.updateEmbeddedDocuments("Item", [{ _id: container._id, "data.weight": containerWeight }]);
          }
        }
      }
    }
    // ability score modifiers
    // const scoreMods = {};
    updateData.str_mod = Math.floor((attributes.ability_scores?.str?.value || 0) / 3 - 3);
    updateData.int_mod = Math.floor((attributes.ability_scores?.int?.value || 0) / 3 - 3);
    updateData.wis_mod = Math.floor((attributes.ability_scores?.wis?.value || 0) / 3 - 3);
    updateData.dex_mod = Math.floor((attributes.ability_scores?.dex?.value || 0) / 3 - 3);
    updateData.con_mod = Math.floor((attributes.ability_scores?.con?.value || 0) / 3 - 3);
    updateData.cha_mod = Math.floor((attributes.ability_scores?.cha?.value || 0) / 3 - 3);
    // if(this._id && shouldUpdateMods) updateData.//await this.update({data: scoreMods});

    // ac not working TEST WITH JAS
    const wornItems = items.filter(i => i.data.data.worn === true);
    const wornBaseAcItems = wornItems.filter(i => i.data.data.attributes.ac_base?.value);
    const baseAcAndMaxDexBonusMap = new Map(wornBaseAcItems.map(i => [i.data.data.attributes.ac_base.value, i.data.data.attributes.max_dex_bonus?.value]));
    const baseAc = baseAcAndMaxDexBonusMap.size ? Math.max(...baseAcAndMaxDexBonusMap.keys()) : 9;
    const maxDexBonus = baseAcAndMaxDexBonusMap.get(baseAc) ?? 3;
    const wornAc = wornItems.reduce((a, b) => a + (b.data.data.attributes.ac_mod?.value || 0), baseAc);
    let ac = wornAc + Math.clamped(updateData.dex_mod, updateData.dex_mod, maxDexBonus);
    ac = attributes.ac?.value ?? ac;
    updateData.ac = ac || 9;
    // if(this._id && ac !== actorData.ac) await this.update({"data.ac": (ac || 9)});

    // touch AC
    let touchAc = 9 + updateData.dex_mod;
    touchAc = attributes.touch_ac?.value ?? touchAc;
    updateData.touch_ac = touchAc || 9;
    // if(this._id && touchAc !== actorData.touch_ac) await this.update({"data.touch_ac": (touchAc || 9)});

    // update actor if any update data is different than existing data
    let shouldUpdate = false;
    for(const key of Object.keys(updateData)) {
      if(updateData[key] !== actorData[key]) {
        shouldUpdate = true;
        break;
      }
    }
    if(this._id && shouldUpdate) await this.update({data: updateData});
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
