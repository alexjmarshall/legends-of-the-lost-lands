import * as Constant from "./constants.js";
import * as Util from "./utils.js";

export function itemSplitDialog(maxQty, itemData, priceInCps, merchant, options) {
  new Dialog({
    title: `Buy ${itemData.name}`,
    content: 
      `<form>
        <div class="form-group">
          <label style="max-width:fit-content;max-width:-moz-fit-content;margin-right:0.5em">How many?</label>
          <span id="selectedQty" style="flex:1;text-align:center;"></span>
          <input class="flex7" type="range" id="qty" min="1" max="${maxQty}" value="1">
        </div>
        <div class="form-group">
          <label style="max-width:fit-content;max-width:-moz-fit-content;margin-right:0.5em">Total price:</label>
          <span id="price"></span>
        </div>
      </form>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Buy`,
        callback: html => {
          const quantity = +html.find('[id=qty]').val();
          options.shownSplitDialog = true;
          buyMacro(itemData, priceInCps, merchant, quantity, options);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    render: html => {
      const qtyRange = html.find('[id=qty]'),
            qtySpan = html.find('[id=selectedQty]'),
            priceSpan = html.find('[id=price]');
      qtySpan.html(+qtyRange.val());
      priceSpan.html(Util.getPriceString(+qtyRange.val() * priceInCps));
      qtyRange.on("input", () => {
        qtySpan.html(+qtyRange.val());
        priceSpan.html(Util.getPriceString(+qtyRange.val() * priceInCps));
      });
    },
    default: "one",
  }).render(true);
}



export function modDialog(options, title, fields=[{label:'', key:'', placeholder:''}], callback) {
  let formFields = ``;
  fields.forEach(field => {
    formFields += `<div class="form-group">
                    <label>${field.label}</label>
                    <input type="text" id="${field.key}" placeholder="${field.placeholder || 'e.g. +2, -4'}">
                  </div>`;
  });
  const content = `<form>${formFields}</form>`;
  new Dialog({
    title: 'Modify ' + title,
    content,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Submit`,
        callback: html => {
          options.shownModDialog = true;
          fields.forEach(field => {
            options[field.key] = html.find(`[id=${field.key}]`)?.val().trim().toLowerCase().replace('x','*');
          });
          callback();
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => console.log("Cancelled modifier dialog")
      }
    },
    default: "one",
  }).render(true);
}


export function altDialog(options, title, buttons) {
  return new Dialog({
    title,
    content: ``,
    buttons: getButtons(),
  }).render(true);

  function getButtons() {
    return Object.fromEntries(buttons.map(button => [button.label, {
      label: button.label,
      callback: () => {
        options.shownAltDialog= true;
        options.altDialogChoice = button.value;
        return button.callback();
      }
    }]));
  }
}


export function attackOptionsDialog(options, weapon, preparations, aimPenalties, callback) {
  // buttons - 
  // preparations: None, Feint (proficient), Hook Shield (axe or hook, specialist), Bind (specialist),
  // moulinet (fluid and swing, specialist), the masterstrikes (obviate feint/bind vs. certain stances, mastery)

  const atkForm = Constant.ATK_MODES[weapon.data.data.atk_mode]?.ATK_FORM;
  const atkHeight = weapon.data.data.atk_height;
  const stanceDesc = ` ${atkForm && atkHeight ? `${atkForm} from ${atkHeight}` : ''}`;
  const label = `${weapon.name}${stanceDesc}`;

  const getButton = (key, val, currVal) => `
    <button id="${val}" class="stance-button${currVal === val ? ' selected-button' : ''}" data-${key}="${val}">
      ${Util.upperCaseFirst(val)}
    </button>
  `;

  const prepButtons = preparations.map(p => getButton('prep', p, preparations[0])).join('');

  const atkOptions = preparations.length > 1 ? `
    <div class="flexrow prep-buttons">
      <label class="flex1 stance-label">Preparation</label>
      <div class="flexrow flex4">${prepButtons}</div>
    </div>
  ` : '';

  const aimButtons = Object.entries(aimPenalties).map(p => {
    const area = p[0];
    const penalty = p[1];
    return `
      <button id="${area}" class="choice-button" data-area="${area}" data-penalty="${penalty}">
        ${Util.upperCaseFirst(area)} (${penalty})
      </button>
    `;
  }).join('');

  // TODO do this programmatically, and fix sections on armor tab
  const aimOptions = `
    <div class="flexrow aim-buttons">
      <label class="flex1 aim-label">Aim</label>
      <div class="flexrow flex4">${aimButtons}</div>
    </div>
  `;

  const content = `
    <div style="margin-bottom:1em;">
      <label>${label}</label>
      <div style="padding-left:5px;">
        ${atkOptions}
        ${aimOptions}
      </div>
    </div>
  `;

  const d = new Dialog({
    title: 'Attack Options',
    content,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Submit`,
        callback: async html => {
          const $selectedPrepButton = $(html.find(`.prep-buttons .selected-button`));
          const prepVal = $selectedPrepButton.data('prep');
          options.altDialogPrep = prepVal;
          options.shownAltDialog= true;
          callback();
        },
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      },
    },
    render: html => {
      const stanceButtons = html.find(`.stance-button`);
      for (const button of stanceButtons) {
        const $button = $(button);
        $button.click(function() {
          const $button = $(this);
          if (!$button.hasClass("selected-button")) {
            $button.siblings().removeClass("selected-button");
            $button.addClass("selected-button");
          }
        });
      };
      const aimButtons = html.find(`.choice-button`);
      aimButtons.click(function() {
        const $button = $(this);
        const aimArea = $button.data('area');
        const aimPenalty = $button.data('penalty');
        const $selectedPrepButton = $(html.find(`.prep-buttons .selected-button`));
        const prepVal = $selectedPrepButton.data('prep');
        options.altDialogPrep = prepVal;
        options.altDialogAim = aimArea;
        options.altDialogAimPenalty = aimPenalty;
        options.shownAltDialog= true;
        callback();
        return closeDialog();
      });
    },
    default: "one",
  });

  function closeDialog() {
    d.close();
  }

  d.render(true);
}

export function setStanceDialog(options={}) { // TODO refactor into separate wrapper and dialog function in dialogs.js
  let char;
  try {
    char = Util.selectedCharacter();
  } catch (e) {
    return ui.notifications.error(e.message);
  }
  const actor = char.actor;
  const weapons = actor.items.filter(i => i.type === 'item'
    && i.data.data.attributes.atk_modes
    && (i.data.data.held_left || i.data.data.held_right)
  );
  const shields = actor.items.filter(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield_shape?.value);

  if (!weapons.length && !shields.length) {
    return ui.notifications.info("Not holding any applicable items");
  }
  if (weapons.some(w => Constant.SIZE_VALUES[w.data.data.attributes.size?.value] == null)) {
    return ui.notifications.error("Invalid weapon size specified");
  }

  const heights = Constant.ATK_HEIGHTS;
  
  const getButton = (item, type, key, val, currVal) => `
    <button id="${item._id}-${type}-${val}" class="stance-button${currVal === val ? ' selected-button' : ''}" data-${type}-${key}="${val}">
      ${key === 'mode' ? Util.formatAtkMode(val) : Util.upperCaseFirst(val)}
    </button>
  `;
  const getRows = (item, type, rows) => rows.map(r => `
    <div id="${item._id}-${type}-${r.id}" class="flexrow stance-buttons">
      <label class="flex1 stance-label">${r.label}</label>
      <div class="flexrow flex4">${r.buttons}</div>
    </div>
  `).join('');
  
  const getShieldChoices = item => {
    const styles = ['stable','fluid'];
    const currHeight = item.data.data.shield_height || 'mid';
    const currStyle = item.data.data.shield_style || 'stable';
    const heightButtons = { id: 'heights', label: 'Height',  buttons: heights.map(h => getButton(item, 'shield', 'height', h, currHeight)).join('') };
    const styleButtons = { id: 'styles', label: 'Style', buttons: styles.map(s => getButton(item, 'shield', 'style', s, currStyle)).join('') };
    const rows = [styleButtons,heightButtons];

    return `
      <div id="${item._id}" style="margin-bottom:1em;">
        <label>${item.name}</label>
        <div style="padding-left:5px;">
          ${getRows(item, 'shield', rows)}
        </div>
      </div>
    `;
  };

  // style (fluid, stable, power), height (low, mid, high), timing (riposte, immediate, counter)
  const getWeaponChoices = (item, atkModes) => {
    const styles = ['stable','fluid','power'];
    const itemData = item.data.data;
    const currStyle = itemData.atk_style || 'stable';
    const currHeight = itemData.atk_height || 'mid';
    const currMode = itemData.atk_mode || atkModes[0];
    // const currGrip = itemData.atk_grip || 'normal';
    const currInit = itemData.atk_init || 'offense';
    // const grips = ['hammer','reverse'];
    // if (atkModes.includes('swi(s)')) grips.push('thumb');
    const inits = ['immediate','counter','riposte'];

    const styleButtons = {
      id: 'styles',
      label: 'Style',
      buttons: styles.map(s => getButton(item, 'atk', 'style', s, currStyle)).join('')
    };
    const heightButtons = {
      id: 'heights',
      label: 'Height',
      buttons: heights.map(h => getButton(item, 'atk', 'height', h, currHeight)).join('')
    };
    // const gripButtons = { id: 'grips', label: 'Grip',  buttons: grips.map(g => getButton(item, 'atk', 'grip', g, currGrip)).join('') };
    const initButtons = {
      id: 'inits',
      label: 'Timing',
      buttons: inits.map(i => getButton(item, 'atk', 'init', i, currInit)).join('')
    };
    const modeButtons = atkModes.length > 1 ? {
      id: 'modes',
      label: 'Mode', 
      buttons: atkModes.map(m => getButton(item, 'atk', 'mode', m, currMode)).join('')
    } : null;

    const rows = [styleButtons,heightButtons,initButtons,modeButtons].filter(r => r);

    return `
      <div id="${item._id}" style="margin-bottom:1em;">
        <label>${item.name}</label>
        <div style="padding-left:5px;">
          ${getRows(item, 'atk', rows)}
        </div>
      </div>
    `;
  };
  
  let content = ``;
  for (const w of weapons) {
    const weapAttrs = w.data.data.attributes;
    const atkModes = weapAttrs.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || [];
    if (atkModes.length && atkModes.some(a => !Object.keys(Constant.ATK_MODES).includes(a))) {
      return ui.notifications.error(`Invalid attack mode(s) specified for ${w.name}`);
    }

    content += getWeaponChoices(w, atkModes);
  }
  for (const s of shields) {
    content += getShieldChoices(s);
  }

  return new Dialog({
    title: `Set Stance`,
    content,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: `Submit`,
        callback: async html => {
          const addStance = (item, updates, content) => {
            const rows = ["atk_mode","atk_style","atk_height","atk_init","shield_style","shield_height"];
            const update = {'_id': item._id};
            const selections = {};
            const selectedButtons = html.find(`#${item._id} .selected-button`);
            selectedButtons.each(function() {
              const $button = $(this);
              for (const field of rows) {
                const newVal = $button.data(field.replace('_','-'));
                if (!newVal) continue;
                const oldVal = item.data.data[field];
                selections[field] = newVal;
                if (newVal !== oldVal) {
                  const key = `data.${field}`;
                  Object.assign(update, {[key]: newVal});
                }
              }
            });

            const shield = !!selections['shield_height'];
            const atkStyle = ` ${selections['atk_style']}`;
            const style = shield ? ` ${selections['shield_style']}` : atkStyle;
            const height = shield ? ` ${selections['shield_height']}` : ` ${selections['atk_height']}`;
            const atkForm = Constant.ATK_MODES[selections['atk_mode']]?.ATK_FORM;
            const mode = atkForm ? ` ${atkForm}ing` : '';
            // const grip = (selections['atk_grip'] == null || selections['atk_grip'] === 'hammer') ? '' :  ` in a ${selections['atk_grip']} grip`;
            const init = (selections['atk_init'] === 'riposte' || selections['atk_init'] === 'counter') ? ' defensive' : '';
            const doChatMsg = Object.keys(update).length > 1;
            if (doChatMsg) {
              updates.push(update);
              const choiceDesc = `${style}${height}${init}${mode}`;
              const contentDesc = `a${choiceDesc} guard with ${item.name}.`
              content = !content ? `${actor.name} takes ${contentDesc}`
                : content.replace(/.$/,'') + ` and ${contentDesc}`;
            }
            return content;
          }
          const updates = [];
          let content = '';
          shields.forEach(s => content = addStance(s, updates, content));
          weapons.forEach(w => content = addStance(w, updates, content)); // TODO one chat msg for each dual wield/attack routine attack?
          actor.updateEmbeddedDocuments("Item", updates);
          Util.macroChatMessage(char.token, {
            content,
            flavor: `Set Stance`,
          }, true);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    render: html => {
      const stanceButtons = html.find(`.stance-button`);
      for (const button of stanceButtons) {
        const $button = $(button);
        $button.click(function() {
          const $button = $(this);
          if (!$button.hasClass("selected-button")) {
            $button.siblings().removeClass("selected-button");
            $button.addClass("selected-button");
          }
        });
      };
    },
    default: "one",
  }).render(true);
}
