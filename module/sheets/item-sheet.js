import { EntitySheetHelper } from '../helper.js';
import * as Constant from '../constants.js';
import { ITEM_TYPES } from '../item-helper.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SimpleItemSheet extends ItemSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['brigandine', 'sheet', 'item'],
      template: 'systems/brigandine/templates/item-sheet.html',
      width: 520,
      height: 480,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }],
      scrollY: ['.description', '.attributes'],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.data;
    context.dtypes = Constant.ATTRIBUTE_TYPES;
    context.isGM = game.user.isGM;
    context.isPlayer = !game.user.isGM;

    context.showValue = context.isGM || context.data.type === ITEM_TYPES.CURRENCY;
    context.showHp = context.systemData.hp != null;

    const identified = context.systemData.attributes.admin?.identified.value;
    context.identified = context.isGM || identified == null || identified === true;

    // TODO
    // hide empty and hidden groups from players
    // const isMagic = context.systemData.attributes.admin?.magic.value;
    // Object.keys(context.systemData.groups).forEach((k) => {
    //   const hideMagic = context.isPlayer && !isMagic && Constant.MAGIC_GROUPS.includes(k);
    //   const hideHidden = context.isPlayer && Constant.HIDDEN_GROUPS.includes(k);
    //   const hideEmpty = context.isPlayer && !Object.keys(context.systemData.groups[k].attributes).length;
    //   context.systemData.groups[k].hide = hideMagic || hideHidden || hideEmpty;
    // });

    context.effects = context.item.getEmbeddedCollection('ActiveEffect').contents;
    context.showEffects = context.isGM;

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Attribute Management
    html.find('.attributes').on('click', '.attribute-control', EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find('.groups').on('click', '.group-control', EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find('.attributes').on('click', 'a.attribute-roll', EntitySheetHelper.onAttributeRoll.bind(this));

    // Effect Controls
    html.find('.effect-control').click(this._onEffectControl.bind(this));

    // Add draggable for Macro creation
    html.find('.attributes a.attribute-roll').each((i, a) => {
      a.setAttribute('draggable', true);
      a.addEventListener(
        'dragstart',
        (ev) => {
          let dragData = ev.currentTarget.dataset;
          ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        },
        false
      );
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Effect control buttons within the Item Sheet
   * @param event
   * @private
   */
  _onEffectControl(event) {
    event.preventDefault();

    const owner = this.item;

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest('.effect');
    const effectId = li?.dataset.effectId;
    const effect = owner.effects.get(effectId);

    // Handle different actions
    switch (button.dataset.action) {
      case 'edit':
        return effect.sheet.render(true);
      case 'delete':
        return effect.delete();
      case 'create':
        return owner.createEmbeddedDocuments('ActiveEffect', [
          {
            label: 'New Effect',
            icon: 'icons/svg/aura.svg',
            origin: owner.uuid,
            disabled: false,
          },
        ]);
    }
  }

  /** @override */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
