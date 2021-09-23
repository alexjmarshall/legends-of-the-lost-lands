/**
 * Create a Macro from an attribute drop.
 * Get an existing lostlands macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createLostlandsMacro(data, slot) {
  if(data.type === 'Macro') return false;
  const item = data.data;
  const itemName = item?.name || '';
  const itemMacro = item?.data.macro;
  let itemMacroWithId;
  if(item?._id && itemMacro) itemMacroWithId = itemMacro.replace('itemId', item._id);

  // check for offhand weapon macro
  const offhandWeaps = ['dagger','shortsword','javelin','handaxe','hammer','mace'];
  let offhandWeap = false;
  for (const weap of offhandWeaps) {
    if (itemName.toLowerCase().includes(weap)) offhandWeap = true;
  }
  if(offhandWeap && !data.skipOffhandDialog) {
    return new Dialog({
      title: "What form of attack?",
      content: 
        ``,
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

  // check for dismount macro
  const dismountWeaps = ['halberd','polearm'];
  let dismountWeap = false;
  for (const weap of dismountWeaps) {
    if (itemName.toLowerCase().includes(weap)) dismountWeap = true;
  }
  if(dismountWeap && !data.skipDismountDialog) {
    return new Dialog({
      title: "What form of attack?",
      content: 
        ``,
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

  let macro = game.macros.find(m => (m.name === itemName && m.data.command === itemMacroWithId));
  
  if (!macro) {
    if(itemMacroWithId) macro = await Macro.create({
      name: data.data.name,
      type: "script",
      command: itemMacroWithId,
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
    content: 
      ``,
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
        ${options.baseAttack ? '' : `<div class="form-group">
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
      resultText = ` and <span style="${resultStyle('#5DFC0A')}">CRITICALS</span>${dmgText}`;
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
