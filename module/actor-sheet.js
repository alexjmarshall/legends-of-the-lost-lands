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

    // sort equipment
    const items = context.data.items.filter(i => i.type === 'item');
    items.forEach(item => item.data.totalWeight = Math.ceil(item.data.quantity * item.data.weight) || 0);
    context.data.equipment = this.sortEquipmentByType(items);
    context.hasEquipment = Object.values(context.data.equipment).flat().length > 0;

    // sort spells
    const spells = context.data.items.filter(i => Object.values(Constant.SPELL_TYPES).includes(i.type));
    context.data.spells = this.sortSpellsByType(spells, context.data.data.attributes);
    context.hasSpells = Object.values(context.data.spells).flat().length > 0;

    // sort features
    const features = context.data.items.filter(i => i.type === 'feature');
    context.data.features = this.sortFeaturesBySource(features, context.data.data.attributes);
    context.hasFeatures = Object.values(context.data.features).flat().length > 0;

    context.data.voiceProfiles = Constant.VOICE_SOUNDS.keys();
    context.data.voiceMoods = [];
    for (const [key, value] of Object.entries(Constant.VOICE_MOOD_ICONS)) {
      context.data.voiceMoods.push( { mood: key, icon: value } );
    }
    context.hasVoice = !!context.systemData.voice;
    context.noVoice = !context.systemData.voice;
    context.hideVoiceSelection = context.isPlayer && context.hasVoice;
    context.showSoundBoard = context.isGM || context.hasVoice;

    // fatigue
    context.data.fatigue = this.getFatigueData(context.data);

    return context;
  }

  getFatigueData(data) {
    const fatigue = {};
    const tempDescs = {
      0: 'Hot',
      1: 'Warm',
      2: 'Cool',
      3: 'Cold',
      4: 'Freezing',
    };
    const reqClo = game.settings.get("lostlands", "requiredClo");
    fatigue.tempDesc = tempDescs[reqClo];
    const diffClo = data.data.clo - reqClo;
    fatigue.exposureDesc = Util.upperCaseFirst(Fatigue.getExposureConditionString(diffClo));
    const diseases = Object.keys(data.flags.lostlands.disease ?? {});
    const symptoms = diseases.flatMap(d => Fatigue.DISEASES[d].symptoms);
    const symptomsString = [...new Set(symptoms)].join(', ').replace(/,\s*$/, '');
    fatigue.diseaseDesc = Util.upperCaseFirst(symptomsString) || 'No symptoms';
    const thirstStatus = this.getFatigueStatus(data, 'thirst');
    fatigue.thirstDesc = thirstStatus === 2 ? 'Dying of thirst' : thirstStatus === 1 ? 'Thirsty' : 'Satisfied';
    const hungerStatus = this.getFatigueStatus(data, 'hunger');
    fatigue.hungerDesc = hungerStatus === 2 ? 'Starving' : hungerStatus === 1 ? 'Hungry' : 'Satisfied';

    return fatigue;
  }

  getFatigueStatus(data, type) {
    const damage = data.data.hp.max < data.data.hp.max_max && data.flags.lostlands[type].maxHpDamage;
    const condition = Fatigue.CLOCKS[type].condition;
    const warn = data.effects.map(e => e.label).includes(condition);
    if (damage) return 2;
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
      case "prepare": // TODO clean up code in these cases
        const isPrepared = !!item.data.data.prepared;
        const spellLevel = item.data.data.attributes.lvl.value;
        const actorSlotsAttr = this.actor.data.data.attributes[`${item.type}`]?.[`lvl_${spellLevel}`];
        const preparedSpells = this.actor.data.items.filter(i => i.type === `${item.type}` && 
          i.data.data.attributes.lvl?.value === spellLevel && 
          i.data.data.prepared);
        const slotsMax = actorSlotsAttr?.max || 0;
        if (slotsMax === 0) return ui.notifications.error("Cannot prepare spells of this level");
        if ( !isPrepared && preparedSpells.length >= slotsMax ) {
          return ui.notifications.error("Cannot prepare any more spells of this level");
        }
        if (!isPrepared) {
          Util.macroChatMessage(this, this.actor, { content: `prepares ${item.name}` });
        }
        return this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.prepared": !isPrepared}]);
      case "wear":
        const isWorn = !!item.data.data.worn;
        // can't wear a shield while holding a small shield
        const isShield = Util.stringMatch(item.data.data.attributes.slot?.value, 'shield');
        const holdingSmallShield = this.actor.data.items.some(i => i.type === 'item' && i.data.data.held && Util.stringMatch(i.data.data.attributes.size?.value, 'small'));
        if ( isShield && holdingSmallShield ) {
          return ui.notifications.error("Cannot wear a shield while using a small shield");
        }
        // can't stack rings of protection
        const wornItems = this.actor.data.items.filter(i => i.type === 'item' && i.data.data.worn);
        const stackingRingofProt = item.data.name.toLowerCase().includes('ring of protection') &&
                                   wornItems.some(i => i.data.name.toLowerCase().includes('ring of protection'));
        if ( !isWorn && stackingRingofProt ) {
          return ui.notifications.error("Cannot wear more than one ring of protection");
        }
        const itemSlot = item.data.data.attributes.slot?.value;
        const wornItemsInSlot = wornItems.filter(i => i.data.data.attributes.slot?.value === itemSlot);
        const slotLimit = Util.stringMatch(itemSlot, 'ring') ? 10 : 1;
        if ( itemSlot && !isWorn && wornItemsInSlot.length >= slotLimit ) {
          return ui.notifications.error(`Must remove an item from the ${itemSlot} slot first`);
        }
        let verb = isWorn ? 'doffs' : 'dons';
        Util.macroChatMessage(this, this.actor, { content: `${verb} ${item.name}` });
        return this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.worn": !isWorn}]);
      case "hold":
        const isHeld = !!item.data.data.held;
        const heldItems = this.actor.data.items.filter(i => i.type === 'item' && i.data.data.held);
        const heldItemsLimit = item.data.data.attributes.two_hand?.value || heldItems.some(i => i.data.data.attributes.two_hand?.value) ? 1 : 2;
        // can't hold a small shield while wearing a shield
        const isSmallShield = Util.stringMatch(item.data.data.attributes.size?.value, 'small');
        const wearingShield = this.actor.data.items.some(i => i.type === 'item' && i.data.data.worn && Util.stringMatch(i.data.data.attributes.slot?.value, 'shield'));
        if ( isSmallShield && wearingShield ) {
          return ui.notifications.error("Cannot use a small shield while wearing a shield");
        }
        if ( !isHeld && heldItems.length >= heldItemsLimit ) {
          return ui.notifications.error("Must release a held item first");
        }
        const heldQtyLimit = item.name.toLowerCase().includes('javelin') ? 3 :
          item.data.data.attributes.light?.value ? 2 : 1;
        if ( !isHeld && itemQty > heldQtyLimit ) {
          return ui.notifications.error(`May hold only ${heldQtyLimit} quantity in one hand`);
        }
        await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.held": !isHeld}]);
        if (!isHeld) {
          // handle quick draw attack
          const dmgTypes = item.data.data.attributes.dmg_types?.value.split(',').map(t => t.trim()).filter(t => t) || [];
          const canQuickDraw = item.data.data.attributes.quick_draw?.value && dmgTypes.includes('cut');
          if (canQuickDraw) {
            if (event.altKey) {
              return game.lostlands.Macro.quickDrawAttackMacro(item.id, {applyEffect: event.ctrlKey, showModDialog: event.shiftKey});
            }
            Util.macroChatMessage(this, this.actor, { content: `draws ${item.name}` });
          } else {
            Util.macroChatMessage(this, this.actor, { content: `wields ${item.name}` });
          }
        }
        return;
      case "use":
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
