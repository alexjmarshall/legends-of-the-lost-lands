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

    // const formattedFeatureTypes = {
    //   "natural_weapon": "Weapon",
    //   "grapple_maneuver": "Grappling",
    // };
    // context.propA = {
    //   label: 'Type',
    //   value: formattedFeatureTypes[context.data.type] || Util.upperCaseFirst(context.data.type),
    // };

    this._prepareSkillData(context);
    this._prepareFeatureData(context);
    this._prepareGrapplingData(context);
    this._prepareWeaponData(context);

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

  _prepareFeatureData(context) {
    if (context.data.type !== 'feature') return;
    const source = context.data.data.attributes.source.value;
    context.propB = {
      label: 'Source',
      value: source,
    };
  }

  _prepareGrapplingData(context) {
    if (context.data.type !== 'grapple_maneuver') return;
    const atkReq = context.data.data.attributes.req_atk_status.value;
    const defReq = context.data.data.attributes.req_def_status.value;
    context.propA = {
      label: 'Attacker',
      value: atkReq,
    };
    context.propB = {
      label: 'Defender',
      value: defReq,
    };
  }

  _prepareWeaponData(context) {
    if (context.data.type !== 'natural_weapon') return;
    const dmg = context.data.data.attributes.dmg.value;
    context.propB = {
      label: 'Damage',
      value: dmg,
    };
  }
}
