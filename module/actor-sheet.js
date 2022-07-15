import { EntitySheetHelper } from "./helper.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";
import *  as Fatigue from "./fatigue.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["lostlands", "sheet", "actor"],
      template: "systems/lostlands/templates/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "items"}],
      scrollY: [".description",".items",".armors",".spells",".features",".attributes",".fatigue"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    const data = context.data;
    const type = data.type;
    const attrs = data.data.attributes;
    const items = data.items;

    EntitySheetHelper.getAttributeData(data);
    context.shorthand = !!game.settings.get("lostlands", "macroShorthand");
    context.systemData = data.data;
    context.dtypes = Constant.ATTRIBUTE_TYPES;
    context.isGM = game.user.isGM;
    context.isPlayer = !context.isGM;
    context.isCharacter = type === 'character';
    context.wearsGarments = type === 'character' || type === 'humanoid' || type === 'undead';
    context.showVoice = context.wearsGarments || type === 'monster';

    // item types for create item dropdown
    const setTypes = game.items?.documentClass.metadata.types;
    const types = {};
    for ( let a of setTypes ) {
      types[a] = a;
    }
    context.itemTypes = types;


    // sv / msv
    const sv = +context.systemData.sv || 0;
    const msvTypes = ["monster","undead","humanoid"];
    const msv = +context.systemData.msv || 0;
    const showMsv = msvTypes.includes(type) && sv !== msv;
    context.sv = {
      text: showMsv ? `${sv} / ${msv}` : `${sv}`,
      label: showMsv ?  'SV / MSV' : 'SV',
    };


    // hide empty groups from players
    Object.keys(context.systemData.groups).forEach(k => {
      context.systemData.groups[k].hide = context.isPlayer && !Object.keys(context.systemData.groups[k].attributes).length;
    });


    // stance AC bonus/penalty text
    const parryBonus = context.systemData.ac?.parry?.parry_bonus;
    const fluidParryBonus = context.systemData.ac?.parry?.fluid_parry_bonus;
    const isFluidParrying = fluidParryBonus > parryBonus;
    const parryHeight = Util.upperCaseFirst(context.systemData.ac?.parry?.parry_height || 'mid');
    const stancePenalty = context.systemData.ac?.stance_penalty;
    context.stanceBonusText = !parryBonus && !fluidParryBonus ? ''
      : `Parry: ${isFluidParrying ? `${fluidParryBonus} (${parryHeight})`: `${parryBonus}`}`;
    context.stancePenaltyText = !stancePenalty ? '' : `Stance: -${stancePenalty}`;

    // agility penalty text
    const agilityPenalty = context.systemData.agility_penalty;
    context.agilityPenaltyText = agilityPenalty == null ? '' : `Agility Penalty: ${agilityPenalty > 0 ? '-' : ''}${agilityPenalty}`;

    // spell failure text
    const spellFailure = context.systemData.spell_failure;
    context.spellFailureText = spellFailure == null ? '' : `Spell Failure: ${spellFailure}%`;

    // skill penalty text
    const skillPenalty = context.systemData.skill_penalty;
    context.skillPenaltyText = skillPenalty == null ? '' : `Enc. Penalty: ${skillPenalty > 0 ? '-' : ''}${skillPenalty}`;

    // sort equipment
    const equipment = items.filter(i => !Object.values(Constant.SPELL_TYPES).includes(i.type) && !Constant.NON_PHYSICAL_ITEM_TYPES.includes(i.type));
    context.equipment = Util.sortEquipmentByType(equipment);
    context.hasEquipment = Object.values(context.equipment).flat().length > 0;

    // sort armors
    if (context.wearsGarments) {
      context.armors = this._getArmorsByLocation(context.data);
    }

    // sort spells
    const spells = items.filter(i => Object.values(Constant.SPELL_TYPES).includes(i.type));
    context.spells = this._sortSpellsByType(spells, attrs);
    context.hasSpells = Object.values(context.spells).flat().length > 0;

    // sort features
    const features = items.filter(i => Constant.NON_PHYSICAL_ITEM_TYPES.includes(i.type));
    context.features = this._sortFeaturesBySource(features, data);
    context.hasFeatures = Object.values(context.features).flat().length > 0;


    // voice board
    if (context.showVoice) {
      const attrType = attrs.type?.value;
      const voiceType = type === 'monster' && Object.keys(Constant.VOICE_PROFILES).includes(attrType)
        ? attrType
        : type;
      context.voiceProfiles = Object.keys(Constant.VOICE_SOUNDS[voiceType]);
      const voiceMoods = [];
      for (const [key, value] of Object.entries(Constant.VOICE_MOOD_ICONS)) {
        voiceMoods.push( { mood: key, icon: value } );
      }
      context.voiceMoods = voiceMoods;
      context.hasVoice = !!context.systemData.voice;
      context.noVoice = !context.hasVoice;
      context.hideVoiceSelection = context.isPlayer && context.hasVoice;
      context.showSoundBoard = context.isGM || context.hasVoice;
    }

    // fatigue
    if (context.isCharacter) context.fatigue = this._getFatigueData(context.data);
    
    return context;
  }

  _getArmorsByLocation(data) {
    const ac = data.data.ac || {};
    const armors = {};
    for (let [area, hitLocations] of Object.entries(Constant.AIM_AREAS_UNILATERAL)) {
      area = area.split('_').map(x => Util.upperCaseFirst(x)).join(' ');
      armors[area] = {};
      for (const hitLoc of hitLocations) {
        const sortedArmors = Object.fromEntries(ac[hitLoc]?.sorted_armor_ids?.map((id,ind) => [ind, data.items?.find(i => i._id === id)?.name]) || []);
        if (!Object.entries(sortedArmors).length) {
          Object.assign(sortedArmors, {0: '(none)'});
        }
        const sortedArmorsLastInd = Object.entries(sortedArmors).length - 1;
        armors[area][hitLoc] = {
          sortedArmors,
          sortedArmorsLastInd,
          acDr: {
            b:`${ac[hitLoc]?.["blunt"].ac} / ${ac[hitLoc]?.["blunt"].dr}`,
            p:`${ac[hitLoc]?.["piercing"].ac} / ${ac[hitLoc]?.["piercing"].dr}`,
            s:`${ac[hitLoc]?.["slashing"].ac} / ${ac[hitLoc]?.["slashing"].dr}`,
          },
        }
      }
    }
    
    return armors;
  }

  _getFatigueData(data) {
    const fatigue = {};

    const fahrenheitFromCelsius = c => Math.round(c * 9/5 + 32);

    const tempC = Number(game.settings.get("lostlands", "temp"));
    const tempF = fahrenheitFromCelsius(tempC);
    fatigue.tempDesc = `${tempC}°C / ${tempF}°F`;

    const reqClo = 36 - 10 - tempC;
    const wornClo = data.data.clo;
    fatigue.wornClo = wornClo;
    const diffClo = wornClo - reqClo;
    const isWarm = data.effects.some(e => e.label === 'Warm');
    const exposureDesc = isWarm ? 'Warm' : Util.upperCaseFirst(Fatigue.getExposureCondition(diffClo).desc);
    const exposureDamage = +data.flags?.lostlands?.exposure?.maxHpDamage || 0;
    fatigue.exposureDesc = `${exposureDesc}${exposureDamage ? ` (${exposureDamage})` : ''}`;

    const diseases = Object.entries(data.flags?.lostlands?.disease ?? {});
    const diseaseDmg = diseases.reduce((sum, d) => sum + (Number(d[1]?.maxHpDamage) || 0), 0);
    const symptoms = diseases.filter(d => d[1]?.confirmed).flatMap(d => Fatigue.DISEASES[d[0]].symptoms);
    const symptomsString = [...new Set(symptoms)].join(', ').replace(/,\s*$/, '');
    fatigue.diseaseDesc = Util.upperCaseFirst(symptomsString) || 'No symptoms';
    fatigue.diseaseDesc += diseaseDmg > 0 ? ` (${diseaseDmg})` : '';

    const exhaustionStatus = this._getFatigueStatus(data, 'exhaustion');
    fatigue.exhaustionDesc = `${exhaustionStatus.desc}${exhaustionStatus.damage ? ` (${exhaustionStatus.damage})` : ''}`;

    const thirstStatus = this._getFatigueStatus(data, 'thirst');
    fatigue.thirstDesc = `${thirstStatus.desc}${thirstStatus.damage ? ` (${thirstStatus.damage})` : ''}`;

    const hungerStatus = this._getFatigueStatus(data, 'hunger');
    fatigue.hungerDesc = `${hungerStatus.desc}${hungerStatus.damage ? ` (${hungerStatus.damage})` : ''}`;

    return fatigue;
  }

  _getFatigueStatus(data, type) {
    type = type.toLowerCase();
    const flagData = data.flags?.lostlands?.[type] || {};

    const statusDescs = {
      exhaustion: {
        warn: 'Sleepy',
        damaged: 'Exhausted'
      },
      thirst: {
        warn: 'Thirsty',
        damaged: 'Dehydrated'
      },
      hunger: {
        warn: 'Hungry',
        damaged: 'Starving'
      },
    };
    const status = {
      desc: '',
      damage: 0,
    };

    const isResting = data.effects.some(e => e.label === 'Rest');

    const startTime = flagData.startTime;
    const warningInterval = Fatigue.CLOCKS[type].warningInterval;
    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const time = Util.now();
    const warn = time >= startTime + warningIntervalInSeconds;
    
    const damage = +flagData.maxHpDamage || 0;
    status.damage = damage;

    status.desc = isResting? 'Fine' : damage > 0 ? statusDescs[type].damaged : warn ? statusDescs[type].warn : 'Fine';
    return status;
  }

  _sortSpellsByType(spells, attrs) {
    const sortedSpells = {};
    for(const spelltype of Object.values(Constant.SPELL_TYPES)) {
      const spellsByType = spells.filter(s => s.type === spelltype);
      if(!spellsByType.length) continue;
      sortedSpells[spelltype] = {};
      sortedSpells[spelltype].label = spelltype === "spell_magic" ? "Magic"
        : spelltype === "spell_cleric" ? "Cleric"
        : spelltype === "spell_witch" ? "Witch"
        : "";
      sortedSpells[spelltype].showSf = ["spell_magic","spell_witch"].includes(spelltype);
      sortedSpells[spelltype].levels = {};
      const nolevelSpells = spellsByType.filter(s => !s.data.attributes.lvl?.value);
      if(nolevelSpells.length > 0) {
        sortedSpells[spelltype].levels[`(none)`] = {spells: nolevelSpells};
      } 
      for(let i = 1; i <= Constant.MAX_SPELL_LEVELS[spelltype]; i++) {
        const spellsAtLevel = spellsByType.filter(s => s.data.attributes.lvl?.value === i);
        const slotsAtLevelVal = attrs[spelltype]?.[`lvl_${i}`]?.value || 0;
        const slotsAtLevelMax = attrs[spelltype]?.[`lvl_${i}`]?.max || 0;
        if(!spellsAtLevel.length) continue;
        sortedSpells[spelltype].levels[`Level ${i}`] = {
          spells: spellsAtLevel,
          slots: {
            value: slotsAtLevelVal,
            max: slotsAtLevelMax
          }
        }
      }
    }
    return sortedSpells;
  }

  _sortFeaturesBySource(features, actorData) {
    const sortedFeatures = {};
    const skillArr = features.filter( f => f.type === 'skill');
    skillArr.forEach(s => s.st = Util.getDerivedSkillTarget(s, actorData));
    if (skillArr.length) sortedFeatures['Skill'] = skillArr;
    const classArr = features.filter( f => f.type === 'feature' && Util.stringMatch(f.data.attributes.source?.value, 'class'));
    if (classArr.length) sortedFeatures['Class'] = classArr;
    const raceArr = features.filter( f => f.type === 'feature' && Util.stringMatch(f.data.attributes.source?.value, 'race'));
    if (raceArr.length) sortedFeatures['Race'] = raceArr;
    const weapArr = features.filter( f => f.type === 'natural_weapon');
    if (weapArr.length) sortedFeatures['Natural Weapons'] = weapArr;
    const grappArr = features.filter( f => f.type === 'grapple_maneuver');
    if (grappArr.length) sortedFeatures['Grappling'] = grappArr;

    return sortedFeatures;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".item-row").dblclick(this._onItemControl.bind(this));
    html.find(".item-select").change(e => e.stopPropagation());

    // Voice Sounds
    html.find(".voice-play").click(this._onVoicePlay.bind(this));
    html.find(".voice-preview").click(this._onVoicePreview.bind(this));
    html.find(".voice-select").change(e => e.stopPropagation());
    html.find(".voice-select-button").click(this._onVoiceSelect.bind(this));
    html.find(".voice-reset-button").click(this._onVoiceReset.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll, .voice button.voice-play").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  async _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const itemId = li?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    const selectType = document.querySelector(".tab.items .item-select")?.value;
    const type = selectType || button.dataset.type;
    const data = {name: game.i18n.localize("SIMPLE.ItemNew"), type: type};
    const itemQty = +item?.data.data.quantity || 0;
    
    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        let createData = data;

        // Set default icon by type here feature, spell, equipment
        const img = createData.type === 'container' ? "icons/svg/chest.svg"
          : Constant.NON_PHYSICAL_ITEM_TYPES.includes(createData.type) ? "icons/svg/feature.svg"
          : createData.type === 'spell_magic' ? "icons/svg/spell.svg"
          : createData.type === 'spell_cleric' ? "icons/svg/prayer.svg"
          : createData.type === 'spell_witch' ? "icons/svg/pentacle.svg"
          : createData.type === 'currency' ? "icons/svg/coins.svg"
          : "icons/svg/item-bag.svg";
        if (img) {
          createData.img = img;
        }

        // Set sheet for non-default types
        const sheetClass = Constant.NON_PHYSICAL_ITEM_TYPES.includes(createData.type) ? "lostlands.FeatureItemSheet"
          : Object.values(Constant.SPELL_TYPES).includes(createData.type) ? "lostlands.SpellItemSheet" : null;
        if (sheetClass) {
          createData = foundry.utils.mergeObject(createData, {
            flags: {
              core: {
                sheetClass: sheetClass
              }
            }
          });
        }
        return cls.create(createData, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        const actor = this.actor;
        if(itemQty <= 1) return item.delete();
        return new Dialog({
          title: "Delete Item",
          content: 
          `<form>
            <div class="flexrow">
              <label class="flex1">How many?</label>
              <label class="flex1" style="text-align:center;" id="splitValue"></label>
              <input class="flex3" type="range" min="1" id="splitRange">
            </div>
          </form>`,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: "Submit",
              callback: async html => {
                const quantityVal = +html.find("#splitRange").val();
                if(quantityVal >= itemQty) return item.delete();
                await actor.updateEmbeddedDocuments("Item", [{_id: item._id, "data.quantity": itemQty - quantityVal}]);
              }
            },
            two: {
              icon: '<i class="fas fa-times"></i>',
              label: "Cancel"
            }
          },
          render: html => {
            const initialVal = itemQty;
            const splitRange = html.find('#splitRange');
            splitRange.attr("max",itemQty);
            splitRange.val(initialVal);
            const splitValue = html.find('#splitValue');
            splitValue.html(initialVal);
            splitRange.on('input', () => {
              splitValue.html(splitRange.val());
            });
          }
        }).render(true);
      case "prepare":
        return this._handlePrepareSpell(item);
      case "wear":
        return this._handleWear(item);
      case "hold_left":
        return this._handleHold(item, "left", event);
      case "hold_right":
        return this._handleHold(item, "right", event);
      case "use":
        return this._handleUseItem(item, event);
    }
  }

  async _handleUseItem(item, event) {
    const optionsParam = `{applyEffect:${event.ctrlKey},showModDialog:${event.shiftKey},showAltDialog:${event.altKey}}`;
    const itemMacroCode = `const itemId = '${item._id}';const options = ${optionsParam};${item.data.data.macro}`;
    let macro = game.macros.find(m => ( m.name === item.name && m.data.command === itemMacroCode ));
    if ( !macro ) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        command: itemMacroCode,
        flags: { "lostlands.attrMacro": true }
      });
    }
    return macro.execute();
  }

  _handlePrepareSpell(item) {
    const isPrepared = !!item.data.data.prepared;
    const spellLevel = item.data.data.attributes.lvl.value;
    const actorSlotsAttr = this.actor.data.data.attributes[`${item.type}`]?.[`lvl_${spellLevel}`];
    const preparedSpells = this.actor.data.items.filter(i => i.type === `${item.type}` && 
                           i.data.data.attributes.lvl?.value === spellLevel && 
                           i.data.data.prepared);
    const slotsMax = actorSlotsAttr?.max || 0;
    if (slotsMax === 0) {
      return ui.notifications.error("Cannot prepare spells of this level");
    } 
    if ( !isPrepared && preparedSpells.length >= slotsMax ) {
      return ui.notifications.error("Cannot prepare any more spells of this level");
    }
    if (!isPrepared) {
      Util.macroChatMessage(this.actor, { flavor: 'Prepare Spell', content: `${this.actor.name} prepares ${item.name}.` });
    }
    return this.actor.updateEmbeddedDocuments("Item", [{_id: item._id, "data.prepared": !isPrepared}]);
  }

  _handleWear(item) {
    const data = item.data.data;
    const actorData = this.actor.data;
    const attrs = data.attributes;
    const isWorn = !!data.worn;
    const isBulky = !!data.bulky;
    const isArmor = item.type === 'armor' || item.type === 'helmet';
    const isAmmo = item.type === 'ammo';
    const wornItems = actorData.items.filter(i => i.data.data.worn);
    const charSize = Constant.SIZE_VALUES[actorData.data.attributes.size?.value] ?? 2;
    const itemSize = Constant.SIZE_VALUES[attrs.size?.value];
    const itemLocations = item.data.data.coverage;

    if (!isWorn) {
      // can't wear if quantity greater or less than 1 unless ammunition
      const wearLimit = isAmmo ? 2 : 1;
      const itemQty = +item?.data.data.quantity || 0;
      if (itemQty < 1 || itemQty > wearLimit) return ui.notifications.error(`Can't wear with quantity of ${itemQty}`);


      // can't wear a bulky item if any of this item's locations are already covered by a bulky item
      if (isBulky) {
        const wornBulkyItems = wornItems.filter(i => i.data.data.bulky);
        const wornBulkyLocations = [...new Set(wornBulkyItems.map(i => i.data.data.coverage).flat())];
        const duplicateLocation = wornBulkyLocations.some(l => itemLocations.includes(l));
        if (duplicateLocation) return ui.notifications.error(`Already wearing a bulky item over ${duplicateLocation}`);
      }

      // can't wear armor if any of this item's locations are already covered by more than 2 armors
      if (isArmor) {
        const wornArmors = wornItems.filter(i => i.type === 'armor' || i.type === 'helmet');
        const wornArmorLocations = wornArmors.flatMap(a => a.data.data.coverage);
        for (const itemLoc of itemLocations) {
          const count = wornArmorLocations.filter(l => l === itemLoc).length;
          if (count > 2) return ui.notifications.error(`Already wearing three armors over ${itemLoc}`);
        }
      }
      
      // can't wear a shield if already wearing a shield,
      //    while holding a 2 handed weapon
      //    or if size of shield is bigger than character size + 1
      const isShield = item.type === 'shield';
      const wearingShield = wornItems.some(i => i.type === 'shield');
      const holdingTwoHands = actorData.items.some(i => i.data.data.held_offhand && i.data.data.held_mainhand);
      if (isShield) {
        if (itemSize > charSize + 1) return ui.notifications.error(`Character is too small to wear a shield of this size`);
        if (wearingShield) return ui.notifications.error("Can only wear one shield");
        if (holdingTwoHands) return ui.notifications.error("Cannot wear a shield while holding a weapon with both hands");
      }

      // // can't stack rings of protection
      // const stackingRingofProt = item.data.name.toLowerCase().includes('ring of protection') &&
      //                           wornItems.some(i => i.data.name.toLowerCase().includes('ring of protection'));
      // if (stackingRingofProt ) {
      //   return ui.notifications.error("Cannot wear more than one ring of protection");
      // }
    }
    
    let verb = isWorn ? 'doffs' : 'dons';
    Util.macroChatMessage(this.actor, { flavor: 'Wear Item', content: `${this.actor.name} ${verb} ${item.name}.` });
    return this.actor.updateEmbeddedDocuments("Item", [{_id: item._id, "data.worn": !isWorn}]);
  }

  async _handleHold(item, hand, event) {
    // cases to handle:
    // item is held in this hand
    //    if 2 handed, empty both hands
    //    if 1 handed, empty this hand
    // item not held in this hand
    //    if 2 handed
    //      if other hand empty, hold in both hands
    //      if other hand full, error msg
    //    if 1 handed
    //      if held in other hand
    //        if can be held in 2 hands, hold in this hand
    //        if cannot, error msg
    //      if not held in other hand
    //        hold in this hand
    let itemUpdate = {_id: item._id, data: {}};
    const otherHand = hand === 'left' ? 'right' : 'left';
    const charSize = Constant.SIZE_VALUES[this.actor.data.data.attributes.size?.value] ?? 2;
    const itemSize = Constant.SIZE_VALUES[item.data.data.attributes.size?.value];
    const maxSize = charSize < 2 ? charSize + 1 : charSize + 2;
    const oneHandMaxSize = charSize < 2 ? charSize : charSize + 1;
    const twoHanded = itemSize === maxSize;
    const handAndHalf = itemSize < maxSize && itemSize >= charSize;
    const isHeld = !!item.data.data[`held_${hand}`];
    let isHeldOtherHand = !!item.data.data[`held_${otherHand}`];
    const itemHeldInOtherHand = this.actor.data.items.find(i => i.data.data[`held_${otherHand}`]);
    const thisHandFull = this.actor.data.items.some(i => i.data.data[`held_${hand}`]);

    if (isHeld) {
      if (twoHanded) {
        Object.assign(itemUpdate.data, {held_offhand: false, held_mainhand: false});
      } else {
        itemUpdate.data[`held_${hand}`] = false;
      }
    } else {
      const isShield = !!item.data.data.attributes.shield_shape?.value;
      const wearingShield = this.actor.data.items.some(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield_shape?.value);
      if (isShield && wearingShield) return ui.notifications.error("Cannot hold a shield while wearing a shield");
      if (itemSize > maxSize) return ui.notifications.error("Item too big to hold");
      if (thisHandFull) return ui.notifications.error("Must release a held item first"); // TODO auto release held items getting in the way
      if (twoHanded) {
        if (!!itemHeldInOtherHand) return ui.notifications.error("Must release a held item first");
        Object.assign(itemUpdate.data, {held_offhand: true, held_mainhand: true});
      } else {
        if (isHeldOtherHand) {
          if (!handAndHalf) {
            itemUpdate.data[`held_${otherHand}`] = false;
            isHeldOtherHand = false;
          } 
          itemUpdate.data[`held_${hand}`] = true;
        } else {
          let sizeLimit = maxSize;
          const sizeHeldInOtherHand = Constant.SIZE_VALUES[itemHeldInOtherHand?.data.data.attributes.size?.value];
          if (sizeHeldInOtherHand >= 0) {
            sizeLimit = charSize - sizeHeldInOtherHand;
          } else {
            sizeLimit = oneHandMaxSize;
          }
          if ( itemSize > sizeLimit ) return ui.notifications.error("Must release a held item first");
          itemUpdate.data[`held_${hand}`] = true;
        }
      }

      const itemQty = +item?.data.data.quantity || 0;
      if (itemQty < 1) return ui.notifications.error(`Can't hold with quantity of ${itemQty}`);
      let heldQtyLimit = 1;
      if (item.name.toLowerCase().includes('javelin') && charSize > itemSize) heldQtyLimit = 3;
      else if (itemSize === 0 && charSize > itemSize) heldQtyLimit = 2;
      if (itemQty > heldQtyLimit) return ui.notifications.error(`Can hold only ${heldQtyLimit} quantity`);

      if ( wearingShield && (twoHanded || isHeldOtherHand) ) return ui.notifications.error("Cannot hold with both hands while wearing a shield");

      // handle quick slash attack
      const atkModes = item.data.data.attributes.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || [];
      const canQuickSlash = !!item.data.data.attributes.quick_slash?.value && atkModes.includes('swi(s)');
      if (canQuickSlash && event.altKey) {
        await this.actor.updateEmbeddedDocuments("Item", [itemUpdate]);
        return game.lostlands.Macro.quickSlashAttackMacro(item._id, {applyEffect: event.ctrlKey, showModDialog: event.shiftKey});
      } else {
        const verb = item.data.data.attributes.weap_prof?.value.includes('sword') && !isHeldOtherHand ? 'draws' : 'wields';
        Util.macroChatMessage(this.actor, { flavor: 'Hold Item', content: `${this.actor.name} ${verb} ${item.name}${(isHeldOtherHand || twoHanded) ? ' with both hands' : ''}.` });
      }
    }
    return this.actor.updateEmbeddedDocuments("Item", [itemUpdate]);
  }

  /* -------------------------------------------- */

  _onVoicePlay(event) {
    event.preventDefault();
    let button = $(event.currentTarget);
    const mood = button.data('mood');
    button.attr('disabled', true);
    button.attr('disabled', false);
    const hasVoice = !!this.actor.data.data.voice;
    if (hasVoice) {
      return Util.playVoiceSound(mood, this.actor);
    }
    this._onVoicePreview(event, mood);
  }

  _onVoicePreview(event, mood) {
    let button = $(event.currentTarget);
    const tab = button.closest('.tab.voice');
    const select = tab.find('.voice-select');
    const voice = select.find(":selected").val();
    const type = this.actor.type;
    const soundsArr = mood ? Constant.VOICE_SOUNDS[type]?.[voice]?.[mood]
      : Object.values(Constant.VOICE_SOUNDS[type]?.[voice]).flat();
    if (!soundsArr) return;
    const numTracks = soundsArr.length;
    const trackNum = Math.floor(Math.random() * numTracks);
    Util.playSound(soundsArr[trackNum], null, {push: false, bubble: false});
  }

  _onVoiceSelect(event) {
    event.preventDefault();
    let button = $(event.currentTarget);
    const tab = button.closest('.tab.voice');
    const select = tab.find('.voice-select');
    const voice = select.find(":selected").val();
    const otherCharacterHasVoice = game.actors.some(a => a.data.data.voice === voice);
    if (otherCharacterHasVoice) {
      return new Dialog({
        title: "Voice Already Selected",
        content: `Another party member has already selected this voice. Are you sure you wish to continue?`,
        buttons: {
          one: {
            icon: '<i class="fas fa-check"></i>',
            label: "Continue",
            callback: () => assignVoice.bind(this)()
          },
          two: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel"
          }
        },
      }).render(true);
    }
    assignVoice.bind(this)();
    function assignVoice() {
      const currentVoice = this.actor.data.data.voice;
      voice && voice !== currentVoice && this.actor.update({"data.voice": voice});
    }
  }

  _onVoiceReset(event) {
    event.preventDefault();
    const currentVoice = this.actor.data.data.voice;
    currentVoice && this.actor.update({"data.voice": null});
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
