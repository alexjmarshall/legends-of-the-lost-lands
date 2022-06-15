import * as Constant from "./constants.js";
import * as Util from "./utils.js";
import * as Dialog from "./dialogs.js";

export async function attack(attackers, target, options) { 
  const targetToken = target.token;
  const targetActor = targetToken?.actor;
  const targetName = targetActor?.name;
  const targetUpdate = target.update;
  const targetItemUpdates = target.itemUpdates;
  const doTargetUpdates = options.applyEffect === true && game.user.isGM;

  if(!attackers.length) {
    if(doTargetUpdates) {
      await targetActor.update(targetUpdate);
      await targetActor.updateEmbeddedDocuments("Item", targetItemUpdates);
    }
    return;
  }
  const targetRollData = targetActor?.getRollData();
  const removedLocs = targetActor?.data.data.removedLocs;

  const attacker = attackers[0];
  const token = attacker.token;
  const chatMsgData = attacker.chatMsgData;
  const attacks = attacker.attacks;
  const attackingActor = token.actor;
  const attackerName = attackingActor.name;
  const attackerUpdate = attacker.update;
  const attackerItemUpdates = attacker.itemUpdates;

  const reduceQty = (item, updates) => {
    const qty = +item.data.data.quantity || 0;
    item._id && qty > 1 && updates.push({'_id': item._id, 'data.quantity': qty - 1});
  };

  const attackerRollData = attackingActor.getRollData();
  if (!attackerRollData) {
    ui.notifications.error("Invalid attacker data");
    attackers.shift();
    return attack(attackers, target, options);
  }
  const weapons = attacker.weapons;
  const weapon = weapons[0];
  const range = measureRange(token, targetToken);
  const attackerSize = Constant.SIZE_VALUES[attackerRollData.size];
  if (attackerSize == null) {
    ui.notifications.error("Attacker size not set");
    attackers.shift();
    return attack(attackers, target, options);
  }
  const targetSize = Constant.SIZE_VALUES[targetRollData?.size];

  // if this attacker's weapons are finished, remove attacker and create attack chat msg
  if (!weapons.length) {
    chatMsgData.flavor = attacker.flavor || chatMsgData.flavor;
    // remove comma at end of flavor and add names
    chatMsgData.flavor = chatMsgData.flavor.replace(/,\s*$/, '') + `${targetActor ? ` vs. ${targetName}` : ''}`;
    // add follow up attack to content
    const followAttackText = ` and ${attackerName} is fast enough to attack again!`
    if (attacker.followAttack && !attacker.kill) chatMsgData.content = chatMsgData.content.replace(/!<br>\s*$|\.<br>\s*$/, '') + followAttackText;
    Util.macroChatMessage(token, chatMsgData, false);
    const chatBubbleString = attacker.bubbleString || chatMsgData.bubbleString;
    Util.chatBubble(token, chatBubbleString);    

    for (const attack of attacks) {
      if (targetRollData) {
        const targetHp = +targetActor?.data.data.hp?.value;
        const targetMaxNegHP = targetActor?.type === "humanoid" || targetActor?.type === "character" ?
          (0 - (targetActor?.data.data.attributes.ability_scores?.con?.value ?? 10)) : 0;
        const dmg = attack.damage;
        let hpUpdate = attack.instantKill ? Math.min(targetMaxNegHP, targetHp - dmg) : targetHp - dmg;
        let update = {"data.hp.value": hpUpdate};

        const energyDrainDmg = attack.energyDrainDamage;
        if (energyDrainDmg) {
          const maxHp = +targetToken?.actor.data.data.hp?.max;
          Object.assign(update, {"data.hp.max": maxHp - energyDrainDmg});
        }
        
        if (hpUpdate < targetHp) Object.assign(targetUpdate, update);
      }
      
      attack.sound && Util.playSound(`${attack.sound}`, token, {push: true, bubble: false});
      // wait if there are more attacks or more attackers left to handle
      if ( attacks.indexOf(attack) < attacks.length - 1 || attackers.length > 1 ) await Util.wait(500);
    }

    if (attacker.kill) Util.playVoiceSound(Constant.VOICE_MOODS.KILL, attackingActor, token, {push: true, bubble: true, chance: 0.7});

    const totalEnergyDrainDmg = +attacker.totalEnergyDrainDmg;
    if (totalEnergyDrainDmg) {
      const storedDamage = targetToken.actor.getFlag("lostlands", "energyDrainDamage") || 0;
      await targetToken.actor.setFlag("lostlands", "energyDrainDamage", storedDamage + totalEnergyDrainDmg);
    }

    // update attacking actor
    await attackingActor.updateEmbeddedDocuments("Item", attackerItemUpdates);

    attackers.shift();
    return attack(attackers, target, options);
  }

  // get weapon and its properties
  const actorItems = attackingActor.data.items;
  let weaponItem;
  if (attacker.unarmed) {
    weaponItem = Constant.WEAPONS.fist;
  } else {
    weaponItem = actorItems.get(weapon._id) || actorItems.find(i => Util.stringMatch(i.name, weapon._id));
  }

  // checks for valid weapon data
  if (!weaponItem) {
    ui.notifications.error("Could not find item on this character");
    weapons.shift();
    return attack(attackers, target, options);
  }
  if (weaponItem.data.data.quantity < 1) {
    ui.notifications.error("Item must have a quantity greater than 0 to use");
    weapons.shift();
    return attack(attackers, target, options);
  }
  const weaponHeld = !!weaponItem.data.data.held_left || !!weaponItem.data.data.held_right;
  if (weaponItem.data.data.attributes.holdable && !weaponHeld) {
    ui.notifications.error("Item must be held to use");
    weapons.shift();
    return attack(attackers, target, options);
  }
  const weapName = weaponItem.name;
  const weapAttrs = weaponItem.data.data.attributes;
  let weapSpeed = +weapAttrs.speed?.value || 10 - attackerSize * 2;
  const weapBleed = +weapAttrs.bleed?.value || 0;
  let weapImp = +weapAttrs.impact?.value || 0;
  let weapPen = +weapAttrs.pen?.value || 0;
  const weapSize = Constant.SIZE_VALUES[weapAttrs.size?.value];
  if (weapSize == null) {
    ui.notifications.error("Invalid weapon size specified");
    weapons.shift();
    return attack(attackers, target, options); 
  }
  const weapCategory = weapAttrs.weap_prof?.value || '';
  const isCurvedSword = Util.stringMatch(weapCategory,"curved swords");
  const weapDmgVsLrg = weapAttrs.dmg_vs_large?.value || 0;
  let weapDmg = weapAttrs.dmg?.value;
  const weaponHeldTwoHands = !!weaponItem.data.data.held_left && !!weaponItem.data.data.held_right;
  let weapAtkMod = +weapAttrs.atk_mod?.value || 0;
  let sitAtkMod = 0;
  let sitDmgMod = 0;

  if (!weapDmg) {
    ui.notifications.error("Invalid weapon damage specified");
    weapons.shift();
    return attack(attackers, target, options);
  }

  // handle double weapon
  const isDoubleWeapon = !!weapAttrs.double_weapon?.value;
  if (isDoubleWeapon) {
    const dmgs = weapDmg.toLowerCase().replace(/\s/g,'').split('/') || [];
    if (dmgs.length !== 2) {
      ui.notifications.error("Invalid double weapon damage specified");
      weapons.shift();
      return attack(attackers, target, options);
    }
    if (weapon.dwSideTwo) {
      weapDmg = dmgs[1];
      options.twoWeaponFighting = false;
    } else {
      weapDmg = dmgs[0];
      if (weaponHeldTwoHands) weapons.push(Object.assign(weapon, {dwSideTwo: true}));
    }
  }

  // atk modes TODO weight base adds to weight calculation, use for containers quivers etc. allows user to choose between different ammo quivers worn
  const isBow = !!weapAttrs.bow?.value;
  const quiver = attackingActor.items.find(i => i.data.data.worn && i.data.data.attributes.quiver?.value);
  const ammoName = Constant.AMMO_TYPES.find(t => quiver?.name.toLowerCase().includes(t));
  const atkModes = isBow ? quiver.data.data.attributes.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || []
    : weapAttrs.atk_modes?.value.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || [];
 
  if (atkModes.length && atkModes.some(a => !Object.keys(Constant.ATK_MODES).includes(a))) {
    ui.notifications.error("Invalid attack mode(s) specified");
    weapons.shift();
    return attack(attackers, target, options);
  }
  const defaultThrowAtkMode = atkModes.find(a => a.includes('thrw'));
  let throwable = attacker.throwable ?? !!(weapAttrs.range?.value && defaultThrowAtkMode);

  // attacker reach
  const reachValues = [...new Set(weapAttrs.reach?.value.split(',').map(n => Number(n)).filter(t => !isNaN(t)))];
  const defaultReach = Math.floor(attackerSize / 2) * Constant.SQUARE_SIZE || -1; // TODO decide on square size - 1 yard?
  let maxReach = reachValues.length ? Math.max(...reachValues) * Constant.SQUARE_SIZE : defaultReach;
  // subtract 1 from max reach if not holding the weapon with both hands
  if (!weaponHeldTwoHands && reachValues.length > 1) {
    maxReach -= 1;
  }

  // weapon tags
  const bonusToGroups = !!weapAttrs.bonus_to_groups?.value;
  const flexWeapon = !!weapAttrs.flex_weapon?.value;
  const fragile = !!weapAttrs.fragile?.value;
  const unwieldy = !!weapAttrs.unwieldy?.value;
  const loadable = weapAttrs.loaded?.value != null;
  const doReload = loadable && weapAttrs.loaded.value === false;
  const energyDrain = !!weapAttrs.energy_drain?.value;
  const atkHeight = weaponItem.data.data.atk_height;
  const atkStyle = weaponItem.data.data.atk_style;
  const atkTime = weaponItem.data.data.atk_init;
  let atkTimeText = '';
  const mainhand = weapon.mainhand && options.twoWeaponFighting !== false;
  const offhand = weapon.offhand && options.twoWeaponFighting !== false;

  // reset weapons in non-immediate time if main hand (offhand must be reset manually)
  if (Util.stringMatch(atkTime,'riposte') || Util.stringMatch(atkTime,'counter')) {
    atkTimeText = ` ${atkTime}s and`;
    if (offhand) {
      weapons.shift();
      return attack(attackers, target, options);
    }
    // reset init of mainhand weapon
    // weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.atk_init': 'immediate'});
  }
  
  // unload/reload loadable item
  if (loadable) {
    if (doReload) {
      weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.attributes.loaded.value': true});
      chatMsgData.content += `${attackerName} reloads ${weapName}.<br>`;
      weapons.shift();
      return attack(attackers, target, options);
    } else {
      weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.attributes.loaded.value': false});
    }
  }
  

  // automatic throw if target beyond max reach in feet
  if ( range > maxReach && throwable && weapon.atkMode == null ) {
    weapon.atkMode = defaultThrowAtkMode;
    attacker.showAltDialog = false;
  }
  
  // can't use offhand weapon when wearing a shield
  const wearingShield = actorItems.some(i => i.type === 'item' && i.data.data.worn && !!i.data.data.attributes.shield_shape?.value);
  if ( offhand === true && wearingShield ) {
    weapons.shift();
    return attack(attackers, target, options);
  }


  
  // get attacker's properties
  let atkMode = weapon.atkMode || weaponItem.data.data.atk_mode || atkModes[0];
  let atkType = Constant.ATK_MODES[atkMode]?.ATK_TYPE || 'melee';
  let dmgType = Constant.DMG_TYPES.includes(weapAttrs.dmg_type?.value) ? weapAttrs.dmg_type?.value
    : (Constant.ATK_MODES[atkMode]?.DMG_TYPE || 'blunt');
  let atkForm = Constant.ATK_MODES[atkMode]?.ATK_FORM || 'attack';

  let isPierce = Util.stringMatch(dmgType, 'piercing');
  let isBlunt = Util.stringMatch(dmgType, 'blunt');
  let isSlash = Util.stringMatch(dmgType, 'slashing');
  
  let aimArea = options.altDialogAim || '';
  let aimPenalty = +options.altDialogAimPenalty || 0;
  let atkPrep = options.altDialogPrep || '';
  let isFeinting = Util.stringMatch(atkPrep,'feint');
  let prepText = isFeinting ? ` feints ${atkHeight} then` : '';
  let aimText = aimArea ? ` aims at ${targetName ? `${targetName}'s` : `the`} ${aimArea} and` : '';

  let hitLocTableName = (Util.stringMatch(atkForm, 'swing') || Util.stringMatch(atkForm, 'attack')) ? 'SWING' : 'THRUST';
  if (atkHeight === 'high' || atkHeight === 'low') {
    hitLocTableName += `_${atkHeight.toUpperCase()}`;
  }
  if (aimArea) {
    hitLocTableName += `_${aimArea.toUpperCase()}`;
  }

  const immuneFumbles = !!attackerRollData.immune_fumbles;
  const bab = attackerRollData.bab || 0;
  const dexMod = attackerRollData.dex_mod || 0;
  const strMod = attackerRollData.str_mod || 0;
  const twoWeaponFightingPenalty = mainhand ? -3 + dexMod : offhand ? -5 + dexMod : 0;
  const atkAttr = Constant.ATK_MODES[atkMode]?.ATK_ATTR;
  const dmgAttr = Constant.ATK_MODES[atkMode]?.DMG_ATTR;
  const attrAtkMod = attackerRollData[`${atkAttr}_mod`] || 0;
  let attrDmgMod = (offhand && attackerRollData[`${dmgAttr}_mod`] > 0 ? Math.floor(attackerRollData[`${dmgAttr}_mod`] / 2) : attackerRollData[`${dmgAttr}_mod`]) || 0;
  const attackerAttrAtkMod = attackerRollData.atk_mod || 0;
  const attackerAttrDmgMod = attackerRollData.dmg_mod || 0;
  const attackerAtkMod = attacker.atkMod || 0;
  const attackerDmgMod = attacker.dmgMod || 0;

  const allowedWeapProfs = Util.stringMatch(attackerRollData.allowed_weap_profs, 'all') ? Constant.WEAPON_CATEGORIES
    : Array.isArray(attackerRollData.allowed_weap_profs) ? attackerRollData.allowed_weap_profs
    : Util.getArrFromCSL(attackerRollData.allowed_weap_profs || '').map(p => p.toLowerCase());

  const weapProfs = (Array.isArray(attackerRollData.weap_profs) ? attackerRollData.weap_profs
    : Util.getArrFromCSL(attackerRollData.weap_profs || '').map(p => p.toLowerCase()))
    .filter(p => allowedWeapProfs.includes(p));

  const isProficient = weapProfs.some(a => Util.stringMatch(a,weapCategory));
  let stanceAtkMod = 0;
  let stanceDmgMod = 0;
  let prepAtkMod = 0;
  let critDmg = 0;
  let totalImpaleDmg = 0;


  // attack options dialog
  if (targetActor) {
    const validAreas = [];
    for (const [k,v] of Object.entries(Constant.AIM_AREAS)) {
      const nonRemovedLocs = v.filter(l => !removedLocs?.includes(l));
      if (nonRemovedLocs.length) validAreas.push(k);
    }
    
    const aimPenalties = Object.fromEntries(validAreas.map(a => { // TODO only show aim penalties for Util.stringMatch(targetActor?.type, 'character') || Util.stringMatch(targetRollData.type, 'humanoid')
      let hitLocTableName = (Util.stringMatch(atkForm, 'swing') || Util.stringMatch(atkForm, 'attack')) ? 'SWING' : 'THRUST';
      if (atkHeight === 'high' || atkHeight === 'low') {
        hitLocTableName += `_${atkHeight.toUpperCase()}`;
      }
      hitLocTableName += `_${a.toUpperCase()}`;
      const penalty = Constant.AIM_AREA_PENALTIES[hitLocTableName];
      return [a, penalty];
    }));
    
    if ( options.showAltDialog && attacker.showAltDialog !== false && !options.shownAltDialog ) {
      const callback = () => attack(attackers, target, options);
      const preparations = ['none'];
      if (isProficient) {
        preparations.push('feint');
      }
      return Dialog.attackOptionsDialog(options, weaponItem, preparations, aimPenalties, callback); // TODO allow to wear and choose atk modes from up to 2 quivers
    }
  }


  const thrown = Util.stringMatch(atkForm,'throw');
  if (thrown) weapImp = Math.floor(weapImp / 2);
  // throwing offhand weapon is not allowed
  if ( offhand === true && thrown ) {
    weapons.shift();
    return attack(attackers, target, options);
  }

  // check if target is beyond reach/range
  const weaponRange = +weapAttrs.range?.value;
  const meleeAtk = Util.stringMatch(atkType, 'melee');
  const missileAtk = Util.stringMatch(atkType, 'missile');
  const isShooting = Util.stringMatch(atkForm,"shoot");

  if (missileAtk && !weaponRange) {
    ui.notifications.error("Invalid range specified");
    weapons.shift();
    return attack(attackers, target, options);
  }
  if (!missileAtk && (maxReach == null || maxReach < 0)) {
    ui.notifications.error("Invalid reach specified");
    weapons.shift();
    return attack(attackers, target, options);
  }
  const maxRange = missileAtk ? weaponRange : maxReach;
  if (range > +maxRange) {
    if (range <= Math.max(...reachValues.map(v => Number(v) * Constant.SQUARE_SIZE))) {
      ui.notifications.warn(`Must hold ${weapName} in two hands to use its max reach`);
    } else {
      ui.notifications.error(`Target is beyond the ${missileAtk ? 'range' : 'reach'} of ${weapName}`);
    }
    weapons.shift();
    return attack(attackers, target, options);
  }
  const minReach = missileAtk ? Constant.SQUARE_SIZE : (Math.min(...reachValues) * Constant.SQUARE_SIZE || -1);
  if ( range < +minReach) {
    if (meleeAtk) {
      weapDmg = '1d3';
      dmgType = 'blunt';
      ui.notifications.warn(`Using ${weapName} closer than its min reach`);
    } else {
      ui.notifications.error(`Target is too close to use ${weapName}`);
      weapons.shift();
      return attack(attackers, target, options);
    }
  }

  // mod dialog
  if ( options.showModDialog && !options.shownModDialog ) {
    const fields = [
      {label: 'To-hit modifiers', key: 'dialogAtkMod'}
    ];
    if (!attacker.skipDmgDialog) fields.push({label: 'Damage modifiers', key: 'dialogDmgMod', placeholder: 'e.g. x2, +3d6'});
    return Dialog.modDialog(options, 'Attack', fields, () => attack(attackers, target, options));
  }
  let dialogAtkMod = {}, dialogDmgMod = {};
  try {
    dialogAtkMod.formula = options.dialogAtkMod && await new Roll(options.dialogAtkMod).evaluate() ? options.dialogAtkMod : 0;
    if (/^[\+|\-|\*|\/]/.test(dialogAtkMod.formula)) dialogAtkMod.includesSign = true;
    dialogDmgMod.formula = options.dialogDmgMod && await new Roll(options.dialogDmgMod).evaluate() ? options.dialogDmgMod : 0;
    if (/^[\+|\-|\*|\/]/.test(dialogDmgMod.formula)) dialogDmgMod.includesSign = true;
  } catch {
    ui.notifications.error("Invalid input to modifier dialog");
    options.shownModDialog = false;
    return attack(attackers, target, options);
  }


  // stance mods
  stanceAtkMod += Constant.STANCE_MODS[atkStyle]?.atk_mod || 0;
  const fluidShield = actorItems.some(i => i.type === 'item' && i.data.data.worn
    && !!i.data.data.attributes.shield_shape?.value
    && Util.stringMatch(i.data.data.shield_style,'fluid'));
  if (fluidShield) stanceAtkMod += Constant.STANCE_MODS.fluid.shield_atk_mod || 0;
  stanceDmgMod += Constant.STANCE_MODS[atkStyle]?.dmg_mod(weaponItem) || 0;
  weapImp += Constant.STANCE_MODS[atkStyle]?.impact_mod(weaponItem) || 0;
  weapSpeed += Constant.STANCE_MODS[atkStyle]?.speed_mod(weaponItem) || 0;
  attrDmgMod += Constant.STANCE_MODS[atkStyle]?.str_dmg_mod(attackingActor) || 0;
  prepAtkMod += isFeinting ? Constant.PREP_MODS.feint.atk_mod(weaponItem) : 0;


  // get target's properties
  // can be immune to critical hits, bleed, knockdown and impale
  const immuneCriticalHits = !!targetRollData?.immune_critical_hits;
  const immuneBleed = !!targetRollData?.immune_bleed;
  const immuneKnockdown = !!targetRollData?.immune_knockdown;
  const immuneImpale = !!targetRollData?.immune_impale;
  let dr = Number(targetRollData?.ac.total[dmgType]?.dr) || 0;
  let targetAc = Number(targetRollData?.ac?.total[dmgType]?.ac);
  let targetTouchAc = Number(targetRollData?.ac?.touch_ac);
  let unarmoredAc = targetTouchAc + (Constant.ARMOR_VS_DMG_TYPE.none[dmgType]?.ac || 0);
  let shieldBonus = Number(targetRollData?.ac?.total[dmgType]?.shield_bonus);
  const targetTiming = targetRollData?.ac?.timing || '';
  const isCountering = Util.stringMatch(targetTiming, 'counter');
  const targetHp = +targetActor?.data.data.hp?.value;
  const targetMaxNegHP = targetActor?.type === "humanoid" || targetActor?.type === "character" ?
    (0 - (targetActor?.data.data.attributes.ability_scores?.con?.value ?? 10)) : 0;
  const targetIncapacitated =targetActor?.data.effects.some(e => Util.stringMatch(e.data.label, 'Incapacitated'));
  const targetProne = targetActor?.data.effects.some(e => Util.stringMatch(e.data.label, 'Prone'));
  const targetDead = targetActor?.data.effects.some(e => Util.stringMatch(e.data.label, 'Dead'));
  const targetHelpless = targetActor?.data.effects.some(e => Util.stringMatch(e.data.label, 'Helpless'));
  const targetHeldItems = targetActor?.items.filter(i => i.data.data.held_right || i.data.data.held_left);
  const targetWeapSpeedItem = !targetHeldItems?.length ? null 
    : targetHeldItems.reduce((a,b) => (+b.data.data.attributes.speed?.value || 0) > (+a.data.data.attributes.speed?.value || 0) ? b : a);
  const targetWeapSpeedItemAtkStyle = targetWeapSpeedItem?.data.data.atk_style || 'stable';
  let targetWeapSpeed = !targetWeapSpeedItem ? 10 - targetSize : (+targetWeapSpeedItem.data.data.attributes.speed?.value || 0); // TODO max speed 10? or 8
  targetWeapSpeed += targetWeapSpeedItem ? Constant.STANCE_MODS[targetWeapSpeedItemAtkStyle]?.speed_mod(targetWeapSpeedItem) || 0 : 0;
  const targetReachValues = [...new Set(targetHeldItems?.map(i => i.data.data.attributes.reach?.value.split(',').map(n => Number(n)).filter(t => !isNaN(t))).flat())];
  const targetDefaultReach = Math.floor(targetSize / 2) * Constant.SQUARE_SIZE || -1;
  const targetMaxReach = targetReachValues.length ? Math.max(...targetReachValues) * Constant.SQUARE_SIZE : targetDefaultReach;
  const targetHasReach = range <= targetMaxReach;

  // situational mods
  // 1.5x attrDmgMod if holding weapon with both hands
  if (weaponHeldTwoHands && !isShooting) attrDmgMod = Math.max(attrDmgMod, Math.floor(attrDmgMod * 1.5));
  // +1 if holding a weapon of same size in both hands
  if (weapSize === attackerSize && weaponHeldTwoHands && !isShooting) sitAtkMod++;
  // -2 if holding a weapon one size larger in one hand
  if (weapSize > attackerSize && !weaponHeldTwoHands) sitAtkMod = sitAtkMod - 2;
  // -3 if target is size S and attacker is bigger than medium
  if (targetSize === 1 && attackerSize > 2) sitAtkMod = sitAtkMod - 3;
  // -2 if target is size T and attacker is medium
  if (targetSize === 0 && attackerSize === 2) sitAtkMod = sitAtkMod - 2;
  // -4 if target is size T and attacker is bigger than medium
  if (targetSize === 0 && attackerSize > 2) sitAtkMod = sitAtkMod - 4;
  // chance of second attack by weapon speed
  const speedDiff = weapSpeed - targetWeapSpeed;
  const followAttackChance = speedDiff * 2;
  if (weapons.length === 1 && speedDiff > 0 && await Util.rollDice('d100') <= followAttackChance) {
    attacker.followAttack = true;
  }
  // -2 if weapon category defined but not in attacker's weapon proficiencies
  // TODO weap specialization and mastery
  if (weapCategory != null && !isProficient) {
    sitAtkMod = sitAtkMod - 2;
  }
  // -2 if thrusting with curved sword
  if (isCurvedSword && Util.stringMatch(atkForm,'thrust')) sitAtkMod -= 2;
  // dmg bonus vs. large
  if (targetSize > 2) {
    sitDmgMod += weapDmgVsLrg;
  }

  // determine range penalty, handle missile situational mods, and reduce qty of thrown weapon/missile
  let rangePenalty = 0;
  if (missileAtk) {
    rangePenalty = attacker.ranTarget ? 0 : -Math.abs(Math.floor(range / 10)) || 0;
    // bonus to groups
    if (attacker.ranTarget && bonusToGroups) {
      sitAtkMod = sitAtkMod + 2;
    }
    // bonus to-hit large monsters with missiles
    if (targetSize > 2) {
      sitAtkMod = sitAtkMod + 2;
    }

    // reduce qty of thrown weapon/missile
    if (thrown) {
      try {
        reduceQty(weaponItem, attackerItemUpdates);
      } catch (error) {
        ui.notifications.error(error);
        weapons.shift();
        return attack(attackers, target, options);
      }
    } else if (isShooting) {
      // must be holding with two hands to use a bow/crossbow
      if (!weaponHeldTwoHands) {
        ui.notifications.error(`Must hold ${weapName} with both hands to use`);
        weapons.shift();
        return attack(attackers, target, options);
      }
      const quiver = attackingActor.items.find(i => i.data.data.worn && i.data.data.attributes.quiver?.value);
      const quiverQty = quiver?.data.data.quantity;
      
      try {
        if (!quiver || !quiverQty) {
          throw new Error("Nothing found to shoot from this weapon");
        }
        attackerItemUpdates.push({ '_id': quiver._id, 'data.quantity': quiverQty - 1 });
      } catch (error) {
        ui.notifications.error(error);
        weapons.shift();
        return attack(attackers, target, options);
      }
    }
  }

  // attack
  const d20Result = await Util.rollDice("d20");
  const atkFactors = [bab, attrAtkMod, twoWeaponFightingPenalty, attackerAttrAtkMod, attackerAtkMod, weapAtkMod, rangePenalty, stanceAtkMod, prepAtkMod, sitAtkMod, aimPenalty];
  const atkFactorsText = formatMods(atkFactors);
  let totalAtk = `${d20Result}${atkFactorsText}`;
  // have to add dialog mod afterwards, in case it multiplies/divides
  let dialogAtk = '';
  if (dialogAtkMod.formula) {
    dialogAtk = `${!dialogAtkMod.includesSign ? `+` : ''}${dialogAtkMod.formula}`;
    totalAtk = /^[\*|\/]/.test(dialogAtk) ? `(${totalAtk})${dialogAtk}` : `${totalAtk}${dialogAtk}`;
  }
  let totalAtkResult = Math.max(1, await Util.rollDice(totalAtk));
  const hitSound = weapon.hitSound || weapAttrs.hit_sound?.value || Constant.ATK_MODES[atkMode]?.HIT_SOUND;
  const missSound = weapon.missSound || weapAttrs.miss_sound?.value || Constant.ATK_MODES[atkMode]?.MISS_SOUND;
  let resultSound = missSound;
  let hitDesc = '';
  let hitVerb = 'hits';
  let missDesc = '';
  let resultText = '';
  let dmgEffect = '';
  let isHit = true;
  let injuryObj = {};
  let acObj = {};
  const minorBleedDesc = Constant.minorBleedDesc;
  const majorBleedDesc = Constant.majorBleedDesc;
  const bloodWellDesc = Constant.bloodWellDesc;
  const weaponStuckDesc = Constant.weaponStuckDesc;
  const knockdownDesc = Constant.knockdownDesc;
  const knockbackDesc = Constant.knockbackDesc;
  const staggerDesc = Constant.staggerDesc;
  const knockWindDesc = Constant.knockWindDesc;
  let coverageArea = '';
  let endHeight = '';

  
  let rolledWeapDmg = await Util.rollDice(weapDmg);
  const maxWeapDmg = await new Roll(weapDmg).evaluate({maximize: true}).total; 
  let weapDmgResult = rolledWeapDmg;

  const adjTokens = (token, disposition) => {
    return canvas.tokens.objects.children.filter(t => 
      (disposition ? t.data.disposition === disposition : true) &&
      t.actor._id !== targetActor?._id &&
      t.actor._id !== attackingActor._id &&
      measureRange(token, t) < Constant.SQUARE_SIZE * 2);
  }

  let atkText = Util.stringMatch(atkForm, 'attack') ? ` ${pluralize(weapName)}`:
    ` ${atkForm}s${isBow && ammoName ? ` a ${ammoName} from` : ''} ${weapName}`;
  
  await (async () => {
    if (!isNaN(targetAc)) {

      // handle counter
      if ( isCountering && targetWeapSpeedItem && (isFeinting || await Util.rollDice('d6') + targetWeapSpeed > await Util.rollDice('d6') + weapSpeed) ) {
        resultText = `...but ${targetName} counters with ${targetWeapSpeedItem.name}!`;
        if (isFeinting) {
          prepText = prepText.replace(/\s+then\s*$/, '');
          aimText = '';
          atkText = '';
        } 
        attacker.followAttack = false;
        while (weapons.length) weapons.shift();
        return;
      }
  
      let hitLoc = '';
      const maxImpaleAreas = ['chest','eye'];
      const doubleBleedAreas = ['neck','groin','armpit'];
      const easyBleedAreas = ['neck','jaw','face','skull','eye','forearm','hand','foot','armpit'];
      const doubleKnockdownAreas = ['skull','face','eye','jaw','knee','shin','foot'];
      const helmetAreas = ['skull','face','eye','jaw'];
      const dropKnockdownAreas = ['hand','forearm'];
      let sortedWornArmors = [];
      const parry = targetRollData.ac.parry || {};
      let parryItem = targetActor.items.get(parry.parry_item_id);
      let parryItemHeight = parryItem?.data.data.atk_height;
      let targetParryBonus = parry.parry_bonus || 0;
      let isRiposteParrying = parryItem && Util.stringMatch(targetTiming, 'riposte');
      let isFluidParrying = false;
  
      // roll for hit location if character or humanoid
      if ( Util.stringMatch(targetActor?.type, 'character') || Util.stringMatch(targetRollData.type, 'humanoid') ) {
  
        const hitLocTable = Constant.HIT_LOC_ARRS[hitLocTableName];
        hitLocTable.filter(l => !removedLocs.includes(l));
        const hitLocRoll = await Util.rollDice(`d${hitLocTable.length}`);
        hitLoc = hitLocTable[hitLocRoll - 1];
        coverageArea = hitLoc.replace('right ', '').replace('left ', '');
        for (const [k,v] of Object.entries(Constant.HEIGHT_AREAS)) {
          if (v.includes(coverageArea)) {
            endHeight = k;
            break;
          }
        }
        endHeight = endHeight || atkHeight;
        if (!Util.stringMatch(endHeight, atkHeight)) {
          weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.atk_height': endHeight});
        }

        // apply feint effect to parrying target
        if (isFeinting && isRiposteParrying) {
          targetAc -= targetParryBonus;
          targetParryBonus = 0;
          isRiposteParrying = false;
        }
  
        // fluid parrying
        isFluidParrying = parryItem && parry.fluid_parry_bonus >= targetParryBonus && Util.stringMatch(parryItemHeight, endHeight);
        if (isFluidParrying) targetParryBonus = parry.fluid_parry_bonus;
        //TODO make status effects like unconscious reset parry/fluid automatically
  
        acObj = targetRollData.ac[coverageArea][dmgType] || acObj;
        dr = acObj.dr ?? dr;
        targetAc = acObj.ac ?? targetAc;
        sortedWornArmors = targetRollData.ac[coverageArea].sorted_armor_ids?.map(id => targetActor.items.get(id)) || [];
  
        // shield mods
        // check for friendly adjacent tokens wearing a Large Round Shield, i.e. shield wall
        const largeShieldLocs = [...new Set(Object.values(Constant.SHIELD_TYPES.round.L).map(v => Util.getArrFromCSL(v)).flat())];
        if(largeShieldLocs.includes(coverageArea)) {
          const adjFriendlyTokens = adjTokens(targetToken, 1);
          const adjLargeShields = adjFriendlyTokens.map(t => t.actor.items.filter(i => i.data.data.worn &&
            Util.stringMatch(i.data.data.attributes.shield_shape?.value, 'large round') &&
            i.data.data.shield_height && Util.getArrFromCSL(Constant.SHIELD_TYPES.round.L[i.data.data.shield_height]).includes(coverageArea)
          )).flat();
          const adjLargeShieldAcs = adjLargeShields.map(s => (+s.data.data.ac?.[dmgType]?.ac) || 0);
          const adjLargeShieldDrs = adjLargeShields.map(s => (+s.data.data.ac?.[dmgType]?.dr) || 0);
          // take best
          const shieldWallAcMod = Math.max(...adjLargeShieldAcs, 0);
          const shieldWallDrMod = Math.max(...adjLargeShieldDrs, 0);
          targetAc += shieldWallAcMod;
          dr += shieldWallDrMod;
        }
  
        // handle effects based on target shield
        shieldBonus = acObj.shield_bonus || 0;
        if (flexWeapon) {
          // disregard all shield and parry mods if weapon is flexible
          sortedWornArmors = sortedWornArmors.filter(i => !i.data.data.attributes.shield_shape?.value);
          targetAc -= shieldBonus;
          targetAc -= targetParryBonus;
        } else if (isShooting) {
          targetAc -= targetParryBonus;
        }
      }
      
  
      const isBrutalHit = Util.stringMatch(atkStyle, 'power');
      resultText += `${isBrutalHit ? ' brutally hard' : ''} at ${!aimArea && targetName ? `${targetName}'s`: `the`}${hitLoc ? ` ${hitLoc}`:``} (${Util.chatInlineRoll(totalAtk)} vs. AC ${targetAc})`;
      // 20 always hits
      if( d20Result === 20 && totalAtkResult < targetAc) {
        totalAtkResult = targetAc;
      }
      isHit = totalAtkResult >= targetAc;


      // reset power thrust to fluid
      if (Util.stringMatch(atkStyle, 'power') && Util.stringMatch(atkForm,'thrust')) {
        weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.atk_style': 'fluid'});
      }
      
  
      if (isHit) {
        resultSound = hitSound;
        const armorUpdates = [];
        let dent = false;
        let lastLayerDr = 0;
        const armorPenVal = isBlunt ? weapImp : weapPen;
        const appliedArmors = sortedWornArmors.filter(a => applyArmor(a));
  
        // critical hits
        const skillfulHitChance = totalAtkResult - targetAc + weapSpeed;
        const critMulti = Constant.HIT_LOCATIONS[coverageArea].crit_chance_multi ?? 0;
        const painCritChance = critMulti * skillfulHitChance; // TODO curved swords have lower min reach
        const critRoll = await Util.rollDice('d100');
        const isSkillfulHit = targetHelpless || critRoll <= skillfulHitChance;
        const isCriticalHit = targetHelpless || !immuneCriticalHits && critRoll <= painCritChance;
        if (isSkillfulHit) {
            let critMaxDmg = maxWeapDmg;
            
            await (async () => { // TODO 
              const armor = appliedArmors[0];
              const armorName = armor?.name;
              const isBulky = !!armor?.data.data.attributes.bulky?.value;
              // if pierce and armor is bulky, bypass armor but uses up skillful crit dmg
              if (isPierce && isBulky) {

                hitDesc += ` and finds a gap in ${armorName}`;
                appliedArmors.shift();
                critMaxDmg = 0;

              // if slash and armor is bulky, chance to penetrate leather straps but uses up skillful crit dmg
              } else if (isSlash && isBulky) {

                const penArmor = await penetrateArmor('leather', dmgType, armorPenVal, lastLayerDr);
                if (!penArmor) return;
                const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates);
                if (!armorAbsorb.absorbed) return;
                
                hitDesc += ` and tears the straps of ${armorName}`;
                critMaxDmg = 0;
              }
            })();

            weapDmgResult = critMaxDmg;
        }
  
        // brutal hit gives "free" chance to smash top level of armor
        if (isBrutalHit && appliedArmors.length) {
          await (async () => {
            const armor = appliedArmors[0];
            const armorName = armor?.name;
            const regex = new RegExp(`${armorName}$`);
            const armorMaterial = armor?.data.data.attributes.material?.value || '';
            const penArmor = await penetrateArmor(armorMaterial, dmgType, armorPenVal, lastLayerDr);
            if (!penArmor) return;
  
            lastLayerDr = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].dr;
            const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates);
            if (!armorAbsorb.absorbed) return;
  
            hitDesc = hitDesc.replace(regex,'') + armorAbsorb.hitDesc;
            dent = armorAbsorb.armorDented;
            stanceDmgMod -= armorAbsorb.absorbDr;
          })();
        }
  
        // penetration / impale
        const impaleChance = Constant.BASE_IMPALE_CHANCE - 5 * weapSize;
        const doImpale = !immuneImpale && await Util.rollDice('d100') <= impaleChance;
        if (doImpale) {
          const maxTargetImpales = appliedArmors.length + Constant.HIT_LOCATIONS[coverageArea].max_impale;
          const maxImpales = Math.min(weapPen, maxTargetImpales);
          let lastLayerDr = 0;
          let stuck = false;
  
          for (let i = 0; i < maxImpales; i++) {
            // armor penetration if armor layers remain
            if (appliedArmors.length) {
              const armor = appliedArmors[0];
              const armorName = armor?.name;
              const regex = new RegExp(`${armorName}$`);
              const armorMaterial = armor?.data.data.attributes.material?.value || '';
              const penArmor = await penetrateArmor(armorMaterial, dmgType, armorPenVal, lastLayerDr);
              if (!penArmor) break;
  
              const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates);
              if (!armorAbsorb.absorbed) continue;
  
              lastLayerDr = armorAbsorb.absorbDr
              hitDesc = hitDesc.replace(regex,'') + armorAbsorb.hitDesc;
              dent = armorAbsorb.armorDented;
  
            // special damage effects if no armor layers remain
            } else {

              let rolledDmg = await Util.rollDice(weapDmg);

              // if first flesh impale, must penetrate 'none' armor
              // after that, damage explodes
              const penFlesh = totalImpaleDmg ? rolledDmg >= Math.ceil(0.85 * maxWeapDmg)
                : await penetrateArmor('none', dmgType, armorPenVal, lastLayerDr);
              if (!penFlesh) {
                break;
              }
              
              if (totalImpaleDmg > 0 && maxImpaleAreas.includes(coverageArea)) {
                rolledDmg = maxWeapDmg;
              }

              if (isPierce || isShooting) {
                hitVerb = 'stabs';
              } else if (isSlash) {
                rolledDmg = Math.max(1, Math.round(rolledDmg / 2));
                hitVerb = 'cuts'
              } else {
                rolledDmg = Math.max(1, Math.round(rolledDmg / 3));
                hitVerb = 'lacerates';
              }

              totalImpaleDmg += rolledDmg;

            }
            // beyond first impale, weapon gets stuck
            if (i > 0) stuck = true;
          }
  
          // apply damage and append results string to hitDesc
          dmgEffect = !stuck ? dmgEffect : Util.replacePunc(dmgEffect) + weaponStuckDesc;
        }
  
        // convert slashing and piercing damage to blunt if blunting armor remains
        // blunting armor is bulky if blunt, metal if slashing, and metal and bulky if piercing
        const bluntingArmor = appliedArmors.find(i =>
          isBlunt ? (i.data.data.attributes.bulky?.value && !dent)
          : isSlash ? (i.data.data.attributes.bulky?.value || i.data.data.attributes.metal?.value)
          : (i.data.data.attributes.bulky?.value && i.data.data.attributes.metal?.value)
        );
        if ( bluntingArmor && !isBlunt) {
          hitDesc += !hitDesc.includes(bluntingArmor.name) ? ` and fails to penetrate ${bluntingArmor.name} but` : '';
          // apply worst of current or blunt dr
          const bluntAcObj = targetRollData.ac[coverageArea]['blunt'] || {};
          dr = Math.max(dr, bluntAcObj.dr ?? 0);
          dmgType = 'blunt';
          isBlunt = true;
          isSlash = false;
          isPierce = false;
        }
  
        // apply hit verb
        hitDesc += /but$/.test(hitDesc) ? ` ${hitVerb}` : ` and ${hitVerb}`;
  
        // apply extra location crit damage
        if (isCriticalHit && !bluntingArmor) {
          const critDmgMulti = Constant.HIT_LOCATIONS[coverageArea].crit_dmg_multi ?? 1;
          for (let i = 0; i < critDmgMulti; i++) {
            critDmg += await Util.rollDice(weapDmg) - dr;
          }
        }


        if (critDmg) hitDesc += ` a vulnerable spot`;
  
        // knockdowns
        const knockDownMulti = doubleKnockdownAreas.includes(coverageArea) ? 2 : 1;
        const knockdownChance = knockDownMulti * 5 * weapImp - 20 * (targetSize - 2);
        const canKnockdown = Util.stringMatch(atkForm, 'swing') || isBlunt;
        const isKnockdown = !immuneKnockdown && !targetProne && canKnockdown && await Util.rollDice('d100') <= knockdownChance;
        if (isKnockdown) {
          const armor = appliedArmors[0];
          const isShield = !!armor?.data.data.attributes.shield_shape?.value;
          // knockdown can disarm weapon, knock off helmet, or disarm shield if held in fluid stance
          (() => {
            if ( !!armor && !isShield && helmetAreas.includes(coverageArea)) {
              const attachedHelm = armor?.data.data.attributes.coverage?.value.includes('neck') && !!armor?.data.data.attributes.material?.value.includes('plate');
              if (!attachedHelm && (2 * Math.random() > 1)) {
                dmgEffect = ` and knocks ${armor.name} off ${targetName}'s head` + dmgEffect;
                return;
              }
            }
            if ( dropKnockdownAreas.includes(coverageArea) && Constant.HIT_LOCATIONS[coverageArea]?.bilateral ) {
              const side = hitLoc.includes('right') ? 'right' : 'left';
              const otherSide = side === 'right' ? 'left' : 'right;'
              const heldItem = targetActor.items.find(i => i.data.data[`held_${side}`] && !i.data.data[`held_${otherSide}`]);
              if (heldItem && (2 * Math.random() > 1)) {
                dmgEffect = ` and knocks ${heldItem.name} from ${targetName}'s grip` + dmgEffect;
              }
              return;
            }
            if ( isShield && Util.stringMatch(armor.data.data.shield_style, 'fluid') ) {
              if (2 * Math.random() > 1) {
                dmgEffect = ` and knocks ${armor.name} from ${targetName}'s grip` + dmgEffect;
                appliedArmors.shift();
              }
              return;
            }
  
            let skipWeaps = false;
            const sizeDiff = attackerSize - targetSize;
            const knockdownDmg = sizeDiff * 4 + weapImp;
            const isStunned = targetActor.data.effects.some(e => Util.stringMatch(e.data.label, 'Stunned'));
            if (knockdownDmg > 8 && (2 * Math.random() > 1)) {
              dmgEffect = knockbackDesc + dmgEffect;
              skipWeaps = true;
            } else if ( isStunned || (knockdownDmg > 2 && (2 * Math.random() > 1)) ) {
              dmgEffect = knockdownDesc + dmgEffect;
              skipWeaps = true;
            } else {
              if (['gut','chest','groin'].includes(coverageArea)) {
                dmgEffect = knockWindDesc + dmgEffect;
              } else {
                dmgEffect = staggerDesc + dmgEffect;
              }
            }
  
            // remove any other weapons
            if (skipWeaps) while (weapons.length) weapons.shift();
          })();
          // add prone condition manually
        }
  
        // bleeding
        const armorMaterial = appliedArmors[0]?.data.data.attributes.material?.value || '';
        const bleedDr = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].dr || 0;
        let bleedChance = weapBleed * 2 - bleedDr * 3;
        const canBleed = isSlash || totalImpaleDmg;
        if (easyBleedAreas.includes(coverageArea)) bleedChance *= 2;
        const doBleed = !immuneBleed && canBleed && await Util.rollDice('d100') <= bleedChance;
        if (doBleed) {
          // determine severity
          let severityDesc = (!isBlunt && totalImpaleDmg > 5 && doubleBleedAreas.includes(coverageArea))
            ? majorBleedDesc : minorBleedDesc;
          if (dmgEffect.includes(Util.replacePunc(weaponStuckDesc))) {
            severityDesc = severityDesc.replace(minorBleedDesc,'').replace(majorBleedDesc,bloodWellDesc);
          }
          dmgEffect = Util.replacePunc(dmgEffect) + severityDesc;
          // add bleed/heavy bleed condition manually
        }
  
        // consider any shot weapon as piercing for the purpose of injury determination
        const injuryDmgType = isShooting ? "piercing" : dmgType;
        injuryObj = Constant.HIT_LOCATIONS[coverageArea]?.injury?.[injuryDmgType] || {};
  
        resultText += hitDesc;
  
        // apply target armor damage updates
        targetItemUpdates.push(...armorUpdates);
  
      // handle misses
      } else {
        const deflectingArmor = sortedWornArmors[0];
        const isShield = !!deflectingArmor?.data.data.attributes.shield_shape?.value;
        if (!isRiposteParrying && !isFluidParrying) {
          // use shield if worn in fluid style
          const isFluid = Util.stringMatch(deflectingArmor?.data.data.shield_style, 'fluid');
          const shieldHeight = deflectingArmor?.data.data.shield_height || '';
          if (isShield && isFluid && Util.stringMatch(shieldHeight, endHeight)) {
            parryItem = deflectingArmor;
            targetParryBonus = +parryItem?.data.data.attributes.base_ac?.value || 0;
            parryItemHeight = shieldHeight;
          }
        }
        const targetDexMod = (targetDead || targetHelpless || targetIncapacitated || isShooting) ? 0
          : Math.max(Math.min(+targetRollData.dex_mod, +targetRollData.ac.max_dex_mod || 0), 0);
        const parryDesc = ` but ${targetName} parries${parryItem ? ` with ${parryItem.name}` : ''}`;
        const parryHeightPenalty = Util.stringMatch(parryItemHeight, endHeight) ? 0
          : Util.stringMatch(parryItemHeight, 'mid') || Util.stringMatch(endHeight, 'mid') ? 2
          : 4;
  
        // determine miss desc
        // riposte
        if ( isRiposteParrying && totalAtkResult < unarmoredAc + targetParryBonus - parryHeightPenalty ) {
          missDesc = parryDesc;
          // check for parry item breakage
          if (parryItem && parryItem.data.data.attributes.fragile?.value && await Util.rollDice('d100') <= Constant.WEAP_BREAK_CHANCE) {
            missDesc += ` and ${parryItem.name} breaks!`;
            reduceQty(parryItem, targetItemUpdates);
          } else {
            // check for disarm if power
            if (Util.stringMatch(parryItem.data.data.atk_style, 'power')) {
              if (await Util.rollDice('d6') + targetParryBonus > await Util.rollDice('d6') + weapImp) {
                missDesc += ` and knocks ${weapName} from ${attackerName}'s grip`;
              }
            }
            missDesc += ' and can riposte!';
            attacker.followAttack = false;
          }
        } else if (totalAtkResult < unarmoredAc - targetDexMod) {
          missDesc = ` but misses entirely`;
        } else if (totalAtkResult < unarmoredAc) {
          const dodgeVerb = Constant.HEIGHT_AREAS.high.includes(coverageArea) ? 'ducks'
            : atkForm === 'thrust' ? 'sidesteps'
            : atkForm === 'swing' ? 'jumps back'
            : 'dodges';
          missDesc = ` but ${targetName} ${dodgeVerb}`;
          // dodging defender has a chance to counter equal to follow attack chance
          if ( targetHasReach && await Util.rollDice('d100') <= followAttackChance * -1 ) {
            missDesc += ` and can counter!`;
            attacker.followAttack = false;
          }
        } else if (totalAtkResult < unarmoredAc + targetParryBonus) {
          missDesc = parryDesc;
          // check for weapon item breakage
          if (parryItem && fragile && await Util.rollDice('d100') <= Constant.WEAP_BREAK_CHANCE) {
            missDesc += ` and ${weapName} breaks!`;
            reduceQty(weaponItem, attackerItemUpdates);
          }
        } else {
          const hide = targetActor.data.data.attributes.hide?.value;
          let deflectingArmorName = deflectingArmor?.name;
          if (Constant.ARMOR_VS_DMG_TYPE[hide] && !deflectingArmorName && coverageArea !== 'eye') {
            const hideDesc = Util.stringMatch(hide,'leather') ? `${hide}y` : Util.stringMatch(hide, 'scale') ? `${hide.replace('e','')}y` : `${hide}`;
            deflectingArmorName = ` the ${hideDesc} hide`;
          }
          const isPlate = deflectingArmor?.data.data.attributes.material?.value.includes('plate');
          missDesc = ` ${deflectingArmorName ? 
           ` but the ${isShooting ? 'missile' : 'blow'}${isShooting && isShield ? ` thunks into ` : isShield ? ` is deflected by` : ` glances off`} ${deflectingArmorName}` : 
           ' but misses'}`;
          // check for weapon item breakage
          if ( (isPlate || isShield) && fragile && await Util.rollDice('d100') <= Constant.WEAP_BREAK_CHANCE) {
            missDesc += ` and ${weapName} breaks!`;
            reduceQty(weaponItem, attackerItemUpdates)
          }
        }
  
        // fumbles
        const baseFumbleChance = targetAc - totalAtkResult + weapImp;
        const fumbleChance = unwieldy ? Math.ceil(1.5 * baseFumbleChance) : baseFumbleChance;
        if (!immuneFumbles && await Util.rollDice('d100') <= fumbleChance) {
          attacker.followAttack = false;
          const heldItems = attackingActor.items.filter(i => i.data.data.held_right || i.data.data.held_left);
          const adjTargets = adjTokens(token);
          const selectRandom = (arr) => {
            const res = Math.floor(Math.random() * arr.length);
            return arr[res];
          };
          const fumbles = [
            `slips and falls`, 
            `stumbles, leaving them open to attack`,
          ];
          unwieldy && fumbles.push(`hits themselves instead!`);
          heldItems.length && fumbles.push(`drops ${selectRandom(heldItems)?.name}`);
          meleeAtk && adjTargets.length && fumbles.push(`strikes ${selectRandom(adjTargets)?.name} instead!`);
  
          const fumble = selectRandom(fumbles);
          const fumbleText = ` and${missDesc.includes('misses entirely') ? '' : ` ${attackerName}`} ${fumble}`;
          missDesc = Util.replacePunc(missDesc) + fumbleText;
          while (weapons.length) weapons.shift();
        }
  
        resultText += missDesc;
      }
    } else {
      resultText += ` ${Util.chatInlineRoll(totalAtk)}`;
    }
  
    // damage
    const drMod = 0 - dr;
    const dmgMods = [drMod, attrDmgMod, stanceDmgMod, attackerAttrDmgMod, attackerDmgMod, sitDmgMod];
    const critDmgMods = [critDmg, totalImpaleDmg];
    const dmgModText = formatMods(dmgMods);
    const critDmgModText = formatMods(critDmgMods);
    let baseDmgText= `${attacker.dmgMulti ? `(${weapDmgResult}${dmgModText})*${attacker.dmgMulti}` : `${weapDmgResult}${dmgModText}`}`;
    let totalDmgText = `${baseDmgText}${critDmgModText}`;
    let dialogDmg = '';
    if (dialogDmgMod.formula) {
      dialogDmg = `${!dialogDmgMod.includesSign ? `+` : ''}${dialogDmgMod.formula}`;
      totalDmgText= /^[\*|\/]/.test(dialogDmg) ? `(${baseDmgText})${dialogDmg}${critDmgModText}` : `${totalDmgText}${dialogDmg}${critDmgModText}`;
    }
    let totalDmgResult = await Util.rollDice(totalDmgText);
    // min 1 damage, update both text and totalDmgResult
    if (totalDmgResult < 1) totalDmgText += `+${1 - totalDmgResult}`;
    totalDmgResult = Math.max(1, totalDmgResult);
    let dmgText = ` for ${Util.chatInlineRoll(totalDmgText)}${dr ? ` (DR ${dr})`:''}${dmgType ? ` ${dmgType}` : ''} damage`;
  
  
    // injury level
    let injuryWeapDmg = weapDmgResult - dr + attrDmgMod + stanceDmgMod;
    if (isBlunt) injuryWeapDmg = Math.min(weapImp, injuryWeapDmg);
    const injuryDmg = totalDmgResult > targetHp ? totalDmgResult - targetHp : 0;
    const injury = (injuryWeapDmg > 8 && injuryDmg > 8 && !!injuryObj['gruesome'] ? injuryObj['gruesome'] :
      injuryWeapDmg > 5 && injuryDmg > 5 ? injuryObj['critical'] :
      injuryWeapDmg > 2 && injuryDmg > 2 ? injuryObj['serious'] :
      injuryObj['light']) || {};
  
    attacks.push({
      instantKill: totalDmgResult > targetHp && injury.fatal,
      sound: resultSound,
      damage: isHit ? totalDmgResult : null,
      energyDrainDamage: isHit && energyDrain ? totalDmgResult : null
    });
  
    const sumDmg = attacks.reduce((sum, a) => sum + a.damage, 0);
    const sumEnergyDrainDmg = attacks.reduce((sum, a) => sum + a.energyDrainDamage, 0);
    attacker.totalEnergyDrainDmg = sumEnergyDrainDmg;
    if (targetHp > 0 && sumDmg >= targetHp) {
      while (weapons.length) weapons.shift();
      attacker.kill = true;
    }
  
    // add damage and injury to result
    if (isHit) {
      resultText += dmgText;
  
      if (totalDmgResult < 2) {
        resultText = resultText.replace('hits', 'grazes');
      }
  // TODO touch attack macro for grapples/hooks etc. or add hook to atk modes?
  // TODO handle bleed dmg like disease
  // TODO fix disease macros, collect list of GM macros
  // TODO add XP macro
  // TODO finalize death & dying mechanic
  // MAJOR TODO armor should have HP proportional to coverage area, and base_AC is proportionally reduced as HP is reduced -- only reduce to half of base_ac, then it falls apart
      if (sumDmg > targetHp) {
        let injuryText = injury.text.replace('them', targetName);

        // replace cleaves with slices for curved swords
        if (isCurvedSword) {
          injuryText = injuryText.replace('cleaves','slices');
        }
  
        if (injury.removal) {
          resultText = resultText.replace(/\s\(\d\sinch(es)?\s(across|deep|long)\)/, '');
          dmgEffect = dmgEffect.replace(weaponStuckDesc,'');
        }
        if (injury.fatal) {
          resultText = resultText.replace(/\s\(\d\sinch(es)?\s(across|deep|long)\)/, '');
        }
        resultText += injuryText || '';
        
        if (targetHp > 0) while (weapons.length) weapons.shift();
    
        // remove knockdown/stagger descriptions
        dmgEffect = dmgEffect.replace(staggerDesc,'').replace(knockWindDesc,'');
        
        if (injury.dmgEffect) {
          // replace existing dmg effect descs if included in injury dmg effect
          if (injury.dmgEffect.includes('bleed') || injury.dmgEffect.includes('blood')) {
            dmgEffect = dmgEffect.replace(minorBleedDesc,'').replace(majorBleedDesc,'');
          }
          if (injury.dmgEffect.includes(weaponStuckDesc)) {
            dmgEffect = dmgEffect.replace(weaponStuckDesc,'');
          }
          dmgEffect = Util.replacePunc(dmgEffect.replace(injury.dmgEffect,'')) + injury.dmgEffect;
        }
      }
  
      if (dmgEffect) {
        resultText = Util.replacePunc(resultText) + dmgEffect;
      }
  
      // remove major bleeding and knockout descs if target is dead
      if (Util.actorIsDead(targetActor)) {
        resultText = resultText.replace(majorBleedDesc,'').replace(Constant.knockoutDesc,'');
      }
  
      // replace bleed description if weapon is stuck
      if (resultText.includes(Util.replacePunc(weaponStuckDesc))) {
        attacker.followAttack = false;
        resultText = resultText.replace(minorBleedDesc,'').replace(majorBleedDesc,bloodWellDesc);
      }
    }
  })();
  
  const rangeText = missileAtk && range ? ` ${range}'` : '';
  const pluralize = name => /h$/.test(name) ? `${Util.lowerCaseFirst(name)}es` : `${Util.lowerCaseFirst(name)}s`;

  chatMsgData.content += `${attackerName}` + prepText + aimText + atkTimeText + atkText + resultText;
  // chatMsgData.content += Util.stringMatch(atkForm, 'attack') ? ` ${pluralize(weapName)}`:
  //   ` ${atkForm}s${isBow && ammoName ? ` a ${ammoName} from` : ''} ${weapName}`;
  // chatMsgData.content += `${resultText}`;
  const lastChar = resultText.charAt(resultText.length - 1);
  chatMsgData.content += (lastChar === '!' || lastChar === '.') ? '<br>' : `.<br>`;
  
  chatMsgData.flavor += Util.stringMatch(atkForm, 'attack') ? `${weapName}, ` : `${weapName}${atkStyle && atkStyle !== 'stable' ? ` ${atkStyle}` : ''} ${atkForm.toLowerCase()}${rangeText}${atkHeight ? ` ${atkHeight}${endHeight && endHeight !== atkHeight ? `-to-${endHeight}` : ''}` : ''},`;
  chatMsgData.bubbleString += Util.stringMatch(atkForm, 'attack') ? `${attackerName} ${pluralize(weapName)}${targetActor ? ` ${targetName}` : ''}<br>` :
    `${attackerName} ${atkForm}s ${weapName}${targetActor ? ` at ${targetName}` : ''}.<br>`;

  weapons.shift();

  return attack(attackers, target, options);
}

function formatMods(modsArr) {
  if (!Array.isArray(modsArr)) return '';
  
  return modsArr.filter(m => m).reduce((prev, curr) => curr < 0 ? prev + `-${Math.abs(curr)}` : prev + `+${curr}`, '');
}

// function getPenInchesDesc(dmg, dmgType, weapQlty) {

//   if (Util.stringMatch(dmgType, 'blunt')) {
//     const inches = Math.round(weapQlty * 2, Math.round(dmg / 2) + 1);
//     return `lacerates (${inches} inches across)`;
//   }

//   if (Util.stringMatch(dmgType, 'piercing') || isShooting) {
//     const inches = Math.min(weapQlty * 2, Math.round(dmg / 2));
//     return `stabs (${inches} inch${inches > 1 ? 'es' : ''} deep)`;
//   }

//   const inches = Math.min(weapQlty * 2, dmg + 1);
//   const deep = i > 0;
//   const inchesDeep = Math.floor(inches / 3);
//   hitVerb = `cuts${deep ? ' deeply' : ''} (${inches} inches long${deep ? `, ${inchesDeep} inch${inchesDeep > 1 ? 'es' : ''} deep` : ''})`;
//   }
// }

function applyArmor(armor) {
  const currentAC = +armor?.data.data.attributes.base_ac?.value;
  const maxAc = +armor?.data.data.attributes.base_ac?.max;

  return Math.random() <= currentAC / maxAc; 
}

async function penetrateArmor(armorMaterial, dmgType, armorPenVal, lastLayerDr) {
  const armorBaseAc = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.base_AC || 0;
  const armorAc = armorBaseAc + (Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].ac || 0);
  // const penChance = Constant.BASE_IMPALE_CHANCE + armorPenVal * 10 - (armorAc + lastLayerDr) * 10;
  // const result = await Util.rollDice('d100');
  const pen = await Util.rollDice('d6') + armorPenVal > await Util.rollDice('d6') + armorAc + lastLayerDr;
  return pen;
}

function armorAbsorption(appliedArmors, armorDented, dmgType, armorUpdates) {
  const armor = appliedArmors[0];
  if (!armor) return {};

  const isPlate = armor?.data.data.attributes.material?.value.includes('plate');
  const isBulky = !!armor?.data.data.attributes.bulky?.value;
  const isMetal = !!armor?.data.data.attributes.metal?.value;
  const isShield = !!armor?.data.data.attributes.shield_shape?.value;
  const absorbed = dmgType !== 'blunt' || isBulky || isShield;

  // plate armor is dented or broken if already dented
  armorDented = !armorDented && isPlate;

  const absorbDr = absorbed ? Number(armor?.data.data.ac?.[dmgType]?.dr) || 0 : 0;

  const skipArmor = !absorbed || absorbed && !armorDented;
  skipArmor && appliedArmors.shift();
  let hitDesc = '';

  if (absorbed) {
    const baseAc = Number(armor.data.data.attributes.base_ac?.value);
    let verb = armorDented ? 'dents' : (isBulky && isMetal) ? 'punctures' : (isBulky || isShield) ? 'cracks' : 'tears';

    // only damage armor if not dented
    if (!armorDented) {
      const itemUpdate = {'_id': armor._id, 'data.attributes.base_ac.value': Math.max(0, baseAc - 1)};
      if (baseAc < 2) { // TODO use condition instead of base AC
        verb = isShield ? 'splinters' : 'tears apart';
        const qty = +armor.data.data.quantity || 0;
        qty && Object.assign(itemUpdate, {'data.quantity': qty - 1});
      }
      armorUpdates.push(itemUpdate);
    }
    hitDesc = ` and ${verb} ${armor.name}`;
  }

  return { absorbed, absorbDr, armorDented, hitDesc };
}


function measureRange(token1, token2) {
  const canvasDistance = token1 && token2 ? (canvas.grid.grid.constructor.name === 'SquareGrid' ?
  canvas.grid.measureDistanceGrid(token1.position, token2.position) :
  canvas.grid.measureDistance(token1.position, token2.position)) : undefined;
  // return range rounded to 5'
  return Math.floor(+canvasDistance / Constant.SQUARE_SIZE) * Constant.SQUARE_SIZE;
}
// TODO do one chat msg for each weapon attack