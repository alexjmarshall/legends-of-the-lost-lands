/* eslint-disable no-prototype-builtins */
import * as ITEM from './item-helper.js';
import * as SPELLS from './rules/spells.js';
import * as Util from './utils.js';

export class EntitySheetHelper {
  static getAttributeData(data) {
    for (let attr of Object.values(data.data.attributes)) {
      // Determine attribute type.
      if (attr.dtype) {
        attr.isCheckbox = attr.dtype === 'Boolean';
        attr.isResource = attr.dtype === 'Resource';
        attr.isFormula = attr.dtype === 'Formula';
      }
      // Determine whether to show derive data as title hint.
      if (game.user.isGM && attr.derived) {
        if (attr.derived.value) {
          attr.showValueHint = true;
        }
        if (attr.derived.max) {
          attr.showMaxHint = true;
        }
      }
    }

    // Initialize ungrouped attributes for later.
    data.data.ungroupedAttributes = {};

    // Build an array of sorted group keys.
    const groups = data.data.groups || {};
    let groupKeys = Object.keys(groups).sort((a, b) => {
      let aSort = groups[a].label ?? a;
      let bSort = groups[b].label ?? b;
      return aSort.localeCompare(bSort);
    });

    // Iterate over the sorted groups to add their attributes.
    for (let key of groupKeys) {
      let group = data.data.attributes[key] || {};

      // Initialize the attributes container for this group.
      if (!data.data.groups[key]['attributes']) data.data.groups[key]['attributes'] = {};

      // Sort the attributes within the group, and then iterate over them.
      Object.keys(group)
        .sort((a, b) => a.localeCompare(b))
        .forEach((attr) => {
          // For each attribute, determine whether it's a checkbox or resource, and then add it to the group's attributes list.
          group[attr]['isCheckbox'] = group[attr]['dtype'] === 'Boolean';
          group[attr]['isResource'] = group[attr]['dtype'] === 'Resource';
          group[attr]['isFormula'] = group[attr]['dtype'] === 'Formula';
          data.data.groups[key]['attributes'][attr] = group[attr];
        });
    }

    // Sort the remaining attributes attributes.
    Object.keys(data.data.attributes)
      .filter((a) => !groupKeys.includes(a))
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        data.data.ungroupedAttributes[key] = data.data.attributes[key];
      });

    // Modify attributes on items.
    if (data.items) {
      data.items.forEach((item) => {
        // Iterate over attributes.
        for (let [k, v] of Object.entries(item.data.attributes)) {
          // Grouped attributes.
          if (!v.dtype) {
            for (let [gk, gv] of Object.entries(v)) {
              if (gv.dtype) {
                // Add label fallback.
                if (!gv.label) gv.label = gk;
                // Add formula bool.
                if (gv.dtype === 'Formula') {
                  gv.isFormula = true;
                } else {
                  gv.isFormula = false;
                }
              }
            }
          }
          // Ungrouped attributes.
          else {
            // Add label fallback.
            if (!v.label) v.label = k;
            // Add formula bool.
            if (v.dtype === 'Formula') {
              v.isFormula = true;
            } else {
              v.isFormula = false;
            }
          }
        }
      });
    }
  }

  /* -------------------------------------------- */

  /** @override */
  static onSubmit(event) {
    // Closing the form/sheet will also trigger a submit, so only evaluate if this is an event.
    if (event.currentTarget) {
      // Exit early if this isn't a named attribute.
      if (event.currentTarget.tagName.toLowerCase() === 'input' && !event.currentTarget.hasAttribute('name')) {
        return false;
      }

      let attr = false;
      // If this is the attribute key, we need to make a note of it so that we can restore focus when its recreated.
      const el = event.currentTarget;
      if (el.classList.contains('attribute-key')) {
        let val = el.value;
        let oldVal = el.closest('.attribute').dataset.attribute;
        let attrError = false;
        // Prevent attributes that already exist as groups.
        let groups = document.querySelectorAll('.group-key');
        for (let i = 0; i < groups.length; i++) {
          if (groups[i].value === val) {
            ui.notifications.error(game.i18n.localize('SIMPLE.NotifyAttrDuplicate') + ` (${val})`);
            el.value = oldVal;
            attrError = true;
            break;
          }
        }
        // Handle value and name replacement otherwise.
        if (!attrError) {
          oldVal = oldVal.includes('.') ? oldVal.split('.')[1] : oldVal;
          attr = $(el).attr('name').replace(oldVal, val);
        }
      }

      // Return the attribute key if set, or true to confirm the submission should be triggered.
      return attr ? attr : true;
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   */
  static async onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch (action) {
      case 'create':
        return EntitySheetHelper.createAttribute(event, this);
      case 'delete':
        return EntitySheetHelper.deleteAttribute(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events and modify attribute groups.
   * @param {MouseEvent} event    The originating left click event
   */
  static async onClickAttributeGroupControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    switch (action) {
      case 'create-group':
        return EntitySheetHelper.createAttributeGroup(event, this);
      case 'delete-group':
        return EntitySheetHelper.deleteAttributeGroup(event, this);
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for the roll button on attributes.
   * @param {MouseEvent} event    The originating left click event
   */
  static onAttributeRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.closest('.attribute').querySelector('.attribute-label')?.value;
    const chatLabel = label ?? button.parentElement.querySelector('.attribute-key').value;
    const shorthand = game.settings.get('brigandine', 'macroShorthand');

    // Use the actor for rollData so that formulas are always in reference to the parent actor.
    const rollData = this.actor.getRollData();
    let formula = button.closest('.attribute').querySelector('.attribute-value')?.value;

    // If there's a formula, attempt to roll it.
    if (formula) {
      let replacement = null;
      if (formula.includes('@item.') && this.item) {
        let itemName = this.item.name.slugify({ strict: true }); // Get the machine safe version of the item name.
        replacement = shorthand ? `@items.${itemName}.` : `@items.${itemName}.attributes.`;
        formula = formula.replace('@item.', replacement);
      }

      // Create the roll and the corresponding message
      let r = new Roll(formula, rollData);
      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${chatLabel}`,
      });
    }
  }

  /* -------------------------------------------- */

  /**
   * Return HTML for a new attribute to be applied to the form for submission.
   *
   * @param {Object} items  Keyed object where each item has a "type" and "value" property.
   * @param {string} index  Numeric index or key of the new attribute.
   * @param {string|boolean} group String key of the group, or false.
   *
   * @returns {string} Html string.
   */
  static getAttributeHtml(items, index, group = false) {
    // Initialize the HTML.
    let result = '<div style="display: none;">';
    // Iterate over the supplied keys and build their inputs (including whether or not they need a group key).
    for (let [key, item] of Object.entries(items)) {
      result =
        result +
        `<input type="${item.type}" name="data.attributes${group ? '.' + group : ''}.attr${index}.${key}" value="${
          item.value
        }"/>`;
    }
    // Close the HTML and return.
    return result + '</div>';
  }

  /* -------------------------------------------- */

  /**
   * Validate whether or not a group name can be used.
   * @param {string} groupName    The candidate group name to validate
   * @param {Document} document   The Actor or Item instance within which the group is being defined
   * @returns {boolean}
   */
  static validateGroup(groupName, document) {
    let groups = Object.keys(document.data.data.groups || {});
    let attributes = Object.keys(document.data.data.attributes).filter((a) => !groups.includes(a));

    // Check for duplicate group keys.
    if (groups.includes(groupName)) {
      ui.notifications.error(game.i18n.localize('SIMPLE.NotifyGroupDuplicate') + ` (${groupName})`);
      return false;
    }

    // Check for group keys that match attribute keys.
    if (attributes.includes(groupName)) {
      ui.notifications.error(game.i18n.localize('SIMPLE.NotifyGroupAttrDuplicate') + ` (${groupName})`);
      return false;
    }

    // Check for whitespace or periods.
    if (groupName.match(/[\s|.]/i)) {
      ui.notifications.error(game.i18n.localize('SIMPLE.NotifyGroupAlphanumeric'));
      return false;
    }
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Create new attributes.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createAttribute(event, app) {
    const a = event.currentTarget;
    const group = a.dataset.group;
    let dtype = a.dataset.dtype;
    const attrs = app.object.data.data.attributes;
    const groups = app.object.data.data.groups;
    const form = app.form;

    // Determine the new attribute key for ungrouped attributes.
    let objKeys = Object.keys(attrs).filter((k) => !Object.keys(groups).includes(k));
    let nk = Object.keys(attrs).length + 1;
    let newValue = `attr${nk}`;
    let newKey = document.createElement('div');
    while (objKeys.includes(newValue)) {
      ++nk;
      newValue = `attr${nk}`;
    }

    // Build options for construction HTML inputs.
    let htmlItems = {
      key: {
        type: 'text',
        value: newValue,
      },
    };

    // Grouped attributes.
    if (group) {
      objKeys = attrs[group] ? Object.keys(attrs[group]) : [];
      nk = objKeys.length + 1;
      newValue = `attr${nk}`;
      while (objKeys.includes(newValue)) {
        ++nk;
        newValue = `attr${nk}`;
      }

      // Update the HTML options used to build the new input.
      htmlItems.key.value = newValue;
      htmlItems.group = {
        type: 'hidden',
        value: group,
      };
      htmlItems.dtype = {
        type: 'hidden',
        value: dtype,
      };
    }
    // Ungrouped attributes.
    else {
      // Choose a default dtype based on the last attribute, fall back to "String".
      if (!dtype) {
        let lastAttr = document.querySelector(
          '.attributes > .attributes-group .attribute:last-child .attribute-dtype'
        )?.value;
        dtype = lastAttr ? lastAttr : 'String';
        htmlItems.dtype = {
          type: 'hidden',
          value: dtype,
        };
      }
    }

    // Build the form elements used to create the new grouped attribute.
    newKey.innerHTML = EntitySheetHelper.getAttributeHtml(htmlItems, nk, group);

    // Append the form element and submit the form.
    newKey = newKey.children[0];
    form.appendChild(newKey);
    await app._onSubmit(event);
  }

  /**
   * Delete an attribute.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteAttribute(event, app) {
    const a = event.currentTarget;
    const li = a.closest('.attribute');
    if (li) {
      li.parentElement.removeChild(li);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Create new attribute groups.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async createAttributeGroup(event, app) {
    const a = event.currentTarget;
    const form = app.form;
    let newValue = $(a).siblings('.group-prefix').val();
    // Verify the new group key is valid, and use it to create the group.
    if (newValue.length > 0 && EntitySheetHelper.validateGroup(newValue, app.object)) {
      let newKey = document.createElement('div');
      newKey.innerHTML = `<input type="text" name="data.groups.${newValue}.key" value="${newValue}"/>`;
      // Append the form element and submit the form.
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await app._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Delete an attribute group.
   * @param {MouseEvent} event    The originating left click event
   * @param {Object} app          The form application object.
   * @private
   */
  static async deleteAttributeGroup(event, app) {
    const a = event.currentTarget;
    let groupHeader = a.closest('.group-header');
    let groupContainer = groupHeader.closest('.group');
    let group = $(groupHeader).find('.group-key');
    // Create a dialog to confirm group deletion.
    new Dialog({
      title: game.i18n.localize('SIMPLE.DeleteGroup'),
      content: `${game.i18n.localize('SIMPLE.DeleteGroupContent')} <strong>${group.val()}</strong>`,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-trash"></i>',
          label: game.i18n.localize('Yes'),
          callback: async () => {
            groupContainer.parentElement.removeChild(groupContainer);
            await app._onSubmit(event);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('No'),
        },
      },
    }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Update attributes when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
  static updateAttributes(formData, document) {
    let groupKeys = [];

    // Handle the free-form attributes list
    const formAttrs = foundry.utils.expandObject(formData)?.data?.attributes || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let attrs = [];
      let group = null;
      // Handle attribute keys for grouped attributes.
      if (!v['key']) {
        attrs = Object.keys(v);
        attrs.forEach((attrKey) => {
          group = v[attrKey]['group'];
          groupKeys.push(group);
          let attr = v[attrKey];
          let k = v[attrKey]['key'] ? v[attrKey]['key'].trim() : attrKey.trim();
          if (/[\s.]/.test(k)) return ui.notifications.error('Attribute keys may not contain spaces or periods');
          delete attr['key'];
          // Add the new attribute if it's grouped, but we need to build the nested structure first.
          if (!obj[group]) {
            obj[group] = {};
          }
          obj[group][k] = attr;
        });
      }
      // Handle attribute keys for ungrouped attributes.
      else {
        let k = v['key'].trim();
        if (/[\s.]/.test(k)) return ui.notifications.error('Attribute keys may not contain spaces or periods');
        delete v['key'];
        // Add the new attribute only if it's ungrouped.
        if (!group) {
          obj[k] = v;
        }
      }
      return obj;
    }, {});

    // Remove attributes which are no longer used
    for (let k of Object.keys(document.data.data.attributes)) {
      if (!attributes.hasOwnProperty(k)) attributes[`-=${k}`] = null;
    }

    // Remove grouped attributes which are no longer used.
    for (let group of groupKeys) {
      if (document.data.data.attributes[group]) {
        for (let k of Object.keys(document.data.data.attributes[group])) {
          if (!attributes[group].hasOwnProperty(k)) attributes[group][`-=${k}`] = null;
        }
      }
    }

    // Re-combine formData
    formData = Object.entries(formData)
      .filter((e) => !e[0].startsWith('data.attributes'))
      .reduce(
        (obj, e) => {
          obj[e[0]] = e[1];
          return obj;
        },
        { _id: document.id, 'data.attributes': attributes }
      );

    return formData;
  }

  /* -------------------------------------------- */

  /**
   * Update attribute groups when updating an actor object.
   * @param {object} formData       The form data object to modify keys and values for.
   * @param {Document} document     The Actor or Item document within which attributes are being updated
   * @returns {object}              The updated formData object.
   */
  static updateGroups(formData, document) {
    // Handle the free-form groups list
    const formGroups = expandObject(formData).data.groups || {};
    const groups = Object.values(formGroups).reduce((obj, v) => {
      // If there are duplicate groups, collapse them.
      if (Array.isArray(v['key'])) {
        v['key'] = v['key'][0];
      }
      // Trim and clean up.
      let k = v['key'].trim();
      if (/[\s.]/.test(k)) return ui.notifications.error('Group keys may not contain spaces or periods');
      delete v['key'];
      obj[k] = v;
      return obj;
    }, {});

    // Remove groups which are no longer used
    for (let k of Object.keys(document.data.data.groups)) {
      if (!groups.hasOwnProperty(k)) groups[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData)
      .filter((e) => !e[0].startsWith('data.groups'))
      .reduce(
        (obj, e) => {
          obj[e[0]] = e[1];
          return obj;
        },
        { _id: document.id, 'data.groups': groups }
      );
    return formData;
  }

  /* -------------------------------------------- */

  /**
   * @see ClientDocumentMixin.createDialog
   */
  static async createDialog(data = {}, options = {}) {
    // Collect data
    const documentName = this.metadata.name;
    const folders = game.folders.filter((f) => f.data.type === documentName && f.displayed);
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format('ENTITY.Create', { entity: label });

    // Identify the templates and types
    const collection = game.collections.get(this.documentName);
    const setTemplates = collection.filter((a) => a.getFlag('brigandine', 'isTemplate'));
    const templates = {
      default: game.i18n.localize('SIMPLE.NoTemplate'),
    };
    for (let a of setTemplates) {
      templates[a.id] = a.name;
    }
    const setTypes = this.metadata.types;
    const types = {};
    for (let a of setTypes) {
      types[a] = a;
    }

    // set type from folder
    const folder = game.folders.get(`${data.folder}`);
    const folderName = folder?.name;
    const parentFolderName = folder?.parentFolder?.name;
    const regExp = (str) => new RegExp(`${str?.toLowerCase()}s?$`, 'i');
    const typeVals = Object.values(types);
    let type = typeVals.find((t) => regExp(t).test(folderName) || regExp(t).test(parentFolderName));

    // set type and level if creating a spell
    if (parentFolderName && documentName === 'Item') {
      if (Util.stringMatch(parentFolderName, 'magic spells')) type = types[SPELLS.SPELL_TYPES.SPELL_MAGIC];
      if (Util.stringMatch(parentFolderName, 'cleric spells')) type = types[SPELLS.SPELL_TYPES.SPELL_CLERIC];
      if (Util.stringMatch(parentFolderName, 'druid spells')) type = types[SPELLS.SPELL_TYPES.SPELL_DRUID];
    }
    if (folderName && Object.values(SPELLS.SPELL_TYPES).includes(type)) {
      const level = +folderName.split('Level ').pop();
      if (!isNaN(level)) {
        data.data = { attributes: { lvl: { value: level, label: 'Level', dtype: 'Number', group: '' } } };
      }
    }

    // Render the entity creation form
    const html = await renderTemplate(`systems/brigandine/templates/sidebar/entity-create.html`, {
      name: data.name || game.i18n.format('ENTITY.New', { entity: label }),
      folder: data.folder,
      folders: folders,
      hasFolders: folders.length > 1,
      type: data.type || type || this.metadata.types[0],
      types: types,
      hasTypes: true,
      templates: templates,
      hasTemplates: true,
    });

    // Render the confirmation dialog window
    return Dialog.prompt({
      title: title,
      content: html,
      label: title,
      callback: (html) => {
        // Get the form data
        const form = html[0].querySelector('form');
        const fd = new FormDataExtended(form);
        let createData = fd.toObject();

        // Merge with template data
        const template = collection.get(form.template.value);
        if (template) {
          createData = foundry.utils.mergeObject(template.toObject(), createData);
          createData.type = template.data.type;
          delete createData.flags.brigandine.isTemplate;
        }

        // Set default icon by type
        const img = ITEM.getItemIconByType(createData.type);
        if (img) {
          createData.img = img;
        }
        // Set sheet for non-default types
        const sheetClass =
          createData.type === types.character
            ? 'brigandine.CreateActorSheet'
            : createData.type === types.container
            ? 'brigandine.ContainerActorSheet'
            : createData.type === types.party
            ? 'brigandine.PartyActorSheet'
            : createData.type === types.merchant
            ? 'brigandine.MerchantActorSheet'
            : ITEM.NON_PHYSICAL_ITEM_TYPES.includes(createData.type)
            ? 'brigandine.FeatureItemSheet'
            : Object.values(SPELLS.SPELL_TYPES).includes(createData.type)
            ? 'brigandine.SpellItemSheet'
            : null;
        if (sheetClass) {
          createData = foundry.utils.mergeObject(createData, {
            flags: {
              core: {
                sheetClass: sheetClass,
              },
            },
          });
        }

        // Merge provided override data
        createData = foundry.utils.mergeObject(createData, data);
        return this.create(createData, { renderSheet: true });
      },
      rejectClose: false,
      options: options,
    });
  }
}

/**
 * Recursively freezes all properties of an object, making it immutable.
 * This function deeply freezes an object by freezing all of its properties,
 * including nested objects and functions.
 *
 * @param {Object} object - The object to deep freeze.
 * @returns {Object} - The deeply frozen object.
 *
 * @example
 * const myObject = { a: 1, b: { c: 2 } };
 * const frozenObject = deepFreeze(myObject);
 *
 * // Attempting to modify a property on the frozenObject will throw an error:
 * // frozenObject.a = 3; // Throws an error
 * // frozenObject.b.c = 4; // Throws an error
 */
export function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === 'object') || typeof value === 'function') {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}

// remove duplicates from an array
export function removeDuplicates(array) {
  return [...new Set(array)];
}

export const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function getArrFromCSV(list) {
  if (typeof list === 'string' || list instanceof String) {
    return (
      [
        ...new Set(
          list
            ?.split(',')
            .map((t) => t.trim())
            .filter((t) => t)
        ),
      ] || []
    );
  } else {
    const err = 'Input list not a string.';
    ui.notifications.error(err);
    throw err;
  }
}

export function roundToNearest(num, nearest) {
  return Math.round(num / nearest) * nearest;
}

export function roundToDecimal(num, places) {
  return Math.round(num * 10 ** places) / 10 ** places;
}
