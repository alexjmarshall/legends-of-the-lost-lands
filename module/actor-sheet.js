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
      scrollY: [".biography", ".items", ".attributes"],
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

    // sort skills
    context.data.skills = items.filter(i => i.type === "skill");
    context.hasSkills = context.data.skills.length > 0;

    return context;
  }

  sortSpellsByType(spelltype, data) {
    const spells = data.items.filter(i => i.type === `${spelltype}`);
    if(spells.length > 0) {
      data.spells[`${spelltype}`] = {};
      let nolevelSpells = spells.filter(s => !s.data.attributes.level?.value);
      if(nolevelSpells.length > 0) data.spells[`${spelltype}`][`(none)`] = {spells: nolevelSpells};
      for(let i = 1; i <= MAX_SPELL_LEVELS[`${spelltype}`]; i++) {
        let spellsAtLevel = spells.filter(s => s.data.attributes.level?.value === i);
        if(spellsAtLevel.length > 0) {
          data.spells[`${spelltype}`][`${i}`] = {
            spells: spellsAtLevel,
            slots: {
              value: data.data.attributes[`${spelltype}`]?.[`level_${i}`]?.value,
              max: data.data.attributes[`${spelltype}`]?.[`level_${i}`]?.max
            }
          }
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

    // Spell preparation checkbox
    html.find("#prepareSpell").on("change", async function(event) {
      event.preventDefault();
      const li = event.target.closest(".item");
      const itemId = li?.dataset.itemId;
      const item = this.actor.items.get(itemId);
      const value = !item.data.data.prepared;
      await this.actor.updateEmbeddedDocuments("Item", [{_id: itemId, "data.prepared": value}]);
    }.bind(this));

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
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);
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
        return item.delete();
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
