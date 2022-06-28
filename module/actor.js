import { EntitySheetHelper } from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class SimpleActor extends Actor {

  /** @inheritdoc */
  prepareDerivedData() {

    // actor types: character, humanoid, monster, container, merchant

    super.prepareDerivedData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const actorData = this.data;

    this._prepareCharacterData(actorData);
    // this._prepareHumanoidData(data);
    // this._prepareMonsterData(data);
    // this._prepareContainerData(data);
    // this._prepareMerchantData(data);

    return;
    
    const items = this.data.items;
    // const actorData = this.data.data;
    const attributes = actorData.attributes;
    const charSize = Constant.SIZE_VALUES[attributes.size.value] ?? Constant.SIZE_VALUES.default;


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
      updateData.speed = mv * Constant.SQUARE_SIZE || 0;
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
          otherActor.updateEmbeddedDocuments("Item", [containerUpdateData]);
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

    // derive monster data from HD - BAB, ST, XP
    if (type === 'monster') {
      const hdVals = attributes.hd?.value?.split('+') || [];
      const hdBase = Number(hdVals[0]) + (hdVals.length > 1 ? 1 : 0) || 0;
      updateData.attributes = updateData.attributes || {};
      if (attributes.bab?.value !== undefined) {
        Object.assign(updateData.attributes, {bab: { value: hdBase} });
      }
      const intelligent = attributes.intelligent?.value ?? attributes.type?.value === 'humanoid';
      const stBase = 17 - (intelligent ? hdBase : Math.floor(hdBase / 2));
      if (attributes.base_st?.value !== undefined) {
        Object.assign(updateData.attributes, {base_st: { value: stBase} });
      }
      const xpMulti = Number(attributes.xp_multi?.value) || 1;
      const xp = hdBase  < 1 ? 10 : hdBase === 1 ? 20 : hdBase * hdBase * 10 * xpMulti;
      updateData.xp = {value: xp};
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
      // set remove body part locations
      const injuryArr = Util.getArrFromCSL(actorData.injuries || '');
      const removedLocations = injuryArr.map(i => i.toLowerCase().replace(/  +/g, ' ').trim())
        .map(loc => {
          if (!loc.includes('severed')) return null;
          loc = loc.replace('severed', '');
          if (Constant.HIT_LOC_ARRS.THRUST.includes(loc)) return loc;
          const side = loc.includes("right") ? "right" : loc.includes("left") ? "left" : null;
          loc = loc.replace(side,'').trim();
          if (side) {
            return Constant.LIMB_GROUPS[loc]?.map(l => `${side} ${l}`);
          } 
        }).flat().filter(l => Constant.HIT_LOC_ARRS.THRUST.includes(l));
      // actorData.removedLocs = removedLocations;
      const currRemovedLocs = this.getFlag("lostlands", "removedLocs") || [];
      let updateRemovedLocs = false;
      removedLocations.forEach(l => {
        if (!currRemovedLocs.includes(l)) {
          currRemovedLocs.push(l);
          updateRemovedLocs = true;
        }
      });
      updateRemovedLocs && this.setFlag("lostlands", "removedLocs", currRemovedLocs);
      

      const naturalAc = +attributes.ac?.value || Constant.DEFAULT_BASE_AC;
      const naturalDr = +attributes.dr?.value || 0;
      const mr = +attributes.mr?.value || 0;
      const ac_mod = +attributes.ac_mod?.value || 0;

      const naturalArmorMaterial = Constant.ARMOR_VS_DMG_TYPE[attributes.hide?.value] ? attributes.hide?.value : "none";
      const wornOrHeldItems = items.filter(i => (i.data.data.worn || i.data.data.held_offhand || i.data.data.held_mainhand));

      // spell failure, skill check penalty and max dex mod
      const sf = Math.round(wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.spell_failure || 0), 0));
      const sp = Math.round(wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.skill_penalty || 0), 0));
      const maxDexPenalty = wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.max_dex_penalty || 0), 0);
      const max_dex_mod = Math.round(4 - maxDexPenalty);
      const dexAcBonus = Math.min(updateData.dex_mod, max_dex_mod);

      const riposteItem = wornOrHeldItems.filter(i => Util.stringMatch(i.data.data.atk_init,'riposte'))
        .reduce((a,b) => +b?.data.data.attributes.parry?.value || 0 > +a?.data.data.attributes.parry?.value || 0 ? b : a, undefined);
      const fluidWeap = wornOrHeldItems.filter(i => Util.stringMatch(i.data.data.atk_style,'fluid'))
        .reduce((a,b) => +b?.data.data.attributes.parry?.value || 0 > +a?.data.data.attributes.parry?.value || 0 ? b : a, undefined);
      const parryBonus = Math.max( Math.min(+riposteItem?.data.data.attributes.parry?.value || 0, max_dex_mod), 0);
      const fluidParryBonus = +fluidWeap?.data.data.attributes.parry?.value || 0;
      const parryHeight = fluidWeap?.data.data.atk_height || riposteItem?.data.data.atk_height;
      const parry = { 
        parry_item_id: riposteItem?._id || fluidWeap?._id,
        parry_bonus: parryBonus,
        fluid_parry_bonus: fluidParryBonus,
        parry_height: parryHeight,
      };
      const powerWeap = wornOrHeldItems.some(i => Util.stringMatch(i.data.data.atk_style,'power'));
      const counterWeap = wornOrHeldItems.some(i => Util.stringMatch(i.data.data.atk_init,'counter'));
      const timing = counterWeap ? 'counter' : riposteItem ? 'riposte' : '';

      let stancePenalty = 0;
      if (powerWeap) stancePenalty += Constant.STANCE_MODS.power.ac_mod;
      if (counterWeap) stancePenalty += Constant.STANCE_MODS.counter.ac_mod;

      const touch_ac = Constant.DEFAULT_BASE_AC + dexAcBonus + ac_mod + stancePenalty;

      const ac = { touch_ac, sf, sp, parry, max_dex_mod, mr, total: {}, stance_penalty: stancePenalty, timing };
      for (const dmgType of Constant.DMG_TYPES) {
        ac.total[dmgType] = {
          ac: naturalAc + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac + dexAcBonus + ac_mod,
          dr: naturalDr + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr,
        }
      }

      // ac and dr by body location for characters and humanoids
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
          const garments =  coveringItems.filter(i => !i.data.data.attributes.shield_shape?.value);
          const armor = garments.filter(i => Object.keys(i.data.data.ac || {}).length);
          
          // can only wear one shield and one bulky armor
          const shield = coveringItems.find(i => i.data.data.attributes.shield_shape?.value);
          const shieldStyle = shield?.data.data.shield_style;
          const bulkyArmor = armor.find(i => i.data.data.attributes.bulky?.value);
          const furAmor = armor.filter(i => Util.stringMatch(i.data.data.attributes.material?.value, 'fur'));
          const nonBulkyNonFurArmor = armor.filter(i => !i.data.data.attributes.bulky?.value && !Util.stringMatch(i.data.data.attributes.material?.value, 'fur'));

          // worn clo -- sort the layers by descending warmth, then second layer adds 1/2 its full warmth, third layer 1/4, and so on
          const unwornIndex = Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN;
          const wornWarmthVals = garments.map(i => (+i.data.data.warmth || 0) / 100 * v.weights[unwornIndex]);
          wornWarmthVals.sort((a,b) => b - a);
          const locWarmth = wornWarmthVals.reduce((sum, val, index) => sum + val/Math.pow(2,index), 0);
          updateData.clo += locWarmth;

          // magic damage reduction
          const mdr = coveringItems.reduce((sum, i) => sum + +i.data.data.ac?.mdr || 0, 0);
          ac.mdr += (mdr * v.weights[0] + mdr * v.weights[1]) / 200;

          
          // piercing is the basis for sorted armor Ids
          let sorted_armor_ids = nonBulkyNonFurArmor.sort((a,b) => (+b.data.data.ac["piercing"]?.ac || 0) - (+a.data.data.ac["piercing"]?.ac || 0))
            .map(i => i._id);
          if (bulkyArmor?._id) sorted_armor_ids = [bulkyArmor._id, ...sorted_armor_ids];
          if (furAmor.length) sorted_armor_ids = [...furAmor.map(i => i._id), ...sorted_armor_ids];
          if (shield?._id) sorted_armor_ids = [shield._id, ...sorted_armor_ids];
          ac[k].sorted_armor_ids = sorted_armor_ids;

          // determine if parry bonus applies to this area
          let appliedParryBonus = !!riposteItem ? parryBonus : 0;
          if (Constant.HEIGHT_AREAS[parryHeight]?.includes(k)) appliedParryBonus = fluidParryBonus;

          // worn ac & dr
          for (const dmgType of Constant.DMG_TYPES) {
            const shieldAcBonus = shield?.data.data.ac?.[dmgType]?.ac || 0;
            const fluidShieldAcMod = Util.stringMatch(shieldStyle, 'fluid') ? Constant.STANCE_MODS.fluid.shield_ac_mod : 0;
            // no shield dr vs. piercing on forearm or hand
            const shieldDrBonus = ['forearm','hand'].includes(k) && dmgType === 'piercing' ? 0 : shield?.data.data.ac?.[dmgType]?.dr || 0;
            const fluidShieldDrBonus = (Util.stringMatch(shieldStyle, 'fluid')) ? Constant.STANCE_MODS.fluid.shield_dr_mod : 0;

            const unarmoredAc = naturalAc + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac;
            const unarmoredDr = naturalDr + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr;

            const wornAc = Math.max(0, ...armor.map(i => +i.data.data.ac?.[dmgType]?.ac || 0));
            const locAc = Math.max(unarmoredAc, wornAc) + shieldAcBonus + + fluidShieldAcMod + dexAcBonus + ac_mod + appliedParryBonus + stancePenalty;
            const locDr = Math.min(Constant.MAX_ARMOR_DR, armor.reduce((sum, i) => sum + +i.data.data.ac?.[dmgType]?.dr || 0, 0) + shieldDrBonus)
              + fluidShieldDrBonus + unarmoredDr;

            ac[k][dmgType] = { ac: locAc, dr: locDr, shield_bonus: shieldAcBonus };
            ac.total[dmgType].ac += (locAc * v.weights[0] + locAc * v.weights[1]) / 200;
            ac.total[dmgType].dr += (locDr * v.weights[0] + locDr * v.weights[1]) / 200;
          }
        }

        updateData.clo = Math.round(updateData.clo);

        // round ac
        for (const v of Object.values(ac.total)) {
          v.ac = (Math.round(v.ac) || touch_ac);
          v.dr = Math.round(v.dr);
        }
        ac.mdr = Math.round(ac.mdr);
      }

      // add AC to actorData
      actorData.ac = ac;

      // weap profs
      updateData.weap_profs = Util.getArrFromCSL(attributes.weap_profs?.value || '').map(p => p.toLowerCase());
      if (updateData.weap_profs.some(p => !Constant.WEAPON_CATEGORIES.includes(p))) {
        ui.notifications.error(`Invalid weapon proficiency specified for ${this.name}`);
      }

      // save values
      const svItems = wornOrHeldItems.filter(i => i.data.data.attributes.sv_mod?.value);
      const sv_mod = svItems.reduce((a, b) => a + (+b.data.data.attributes.sv_mod?.value || 0), 0) + (+attributes.sv_mod?.value || 0);
      updateData.sv = (+attributes.base_sv?.value - sv_mod) || 0;

    }
    
    // attitude map
    if (type !== 'container') {
      updateData.attitude_map = actorData.attitude_map || {};
    }

    // update actor if any update data is different than existing data
    for (const key of Object.keys(updateData)) {
      if (foundry.utils.fastDeepEqual(updateData[key], actorData[key])) {
        delete updateData[key];
      }
    }
    
    // if (this._id && Object.keys(updateData).length) {
    //   await Util.wait(200);
    //   this.update({data: updateData});
    // }

  }

  _prepareCharacterData(actorData) {
    const type = actorData.type;
    if (type !== 'character') return;
    const charData = actorData.data;
    const items = actorData.items;
    const wornOrHeldItems = items.filter(i => (i.data.data.worn || i.data.data.held_offhand || i.data.data.held_mainhand));
    const attrs = charData.attributes;
    const charSize = Constant.SIZE_VALUES[attrs.size.value] ?? Constant.SIZE_VALUES.default;


    // encumbrance
    const enc = Math.round(items.reduce((a, b) => a + (+b.data.data.quantity * +b.data.data.weight || 0), 0) * 10) / 10;
    charData.enc = enc;


    // derive mv and speed from encumbrance
    const encStr = Math.round( Util.sizeMulti(attrs.str.value, charSize) );
    const baseMv = attrs.base_mv.value;
    const mvPenalty = Math.floor( Math.max(0, charData.enc - encStr) / encStr * 3 );
    // If there is no penalty, mv is equal to base (i.e. unencumbered) MV
    // Otherwise, it's the smaller of the base MV and the default MV minus the penalty.
    const mv = !mvPenalty ? baseMv : Math.min(baseMv, Constant.DEFAULT_BASE_MV - mvPenalty);
    charData.mv = mv;
    charData.speed = mv * Constant.SQUARE_SIZE;


    // ability score modifiers
    if (attrs.str) attrs.str.mod = Math.floor(attrs.str.value / 3 - 3);
    if (attrs.int) attrs.int.mod = Math.floor(attrs.int.value / 3 - 3);
    if (attrs.wis) attrs.wis.mod = Math.floor(attrs.wis.value / 3 - 3);
    if (attrs.dex) attrs.dex.mod = Math.floor(attrs.dex.value / 3 - 3);
    if (attrs.con) attrs.con.mod = Math.floor(attrs.con.value / 3 - 3);
    if (attrs.cha) attrs.cha.mod = Math.floor(attrs.cha.value / 3 - 3);


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
    

    
    // spell failure, skill check penalty and max dex mod
    charData.spell_failure = Math.round(wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.spell_failure || 0), 0));
    charData.skill_penalty = Math.round(wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.skill_penalty || 0), 0));
    const maxDexPenalty = wornOrHeldItems.reduce((sum, i) => sum + (+i.data.data.ac?.max_dex_penalty || 0), 0);
    charData.max_dex_mod = Math.floor(Constant.MAX_DEX_MOD - maxDexPenalty);

    // AC
    this._prepareCharHumanoidAc(actorData);
    
    // weap profs
    charData.weap_profs = Util.getArrFromCSL(attrs.weap_profs?.value || '').map(p => p.toLowerCase()).filter(p => Constant.WEAPON_CATEGORIES.includes(p));

    // save values
    const svItems = wornOrHeldItems.filter(i => i.data.data.attributes.sv_mod?.value);
    const sv_mod = svItems.reduce((a, b) => a + (+b.data.data.attributes.sv_mod.value || 0), 0);
    charData.sv = attrs.base_sv.value - sv_mod;
  }

  _prepareCharHumanoidAc(actorData) {
    const type = actorData.type;
    if (type !== 'character' && type !== 'humanoid') return;
    const data = actorData.data;
    const items = actorData.items;
    const wornOrHeldItems = items.filter(i => (i.data.data.worn || i.data.data.held_offhand || i.data.data.held_mainhand));
    const attrs = data.attributes;
    const charSize = Constant.SIZE_VALUES[attrs.size.value] ?? Constant.SIZE_VALUES.default;

    // AC
    const naturalArmorMaterial = Constant.ARMOR_VS_DMG_TYPE[attrs.hide?.value] ? attrs.hide.value : "none";
    const naturalAc = attrs.base_ac.value ?? Constant.DEFAULT_BASE_AC;
    const naturalDr = Math.max(0, charSize - 2);
    const dexAcBonus = Math.min(attrs.dex.mod || 0, data.max_dex_mod || 0);

    const getBetterParryItem = (a,b) => (+b?.data.data.attributes.parry?.value || 0) > (+a?.data.data.attributes.parry?.value || 0) ? b : a;
    const riposteItem = wornOrHeldItems.filter(i => Util.stringMatch(i.type, 'weapon') && Util.stringMatch(i.data.data.atk_init,'riposte'))
      .reduce(getBetterParryItem, undefined);
    const fluidWeap = wornOrHeldItems.filter(i => Util.stringMatch(i.type, 'weapon') && Util.stringMatch(i.data.data.atk_style,'fluid'))
      .reduce(getBetterParryItem, undefined);
    
    // parry-riposte overwrites fluid parry
    const riposteParryBonus = +riposteItem?.data.data.attributes.parry?.value || 0;
    const fluidParryBonus = +fluidWeap?.data.data.attributes.parry?.value || 0;
    const parryHeight = riposteItem?.data.data.atk_height || fluidWeap?.data.data.atk_height || null;
    const parry = { 
      parry_item_id: riposteItem?._id || fluidWeap?._id || null,
      parry_bonus: riposteParryBonus || fluidParryBonus || 0,
      parry_type: riposteParryBonus ? 'riposte' : fluidParryBonus ? 'fluid' : '',
      parry_height: parryHeight,
    };

    // stance penalty
    const powerWeap = wornOrHeldItems.some(i => Util.stringMatch(i.data.data.atk_style,'power'));
    const counterWeap = wornOrHeldItems.some(i => Util.stringMatch(i.data.data.atk_init,'counter'));
    const timing = counterWeap ? 'counter' : riposteItem ? 'riposte' : '';
    const powerWeapPenalty = powerWeap ? Constant.STANCE_MODS.power.ac_mod : 0;
    const counterWeapPenalty = counterWeap ? Constant.STANCE_MODS.counter.ac_mod : 0;
    const stancePenalty = powerWeapPenalty + counterWeapPenalty;

    const touch_ac = naturalAc + dexAcBonus + stancePenalty;
    const ac = { touch_ac, parry, total: {}, stance_penalty: stancePenalty, timing };
    // for (const dmgType of Constant.DMG_TYPES) { // this is just for monsters
    //   ac.total[dmgType] = {
    //     ac: naturalAc + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac + dexAcBonus,
    //     dr: naturalDr + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr,
    //   }
    // }


    // ac and by hit location
    // initialize total AC/DR values and clo
    for (const dmgType of Constant.DMG_TYPES) {
      ac.total[dmgType] = {
        ac: 0,
        dr: 0,
      }
    }
    let clo = 0;

    for (const [k,v] of Object.entries(Constant.HIT_LOCATIONS)) {
      ac[k] = {};
      const coveringItems = wornOrHeldItems.filter(i => i.data.data.coverage?.includes(k));
      const garments = coveringItems.filter(i => i.type === 'clothing' || i.type === 'armor');
      const armor = garments.filter(i => i.type === 'armor');
      
      // can only wear one shield and one bulky armor
      const shield = coveringItems.find(i => i.type === 'shield');
      const shieldStyle = shield?.data.data.shield_style;
      const bulkyArmor = armor.find(i => i.data.data.bulky);
      const furArmor = armor.filter(i => Util.stringMatch(i.data.data.attributes.material?.value, 'fur'));
      const nonBulkyNonFurArmor = armor.filter(i => !i.data.data.bulky && !Util.stringMatch(i.data.data.attributes.material?.value, 'fur'));

      // worn clo -- sort the layers by descending warmth, then second layer adds 1/2 its full warmth, third layer 1/4, and so on
      const unwornIndex = Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN;
      const wornWarmthVals = garments.map(i => (+i.data.data.clo || 0) / 100 * v.weights[unwornIndex]);
      wornWarmthVals.sort((a,b) => b - a);
      const locWarmth = wornWarmthVals.reduce((sum, val, index) => sum + val/Math.pow(2, index), 0);
      clo += locWarmth;

      // magic damage reduction
      const mdr = coveringItems.reduce((sum, i) => sum + +i.data.data.ac?.mdr || 0, 0);
      ac.mdr += (mdr * v.weights[0] + mdr * v.weights[1]) / 200;

      
      // piercing is the basis for sorted armor Ids
      let sorted_armor_ids = nonBulkyNonFurArmor.sort((a,b) => (+b.data.data.ac["piercing"]?.ac || 0) - (+a.data.data.ac["piercing"]?.ac || 0))
        .map(i => i._id);
      if (bulkyArmor?._id) sorted_armor_ids = [bulkyArmor._id, ...sorted_armor_ids];
      if (furArmor.length) sorted_armor_ids = [...furArmor.map(i => i._id), ...sorted_armor_ids];
      if (shield?._id) sorted_armor_ids = [shield._id, ...sorted_armor_ids];
      ac[k].sorted_armor_ids = sorted_armor_ids;

      // parry bonus applies if parry-riposte, or if parryHeight includes this area
      const appliedParryBonus = (!!riposteItem || Constant.HEIGHT_AREAS[parryHeight]?.includes(k)) ? parry.parry_bonus : 0;

      // worn ac & dr by damage type
      for (const dmgType of Constant.DMG_TYPES) {
        const shieldAcBonus = shield?.data.data.ac?.[dmgType]?.ac || 0;
        const fluidShieldAcMod = Util.stringMatch(shieldStyle, 'fluid') ? Constant.STANCE_MODS.fluid.shield_ac_mod : 0;
        // no shield dr vs. piercing on forearm or hand
        const shieldDrBonus = ['forearm','hand'].includes(k) && dmgType === 'piercing' ? 0 : shield?.data.data.ac?.[dmgType]?.dr || 0;
        const fluidShieldDrBonus = (Util.stringMatch(shieldStyle, 'fluid')) ? Constant.STANCE_MODS.fluid.shield_dr_mod : 0;

        const unarmoredAc = naturalAc + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].ac;
        const unarmoredDr = naturalDr + Constant.ARMOR_VS_DMG_TYPE[naturalArmorMaterial][dmgType].dr;

        const wornAc = Math.max(0, ...armor.map(i => +i.data.data.ac?.[dmgType]?.ac || 0));
        const locAc = Math.max(unarmoredAc, wornAc) + shieldAcBonus + fluidShieldAcMod + dexAcBonus + appliedParryBonus + stancePenalty;
        const locDr = Math.min(Constant.MAX_ARMOR_DR, armor.reduce((sum, i) => sum + +i.data.data.ac?.[dmgType]?.dr || 0, 0) + shieldDrBonus)
          + fluidShieldDrBonus + unarmoredDr;

        ac[k][dmgType] = { ac: locAc, dr: locDr, shield_bonus: shieldAcBonus };
        ac.total[dmgType].ac += (locAc * v.weights[0] + locAc * v.weights[1]) / 200;
        ac.total[dmgType].dr += (locDr * v.weights[0] + locDr * v.weights[1]) / 200;
      }
    }

    data.clo = Math.floor(clo);

    // round ac
    for (const v of Object.values(ac.total)) {
      v.ac = Math.floor( Math.round(v.ac), touch_ac);
      v.dr = Math.floor(v.dr);
    }
    ac.mdr = Math.floor(ac.mdr);

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
