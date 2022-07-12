import { EntitySheetHelper } from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class SimpleActor extends Actor {

  /** @inheritdoc */
  prepareDerivedData() {console.log(`updatin actor ${this.data.name}`)

    // actor types: character, humanoid, undead, monster, container, merchant

    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const actorData = this.data;

    this._prepareCharacterData(actorData);
    this._prepareHumanoidAndUndeadData(actorData);
    this._prepareMonsterData(actorData);
    this._prepareContainerData(actorData);
  }

  _getEnc(items) {
    const wgtItems = items.filter(i => +i.data.data.total_weight > 0);
    const sumItemWeight = (a, b) => a + b.data.data.total_weight;
    const enc = Math.round( wgtItems.reduce(sumItemWeight, 0) * 10 ) / 10;
    return enc;
  }

  _prepareContainerData(actorData) {
    const type = actorData.type;
    if (type !== 'container') return;

    const containerName = actorData.name;
    const items = actorData.items;
    const data = actorData.data;
    const attrs = data.attributes;
    const enc = this._getEnc(items);
    data.enc = enc;

    // find item with same name as this container owned by another character
    if (!game.actors) return;
    const characters = game.actors.filter(a => a.type === "character" 
      && a.items.some(i => i.type === "container" && i.name === containerName));
    if (!characters.length) return;

    if (characters.length > 1) ui.notifications.error(`More than one character with container ${containerName}!`);

    const character = characters[0];
    const container = character.items.find(item => item.name === containerName);
    if (!container?._id) return;

    const containerFactor = +attrs.enc_factor.value || 1;
    const containerWeight = (Math.round(enc / containerFactor * 10) / 10) || 1;
    const containerUpdateData = { _id: container._id, "data.weight": containerWeight };
    if (containerWeight !== container.data.data.weight) {
      character.updateEmbeddedDocuments("Item", [containerUpdateData]);
    }
  }

  _getMonsterXP(hdVal, hpMax, xpMulti) {
    // hd x hd x 10 x multiplier + 1/hp
    return hdVal * hdVal * 10 * xpMulti + hpMax;
  }

  _prepareMonsterData(actorData) {
    const type = actorData.type;
    if (type !== 'monster') return;
    const data = actorData.data;
    const attrs = data.attributes;
    const items = actorData.items;
    const size = attrs.size.value.toUpperCase().trim();
    const sizeVal = Constant.SIZE_VALUES[size] ?? Constant.SIZE_VALUES.default;

    // HD is given in the format "1/2" (which should produce an hdVal of 0) or "8+2" (which should produce 9)
    const hdValArr = attrs.hd.value.split("+").splice(0,2).map(x => Number(x)).filter(x => !isNaN(x));
    const hdVal = Number(hdValArr[0] + hdValArr.length - 1) || 0;

    const xpMulti = Math.max(1, (+attrs.xp_multi.value || 1));
    const hpMax = +data.hp.max || 0;
    data.xp = this._getMonsterXP(hdVal, hpMax, xpMulti);

    // mv & speed
    const mv = +attrs.mv.value || Constant.DEFAULT_MONSTER_MV;
    data.mv = mv;
    data.speed = mv * Constant.SQUARE_SIZE;

    const intelligent = attrs.intelligent.value;
    const msvVal = intelligent ? hdVal : Math.floor(hdVal / 2);
    data.sv = Math.max(Constant.MIN_SAVE_TARGET, (Constant.DEFAULT_BASE_SV - hdVal));
    data.msv = Math.max(Constant.MIN_SAVE_TARGET, (Constant.DEFAULT_BASE_SV - msvVal));

    data.bab = hdVal;

    data.size = sizeVal;

    // record natural weapon Ids for attack routine
    const atkRoutine = attrs.atk_routine.value || '';
    const atkRoutineArr = atkRoutine.split(',').filter(t => t);
    const atkRoutineIds = [];
    atkRoutineArr.forEach(a => {
      const weap = items.find(i => i.type === 'natural_weapon' && Util.stringMatch(i.name, a));
      if (weap && weap._id) atkRoutineIds.push(weap._id);
    });
    data.atk_routine_ids = atkRoutineIds;

    // ac & dr
    const naturalArmorMaterial = Constant.ARMOR_VS_DMG_TYPE[attrs.hide.value] ? attrs.hide.value : "none";
    const naturalAc = attrs.ac.value ?? Constant.DEFAULT_BASE_AC;
    const naturalDr = Math.max(0, sizeVal - 2);
    const hideAc = Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial].base_AC;
    const touchAc = naturalAc - hideAc - sizeVal;
    const ac = { touch_ac: touchAc, total: {} };

    for (const dmgType of Constant.DMG_TYPES) {
      const unarmoredAc = Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac;
      const unarmoredDr = Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr;

      ac.total[dmgType] = {
        ac: naturalAc + unarmoredAc,
        dr: naturalDr + unarmoredDr,
      }
    }

    data.ac = ac;
  }

  _prepareAbilityScoreMods(abilities) {
    if (abilities.str) abilities.str.mod = Math.floor(abilities.str.value / 3 - 3);
    if (abilities.int) abilities.int.mod = Math.floor(abilities.int.value / 3 - 3);
    if (abilities.wis) abilities.wis.mod = Math.floor(abilities.wis.value / 3 - 3);
    if (abilities.dex) abilities.dex.mod = Math.floor(abilities.dex.value / 3 - 3);
    if (abilities.con) abilities.con.mod = Math.floor(abilities.con.value / 3 - 3);
    if (abilities.cha) abilities.cha.mod = Math.floor(abilities.cha.value / 3 - 3);
  }

  _getHighestAttrVal(items, key) {
    return items.length ? Math.max(...items.map(c => (+c.data.data.attributes[key]?.value || 0))) : 0;
  }

  _prepareHumanoidAndUndeadData(actorData) {
    const type = actorData.type;
    if (type !== 'humanoid' && type !== 'undead') return;
    const data = actorData.data;
    const items = actorData.items;
    const wornItems = items.filter(i => i.data.data.worn);
    const attrs = data.attributes;
    const abilities = attrs.ability_scores || {};
    const size = attrs.size.value.toUpperCase().trim();
    const sizeVal = Constant.SIZE_VALUES[size] ?? Constant.SIZE_VALUES.default;

    // HD is given in the format "1/2" (which should produce an hdVal of 0) or "8+2" (which should produce 9)
    const hdValArr = attrs.hd.value.split("+").splice(0,2).map(x => Number(x)).filter(x => !isNaN(x));
    const hdVal = Number(hdValArr[0] + hdValArr.length - 1) || 0;

    // xp
    const xpMulti = Math.max(1, (+attrs.xp_multi.value || 1));
    const hpMax = +data.hp.max || 0;
    data.xp = this._getMonsterXP(hdVal, hpMax, xpMulti);

    // mv & speed
    const mv = +attrs.mv.value || Constant.DEFAULT_HUMANOID_MV;
    data.mv = mv;
    data.speed = mv * Constant.SQUARE_SIZE;

    // sv
    const magicWornClothing = wornItems.filter(i => i.type === 'clothing' && i.data.data.attributes.magic?.value);
    const magicClothingSvMod = this._getHighestAttrVal(magicWornClothing, "sv_mod");
    const magicWornJewelry = wornItems.filter(i => i.type === 'jewelry' && i.data.data.attributes.magic?.value);
    const magicJewelrySvMod = this._getHighestAttrVal(magicWornJewelry, "sv_mod");
    const intelligent = attrs.intelligent.value;
    const msvVal = intelligent ? hdVal : Math.floor(hdVal / 2);
    data.sv = Math.max(Constant.MIN_SAVE_TARGET, (Constant.DEFAULT_BASE_SV - hdVal - magicClothingSvMod - magicJewelrySvMod));
    data.msv = Math.max(Constant.MIN_SAVE_TARGET, (Constant.DEFAULT_BASE_SV - msvVal - magicClothingSvMod - magicJewelrySvMod));

    data.bab = hdVal;

    data.size = sizeVal;

    this._prepareAbilityScoreMods(abilities);
    
    this._prepareWornAc(actorData);
  }

  _prepareCharacterData(actorData) {
    const type = actorData.type;
    if (type !== 'character') return;
    const charData = actorData.data;
    const items = actorData.items;
    const wornItems = items.filter(i => i.data.data.worn);
    const attrs = charData.attributes;
    const abilities = attrs.ability_scores || {};
    const size = attrs.size.value.toUpperCase().trim();
    const sizeVal = Constant.SIZE_VALUES[size] ?? Constant.SIZE_VALUES.default;
    const AGILITY_PENALTY = {threshold: 5, factor: 3};
    const SKILL_PENALTY = {threshold: 2};
    const SPELL_FAILURE = {factor: 5/2};

    // encumbrance
    charData.enc = this._getEnc(items);

    // mv & speed
    const str = abilities.str?.value || 10;
    const encStr = Math.round( Util.sizeMulti(str, sizeVal) );
    const baseMv = attrs.base_mv.value;
    const mvPenalty = Math.floor( Math.max(0, charData.enc - encStr * 4) / encStr * 3/4 ); // TODO magic numbers
    // If there is no penalty, mv is equal to base (i.e. unencumbered) MV
    // Otherwise, it's the smaller of the base MV and the default MV minus the penalty.
    const mv = Math.max(1, !mvPenalty ? baseMv : Math.min(baseMv, Constant.DEFAULT_BASE_MV - mvPenalty));
    charData.mv = mv;
    charData.speed = mv * Constant.SQUARE_SIZE;


    // ability score mods
    this._prepareAbilityScoreMods(abilities);


    // set remove body part locations
    // const injuryArr = Util.getArrFromCSL(actorData.injuries || '');
    // const removedLocations = injuryArr.map(i => i.toLowerCase().replace(/  +/g, ' ').trim())
    //   .map(loc => {
    //     if (!loc.includes('severed')) return null;
    //     loc = loc.replace('severed', '');
    //     if (Constant.HIT_LOC_ARRS.THRUST.includes(loc)) return loc;
    //     const side = loc.includes("right") ? "right" : loc.includes("left") ? "left" : null;
    //     loc = loc.replace(side,'').trim();
    //     if (side) {
    //       return Constant.LIMB_GROUPS[loc]?.map(l => `${side} ${l}`);
    //     } 
    //   }).flat().filter(l => Constant.HIT_LOC_ARRS.THRUST.includes(l));
    // // actorData.removedLocs = removedLocations;
    // const currRemovedLocs = this.getFlag("lostlands", "removedLocs") || [];
    // let updateRemovedLocs = false;
    // removedLocations.forEach(l => {
    //   if (!currRemovedLocs.includes(l)) {
    //     currRemovedLocs.push(l);
    //     updateRemovedLocs = true;
    //   }
    // });
    // updateRemovedLocs && this.setFlag("lostlands", "removedLocs", currRemovedLocs);
    

    
    // spell failure, skill check penalty & max dex mod
    const totalPenaltyWgt = wornItems.reduce((sum, i) => sum + (+i.data.data.penalty_weight || 0), 0);
    charData.spell_failure = Math.floor(totalPenaltyWgt * SPELL_FAILURE.factor);
    charData.skill_penalty = Math.max(0, Math.floor(totalPenaltyWgt - SKILL_PENALTY.threshold));
    charData.agility_penalty = Math.floor( Math.max(0, (totalPenaltyWgt - AGILITY_PENALTY.threshold)) / AGILITY_PENALTY.factor );

    // sv
    const magicWornClothing = wornItems.filter(i => i.type === 'clothing' && i.data.data.attributes.magic?.value);
    const magicClothingSvMod = this._getHighestAttrVal(magicWornClothing, "sv_mod");
    const magicWornJewelry = wornItems.filter(i => i.type === 'jewelry' && i.data.data.attributes.magic?.value);
    const magicJewelrySvMod = this._getHighestAttrVal(magicWornJewelry, "sv_mod");
    const svBase = +attrs.base_sv.value || Constant.DEFAULT_BASE_SV;
    const sv = Math.max(Constant.MIN_SAVE_TARGET, (svBase - magicClothingSvMod - magicJewelrySvMod));
    charData.sv = sv;    

    charData.bab = +attrs.bab.value || 0;

    charData.size = sizeVal;

    this._prepareWornAc(actorData);

    this._prepareWornClo(actorData);
    
    charData.weap_profs = Util.getArrFromCSL(attrs.weapons.weap_profs.value || '').map(p => p.toLowerCase()).filter(p => Constant.WEAPON_CATEGORIES.includes(p));
  }

  _prepareWornClo(actorData) { // TODO cannot wear clothing/armor too small
    const data = actorData.data;
    const items = actorData.items;
    const wornItems = items.filter(i => i.data.data.worn);
    const charSize = +data.size ?? Constant.SIZE_VALUES.default;
    const getSizePenalty = itemSize => Math.max(0, charSize - (+itemSize || 0));

    let clo = 0;

    for (const [k,v] of Object.entries(Constant.HIT_LOCATIONS)) {
      const coveringItems = wornItems.filter(i => i.data.data.coverage?.includes(k));
      const garments = coveringItems.filter(i => Constant.WEARABLE_TYPES.includes(i.type) && Number(i.data.data.clo));

      // sort the layers by descending clo
      //    second layer adds 1/2 its full clo, third layer 1/4, and so on
      const unwornIndex = Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN;
      const locationWeight = v.weights[unwornIndex] / 100;
      const cloVals = garments.map(i => (i.data.data.clo - getSizePenalty(i.data.data.size)) * locationWeight);
      cloVals.sort((a,b) => b - a);
      const locWarmth = cloVals.reduce((sum, val, index) => sum + val/Math.pow(2, index), 0);
      clo += locWarmth;
    }

    data.clo = Math.floor(clo);
  }

  _prepareWornAc(actorData) {
    const data = actorData.data;
    const items = actorData.items;
    const heldItems = items.filter(i => (i.data.data.held_offhand || i.data.data.held_mainhand));
    const wornItems = items.filter(i => i.data.data.worn);
    const attrs = data.attributes;
    const charSize = data.size;
    const getSizePenalty = itemSize => Math.max(0, charSize - (+itemSize || 0));

    const naturalArmorMaterial = Constant.ARMOR_VS_DMG_TYPE[attrs.hide?.value] ? attrs.hide.value : "none";
    const naturalAc = attrs.base_ac.value ?? Constant.DEFAULT_BASE_AC;
    const naturalDr = Math.max(0, charSize - 2);
    const dexAcBonus = +attrs.ability_scores?.dex?.mod || 0;
    const agilityPenalty = +data.agility_penalty || 0;
    
    const parryValReducer = (a,b) => +b.data.data.attributes.parry.value > +a.data.data.attributes.parry.value ? b : a;
    const riposteWeaps = heldItems.filter(i => i.type === 'weapon' && i.data.data.atk_init === 'riposte' && +i.data.data.attributes.parry?.value);
    const riposteWeap = riposteWeaps.reduce(parryValReducer, null);
    const fluidWeaps = heldItems.filter(i => i.type === 'weapon' && i.data.data.atk_style === 'fluid' && +i.data.data.attributes.parry?.value);
    const fluidWeap = fluidWeaps.reduce(parryValReducer, null);
    
    // riposte parry overwrites fluid parry
    const riposteParryBonus = +riposteWeap?.data.data.attributes.parry?.value || 0;
    const fluidParryBonus = +fluidWeap?.data.data.attributes.parry?.value || 0;
    const parryHeight = riposteWeap?.data.data.atk_height || fluidWeap?.data.data.atk_height || null;
    const parry = { 
      parry_item_id: riposteWeap?._id || fluidWeap?._id || null,
      parry_bonus: riposteParryBonus || fluidParryBonus || 0,
      parry_type: riposteParryBonus ? 'riposte' : fluidParryBonus ? 'fluid' : '',
      parry_height: parryHeight,
    };

    // stance penalty
    const powerWeap = heldItems.some(i => i.data.data.atk_style === 'power');
    const counterWeap = heldItems.some(i => i.data.data.atk_init === 'counter');
    const timing = counterWeap ? 'counter' : riposteWeap ? 'riposte' : '';
    const powerWeapPenalty = powerWeap ? Constant.STANCE_MODS.power.ac_mod : 0;
    const counterWeapPenalty = counterWeap ? Constant.STANCE_MODS.counter.ac_mod : 0;
    const stancePenalty = powerWeapPenalty + counterWeapPenalty;


    // get best clothing magical AC bonus
    const magicWornClothing = wornItems.filter(i => i.type === 'clothing' && i.data.data.attributes.magic?.value);
    const magicClothingACBonus = this._getHighestAttrVal(magicWornClothing, "ac_mod");

    // get best jewelry magical AC bonus
    const magicWornJewelry = wornItems.filter(i => i.type === 'jewelry' && i.data.data.attributes.magic?.value);
    const magicJewelryACBonus = this._getHighestAttrVal(magicWornJewelry, "ac_mod");


    // ac by hit location
    // initialize total AC/DR values
    const touchAc = Math.max(1, naturalAc + dexAcBonus + stancePenalty - agilityPenalty);
    const ac = { touch_ac: touchAc, mdr: 0, parry, total: {}, stance_penalty: stancePenalty, timing };
    for (const dmgType of Constant.DMG_TYPES) {
      ac.total[dmgType] = {
        ac: 0,
        dr: 0,
      }
    }

    for (const [k,v] of Object.entries(Constant.HIT_LOCATIONS)) {
      ac[k] = {};
      const locationWeight = (v.weights[Constant.HIT_LOC_WEIGHT_INDEXES.SWING] + v.weights[Constant.HIT_LOC_WEIGHT_INDEXES.THRUST]) / 200;
      const coveringItems = wornItems.filter(i => i.data.data.coverage?.includes(k));
      // can only wear three total armor layers
      const armor = coveringItems.filter(i => (i.type === 'armor' || i.type === 'helmet') && i.data.data.ac).slice(0,3);
      const bulkyArmor = armor.filter(i => i.data.data.bulky);
      const nonBulkyArmor = armor.filter(i => !i.data.data.bulky);
      
      // magic damage reduction
      const mdr = armor.reduce((sum, i) => sum + +i.data.data.ac?.mdr || 0, 0);
      ac.mdr += mdr * locationWeight;

      // shield
      const shield = coveringItems.find(i => i.type === 'shield');
      const shieldStyle = shield?.data.data.shield_style;
      const fluidShieldAcMod = shieldStyle === 'fluid' ? Constant.STANCE_MODS.fluid.shield_ac_mod : 0;
      const shieldAcBonus = (shield?.data.data.ac?.[dmgType]?.ac || 0) + fluidShieldAcMod;
      const fluidShieldDrBonus = shieldStyle === 'fluid' ? Constant.STANCE_MODS.fluid.shield_dr_mod : 0;
      const shieldDrBonus = (shield?.data.data.ac?.[dmgType]?.dr || 0) + fluidShieldDrBonus;

      // sort non-bulky armors by piercing AC and record Ids
      //    shield goes on top of bulky goes on top of non-bulky
      const getPierceAc = item => +item.data.data.ac.piercing.ac || 0;
      let sorted_armor_ids = nonBulkyArmor.sort((a,b) => getPierceAc(b) - getPierceAc(a)).map(i => i._id);
      const bulkyArmorIds = bulkyArmor.sort((a,b) => getPierceAc(b) - getPierceAc(a)).map(i => i._id);
      sorted_armor_ids = [...bulkyArmorIds, ...sorted_armor_ids];
      if (shield?._id) sorted_armor_ids = [shield._id, ...sorted_armor_ids];
      ac[k].sorted_armor_ids = sorted_armor_ids;

      // parry bonus applies if riposting, or if parryHeight includes this area
      const appliedParryBonus = (!!riposteWeap || Constant.HEIGHT_AREAS[parryHeight]?.includes(k)) ? parry.parry_bonus : 0;

      // ac & dr by damage type
      for (const dmgType of Constant.DMG_TYPES) {

        // no shield dr vs. piercing on forearm or hand
        const appliedShieldDrBonus = ['forearm','hand'].includes(k) && dmgType === 'piercing' ? 0 : shieldDrBonus;
        
        // ac -- use highest of worn ACs if wearing armor, else use unarmored AC
        const unarmoredAc = Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac;
        const wornAc = Math.max(0, ...armor.map(i => (+i.data.data.ac?.[dmgType]?.ac || 0) - getSizePenalty(i.data.data.size)));
        const acMod = armor.length ? wornAc : unarmoredAc;
        const locAc = touchAc + acMod + shieldAcBonus + appliedParryBonus + magicClothingACBonus + magicJewelryACBonus;
        
        // dr -- all source of DR are cumulative
        const unarmoredDr = Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr;
        const wornDr = armor.reduce((sum, i) => sum + (+i.data.data.ac?.[dmgType]?.dr || 0), 0);
        const locDr = naturalDr + unarmoredDr + wornDr + appliedShieldDrBonus;

        // record values
        ac[k][dmgType] = { ac: locAc, dr: locDr, shield_bonus: shieldAcBonus };
        ac.total[dmgType].ac += locAc * locationWeight;
        ac.total[dmgType].dr += locDr * locationWeight;
      }
    }

    // round total ac & dr values
    for (const v of Object.values(ac.total)) { // TODO helmet must be closed to cover nose/jaw for pierce
      v.ac = Math.round(v.ac); // crit slash dmg armor must not be shield or helmet
      v.dr = Math.round(v.dr); // if closed, must remove to listen/speak
    }
    ac.mdr = Math.round(ac.mdr); // hinged helmet has a macro to change between open/closed...automatically muffle in character speaking with closed helmet?

    data.ac = ac;
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
