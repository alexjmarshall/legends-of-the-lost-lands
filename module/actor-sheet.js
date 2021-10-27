import { EntitySheetHelper } from "./helper.js";
import { ATTRIBUTE_TYPES, MAX_SPELL_LEVELS, VOICE_SOUNDS, VOICE_MOODS } from "./constants.js";
import { wait } from "./utils.js";

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
    context.dtypes = ATTRIBUTE_TYPES;
    context.isGM = game.user.isGM;
    context.isPlayer = !game.user.isGM;

    // sort equipment
    const items = context.data.items;
    context.data.equipment = items.filter(i => i.type === "item");

    // sort spells
    context.data.spells = {};
    this.sortSpellsByType('spell_cleric', context.data);
    this.sortSpellsByType('spell_magic', context.data);
    this.sortSpellsByType('spell_witch', context.data);
    context.hasSpells = Object.keys(context.data.spells).length > 0;

    // sort features
    context.data.features = {};
    this.sortFeaturesBySource('none', context.data);
    this.sortFeaturesBySource('class', context.data);
    this.sortFeaturesBySource('race', context.data);
    context.hasFeatures = Object.keys(context.data.features).length > 0;

    context.data.voiceProfiles = VOICE_SOUNDS.keys();
    context.data.voiceMoods = [];
    for (const [key, value] of VOICE_MOODS) {
      context.data.voiceMoods.push( { mood: key, icon: value } );
    }
    context.hasVoice = !!context.systemData.voice;
    context.noVoice = !context.systemData.voice;
    context.hideVoiceSelection = context.isPlayer && context.hasVoice;
    context.showSoundBoard = context.isGM || context.hasVoice;

    return context;
  }

  sortSpellsByType(spelltype, data) {
    const spells = data.items.filter(i => i.type === `${spelltype}`);
    if(!spells.length) return;
    data.spells[`${spelltype}`] = {};
    const nolevelSpells = spells.filter(s => !s.data.attributes.lvl?.value);
    if(nolevelSpells.length > 0) data.spells[`${spelltype}`][`(none)`] = {spells: nolevelSpells};
    for(let i = 1; i <= MAX_SPELL_LEVELS[`${spelltype}`]; i++) {
      const spellsAtLevel = spells.filter(s => s.data.attributes.lvl?.value === i);
      const slotsAtLevelVal = data.data.attributes[`${spelltype}`]?.[`lvl_${i}`]?.value;
      const slotsAtLevelMax = data.data.attributes[`${spelltype}`]?.[`lvl_${i}`]?.max;
      if(!spellsAtLevel.length) continue;
      data.spells[`${spelltype}`][`${i}`] = {
        spells: spellsAtLevel,
        slots: {
          value: slotsAtLevelVal,
          max: slotsAtLevelMax
        }
      }
    }
  }

  sortFeaturesBySource(source, data) {
    const attrs = data.data.attributes;
    const sourceKey = source === 'class' ?
      `${attrs.class?.value != null ? `${attrs.class.value}` : 'Class'}` :
      source === 'race' ? `${attrs.race?.value != null ? `${attrs.race.value}` : 'Race'}` :
      source;
    const featureBySource = source === 'none' ? 
      data.items.filter(i => i.type === `feature` && (i.data.attributes.source?.value?.toLowerCase() !== 'class' && i.data.attributes.source?.value?.toLowerCase() !== 'race')) :
      data.items.filter(i => i.type === `feature` && i.data.attributes.source?.value?.toLowerCase() === `${source}`);
    if(!featureBySource.length) return;
    data.features[`${sourceKey}`] = featureBySource;
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
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));

    // Voice Sounds
    html.find(".voice-play").click(this._onVoicePlay.bind(this));
    html.find(".voice-preview").click(this._onVoicePreview.bind(this));
    html.find(".voice-select").change(e => e.stopPropagation());
    html.find(".voice-select-button").click(this._onVoiceSelect.bind(this));
    html.find(".voice-reset-button").click(this._onVoiceReset.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
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
    const sheetFlag = {
      core: {
        sheetClass: "lostlands.SpellItemSheet"
      }
    };
    const data = {flags:sheetFlag, name: game.i18n.localize("SIMPLE.ItemNew"), type: type};
    if(type === "item") data.flags = {};
    
    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        return cls.create(data, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        const actor = this.actor;
        const itemQty = +item.data.data.quantity || 0;
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
          default: "two",
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
        const isPrepared = !!item.data.data.prepared;
        const spellLevel = item.data.data.attributes.lvl.value;
        const actorSlotsAttr = this.actor.data.data.attributes[`${item.type}`]?.[`lvl_${spellLevel}`];
        const preparedSpells = this.actor.data.items.filter(i => i.type === `${item.type}` && 
          i.data.data.attributes.lvl?.value === spellLevel && 
          i.data.data.prepared);
        const slotsMax = actorSlotsAttr?.max || 0;
        if(slotsMax === 0) return ui.notifications.error("Cannot prepare spells of this level.");
        if(!isPrepared && preparedSpells.length >= slotsMax) {
          // clear up a slot by unpreparing first prepared spell
          const firstPreparedSpellId = preparedSpells[0].data._id;
          await this.actor.updateEmbeddedDocuments("Item", [{_id: firstPreparedSpellId, "data.prepared": false}]);
        }
        if(!isPrepared === true) {
          game.lostlands.Macro.macroChatMessage(this, { content: `prepares ${item.name}` });
        }
        return await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.prepared": !isPrepared}]);
      case "wear":
        const isWorn = !!item.data.data.worn;
        // check whether already wearing an item in this slot
        const slot = item.data.data.attributes.slot?.value?.toLowerCase();
        const slotItems = this.actor.data.items.filter(i => i.data.data.worn && i.data.data.attributes.slot?.value === slot);
        const slotLimit = slot === 'ring' ? 10 : 1;
        const wearingRingofProtection = !!this.actor.data.items.find(i => i.data.data.worn && i.data.name.toLowerCase().includes('ring of protection'));
        if(slot && !isWorn && (slotItems.length >= slotLimit || (wearingRingofProtection && !!item.data.name.toLowerCase().includes('ring of protection')))) {
          // return ui.notifications.error("Must remove an item of this type first.");
          // clear up the slot
          const firstSlotItemId = slotItems[0].data._id;
          await this.actor.updateEmbeddedDocuments("Item", [{_id: firstSlotItemId, "data.worn": false}]);
        }
        if(!isWorn === true) {
          game.lostlands.Macro.macroChatMessage(this, { content: `dons ${item.name}` });
        }
        return await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.worn": !isWorn}]);
      case "hold":
        const isHeld = !!item.data.data.held;
        const heldItems = this.actor.data.items.filter(i => i.data.data.held);
        const heldItemsLimit = item.data.data.attributes.two_hand?.value || heldItems.find(i => i.data.data.attributes.two_hand?.value) ? 1 : 2;
        if(!isHeld && heldItems.length >= heldItemsLimit) {
          // return ui.notifications.error("Must drop an item first.");
          // if heldItemsLimit is 1, must clear all held items. Otherwise, just clear one.
          for(const item of heldItems) {
            await this.actor.updateEmbeddedDocuments("Item", [{_id: item.data._id, "data.held": false}]);
            if(heldItemsLimit > 1) break;
          }
        }
        if(!isHeld === true) {
          game.lostlands.Macro.macroChatMessage(this, { content: `wields ${item.name}` });
        }
        return await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.held": !isHeld}]);
      case "use":
        let itemMacroWithId = item.data.data.macro.replace('itemId', item._id);
        let isLostlandsMacro = itemMacroWithId?.includes('game.lostlands.Macro')
        if(event.ctrlKey && event.altKey && isLostlandsMacro) {
          // create alternate version of macro
          itemMacroWithId = itemMacroWithId.replace('{}', '{applyDamage: true, showModDialog: true}');
        } else if(event.ctrlKey && isLostlandsMacro) {
          itemMacroWithId = itemMacroWithId.replace('{}', '{applyDamage: true}');
        } else if(event.altKey && isLostlandsMacro) {
          itemMacroWithId = itemMacroWithId.replace('{}', '{showModDialog: true}');
        }
        let macro = game.macros.find(m => (m.name === item.name && m.data.command === itemMacroWithId));
        if (!macro && itemMacroWithId) {
          macro = await Macro.create({
            name: item.name,
            type: "script",
            command: itemMacroWithId,
            flags: { "lostlands.attrMacro": true }
          });
        }
        return await macro.execute();
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  async _onVoicePlay(event) {
    event.preventDefault();
    let button = $(event.currentTarget);
    const tab = button.closest('.tab.voice');
    const buttons = tab.find('button.voice-play');
    const mood = button.data('mood');
    const select = tab.find('.voice-select');
    const voice = this.actor.data.data.voice || select.find(":selected").val();
    const numTracks = VOICE_SOUNDS?.get(`${voice}`)?.get(`${mood}`)?.length || 1;
    const trackNum = Math.floor(Math.random() * numTracks + 1);
    const hasVoice = !!this.actor.data.data.voice;
    const sound = await AudioHelper.play({src: `systems/lostlands/sounds/${voice}/${mood}_${trackNum}.mp3`, volume: 1, loop: false}, hasVoice);
    if (hasVoice) {
      const token = this.actor.isToken ? this.actor.token.data :
      canvas.tokens.objects.children.find(t => t.actor.id === this.actor.id && t.actor.data.data.voice === this.actor.data.data.voice);
      canvas.hud.bubbles.say(token, `<i class="fas fa-volume-up"></i>`, {emote: true});
    }
    buttons.attr('disabled', true);
    await wait(sound.duration * 1000);
    buttons.attr('disabled', false);
  }

  async _onVoicePreview(event) {
    event.preventDefault();
    let button = $(event.currentTarget);
    const tab = button.closest('.tab.voice');
    const select = tab.find('.voice-select');
    const voice = this.actor.data.data.voice || select.find(":selected").val();
    const allSoundPaths = [];
    VOICE_SOUNDS?.get(`${voice}`)?.forEach((v, k) => {
      allSoundPaths.push(...v)
    });
    const numTracks = allSoundPaths.length;
    const trackNum = Math.floor(Math.random() * numTracks);
    const sound = await AudioHelper.play({src: allSoundPaths[trackNum], volume: 1, loop: false}, false);
    button.attr('disabled', true);
    await wait(sound.duration * 1000);
    button.attr('disabled', false);
  }

  _onVoiceSelect(event) {
    event.preventDefault();
    let button = $(event.currentTarget);
    const tab = button.closest('.tab.voice');
    const select = tab.find('.voice-select');
    const voice = select.find(":selected").val();
    const otherCharacterHasVoice = !!game.actors.find(a => a.data.data.voice === voice);
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
        default: "two"
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
    let button = $(event.currentTarget);
    const tab = button.closest('.tab.voice');
    const select = tab.find('.voice-select');
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
