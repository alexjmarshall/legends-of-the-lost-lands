import { SimpleItemSheet } from "./item-sheet.js";
import { EntitySheetHelper } from "./helper.js";
import * as Constant from "./constants.js";
import * as Util from "./utils.js";

export class FeatureItemSheet extends SimpleItemSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["lostlands", "sheet", "item"],
      template: "systems/lostlands/templates/feature-item-sheet.html",
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

    context.propA = {
      label: 'Type',
      value: Util.upperCaseFirst(context.data.type).replace('_',' '),
    };

    this._prepareSkillData(context)

    return context;
  }

  _prepareSkillData(context) {
    if (context.data.type !== 'skill') return;
    const actorData = context.document.actor?.data;
    context.propB = {
      label: 'ST',
      value: Util.getDerivedSkillTarget(context.data, actorData),
    };
  }
}
