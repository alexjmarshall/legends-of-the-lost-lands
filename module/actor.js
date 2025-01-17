import { EntitySheetHelper } from './helper.js';
import * as Constant from './constants.js';
import * as SIZE from './rules/size.js';
import * as RACE from './rules/races/index.js';
import * as CLASS from './rules/classes/index.js';
import * as ALIGNMENT from './rules/alignment.js';
import * as ABILITIES from './rules/abilities.js';
import * as RULES_HELPER from './rules/helper.js';
import * as CANVAS from './canvas.js';
import { addAreaHp } from './rules/hp.js';
import { PACK_ANIMALS } from './rules/pack-animals.js';
import { HIT_LOCATIONS } from './rules/hit-locations.js';
import { removeDuplicates, roundToDecimal } from './helper.js';
import { sizeMulti } from './rules/size.js';
import { ITEM_TYPES } from './item-helper.js';
import { features } from './rules/features.js';
import { GARMENT_MATERIALS, garmentMaterials, armorVsDmgType } from './rules/armor-and-clothing.js';
import {
  ATK_STYLES,
  ATK_TIMINGS,
  ATK_HEIGHTS_LIST,
  PHYSICAL_DMG_TYPES_LIST,
  PHYSICAL_DMG_TYPES,
} from './rules/attack-and-damage.js';
import { hitLocations, HIT_LOC_WEIGHT_INDEXES, HEIGHT_AREAS } from './rules/hit-locations.js';

export const ACTOR_TYPES = Object.freeze({
  CHARACTER: 'character',
  HUMANOID: 'humanoid',
  MERCHANT: 'merchant',
  MONSTER: 'monster',
  PACK_ANIMAL: 'pack_animal',
  PARTY: 'party',
  STORAGE: 'storage',
});

/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
// eslint-disable-next-line no-undef
export class BrigandineActor extends Actor {
  /** @override*/
  prepareBaseData() {
    // no access to embedded entities here
    // this is also before active effects are applied
    // therefore derivations here should not use character items or any attributes that are modified by active effects
    // however, this is a good place to derive data that will be modified by active effects
    super.prepareBaseData();
    this.data.data.groups = this.data.data.groups || {};
    this.data.data.attributes = this.data.data.attributes || {};
    const actorData = this.data;

    this._prepareCharacterBaseData(actorData);
  }

  _addHumanoidLocationMaxHp(charData) {
    const hp = charData.hp;
    const totalMaxHp = hp.max;
    addAreaHp(totalMaxHp, hp);
  }

  _prepareCharacterBaseData(actorData) {
    if (actorData.type !== ACTOR_TYPES.CHARACTER) return;
    const charData = actorData.data;
    charData.combat = {
      attacks: 1,
      dmg_bonus_humanoid: 0,
      dmg_bonus_undead: 0,
      melee_to_hit_mod: 0,
      melee_dmg_mod: 0,
      missile_to_hit_mod: 0,
      missile_dmg_mod: 0,
    };
    charData.pain_penalty = 0; // TODO apply to all skill checks, ability checks, and saves
    charData.healing_mod = 0; // TODO apply to natural healing and injury heal checks
    charData.reaction_mod = 0; // TODO apply to reaction rolls
    charData.passive_perception = 10; // TODO apply to surprise checks
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const actorData = this.data;

    this._prepareCharacterData(actorData);
    this._preparePackAnimalData(actorData);
    // this._prepareHumanoidData(actorData);
    // TODO derive monster natural weapon atk mode from first atk_mode
    // this._prepareMonsterData(actorData);
    // this._prepareStorageData(actorData);
    // // merchant?
    // this._preparePartyData(actorData);
    // // TODO fix shield shape/size coverage
    //     TODO when character goes invisible, remove any targets on it
    // TODO need at least 1 hand free for Somatic spells
  }

  _preparePackAnimalData(actorData) {
    if (actorData.type !== ACTOR_TYPES.PACK_ANIMAL) return;

    const charData = actorData.data;
    const animalType = PACK_ANIMALS[charData.attributes.type.value];

    if (!+charData.attributes.weight.value && animalType) {
      charData.attributes.weight.value = animalType.weight;
    }

    if (!+charData.attributes.base_mv.value && animalType) {
      charData.attributes.base_mv.value = PACK_ANIMALS[animalType].baseMv;
    }

    // encumbrance
    const { items } = actorData;
    this._addEnc(charData, items);

    // mv & speed
    this._addMvSpeedPackAnimal(charData); // TODO durability affects AC and clo
  }

  _prepareCharacterData(actorData) {
    if (actorData.type !== ACTOR_TYPES.CHARACTER) return;

    const charData = actorData.data;

    // size_val
    charData.size_val = SIZE.SIZE_VALUES[charData.size] || SIZE.SIZE_VALUES.default;

    // ability score mods
    const attrs = charData.attributes;
    const abilities = attrs.ability_scores || {};
    this._addAbilityScoreMods(abilities, charData.lvl);

    // max hp & location hp
    this._addHumanoidLocationMaxHp(charData);

    // alignment
    charData.alignment = ALIGNMENT.alignmentByScore(charData.attributes.alignment_score.value);

    // passive perception
    const skills = charData.skills || {};
    charData.passive_perception = Number(10 + skills.listening.lvl) || 10;

    // retainer loyalty
    if (attrs.admin.is_retainer.value) {
      const loyalty = attrs.retainer.loyalty || {};
      if (loyalty.value) loyalty.mod = ABILITIES.getScoreMod(loyalty.value);
    }

    // encumbrance
    const { items } = actorData;
    this._addEnc(charData, items);

    // mv & speed
    const hasSmallArms = items.some((i) => i.type === ITEM_TYPES.FEATURE && i.data.name === features.SMALL_ARMS.name);
    charData.max_mv = hasSmallArms ? 9 : 12;
    this._addMvSpeedCharacter(charData);

    // set removed body part locations
    this._addRemovedLocations(charData, items);

    // spell failure, skill check penalty & max dex mod
    this._addWornWeightPenalties(charData, items);

    // worn AC and clo
    this._addWornAc(actorData);
    this._addWornClo(actorData);
  }

  _addWornWeightPenalties(charData, items) {
    const wornItems = items.filter((i) => i.data.data.worn);

    const totalPenaltyWgt = wornItems.reduce((sum, i) => sum + (+i.data.data.penalty_weight || 0), 0);

    const isNonProficientArmor = (i) => {
      const material = i.data.data.attributes.material?.value;
      const armorTypes = [ITEM_TYPES.ARMOR, ITEM_TYPES.SHIELD, ITEM_TYPES.HELM];
      if (!armorTypes.includes(i.type)) return false;
      const classObj = new CLASS[charData.class](charData.lvl, charData.origin);
      if (i.type === ITEM_TYPES.SHIELD) return !classObj?.shields.includes(material);
      return !classObj?.armors.includes(material);
    };

    const maxMailWgt = sizeMulti(
      garmentMaterials[GARMENT_MATERIALS.MAIL].weight + garmentMaterials[GARMENT_MATERIALS.PADDED].weight,
      charData.size_val
    );
    charData.spell_failure = Math.min(100, Math.floor((totalPenaltyWgt / maxMailWgt) * 100));

    const maxIronPlateWgt = sizeMulti(garmentMaterials[GARMENT_MATERIALS.IRON_PLATE].weight, charData.size_val);
    charData.armor_penalty = 0 - Math.floor((totalPenaltyWgt / maxIronPlateWgt) * 8);

    const totalNonProfPenaltyWgt = wornItems.reduce((sum, i) => {
      const penaltyWeight = +i.data.data.penalty_weight || 0;
      if (isNonProficientArmor(i)) return sum + penaltyWeight;
      return sum + roundToDecimal(penaltyWeight / 8, 1);
    }, 0);
    charData.combat_armor_penalty = 0 - Math.floor((totalNonProfPenaltyWgt / maxIronPlateWgt) * 8);
    // TODO for skill checks, use the armor_penalty for non-combat and combat_armor_penalty for combat skills
    charData.max_dex_mod = 6 - Math.floor((totalPenaltyWgt / maxIronPlateWgt) * 6);
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
      const members = Util.getArrFromCSV(membersVal)
        .map((name) => game.actors.getName(name))
        .filter((a) => a);
      const memberMVs = members.map((a) => +a.data.data.mv).filter((m) => m != null && !isNaN(m));
      const slowestMV = memberMVs.length ? Math.min(...memberMVs) : Constant.DEFAULT_BASE_MV;
      const mv = slowestMV || Constant.DEFAULT_BASE_MV;
      console.log(`Updating party ${actorData.name} Mv to ${mv}`, members);
      data.mv = mv;
    }
  }

  _addRemovedLocations(charData, items) {
    const injuryItems = items.filter((i) => i.type === 'injury' && i.data.data.attributes.amputation?.value === true);
    if (!injuryItems.length) return;
    const removedLocations = injuryItems
      .map((i) => {
        let loc = i.data.data.attributes.location.value?.toLowerCase();
        const side = loc.includes('right') ? 'right' : loc.includes('left') ? 'left' : null;
        let removedLocs;
        if (!side) {
          if (HIT_LOCATIONS[loc]?.bilateral) return [];
          removedLocs = HIT_LOCATIONS[loc]?.amputated || [loc];
        } else {
          loc = loc.replace(side, '').trim();
          const locs = HIT_LOCATIONS[loc]?.amputated || [loc];
          removedLocs = locs.map((l) => `${side} ${l}`);
        }
        return removedLocs;
      })
      .flat();
    charData.removedLocs = removeDuplicates(removedLocations);
  }

  _addEnc(charData, items) {
    const wgtItems = items.filter((i) => +i.data.data.total_weight > 0);
    const sumItemWeight = (a, b) => a + b.data.data.total_weight;
    const enc = wgtItems.reduce(sumItemWeight, 0);
    charData.enc = roundToDecimal(enc, 1);
  }

  _addMvSpeedCharacter(charData) {
    const sizeVal = charData.size_val;
    const strScore = +charData.attributes.ability_scores.str?.value || 10;
    const encMod = +RACE[charData.race]?.encModifier || 1;
    const encStr = strScore * encMod;

    const load = +charData.enc || 0;
    const maxLoad = Math.floor(80 + encStr * 10);
    const sizeAdjustedMaxLoad = sizeMulti(maxLoad, sizeVal);
    const relativeLoad = load / sizeAdjustedMaxLoad;

    const mv = +charData.base_mv || 12;
    const wgtMv = Math.max(0, Math.ceil((1 - relativeLoad) * mv));

    charData.mv = Math.min(wgtMv, charData.max_mv);
    charData.speed = Math.floor((wgtMv * CANVAS.GRID_SIZE) / 2);
    // round charData.speed to the nearest 5
    charData.speed = Math.ceil(charData.speed / 5) * 5;
  }

  _addMvSpeedPackAnimal(charData) {
    // based on bodyweight
    const size = charData.attributes.size?.value || SIZE.SIZES.LARGE;
    const bodyweight = +charData.attributes.weight.value || SIZE.defaultBodyWeight[size];
    const encMod = +PACK_ANIMALS[charData.attributes.type?.value]?.encMod || 1;
    const encBodyweight = bodyweight * encMod;

    const load = +charData.enc || 0;
    const maxLoad = Math.floor(1.2 * encBodyweight);
    const relativeLoad = load / maxLoad;

    const mv = +charData.attributes.base_mv?.value || 12;
    const wgtMv = Math.max(0, Math.ceil((1 - relativeLoad) * mv));

    charData.mv = wgtMv;
    charData.speed = Math.floor((wgtMv * CANVAS.GRID_SIZE) / 2);
    // round speed to the nearest 5
    charData.speed = Math.ceil(charData.speed / 5) * 5;
  }

  _getMonsterXP(hdVal, hpMax, xpMulti) {
    // hd x hd x 10 x multiplier + 1/hp
    return hdVal * hdVal * 10 * xpMulti + hpMax;
  }

  _addAbilityScoreMods(abilities, lvl) {
    for (const ability of Object.values(ABILITIES.ABILITIES)) {
      if (!abilities[ability]) continue;
      abilities[ability].mod = ABILITIES.getScoreMod(+abilities[ability].value);
      abilities[ability].full_mod = ABILITIES.getFullScoreMod(+abilities[ability].value);
      abilities[ability].min = RULES_HELPER.progressions.medium(lvl).min;
    }
  }

  _getHighestMagicVal(items, key) {
    return items.length ? Math.max(...items.map((c) => +c.data.data.attributes.magic_mods?.[key].value || 0)) : 0;
  }

  _addWornClo(actorData) {
    const { data } = actorData;
    const { items } = actorData;
    const wornItems = items.filter((i) => i.data.data.worn);
    const charSizeVal = data.size_val;

    let clo = 0; // TODO binary hit locations don't need to be an even weight number

    for (const [locKey, locVal] of Object.entries(hitLocations)) {
      const garments = wornItems.filter((i) => i.data.data.coverage?.includes(locKey) && Number(i.data.data.clo));

      // sort the layers by descending clo
      //    second layer adds 1/2 its full clo, third layer 1/4, and so on
      const unwornIndex = HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN;
      const locationWeight = locVal.weights[unwornIndex] / 100;
      const cloVals = garments.map((i) => i.data.data.clo * locationWeight);
      cloVals.sort((a, b) => b - a);
      const locWarmth = cloVals.reduce((sum, val, index) => sum + val / 2 ** index, 0);
      clo += locWarmth;
    }

    data.clo = Math.floor(clo);
  }

  _getSizePenalty(itemSize, charSize) {
    return Math.max(0, +itemSize - +charSize) || 0;
  }

  // TODO replace Delete Button on actor/item attributes with Show to Players checkmark
  // hide data type and attribute key from GM as well?

  _getParryValue(actorData, parryItem) {
    if (!parryItem) return 0;
    const skill = parryItem.data.data.attributes.skill.value;
    const skillValue = actorData.data.skills[skill]?.lvl || 0;
    // parry value is the weapon's parry rating + 1/2 skill rating
    const itemParry = +parryItem.data.data.attributes.parry.value || 0;
    return itemParry + Math.floor(skillValue / 2);
  }

  _addParryWeapons(actorData, heldItems) {
    // an active parry weapon has the parry timing
    // a non-active parry weapon has the standard attack style
    // if there are active parry weapons, the one with the highest parry value is the only weapon considered to be parrying
    // otherwise, the best non-active parry weapon for each height area is considered to be parrying

    const parry = {
      active: null,
      non_active: Object.fromEntries(ATK_HEIGHTS_LIST.map((a) => [a, null])),
    };

    const activeParryWeaps = heldItems.filter(
      (i) => i.type === ITEM_TYPES.MELEE_WEAPON && i.data.data.atk_timing === ATK_TIMINGS.PARRY
    );

    const parryValReducer = (a, b) => (this._getParryValue(actorData, b) > this._getParryValue(actorData, a) ? b : a);

    const activeParryWeap = activeParryWeaps.reduce(parryValReducer, null);

    if (activeParryWeap) {
      parry.active = {
        item_id: activeParryWeap._id,
        parry_bonus: this._getParryValue(actorData, activeParryWeap),
        parry_height: activeParryWeap.data.data.atk_height,
      };
      return parry;
    }

    const nonActiveParryWeaps = heldItems.filter(
      (i) => i.type === ITEM_TYPES.MELEE_WEAPON && i.data.data.atk_style === ATK_STYLES.STANDARD
    );

    ATK_HEIGHTS_LIST.forEach((a) => {
      const item = nonActiveParryWeaps.filter((w) => w.data.data.atk_height === a).reduce(parryValReducer, null);
      if (item) {
        parry.non_active[a] = {
          item_id: item._id,
          parry_bonus: this._getParryValue(actorData, item),
          parry_height: item.data.data.atk_height,
        };
      }
    });

    return parry;
  }

  _addWornAc(actorData) {
    const { data } = actorData;
    const attrs = data.attributes;
    const { items } = actorData;
    const heldItems = items.filter((i) => i.data.data.held_offhand || i.data.data.held_mainhand);
    const wornItems = items.filter((i) => i.data.data.worn);

    const ac = {
      touch_ac: 0,
      parry: this._addParryWeapons(actorData, heldItems),
      timing: null,
      total: Object.fromEntries(PHYSICAL_DMG_TYPES_LIST.map((t) => [t, { ac: 0, dr: 0 }])),
      location: Object.fromEntries(
        Object.keys(hitLocations).map((hitLoc) => [
          hitLoc,
          Object.fromEntries(PHYSICAL_DMG_TYPES_LIST.map((t) => [t, { ac: 0, dr: 0 }])),
        ])
      ),
    };

    // touch ac
    const dexAcBonus = Math.min(data.max_dex_mod, +attrs.ability_scores?.dex?.mod || 0);
    const touchAc = data.base_ac + dexAcBonus;
    ac.touch_ac = touchAc; // TODO also add location based derived attribute

    // timing
    const counterWeap = heldItems.some((i) => i.data.data.atk_timing === ATK_TIMINGS.COUNTER);
    const activeParryWeap = heldItems.some((i) => i.data.data.atk_timing === ATK_TIMINGS.PARRY);
    ac.timing = counterWeap ? ATK_TIMINGS.COUNTER : activeParryWeap ? ATK_TIMINGS.PARRY : ac.timing;

    // ac and dr by hit location and dmg type
    const charSizeVal = data.size_val;
    const naturalArmorMaterial = armorVsDmgType[attrs.hide?.value] || armorVsDmgType.none;
    const naturalDr = Math.max(0, charSizeVal - 3);

    for (const [locKey, locVal] of Object.entries(hitLocations)) {
      const locationWeight =
        (locVal.weights[HIT_LOC_WEIGHT_INDEXES.SWING] + locVal.weights[HIT_LOC_WEIGHT_INDEXES.THRUST]) / 200;

      const coveringItems = wornItems.filter((i) => i.data.data.coverage?.includes(locKey));
      const armor = coveringItems.filter((i) => i.type === ITEM_TYPES.ARMOR || i.type === ITEM_TYPES.HELM);

      // sort armors and record their Ids in order. Shield goes on top.
      const shield = coveringItems.find((i) => i.type === ITEM_TYPES.SHIELD);
      const sortedArmors = [...armor.sort((a, b) => b.data.sort - a.data.sort)];
      if (shield) sortedArmors.push(shield);
      ac.location[locKey].sorted_armors = sortedArmors.map((i) => {
        const armorEntry = {
          id: i._id,
          type: i.type,
          name: i.name,
        };
        Object.values(PHYSICAL_DMG_TYPES).forEach((dmgType) => {
          armorEntry[dmgType] = {
            dr: +i.data.data.ac?.[dmgType]?.dr || 0,
            pen: +i.data.data.ac?.[dmgType]?.pen || 0,
          };
        });
        return armorEntry;
      });

      // parry bonus applies if active, or if parry_height includes this area
      let appliedParryBonus = 0;
      if (ac.parry.active) {
        appliedParryBonus = ac.parry.active.parry_bonus;
      } else {
        for (const [atkHeight, parryData] of Object.entries(ac.parry.non_active)) {
          if (parryData && HEIGHT_AREAS[atkHeight].includes(locKey)) {
            appliedParryBonus = parryData.parry_bonus;
            break;
          }
        }
      }

      // add ac, pen & dr by damage type
      for (const dmgType of PHYSICAL_DMG_TYPES_LIST) {
        let appliedArmor = sortedArmors.map((i) => ({
          type: i.data.type,
          ac: +i.data.data.ac?.[dmgType]?.ac || 0,
          dr: +i.data.data.ac?.[dmgType]?.dr || 0,
          closed: i.data.data.attributes.closed?.value,
          size_val: i.data.data.size_val,
        }));

        // reduce shield DR by 1 if hit location is forearm or hand
        if ([HIT_LOCATIONS.FOREARM, HIT_LOCATIONS.HAND].includes(locKey)) {
          appliedArmor = appliedArmor.map((a) => {
            if (a.type === ITEM_TYPES.SHIELD) a.dr = Math.max(0, a.dr - 1);
            return a;
          });
        }

        // filter out helms on eyes, nose and jaw if dmg type is pierce and helm is open
        if (
          dmgType === PHYSICAL_DMG_TYPES.PIERCE &&
          [HIT_LOCATIONS.EYE, HIT_LOCATIONS.NOSE, HIT_LOCATIONS.JAW].includes(locKey)
        ) {
          appliedArmor = appliedArmor.filter((a) => a.type !== ITEM_TYPES.HELM || a.closed);
        }

        // ac -- use top layer AC if wearing armor, else use unarmored AC
        // total AC is touch AC + worn AC + parry bonus
        const unarmoredAc = naturalArmorMaterial[dmgType].ac;
        const topLayer = appliedArmor[appliedArmor.length - 1];
        const acMod = topLayer ? topLayer.ac - this._getSizePenalty(topLayer.size_val, charSizeVal) : unarmoredAc;
        const locAc = touchAc + acMod + appliedParryBonus;

        // dr -- all sources of DR are cumulative
        // total DR is natural DR + unarmored DR + worn DR + soft DR if blunt
        const unarmoredDr = naturalArmorMaterial[dmgType].dr;
        const wornDr = appliedArmor.reduce((sum, i) => sum + i.dr, 0);
        const softDr = locVal.soft && dmgType === PHYSICAL_DMG_TYPES.BLUNT ? 1 : 0;
        const locDr = naturalDr + unarmoredDr + wornDr + softDr;

        // record values
        ac.location[locKey][dmgType] = { ac: locAc, dr: locDr };
        ac.total[dmgType].ac += locAc * locationWeight;
        ac.total[dmgType].dr += locDr * locationWeight;
      }
    }

    // round total ac & dr values
    for (const v of Object.values(ac.total)) {
      v.ac = Math.round(v.ac);
      v.dr = Math.floor(v.dr);
    }
    // TODO hinged helm has a macro to change between open/closed...automatically muffle in character speaking with closed helm?
    // and only if the helm has_visor

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
