import { EntitySheetHelper } from './helper/helper.js';
import * as ActorUtil from './helper/actor.js';
import * as Constant from './constants.js';

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
// eslint-disable-next-line no-undef
export class SimpleActor extends Actor {
  // "character","humanoid","monster","storage","merchant","party"
  /** @override*/
  prepareBaseData() {
    // no access to embedded entities here
    // this is also before active effects are applied
    // therefore derivations here should not use character items or any attributes that are modified by active effects
    // TODO derive character location max hp here
    super.prepareBaseData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const actorData = this.data;

    this._prepareCharacterBaseData(); // TODO if 0, derive XP value of characters
  }

  _prepareCharacterBaseData() {
    // skills
  }

  /** @override */
  prepareDerivedData() {
    // TODO note skill target in actor derived data
    super.prepareDerivedData();
    const actorData = this.data;
    console.log('Preparing actor data', actorData);

    // this._prepareCharacterData(actorData);
    // this._prepareHumanoidData(actorData);
    // TODO derive monster natrural weapon atk mode from first atk_mode
    // this._prepareMonsterData(actorData);
    // this._prepareStorageData(actorData);
    // // merchant?
    // this._preparePartyData(actorData);
    // // TODO fix shield shape/size coverage
  }

  _prepareCharacterData(actorData) {
    const { type } = actorData;
    if (type !== 'character') {
      return;
    }

    const charData = actorData.data;
    const { items } = actorData;
    const wornItems = items.filter((i) => i.data.data.worn);
    const attrs = charData.attributes;
    const abilities = attrs.ability_scores || {};
    const size = attrs.size.value.toUpperCase().trim();
    const sizeVal = Constant.SIZE_VALUES[size] ?? Constant.SIZE_VALUES.default;
    const AGILITY_PENALTY_THRESHOLD = 5;
    const AGILITY_PENALTY_FACTOR = 3;
    const armor_check_penalty_THRESHOLD = 2;
    const SPELL_FAILURE_FACTOR = 5 / 2;
    const DEFAULT_STR = 10;
    const ENC_BASE = 20 / 3;
    const ENC_FACTOR = 2 / 3;
    const BASE_MV = {
      default: 12,
      dwarf: 9,
      barbarian: 15,
    };
    const BASE_SV = {
      default: 0,
      paladin: 2,
    };
    const BASE_AC = 10;

    // retainer loyalty
    if (attrs.admin.is_retainer.value) {
      const loyalty = attrs.retainer.loyalty || {};
      if (loyalty.value) loyalty.mod = this._getScoreMod(loyalty.value);
    }

    // encumbrance
    charData.enc = this._getEnc(items);

    // mv & speed
    const str = abilities.str.value ?? DEFAULT_STR;
    const encStr = Math.round(ActorUtil.sizeMulti(str, sizeVal));
    const baseMv =
      BASE_MV[attrs.race.value?.toLowerCase()] ?? BASE_MV[attrs.class.value?.toLowerCase()] ?? BASE_MV.default;
    const mvPenalty = Math.floor(((charData.enc / (ENC_BASE + encStr * ENC_FACTOR)) * baseMv) / DEFAULT_BASE_MV);
    const mv = Math.max(0, baseMv - mvPenalty);
    charData.mv = mv;
    charData.speed = mv * Constant.GRID_SIZE;

    // ability score mods
    this._addAbilityScoreMods(abilities);

    // set remove body part locations
    this._updateRemovedLocations(charData);

    // spell failure, skill check penalty & max dex mod // TODO go back to max dex mod from agility penalty
    const totalPenaltyWgt = wornItems.reduce((sum, i) => sum + (+i.data.data.penalty_weight || 0), 0);
    charData.spell_failure = Math.floor(totalPenaltyWgt * SPELL_FAILURE_FACTOR);
    charData.armor_check_penalty = Math.max(0, Math.floor(totalPenaltyWgt - armor_check_penalty_THRESHOLD));
    charData.agility_penalty = Math.floor(
      Math.max(0, totalPenaltyWgt - AGILITY_PENALTY_THRESHOLD) / AGILITY_PENALTY_FACTOR
    );

    // save bonuses
    const magicWornClothing = wornItems.filter(
      (i) => i.type === 'clothing' && i.data.data.attributes.admin?.magic.value
    );
    const magicClothingSvMod = this._getHighestMagicVal(magicWornClothing, 'sv_mod');
    const magicWornJewelry = wornItems.filter((i) => i.type === 'jewelry' && i.data.data.attributes.admin?.magic.value);
    const magicJewelrySvMod = this._getHighestMagicVal(magicWornJewelry, 'sv_mod');
    const baseSv = BASE_SV[attrs.class.value?.toLowerCase()] ?? BASE_SV.default;
    charData.sv = baseSv + +attrs.lvl.value + magicClothingSvMod + magicJewelrySvMod;
    charData.msv = baseSv + +attrs.lvl.value + abilities.wis.mod + magicClothingSvMod + magicJewelrySvMod;

    // TODO CONTINUE HERE
    // base attack bonus - derive from level and class
    // derive other things from level and class
    // macro for increasing level and button that becomes active if XP > xp_required
    //    also rolls chat for hit points
    charData.bab =
      charData.hit_die =
      // size
      charData.size =
        sizeVal;

    // worn AC and clo
    this._addWornAc(actorData, BASE_AC);
    this._addWornClo(actorData);

    // weapons
    const getWeapProfs = (weapCatList) =>
      Util.getArrFromCSL(weapCatList || '')
        .map((p) => p.toLowerCase())
        .filter((p) => Constant.WEAPON_CATEGORIES.includes(p));
    charData.weap_profs = getWeapProfs(attrs.weapons.weap_profs.value);
  }

  _prepareHumanoidData(actorData) {
    const { type } = actorData;
    if (type !== 'humanoid') return;
    const { data } = actorData;
    const { items } = actorData;
    const wornItems = items.filter((i) => i.data.data.worn);
    const attrs = data.attributes;
    const abilities = attrs.ability_scores || {};
    const size = attrs.size.value.toUpperCase().trim();
    const sizeVal = Constant.SIZE_VALUES[size] ?? Constant.SIZE_VALUES.default;
    const BASE_AC = +attrs.base_ac || 9;
    const DEFAULT_MV = 9;

    // HD is given in the format "1/2" (which should produce an hdVal of 0) or "8+2" (which should produce 9)
    const hdValArr = attrs.hd.value
      .split('+')
      .splice(0, 2)
      .map((x) => Number(x))
      .filter((x) => !isNaN(x));
    const hdVal = Number(hdValArr[0] + hdValArr.length - 1) || 0;

    // xp
    const xpMulti = Math.max(1, +attrs.xp_multi.value || 1);
    const hpMax = +data.hp.max || 0;
    data.xp = this._getMonsterXP(hdVal, hpMax, xpMulti);

    // mv & speed
    const mv = +attrs.mv.value || DEFAULT_MV;
    data.mv = mv;
    data.speed = mv * Constant.GRID_SIZE;

    // sv
    const magicWornClothing = wornItems.filter(
      (i) => i.type === 'clothing' && i.data.data.attributes.admin?.magic.value
    );
    const magicClothingSvMod = this._getHighestMagicVal(magicWornClothing, 'sv_mod');
    const magicWornJewelry = wornItems.filter((i) => i.type === 'jewelry' && i.data.data.attributes.admin?.magic.value);
    const magicJewelrySvMod = this._getHighestMagicVal(magicWornJewelry, 'sv_mod');
    const intelligent = attrs.intelligent.value;
    const msvVal = intelligent ? hdVal : Math.floor(hdVal / 2);
    data.sv = hdVal + magicClothingSvMod + magicJewelrySvMod;
    data.msv = msvVal + magicClothingSvMod + magicJewelrySvMod;

    // base attack bonus
    data.bab = hdVal;

    // size
    data.size = sizeVal;

    this._addAbilityScoreMods(abilities);

    this._addWornAc(actorData, BASE_AC);
  }

  _prepareMonsterData(actorData) {
    const { type } = actorData;
    if (type !== 'monster') return;
    const { data } = actorData;
    const attrs = data.attributes;
    const { items } = actorData;
    const size = attrs.size.value.toUpperCase().trim();
    const sizeVal = Constant.SIZE_VALUES[size] ?? Constant.SIZE_VALUES.default;

    // HD is given in the format "1/2" (which should produce an hdVal of 0) or "8+2" (which should produce 9)
    const hdValArr = attrs.hd.value
      .split('+')
      .splice(0, 2)
      .map((x) => Number(x))
      .filter((x) => !isNaN(x));
    const hdVal = Number(hdValArr[0] + hdValArr.length - 1) || 0;

    const xpMulti = Math.max(1, +attrs.xp_multi.value || 1);
    const hpMax = +data.hp.max || 0;
    data.xp = this._getMonsterXP(hdVal, hpMax, xpMulti);

    // mv & speed
    const mv = +attrs.mv.value || Constant.DEFAULT_MONSTER_MV;
    data.mv = mv;
    data.speed = mv * Constant.GRID_SIZE;

    const intelligent = attrs.intelligent.value;
    const msvVal = intelligent ? hdVal : Math.floor(hdVal / 2);
    data.sv = Math.max(Constant.MIN_SAVE_TARGET, Constant.DEFAULT_BASE_SV - hdVal);
    data.msv = Math.max(Constant.MIN_SAVE_TARGET, Constant.DEFAULT_BASE_SV - msvVal);

    data.bab = hdVal;

    data.size = sizeVal;

    // record natural weapon Ids for attack routine
    const atkRoutine = attrs.atk_routine.value || '';
    const atkRoutineArr = atkRoutine.split(',').filter((t) => t);
    const atkRoutineIds = [];
    atkRoutineArr.forEach((a) => {
      const weap = items.find((i) => i.type === 'natural_weapon' && Util.stringMatch(i.name, a));
      if (weap && weap._id) atkRoutineIds.push(weap._id);
    });
    data.atk_routine_ids = atkRoutineIds;

    // ac & dr
    const naturalArmorMaterial = Constant.armorVsDmgType[attrs.hide.value] ? attrs.hide.value : 'none';
    const naturalAc = attrs.ac.value ?? Constant.DEFAULT_BASE_AC;
    const naturalDr = Math.max(0, sizeVal - 2);
    const hideAc = Constant.armorVsDmgType[naturalArmorMaterial].base_AC;
    const touchAc = naturalAc - hideAc - sizeVal;
    const ac = { touch_ac: touchAc, total: {} };

    for (const dmgType of Constant.DMG_TYPES) {
      const unarmoredAc = Constant.armorVsDmgType[naturalArmorMaterial][dmgType].ac;
      const unarmoredDr = Constant.armorVsDmgType[naturalArmorMaterial][dmgType].dr;

      ac.total[dmgType] = {
        ac: naturalAc + unarmoredAc,
        dr: naturalDr + unarmoredDr,
      };
    }

    data.ac = ac;
  }

  _prepareStorageData(actorData) {
    // TODO non-magical containers like backpacks & sacks don't give "bonus" weight, but are required to carry more than 2lb of "loose" items
    const { type } = actorData;
    if (type !== 'container') return;

    const containerName = actorData.name;
    const { items } = actorData;
    const { data } = actorData;
    const attrs = data.attributes;
    const enc = this._getEnc(items);
    data.enc = enc;

    // find item with same name as this container owned by another character
    if (!game.actors) return;
    const characters = game.actors.filter(
      (a) => a.type === 'character' && a.items.some((i) => i.type === 'container' && i.name === containerName)
    );
    if (!characters.length) return;

    if (characters.length > 1) ui.notifications.error(`More than one character with container ${containerName}!`);

    const character = characters[0];
    const container = character.items.find((item) => item.name === containerName);
    if (!container?._id) return;

    const containerFactor = +attrs.load_red_factor.value || 1;
    const containerWeight = Math.round((enc / containerFactor) * 10) / 10 || 1;
    const containerUpdateData = { _id: container._id, 'data.weight': containerWeight };
    if (containerWeight !== container.data.data.weight) {
      character.updateEmbeddedDocuments('Item', [containerUpdateData]);
    }
  }

  _preparePartyData(actorData) {
    const { type } = actorData;
    if (type !== 'party') return;

    const { data } = actorData;
    const attrs = data.attributes;

    // party MV = slowest member TODO allow DM to hardcode in attrs?
    const membersVal = attrs.members.value || '';
    if (game.actors?.getName) {
      const members = Util.getArrFromCSL(membersVal)
        .map((name) => game.actors.getName(name))
        .filter((a) => a);
      const memberMVs = members.map((a) => +a.data.data.mv).filter((m) => m != null && !isNaN(m));
      const slowestMV = memberMVs.length ? Math.min(...memberMVs) : Constant.DEFAULT_BASE_MV;
      const mv = slowestMV || Constant.DEFAULT_BASE_MV;
      console.log(`Updating party ${actorData.name} MV to ${mv}`, members);
      data.mv = mv;
    }
  }

  // TODO test
  _updateRemovedLocations(charData) {
    const injuryArr = Util.getArrFromCSL(charData.injuries || '');
    const removedLocations = injuryArr
      .map((i) => {
        let loc = i.toLowerCase();
        if (!loc.includes('severed')) {
          return null;
        }
        loc = loc.replace('severed', '').trim();
        if (Object.keys(Constant.HIT_LOCATIONS).includes(loc)) {
          return loc;
        }
        const side = loc.includes('right') ? 'right' : loc.includes('left') ? 'left' : null;
        if (!side) {
          return null;
        }
        const limbGroup = Constant.LIMB_GROUPS[loc.replace(side, '').trim()];
        return limbGroup ? limbGroup.map((l) => `${side} ${l}`) : loc;
      })
      .flat();

    charData.removedLocs = removedLocations;
  }

  _getEnc(items) {
    const wgtItems = items.filter((i) => +i.data.data.total_weight > 0);
    const sumItemWeight = (a, b) => a + b.data.data.total_weight;
    const enc = Math.round(wgtItems.reduce(sumItemWeight, 0) * 10) / 10;
    return enc;
  }

  _getMonsterXP(hdVal, hpMax, xpMulti) {
    // hd x hd x 10 x multiplier + 1/hp
    return hdVal * hdVal * 10 * xpMulti + hpMax;
  }

  _addAbilityScoreMods(abilities) {
    if (abilities.str) abilities.str.mod = this._getScoreMod(+abilities.str.value);
    if (abilities.int) abilities.int.mod = this._getScoreMod(+abilities.int.value);
    if (abilities.wis) abilities.wis.mod = this._getScoreMod(+abilities.wis.value);
    if (abilities.dex) abilities.dex.mod = this._getScoreMod(+abilities.dex.value);
    if (abilities.con) abilities.con.mod = this._getScoreMod(+abilities.con.value);
    if (abilities.cha) abilities.cha.mod = this._getScoreMod(+abilities.cha.value);
  }

  _getHighestMagicVal(items, key) {
    return items.length ? Math.max(...items.map((c) => +c.data.data.attributes.magic_mods?.[key].value || 0)) : 0;
  }

  _addWornClo(actorData) {
    const { data } = actorData;
    const { items } = actorData;
    const wornItems = items.filter((i) => i.data.data.worn);
    const charSize = +data.size ?? Constant.SIZE_VALUES.default;

    let clo = 0;

    for (const [k, v] of Object.entries(Constant.HIT_LOCATIONS)) {
      const coveringItems = wornItems.filter((i) => i.data.data.coverage?.includes(k));
      const garments = coveringItems.filter(
        (i) => i.data.data.attributes.admin?.wearable.value && Number(i.data.data.clo)
      );

      // sort the layers by descending clo
      //    second layer adds 1/2 its full clo, third layer 1/4, and so on
      const unwornIndex = Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN;
      const locationWeight = v.weights[unwornIndex] / 100;
      const cloVals = garments.map(
        (i) => (i.data.data.clo - this._getSizePenalty(i.data.data.size, charSize)) * locationWeight
      );
      cloVals.sort((a, b) => b - a);
      const locWarmth = cloVals.reduce((sum, val, index) => sum + val / 2 ** index, 0);
      clo += locWarmth;
    }

    data.clo = Math.floor(clo);
  }

  _getSizePenalty(itemSize, charSize) {
    return Math.max(0, +itemSize - +charSize) || 0;
  }

  _addWornAc(actorData, naturalAc) {
    const { data } = actorData;
    const attrs = data.attributes;
    const { items } = actorData;
    const heldItems = items.filter((i) => i.data.data.held_offhand || i.data.data.held_mainhand);
    const wornItems = items.filter((i) => i.data.data.worn);
    const charSize = data.size;
    const NATURAL_DR_THRESHOLD = 2;

    const naturalArmorMaterial = Constant.armorVsDmgType[attrs.hide?.value] ? attrs.hide.value : 'none';
    const naturalDr = Math.max(0, charSize - NATURAL_DR_THRESHOLD);
    const dexAcBonus = +attrs.ability_scores?.dex?.mod || 0;
    const agilityPenalty = +data.agility_penalty || 0;

    // parry weapons
    // riposte parry overwrites fluid parry, stable bonus is 1/2 parry, fluid is 1/2 + 1
    const parry = [];
    const parryValReducer = (a, b) =>
      +b.data.data.attributes.parry.value > +a.data.data.attributes.parry.value ? b : a;
    const riposteWeaps = heldItems.filter(
      (i) =>
        (i.type === 'melee_weapon' || i.type === 'throw_weapon') &&
        i.data.data.atk_timing === 'riposte' &&
        +i.data.data.attributes.parry?.value
    );
    const riposteWeap = riposteWeaps.reduce(parryValReducer, null);
    if (riposteWeap) {
      parry.push({
        parry_item_id: riposteWeap._id,
        parry_bonus: +riposteWeap.data.data.attributes.parry.value || 0,
        parry_type: 'riposte',
        parry_height: riposteWeap.data.data.atk_height,
      });
    } else {
      const fluidStableWeaps = heldItems.filter(
        (i) =>
          (i.type === 'melee_weapon' || i.type === 'throw_weapon') &&
          (i.data.data.atk_style === 'fluid' || i.data.data.atk_style === 'stable') &&
          +i.data.data.attributes.parry?.value
      );
      const fluidStableWeapsByHeight = Constant.HEIGHT_AREAS.map((a) =>
        fluidStableWeaps.filter((w) => w.data.data.atk_height === a).reduce(parryValReducer, null)
      ).filter((w) => w);
      parry.push(
        ...fluidStableWeapsByHeight.map((w) => {
          const parry_type = w.data.data.atk_style;
          const parry_value = Math.floor(+w.data.data.attributes.parry.value / 2) || 0;
          const parryTypeBonus = parry_type === 'stable' ? 1 : 0;
          const parry_bonus = parry_value + parryTypeBonus;
          return {
            parry_item_id: w._id,
            parry_bonus,
            parry_type,
            parry_height: w.data.data.atk_height,
          };
        })
      );
    }

    // stance penalty
    const powerWeap = heldItems.some((i) => i.data.data.atk_style === 'power');
    const counterWeap = heldItems.some((i) => i.data.data.atk_timing === 'counter');
    const timing = counterWeap ? 'counter' : riposteWeap ? 'riposte' : '';
    const powerWeapPenalty = powerWeap ? Constant.STANCE_MODS.power.ac_mod : 0;
    const counterWeapPenalty = counterWeap ? Constant.STANCE_MODS.counter.ac_mod : 0;
    const stancePenalty = powerWeapPenalty + counterWeapPenalty;

    // get best clothing magical AC bonus
    const magicWornClothing = wornItems.filter(
      (i) => i.type === 'clothing' && i.data.data.attributes.admin?.magic.value
    );
    const magicClothingACBonus = this._getHighestMagicVal(magicWornClothing, 'ac_mod');

    // get best jewelry magical AC bonus
    const magicWornJewelry = wornItems.filter((i) => i.type === 'jewelry' && i.data.data.attributes.admin?.magic.value);
    const magicJewelryACBonus = this._getHighestMagicVal(magicWornJewelry, 'ac_mod');

    // ac by hit location
    // initialize total AC/DR values
    const touchAc = Math.max(1, naturalAc + dexAcBonus + stancePenalty - agilityPenalty);
    const ac = {
      touch_ac: touchAc,
      mdr: 0,
      parry,
      total: {},
      stance_penalty: stancePenalty,
      timing,
    };
    for (const dmgType of Constant.DMG_TYPES) {
      ac.total[dmgType] = {
        ac: 0,
        dr: 0,
      };
    }

    for (const [k, v] of Object.entries(Constant.HIT_LOCATIONS)) {
      ac[k] = {};
      const locationWeight =
        (v.weights[Constant.HIT_LOC_WEIGHT_INDEXES.SWING] + v.weights[Constant.HIT_LOC_WEIGHT_INDEXES.THRUST]) / 200;
      const coveringItems = wornItems.filter((i) => i.data.data.coverage?.includes(k));
      // can only wear three total armor layers
      const armor = coveringItems
        .filter((i) => (i.type === 'armor' || i.type === 'helmet') && i.data.data.ac)
        .slice(0, 3);
      const bulkyArmor = armor.filter((i) => i.data.data.bulky);
      const nonBulkyArmor = armor.filter((i) => !i.data.data.bulky);

      // magic damage reduction
      const mdr = armor.reduce((sum, i) => sum + +i.data.data.ac?.mdr || 0, 0);
      ac.mdr += mdr * locationWeight;

      // shield
      const shield = coveringItems.find((i) => i.type === 'shield');
      const shieldStyle = shield?.data.data.shield_style;
      const fluidShieldAcMod = shieldStyle === 'fluid' ? Constant.STANCE_MODS.fluid.shield_ac_mod : 0;
      const shieldAcBonus = (shield?.data.data.ac?.[dmgType]?.ac || 0) + fluidShieldAcMod;
      const fluidShieldDrBonus = shieldStyle === 'fluid' ? Constant.STANCE_MODS.fluid.shield_dr_mod : 0;
      const shieldDrBonus = (shield?.data.data.ac?.[dmgType]?.dr || 0) + fluidShieldDrBonus;

      // sort non-bulky armors by pierce AC and record Ids
      //    shield goes on top of bulky goes on top of non-bulky
      const getPierceAc = (item) => +item.data.data.ac.pierce.ac || 0;
      let sorted_armor_ids = nonBulkyArmor.sort((a, b) => getPierceAc(b) - getPierceAc(a)).map((i) => i._id);
      const bulkyArmorIds = bulkyArmor.sort((a, b) => getPierceAc(b) - getPierceAc(a)).map((i) => i._id);
      sorted_armor_ids = [...bulkyArmorIds, ...sorted_armor_ids];
      if (shield?._id) sorted_armor_ids = [shield._id, ...sorted_armor_ids];
      ac[k].sorted_armor_ids = sorted_armor_ids;

      // parry bonus applies if riposting, or if parryHeight includes this area
      const appliedParryBonus =
        ac.parry.find((p) => Constant.HEIGHT_AREAS[p.parry_height]?.includes(k))?.parry_bonus || 0;

      // ac & dr by damage type
      for (const dmgType of Constant.DMG_TYPES) {
        let appliedArmor = armor;
        // no shield dr vs. pierce on forearm or hand
        const appliedShieldDrBonus = ['forearm', 'hand'].includes(k) && dmgType === 'pierce' ? 0 : shieldDrBonus;

        // ignore helmet for pierce on eyes and jaw if open
        if (dmgType === 'pierce' && ['eye', 'jaw', 'ear'].includes(k)) {
          appliedArmor = appliedArmor.filter((a) => a.data.data.attributes.closed.value);
        }

        // ac -- use highest of worn ACs if wearing armor, else use unarmored AC
        const unarmoredAc = Constant.armorVsDmgType[naturalArmorMaterial][dmgType].ac;
        const wornAc = Math.max(
          0,
          ...appliedArmor.map(
            (i) => (+i.data.data.ac?.[dmgType]?.ac || 0) - this._getSizePenalty(i.data.data.size, charSize)
          )
        );
        const acMod = appliedArmor.length ? wornAc : unarmoredAc;
        const locAc = touchAc + acMod + shieldAcBonus + appliedParryBonus + magicClothingACBonus + magicJewelryACBonus;

        // dr -- all source of DR are cumulative
        const unarmoredDr = Constant.armorVsDmgType[naturalArmorMaterial][dmgType].dr;
        const wornDr = appliedArmor.reduce((sum, i) => sum + (+i.data.data.ac?.[dmgType]?.dr || 0), 0);
        const locDr = naturalDr + unarmoredDr + wornDr + appliedShieldDrBonus;

        // record values
        ac[k][dmgType] = { ac: locAc, dr: locDr, shield_bonus: shieldAcBonus };
        ac.total[dmgType].ac += locAc * locationWeight;
        ac.total[dmgType].dr += locDr * locationWeight;
      }
    }

    // round total ac & dr values
    for (const v of Object.values(ac.total)) {
      // TODO helmet must be closed to cover nose/jaw for pierce
      v.ac = Math.round(v.ac); // crit slash dmg armor must not be shield or helmet
      v.dr = Math.round(v.dr); // if closed, must remove to listen/speak
    }
    ac.mdr = Math.round(ac.mdr); // hinged helmet has a macro to change between open/closed...automatically muffle in character speaking with closed helmet?

    data.ac = ac;
  }

  /* -------------------------------------------- */

  /** @override */
  static async createDialog(data = {}, options = {}) {
    return EntitySheetHelper.createDialog.call(this, data, options);
  }

  /* -------------------------------------------- */
  /*  Roll Data Preparation                       */
  /* -------------------------------------------- */

  /** @inheritdoc */
  getRollData() {
    // Copy the actor's system data
    const { data } = this.toObject(false);
    const shorthand = game.settings.get('brigandine', 'macroShorthand');
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
    if (shorthand) {
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
    for (const [k, v] of Object.entries(data.attributes || {})) {
      // Make an array of formula attributes for later reference.
      if (v.dtype === 'Formula') formulaAttributes.push(k);
      // Add shortened version of the attributes.
      if (shorthand) {
        if (!(k in data)) {
          // Non-grouped attributes.
          if (v.dtype) {
            data[k] = v.value;
          }
          // Grouped attributes.
          else {
            data[k] = {};
            for (const [gk, gv] of Object.entries(v)) {
              data[k][gk] = gv.value;
              if (gv.dtype === 'Formula') formulaAttributes.push(`${k}.${gk}`);
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
      const key = item.name.slugify({ strict: true });
      const itemData = item.toObject(false).data;

      // Add items to shorthand and note which ones are formula attributes.
      for (const [k, v] of Object.entries(itemData.attributes)) {
        // When building the attribute list, prepend the item name for later use.
        if (v.dtype === 'Formula') itemAttributes.push(`${key}..${k}`);
        // Add shortened version of the attributes.
        if (shorthand) {
          if (!(k in itemData)) {
            // Non-grouped item attributes.
            if (v.dtype) {
              itemData[k] = v.value;
            }
            // Grouped item attributes.
            else {
              if (!itemData[k]) itemData[k] = {};
              for (const [gk, gv] of Object.entries(v)) {
                itemData[k][gk] = gv.value;
                if (gv.dtype === 'Formula') itemAttributes.push(`${key}..${k}.${gk}`);
              }
            }
          }
        }
        // Handle non-shorthand version of grouped attributes.
        else if (!v.dtype) {
          if (!itemData[k]) itemData[k] = {};
          for (const [gk, gv] of Object.entries(v)) {
            itemData[k][gk] = gv.value;
            if (gv.dtype === 'Formula') itemAttributes.push(`${key}..${k}.${gk}`);
          }
        }
      }

      // Delete the original attributes key if using the shorthand syntax.
      if (shorthand) {
        delete itemData.attributes;
      }
      obj[key] = itemData;
      return obj;
    }, {});
  }

  /* -------------------------------------------- */

  _applyItemsFormulaReplacements(data, itemAttributes, shorthand) {
    for (let k of itemAttributes) {
      // Get the item name and separate the key.
      let item = null;
      const itemKey = k.split('..');
      item = itemKey[0];
      k = itemKey[1];

      // Handle group keys.
      let gk = null;
      if (k.includes('.')) {
        const attrKey = k.split('.');
        k = attrKey[0];
        gk = attrKey[1];
      }

      let formula = '';
      if (shorthand) {
        // Handle grouped attributes first.
        if (data.items[item][k][gk]) {
          formula = data.items[item][k][gk].replace('@item.', `@items.${item}.`);
          data.items[item][k][gk] = Roll.replaceFormulaData(formula, data);
        }
        // Handle non-grouped attributes.
        else if (data.items[item][k]) {
          formula = data.items[item][k].replace('@item.', `@items.${item}.`);
          data.items[item][k] = Roll.replaceFormulaData(formula, data);
        }
      } else {
        // Handle grouped attributes first.
        if (data.items[item].attributes[k][gk]) {
          formula = data.items[item].attributes[k][gk].value.replace('@item.', `@items.${item}.attributes.`);
          data.items[item].attributes[k][gk].value = Roll.replaceFormulaData(formula, data);
        }
        // Handle non-grouped attributes.
        else if (data.items[item].attributes[k].value) {
          formula = data.items[item].attributes[k].value.replace('@item.', `@items.${item}.attributes.`);
          data.items[item].attributes[k].value = Roll.replaceFormulaData(formula, data);
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
    for (let k of formulaAttributes) {
      // Grouped attributes are included as `group.attr`, so we need to split them into new keys.
      let attr = null;
      if (k.includes('.')) {
        const attrKey = k.split('.');
        k = attrKey[0];
        attr = attrKey[1];
      }
      // Non-grouped attributes.
      if (data.attributes[k]?.value) {
        data.attributes[k].value = Roll.replaceFormulaData(data.attributes[k].value, data);
      }
      // Grouped attributes.
      else if (attr) {
        data.attributes[k][attr].value = Roll.replaceFormulaData(data.attributes[k][attr].value, data);
      }

      // Duplicate values to shorthand.
      if (shorthand) {
        // Non-grouped attributes.
        if (data.attributes[k]?.value) {
          data[k] = data.attributes[k].value;
        }
        // Grouped attributes.
        else if (attr) {
          // Initialize a group key in case it doesn't exist.
          if (!data[k]) {
            data[k] = {};
          }
          data[k][attr] = data.attributes[k][attr].value;
        }
      }
    }
  }
}
