import { SimpleItemSheet } from "./item-sheet.js";
import { EntitySheetHelper } from "./helper.js";
import * as Constant from "./constants.js";

export class SpellItemSheet extends SimpleItemSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["lostlands", "sheet", "item"],
      template: "systems/lostlands/templates/spell-item-sheet.html",
      width: 520,
      height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".description", ".attributes"],
    });
  }

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.data;
    context.dtypes = Constant.ATTRIBUTE_TYPES;
    context.isGM = game.user.isGM;
    context.isPlayer = !game.user.isGM;
    if(context.data.type === "spell_magic") context.spellType = "Magic";
    else if(context.data.type === "spell_cleric") context.spellType = "Cleric";
    else if(context.data.type === "spell_witch") context.spellType = "Witch";
    return context;
  }
}
