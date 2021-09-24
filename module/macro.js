/**
 * Create a Macro from an attribute drop.
 * Get an existing lostlands macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 * 
 * Weapon attack macro commands call weaponAttackMacro() with
 * 'weaponId' and an options arg with:
 * {
 *  offhand: true/false,
 *  dismount: true/false,
 *  throwable: true/false,
 *  attack_type: melee/missile/thrown,
 *  attack_description: slash/thrust/bash/sling/bow/crossbow
 * }
 */
export async function createLostlandsMacro(data, slot) {
  if(data.type === 'Macro') return false;
  const item = data.data;
  const itemName = item?.name || '';
  const itemMacro = item?.data.macro || '';
  let itemMacroWithId = '';
  if(item?._id && itemMacro) itemMacroWithId = itemMacro.replace('itemId', item._id);

  const offhandWeap = itemMacroWithId.replace(/\s+/g, '').includes('offhand:true');
  if(offhandWeap && !data.skipOffhandDialog) return offhandAttackDialog(data, slot);

  // check for dismount macro
  const dismountWeaps = ['halberd','polearm'];
  let dismountWeap = false;
  for (const weap of dismountWeaps) {
    if (itemName.toLowerCase().includes(weap)) dismountWeap = true;
  }
  if(dismountWeap && !data.skipDismountDialog) {
    return new Dialog({
      title: "What form of attack?",
      content: ``,
      buttons: {
        one: {
          icon: '<i class="fas fa-user-friends"></i>',
          label: "Melee attack",
          callback: () => {
            data.skipDismountDialog = true;
            createLostlandsMacro(data, slot)
          }
        },
        two: {
          icon: '<i class="fas fa-horse"></i>',
          label: "Dismount rider",
          callback: () => {
            data.skipDismountDialog = true;
            item.data.macro = "game.lostlands.Macro.dismountWeaponMacro('itemId')";
            item.name += " (dismount)";
            createLostlandsMacro(data, slot)
          }
        }
      },
      default: "one"
    }).render(true);
  }

  const macroName = itemName || (data.label ? data.label : undefined);
  const macroCommand = itemMacroWithId || (data.roll ? `/r ${data.roll}#${data.label}` : undefined);
  const type = data.roll ? "chat" : "script";

  let macro = game.macros.find(m => (m.name === macroName && m.data.command === macroCommand));
  
  if (!macro) {
    if(macroCommand) macro = await Macro.create({
      name: macroName,
      type: type,
      command: macroCommand,
      flags: { "lostlands.attrMacro": true }
    });
    else {
      ui.notifications.error("Could not find a macro for this item.");
      return false;
    }
  }

  game.user.assignHotbarMacro(macro, slot);
  return false;
}

export function missileWeaponMacro(weaponId) {
  return weaponAttack(weaponId, { missile: true });
}

export function meleeWeaponMacro(weaponId) {
  return weaponAttack(weaponId, { melee: true });
}

export function offhandWeaponMacro(weaponId) {
  return weaponAttack(weaponId, { offhand: true, melee: true });
}

export function dismountWeaponMacro(weaponId) {
  return weaponAttack(weaponId, { dismount: true })
}

export function grappleMacro() {
  return weaponAttack(null, { grapple: true })
}

export function thrownWeaponMacro(weaponId) {
  new Dialog({
    title: "What form of attack?",
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-user-friends"></i>',
        label: "Melee",
        callback: () => weaponAttack(weaponId, { melee: true })
      },
      two: {
        icon: '<i class="fas fa-people-arrows"></i>',
        label: "Throw",
        callback: () => weaponAttack(weaponId, { thrown: true })
      }
    },
    default: "one"
  }).render(true);
}

function weaponAttack(weaponId, options={}) {
  if(canvas.tokens.controlled.length !== 1) return ui.notifications.error("Select attacking token.");
  new Dialog({
    title: "Attack",
    content: 
      `<form>
        <div class="form-group">
          <label>Attack modifiers?</label>
          <input type="text" id="atkMod" placeholder="e.g. -4">
        </div>
        ${options.grapple ? '' : `<div class="form-group">
          <label>Damage modifiers?</label>
          <input type="text" id="dmgMod" placeholder="e.g. 2d6">
        </div>
      </form>`}`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Attack",
        callback: async html => {
          const atkMod = html.find('[id=atkMod]')[0]?.value;
          const dmgMod = html.find('[id=dmgMod]')[0]?.value;
          await attack(atkMod, dmgMod);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => console.log("Cancelled attack")
      }
    },
    default: "one"
  }).render(true);
  
  async function attack(dialogAtkMod, dialogDmgMod) {
    // atk and dmg mods
    dialogAtkMod = dialogAtkMod || 0;
    dialogDmgMod = dialogDmgMod || 0;
    const token = canvas.tokens.controlled[0];
    const rollData = token.actor.getRollData();
    const bab = rollData.bab || 0;
    const strmod = rollData.strmod || 0;
    const dexmod = rollData.dexmod || 0;
    const offhandAtkPenalty = options.offhand ? -2 : 0;
    const attrdmgMod = (options.missile || options.offhand) ? 0 : strmod;
    const atkmod = rollData.atkmod || 0;
    const dmgmod = rollData.dmgmod || 0;
    const weaponItem = token.actor.data.items.get(weaponId);
    if(!weaponItem && !options.grapple) return ui.notifications.error("Cannot find item in selected character's inventory.");
    const weapon = weaponItem?.name || '';
    const isRapier = weapon.toLowerCase().includes('rapier');
    const attrAtkMod = (options.missile || options.thrown || isRapier) ? dexmod : strmod;
    const weaponAttrs = weaponItem?.data.data.attributes;
    const weapAtkMod = weaponAttrs?.atkmod?.value || 0;
    const weapDmg = options.dismount ? '1d6' : weaponAttrs?.dmg?.value;

    // target and range
    let targetToken, targetRollData, range, rangePenalty;
    if([...game.user.targets].length === 1) {
      targetToken = [...game.user.targets][0];
      targetRollData = targetToken.actor.getRollData();
      if(options.missile || options.thrown) {
        const canvasDistance = canvas.grid.grid.constructor.name === 'SquareGrid' ?
          canvas.grid.measureDistanceGrid(token.position, targetToken.position) :
          canvas.grid.measureDistance(token.position, targetToken.position);
        range = Math.floor(+canvasDistance / 5) * 5;
        rangePenalty = -Math.abs(Math.floor(range / 10));
      }
    }

    // put together chat message content
    const d20roll = new Roll("d20");
    await d20roll.evaluate();
    const totalAtk = `${d20roll.total}+${bab}+${attrAtkMod}${offhandAtkPenalty ? `+${offhandAtkPenalty}` : ''}${atkmod ? `+${atkmod}` : ''}${weapAtkMod ? `+${weapAtkMod}` : ''}${dialogAtkMod ? `+${dialogAtkMod}` : ''}${rangePenalty ? `+${rangePenalty}` : ''}`;
    const critMin = (weapon.toLowerCase().includes('axe') || weapon.toLowerCase().includes('halberd')) ? 19 : 20;
    const isCrit = d20roll.total >= critMin && !options.grapple && !options.dismount;
    let totalDmg = `${weapDmg ? `${weapDmg}` : ''}${attrdmgMod ? `+${attrdmgMod}` : ''}${dmgmod ? `+${dmgmod}` : ''}${dialogDmgMod ? `+${dialogDmgMod}` : ''}`;
    if(isCrit) totalDmg += `+${weapDmg}`;
    if(options.grapple) totalDmg = '';

    let targetNameText = '';
    if(targetToken?.actor?.name) {
      targetNameText = ` ${targetToken.actor.name}`;
    }

    let rangeText = '';
    if(range) {
      rangeText = ` from ${range}' away`;
    }

    let hitSound, missSound;
    let attackText = `attacks${targetNameText}${weapon ? ` with ${weapon}` : ''}`;
    const weapLowerCase = weapon.toLowerCase();
    const slashWeaps = ['sword','axe','halberd'];
    for(const weap of slashWeaps) {
      if(weapLowerCase.includes(weap)) {
        attackText = `slashes${targetNameText} with ${weapon}`;
        hitSound = 'slash_hit';
        missSound = 'slash_miss';
        break;
      }
    }
    const thrustWeaps = ['dagger','rapier','spear','javelin','pike','lance'];
    for(const weap of thrustWeaps) {
      if(weapLowerCase.includes(weap)) {
        attackText = `thrusts ${weapon}${targetNameText ? ` at${targetNameText}` : ''}`;
        hitSound = 'thrust_hit';
        missSound = 'thrust_miss';
        break;
      }
    }
    const bludgeonWeaps = ['hammer','mace','morningstar','flail','quarterstaff','polearm'];
    for(const weap of bludgeonWeaps) {
      if(weapLowerCase.includes(weap)) {
        attackText = `bashes${targetNameText} with ${weapon}`;
        hitSound = 'bash_hit';
        missSound = 'bash_miss';
        break;
      }
    }
    if(weapLowerCase.includes('sling')) {
      attackText = `slings a stone with ${weapon}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'sling_hit';
      missSound = 'sling_miss';
    }
    if(weapLowerCase.includes('bow')) {
      attackText = `shoots an arrow from ${weapon}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'bow_hit';
      missSound = 'bow_miss';
    }
    if(weapLowerCase.includes('crossbow')) {
      attackText = `shoots a bolt from ${weapon}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'crossbow_hit';
      missSound = 'crossbow_miss';
    } 
    if(options.thrown) {
      attackText = `throws ${weapon}${targetNameText ? ` at${targetNameText}` : ''}`;
      hitSound = 'thrown_hit';
      missSound = 'thrown_miss';
    }
    if(options.grapple) {
      attackText = `grapples${targetNameText}`;
      hitSound = '';
      missSound = '';
    }
    if(options.dismount) {
      attackText = `attempts to dismount${targetNameText} with ${weapon}`;
      hitSound = '';
      missSound = '';
    }

    const dmgText = `${totalDmg ? ` for [[${totalDmg}]] damage.` : ''}`;
    let resultText = dmgText;
    let resultSound;
    if(isCrit) {
      resultText = ` and <span style="${resultStyle('#5DFC0A')}">CRITS</span>${dmgText}`;
      resultSound = hitSound;
    }
    if(!isNaN(targetRollData?.ac)) {
      const totalAtkRoll = new Roll(totalAtk);
      await totalAtkRoll.evaluate();
      const touchac = targetRollData.touchac || targetRollData.ac;
      const isHit = totalAtkRoll.total >= ((options.grapple || options.dismount) ? touchac : targetRollData.ac);
      if(isHit && !isCrit) {
        resultText = ` and <span style="${resultStyle('#7CCD7C')}">HITS</span>${dmgText}`;
        resultSound = hitSound;
      } else if(!isHit) {
        resultText = ` and <span style="${resultStyle('#EE6363')}">MISSES</span>`;
        resultSound = missSound;
      }
    } else resultSound = undefined; // no sound if no opponent AC

    const content = `${attackText}${rangeText} [[${totalAtk}]]${resultText}`;
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker(token),
      content: content,
      type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
      emote: true,
      sound: resultSound ? `systems/lostlands/sounds/${resultSound}.mp3` : undefined
    }); // , {chatBubble: true}

    function resultStyle(bgColour) {
      return `background: ${bgColour}; padding: 1px 4px; border: 1px solid #4b4a44; border-radius: 2px; white-space: nowrap; word-break: break-all;`;
    }
  }
}

function offhandAttackDialog(data, slot) {
  const item = data.data;
  return new Dialog({
    title: "What form of attack?",
    content: ``,
    buttons: {
      one: {
        icon: '<i class="fas fa-hand-point-right"></i>',
        label: "Main-hand",
        callback: () => {
          data.skipOffhandDialog = true;
          createLostlandsMacro(data, slot)
        }
      },
      two: {
        icon: '<i class="fas fa-hand-point-left"></i>',
        label: "Off-hand",
        callback: () => {
          data.skipOffhandDialog = true;
          item.data.macro = "game.lostlands.Macro.offhandWeaponMacro('itemId')";
          item.name += " (off-hand)";
          createLostlandsMacro(data, slot)
        }
      }
    },
    default: "one"
  }).render(true);
}

export function buyBasicEquipment() {
  let token = canvas.tokens.controlled[0];
  let actor = canvas.tokens.controlled[0]?.actor;
  if(!actor || !actor.isOwner){
    ui.notifications.error("Select the token of the character making the purchase.");
    return;
  }

  const basicItems = game.items.filter(i => i.folder?.parentFolder?.name == 'Basic Equipment');
  const armsAndArmor = basicItems.filter(i => i.folder?.name == 'Arms & Armor');
  const misc = basicItems.filter(i => i.folder?.name === 'Miscellaneous');
  
  let armsAndArmorOptionsText = ``;
  for (const item of armsAndArmor) {
    armsAndArmorOptionsText += `<option value="${item.id}">${item.name}</option>`;
  }

  let miscOptionsText = ``;
  for (const item of misc) {
    miscOptionsText += `<option value="${item.id}">${item.name}</option>`;
  }
  const optionsText = `
    <optgroup label="Miscellaneous">${miscOptionsText}</optgroup>
    <optgroup label="Arms & Armor">${armsAndArmorOptionsText}</optgroup>
  `;

  async function resolvePurchase(itemId, itemName, qty, price) {
    qty = +qty;
    let cost = +price;
    if(isNaN(qty) || qty < 0 || qty % 1 || isNaN(cost) || cost < 0 || cost % 1){
      ui.notifications.error("Invalid input.");
      return;
    }

    const actorItems = actor.data.items, gpItem = actorItems.find(i => i.name === "Gold Pieces");
    const gpQty = +gpItem?.data.data.quantity || 0;
    const spItem = actorItems.find(i => i.name === "Silver Pieces");
    const spQty = +spItem?.data.data.quantity || 0;
    const cpItem = actorItems.find(i => i.name === "Copper Pieces");
    const cpQty = +cpItem?.data.data.quantity || 0;
    const totalMoney = Math.round((gpQty + spQty/10 + cpQty/50) * 100) / 100;

    if(cost > totalMoney) {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker(token),
        content: `tries to purchase ${qty} ${itemName}${qty > 1 ? 's' : ''} for ${price} GP, but does not have enough money. The merchant appears annoyed.`,
        type: CONST.CHAT_MESSAGE_TYPES.EMOTE
      });
      return;
    }

    // add item to actor
    const ownedItem = actorItems.find(i => i.name === itemName);
    if(ownedItem) {
      const ownedItemQty = +ownedItem.data.data.quantity;
      const itemUpdate = { _id: ownedItem.data._id, "data.quantity": ownedItemQty + qty };
      await actor.updateEmbeddedDocuments("Item", [itemUpdate]);
    } else {
      const itemData = game.items.get(itemId).clone({"data.quantity": qty});
      await actor.createEmbeddedDocuments("Item", [itemData.data]);
    }

    // pay for item from actor
    if(cpQty >= cost*50) {
      const cpUpdate = { _id: cpItem?.data._id, "data.quantity": cpQty - cost*50 };
      cpUpdate._id && await actor.updateEmbeddedDocuments("Item", [cpUpdate]);
    } else if(Math.round((spQty/10 + cpQty/50) * 100) / 100 >= cost) {
      const cpUpdate = { _id: cpItem?.data._id, "data.quantity": cpQty % 5 };
      cpUpdate._id && await actor.updateEmbeddedDocuments("Item", [cpUpdate]);
      cost = Math.round((cost - Math.floor(cpQty / 5) * 5 / 50) * 100) / 100;
      const spUpdate = { _id: spItem?.data._id, "data.quantity": spQty - cost*10 };
      spUpdate._id && await actor.updateEmbeddedDocuments("Item", [spUpdate]);
    } else {
      let change = Math.round((totalMoney - cost) * 100) / 100;
      let gpChange = Math.floor(change);
      change = Math.round((change - gpChange) * 10 * 100) / 100;
      let spChange = Math.floor(change);
      change = Math.round((change - spChange) * 5 * 100) / 100;
      const gpUpdate = { _id: gpItem?.data._id, "data.quantity": gpChange };
      gpUpdate._id && await actor.updateEmbeddedDocuments("Item", [gpUpdate]);
      const spUpdate = { _id: spItem?.data._id, "data.quantity": spChange };
      spUpdate._id && await actor.updateEmbeddedDocuments("Item", [spUpdate]);
      const cpUpdate = { _id: cpItem?.data._id, "data.quantity": change };
      cpUpdate._id && await actor.updateEmbeddedDocuments("Item", [cpUpdate]);
    }

    const content = `buys ${qty} ${itemName}${qty > 1 ? 's' : ''} for ${price} GP.`;
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker(token),
      content: content,
      type: CONST.CHAT_MESSAGE_TYPES.EMOTE
    });
  }

  new Dialog({
    title: "Buy Basic Equipment",
    content: 
      `<p><form id="purchase-form">
        <div class="flexrow">
          <div class="flexcol flex1">
            <label for="qty">Quantity</label>
            <input id="qty" type="number" value="1"/>
          </div>
          <div class="flexcol flex2" style="padding-right:2px">
            <label for="select">Item</label>
            <select id="select" style="padding:1px">
              ${optionsText}
            </select>
          </div>
          <div class="flexcol flex1">
            <label for="cost">Cost</label>
            <input id="cost" type="number"/>
          </div>
        </div>
      </form></p>`,
    buttons: {
      one: {
        icon: '<i class="fas fa-check"></i>',
        label: "Buy",
        callback: async html => {
          const itemId = html.find("#select").val();
          const itemName = html.find("#select option:selected").text();
          const qty = html.find("#qty").val();
          const unitCost = html.find("#cost").val();
          const cost = qty && unitCost ? qty * unitCost : undefined;
          await resolvePurchase(itemId, itemName, qty, cost);
        }
      },
      two: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    },
    default: "two",
    render: html => {
      const select = html.find("#select");
      const costInput = html.find("#cost");
      syncCostVal();

      select.change(function() {
        syncCostVal();
      })

      function syncCostVal() {
        const itemId = select.val();
        const selectedItem = game.items.get(itemId);
        const itemCost = selectedItem.data.data.attributes.value?.value;
        if(!itemCost) ui.notifications.error("Item does not have the value attribute set.");
        costInput.val(itemCost);
      }
    }
  }).render(true);
}
