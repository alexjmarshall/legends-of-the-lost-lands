import { BrigandineItemSheet } from './item-sheet.js';
import { EntitySheetHelper } from '../helper.js';
import * as Constant from '../constants.js';

export class SpellItemSheet extends BrigandineItemSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['brigandine', 'sheet', 'item'],
      template: 'systems/brigandine/templates/spell-item-sheet.html',
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
    context.props.Range = context.systemData.attributes.range?.value;
    context.props.Area = context.systemData.attributes.area?.value;
    context.props.Duration = context.systemData.attributes.duration?.value;
    context.props.Complexity = context.systemData.attributes.complexity?.value;

    context.showEffects = false;

    return context;
  }
}
