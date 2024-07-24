import { BrigandineItemSheet } from './item-sheet.js';
import { EntitySheetHelper } from '../helper.js';
import * as Constant from '../constants.js';
import * as Util from '../utils.js';

export class FeatureItemSheet extends BrigandineItemSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['brigandine', 'sheet', 'item'],
      template: 'systems/brigandine/templates/feature-item-sheet.html',
      width: 520,
      height: 480,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }],
      scrollY: ['.description', '.attributes'],
    });
  }

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    context.props = {};

    // this._prepareFeatureData(context);
    // this._prepareGrapplingData(context);
    // this._prepareWeaponData(context);

    return context;
  }

  _prepareFeatureData(context) {
    if (context.data.type !== 'feature') return;
    const type = context.data.data.attributes.type.value;
    context.props['Type'] = type;
  }

  _prepareGrapplingData(context) {
    if (context.data.type !== 'grapple_maneuver') return;
    const atkReq = context.data.data.attributes.req_atk_status.value;
    const defReq = context.data.data.attributes.req_def_status.value;
    context.props['Attacker'] = atkReq;
    context.props['Defender'] = defReq;
  }

  _prepareWeaponData(context) {
    if (context.data.type !== 'natural_weapon') return;
    const dmg = context.data.data.attributes.dmg.value;
    context.props['Damage'] = dmg;
  }
}
