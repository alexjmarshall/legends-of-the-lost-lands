import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";
import {MAX_SPELL_LEVELS} from "./constants.js";

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
    context.data.features = items.filter(i => i.type === "feature");
    context.hasFeatures = context.data.features.length > 0;

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
        return await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.prepared": !isPrepared}]);
      case "wear":
        const isWorn = !!item.data.data.worn;
        // check whether already wearing an item in this slot
        const slot = item.data.data.attributes.slot?.value;
        const slotItems = this.actor.data.items.filter(i => i.data.data.attributes.slot?.value === slot && i.data.data.worn);
        const slotLimit = slot === 'ring' ? 2 : 1;
        if(slot && !isWorn && slotItems.length >= slotLimit) {
          // clear up the slot
          const firstSlotItemId = slotItems[0].data._id;
          await this.actor.updateEmbeddedDocuments("Item", [{_id: firstSlotItemId, "data.worn": false}]);
        }
        return await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.worn": !isWorn}]);
      case "hold":
        const isHeld = !!item.data.data.held;
        const heldItems = this.actor.data.items.filter(i => i.data.data.held);
        if(!isHeld && heldItems.length >= 2) {
          // clear up a slot by unholding first held item
          const firstHeldItemId = heldItems[0].data._id;
          await this.actor.updateEmbeddedDocuments("Item", [{_id: firstHeldItemId, "data.held": false}]);
        }
        return await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.held": !isHeld}]);
      case "use":
        const itemMacroWithId = item.data.data.macro.replace('itemId', item._id);
        let macro = game.macros.find(m => (m.name === item.name && m.data.command === itemMacroWithId));
        if (!macro && itemMacroWithId) {
          macro = await Macro.create({
            name: item.name,
            type: "script",
            command: itemMacroWithId,
            flags: { "lostlands.attrMacro": true }
          });
        }
        if(event.ctrlKey) {
          macro.data.command = macro.data.command.replace('{}', '{applyDamage: true}');
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

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
