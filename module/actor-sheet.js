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
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".description", ".items", ".spells", ".features", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("lostlands", "macroShorthand");
    context.systemData = context.data.data;
    context.dtypes = Constant.ATTRIBUTE_TYPES;
    context.isGM = game.user.isGM;
    context.isPlayer = !context.isGM;
    context.isCharacter = context.data.type === 'character';
    context.showMR = context.systemData.ac.mr || context.systemData.ac.mdr; // TODO allow showing these separately on sheet
    context.parryBonus = context.systemData.ac?.parry?.parry_bonus;

    // sort equipment
    const items = context.data.items.filter(i => i.type === 'item');
    items.forEach(item => item.data.totalWeight = Math.round(item.data.quantity * item.data.weight * 10) / 10 || 0);
    context.equipment = this.sortEquipmentByType(items);
    context.hasEquipment = Object.values(context.equipment).flat().length > 0;

    // sort spells
    const spells = context.data.items.filter(i => Object.values(Constant.SPELL_TYPES).includes(i.type));
    context.spells = this.sortSpellsByType(spells, context.data.data.attributes);
    context.hasSpells = Object.values(context.spells).flat().length > 0;

    // sort features
    const features = context.data.items.filter(i => i.type === 'feature');
    context.features = this.sortFeaturesBySource(features, context.data.data.attributes);
    context.hasFeatures = Object.values(context.features).flat().length > 0;

    // skill check penalty
    const sp = context.systemData.ac?.sp;
    context.sp = `${Number(sp) > 0 ? '-' : ''}${context.systemData.ac?.sp}`;

    context.voiceProfiles = Constant.VOICE_SOUNDS.keys();
    const voiceMoods = [];
    for (const [key, value] of Object.entries(Constant.VOICE_MOOD_ICONS)) {
      voiceMoods.push( { mood: key, icon: value } );
    }
    context.voiceMoods = voiceMoods;
    context.hasVoice = !!context.systemData.voice;
    context.noVoice = !context.systemData.voice;
    context.hideVoiceSelection = context.isPlayer && context.hasVoice;
    context.showSoundBoard = context.isGM || context.hasVoice;

    // fatigue
    if (context.isCharacter) {
      context.fatigue = this.getFatigueData(context.data);
    }

    return context;
  }

  getFatigueData(data) {
    const fatigue = {};
    const tempDescs = [
      [-Infinity, 'Extremely hot'],
      [-4, 'Hot'],
      [6, 'Warm'],
      [16, 'Cool'],
      [16, 'Cold'],
      [26, 'Extremely cold'],
    ];

    let reqClo = Number(game.settings.get("lostlands", "requiredClo"));
    if (isNaN(reqClo)) return ui.notifications.error("required clo set incorrectly");

    fatigue.tempDesc = tempDescs.find((t, i) => reqClo >= t[0] && reqClo < (tempDescs[i+1] ? tempDescs[i+1][0] : Infinity))?.[1];

    const diffClo = data.data.clo - reqClo;
    const isWarm = data.effects.some(e => e.label === 'Warm');
    fatigue.exposureDesc = isWarm && diffClo < 10 ? 'Warm' : Util.upperCaseFirst(Fatigue.getExposureConditionString(diffClo));

    const diseases = Object.keys(data.flags?.lostlands?.disease ?? {});
    const symptoms = diseases.flatMap(d => Fatigue.DISEASES[d].symptoms);
    const symptomsString = [...new Set(symptoms)].join(', ').replace(/,\s*$/, '');
    fatigue.diseaseDesc = Util.upperCaseFirst(symptomsString) || 'No symptoms';

    const exhaustionStatus = this.getFatigueStatus(data, 'exhaustion');
    fatigue.exhaustionDesc = exhaustionStatus === 2 ? 'Exhausted' : exhaustionStatus === 1 ? 'Sleepy' : 'Fine';

    const thirstStatus = this.getFatigueStatus(data, 'thirst');
    fatigue.thirstDesc = thirstStatus === 2 ? 'Dehydrated' : thirstStatus === 1 ? 'Thirsty' : 'Fine';

    const hungerStatus = this.getFatigueStatus(data, 'hunger');
    fatigue.hungerDesc = hungerStatus === 2 ? 'Starving' : hungerStatus === 1 ? 'Hungry' : 'Fine';

    return fatigue;
  }

  getFatigueStatus(data, type) {
    const isResting = data.effects.some(e => e.label === 'Rest');
    if (isResting) return 0;
    const flagData = data.flags?.lostlands?.[type] || {};
    const damage = !!flagData.maxHpDamage;
    if (damage) return 2;

    const startTime = flagData.startTime;
    const warningInterval = Fatigue.CLOCKS[type].warningInterval;
    const warningIntervalInSeconds = Util.intervalInSeconds(warningInterval);
    const time = Util.now();
    const warn = time >= startTime + warningIntervalInSeconds;
    if (warn) return 1;

    return 0;
  }

  sortEquipmentByType(items) {    
    const equipment = {};
    const heldArr = items.filter(i => i.data.attributes.holdable?.value);
    if (heldArr.length) equipment.holdable = heldArr;
    const wornArr = items.filter(i => !i.data.attributes.holdable?.value && i.data.attributes.wearable?.value);
    if (wornArr.length) equipment.wearable = wornArr;
    const magicArr = items.filter(i => !i.data.attributes.holdable?.value && !i.data.attributes.wearable?.value && i.data.attributes.magic?.value);
    if (magicArr.length) equipment.magic = magicArr
    const otherArr = items.filter(i => !i.data.attributes.holdable?.value && !i.data.attributes.wearable?.value && !i.data.attributes.magic?.value);
    if (otherArr.length) equipment.other = otherArr;

    return equipment;
  }

  sortSpellsByType(spells, attrs) {
    const sortedSpells = {};
    for(const spelltype of Object.values(Constant.SPELL_TYPES)) {
      const spellsByType = spells.filter(s => s.type === spelltype);
      if(!spellsByType.length) continue;
      sortedSpells[spelltype] = {};
      const nolevelSpells = spellsByType.filter(s => !s.data.attributes.lvl?.value);
      if(nolevelSpells.length > 0) sortedSpells[spelltype][`(none)`] = {spells: nolevelSpells};
      for(let i = 1; i <= Constant.MAX_SPELL_LEVELS[spelltype]; i++) {
        const spellsAtLevel = spellsByType.filter(s => s.data.attributes.lvl?.value === i);
        const slotsAtLevelVal = attrs[spelltype]?.[`lvl_${i}`]?.value;
        const slotsAtLevelMax = attrs[spelltype]?.[`lvl_${i}`]?.max;
        if(!spellsAtLevel.length) continue;
        sortedSpells[spelltype][`Level ${i}`] = {
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

  sortFeaturesBySource(features) {
    const sortedFeatures = {};
    const classArr = features.filter( f => Util.stringMatch(f.data.attributes.source?.value, 'class'));
    if (classArr.length) sortedFeatures['Class'] = classArr;
    const raceArr = features.filter( f => Util.stringMatch(f.data.attributes.source?.value, 'race'));
    if (raceArr.length) sortedFeatures['Race'] = raceArr;
    const otherArr = features.filter(f => !Util.stringMatch(f.data.attributes.source?.value, 'class') && 
      !Util.stringMatch(f.data.attributes.source?.value, 'race'));
    if (otherArr.length) sortedFeatures['Other'] = otherArr;

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
    const type = button.dataset.type;
    const data = {name: game.i18n.localize("SIMPLE.ItemNew"), type: type};
    const itemQty = +item?.data.data.quantity || 0;
    
    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        return cls.create(data, {parent: this.actor});
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
    let itemMacroWithId = item.data.data.macro.replace(/itemId/g, item._id);
    let isLostlandsMacro = itemMacroWithId?.includes('game.lostlands.Macro');
    if (isLostlandsMacro) {
      let optionsParam = '';
      if (event.ctrlKey) optionsParam += 'applyEffect: true,';
      if (event.shiftKey) optionsParam += 'showModDialog: true,';
      if (event.altKey) optionsParam += 'showAltDialog: true,';
      optionsParam = `{${optionsParam}}`;
      itemMacroWithId = itemMacroWithId.replace(/{}/g, optionsParam);
    }
    let macro = game.macros.find(m => ( m.name === item.name && m.data.command === itemMacroWithId ));
    if ( !macro ) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        command: itemMacroWithId,
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
      Util.macroChatMessage(this, { content: `${this.actor.name} prepares ${item.name}.` });
    }
    return this.actor.updateEmbeddedDocuments("Item", [{_id: item._id, "data.prepared": !isPrepared}]);
  }

  _handleWear(item) {
    const isWorn = !!item.data.data.worn;
    const wornItems = this.actor.data.items.filter(i => i.type === 'item' && i.data.data.worn);
    if (!isWorn) {
      const charSize = Constant.SIZE_VALUES[this.actor.data.data.attributes.size?.value] ?? 2;
      const itemSize = Constant.SIZE_VALUES[item.data.data.attributes.size?.value];

      // can't wear a rigid item if any of this item's locations are already covered by a rigid item
      const isRigid = !!item.data.data.attributes.rigid?.value;
      if (isRigid) {
        const itemLocations = item.data.data.locations;
        const wornRigidItems = wornItems.filter(i => i.type === 'item' && !!i.data.data.attributes.rigid?.value);
        const wornRigidLocations = wornRigidItems.map(i => i.data.data.locations).flat();
        const duplicateLocation = wornRigidLocations.find(l => itemLocations.includes(l));
        if (!!duplicateLocation) {
          return ui.notifications.error(`Already wearing a rigid item over ${duplicateLocation}`);
        }
      }

      // can't wear if quantity greater or less than 1
      const itemQty = +item?.data.data.quantity || 0;
      if (itemQty !== 1) return ui.notifications.error(`Can't wear with quantity of ${itemQty}`);
      
      // can't wear a shield if already wearing a shield,
      //    while holding a small shield or 2 handed weapon
      //    or if size of shield is bigger than character size + 1
      const isShield = !!item.data.data.attributes.shield?.value;
      const wearingShield = this.actor.data.items.some(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield?.value);
      const holdingShield = this.actor.data.items.some(i => i.type === 'item' && (i.data.data.held_left && i.data.data.held_right) && !!i.data.data.attributes.shield?.value);
      const holdingTwoHands = this.actor.data.items.some(i => i.type === 'item' && i.data.data.held_left && i.data.data.held_right);
      if (isShield) {
        if (itemSize > charSize + 1) return ui.notifications.error(`Character is too small to wear a shield of this size`);
        if (wearingShield) return ui.notifications.error("Can only wear one shield");
        if (holdingShield) return ui.notifications.error("Cannot wear a shield while holding a shield");
        if (holdingTwoHands) return ui.notifications.error("Cannot wear a shield while holding a weapon with both hands");
      }

      // can't stack rings of protection
      const stackingRingofProt = item.data.name.toLowerCase().includes('ring of protection') &&
                                wornItems.some(i => i.data.name.toLowerCase().includes('ring of protection'));
      if (stackingRingofProt ) {
        return ui.notifications.error("Cannot wear more than one ring of protection");
      }

      // can't wear item if already wearing an item in that slot
      const itemSlot = item.data.data.attributes.slot?.value;
      const wornItemsInSlot = wornItems.filter(i => i.data.data.attributes.slot?.value === itemSlot);
      const slotLimit = Util.stringMatch(itemSlot, 'ring') ? 10 : 1;
      if ( itemSlot && wornItemsInSlot.length >= slotLimit ) {
        return ui.notifications.error(`Must remove an item from the ${itemSlot} slot first`);
      }
    }
    
    let verb = isWorn ? 'doffs' : 'dons';
    Util.macroChatMessage(this, { content: `${this.actor.name} ${verb} ${item.name}.` });
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
        Object.assign(itemUpdate.data, {held_left: false, held_right: false});
      } else {
        itemUpdate.data[`held_${hand}`] = false;
      }
    } else {
      const isShield = !!item.data.data.attributes.shield?.value;
      const wearingShield = this.actor.data.items.some(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield?.value);
      if (isShield && wearingShield) return ui.notifications.error("Cannot use a shield while wearing a shield");
      if (itemSize > maxSize) return ui.notifications.error("Item too big to hold");
      if (thisHandFull) return ui.notifications.error("Must release a held item first");
      if (twoHanded) {
        if (!!itemHeldInOtherHand) return ui.notifications.error("Must release a held item first");
        Object.assign(itemUpdate.data, {held_left: true, held_right: true});
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
      const canQuickSlash = !!item.data.data.attributes.quick_slash?.value && atkModes.includes('swing(s)');
      if (canQuickSlash && event.altKey) {
        await this.actor.updateEmbeddedDocuments("Item", [itemUpdate]);
        return game.lostlands.Macro.quickSlashAttackMacro(item._id, {applyEffect: event.ctrlKey, showModDialog: event.shiftKey});
      } else {
        Util.macroChatMessage(this, { content: `${this.actor.name} wields ${item.name}${(isHeldOtherHand || twoHanded) ? ' in both hands' : ''}.` });
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
    const soundsArr = mood ? Constant.VOICE_SOUNDS?.get(`${voice}`)?.get(`${mood}`) :
                      Array.from(Constant.VOICE_SOUNDS?.get(`${voice}`)?.values()).flat();
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
