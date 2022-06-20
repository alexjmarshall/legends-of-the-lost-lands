import * as Constant from "./constants.js";
import * as Util from "./utils.js";
import * as Dialog from "./dialogs.js";

export async function attack(attacker, target, options) { // TODO to break attacking loop, return false;
  const targetToken = target.token;
  const targetActor = targetToken?.actor;
  const targetName = targetActor?.name;
  const targetUpdate = target.update;
  const targetItemUpdates = target.itemUpdates;
  const doTargetUpdates = options.applyEffect === true && game.user.isGM;
  const targetRollData = targetActor?.getRollData();
  const removedLocs = targetActor?.getFlag("lostlands", "removedLocs") || [];

  const token = attacker.token;
  const chatMsgData = attacker.chatMsgData;
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
    return ui.notifications.error("Invalid attacker data");
  }
  const weapons = attacker.weapons;
  const weapon = weapons[0];
  const range = measureRange(token, targetToken);
  const attackerSize = Constant.SIZE_VALUES[attackerRollData.size];
  if (attackerSize == null) {
    return ui.notifications.error("Attacker size not set");
  }

  // if this attacker's weapons are finished, update attacker and target energy drain
  if (!weapons.length) {

    const totalEnergyDrainDmg = +target.totalEnergyDrainDmg || 0;
    if ( doTargetUpdates && totalEnergyDrainDmg && targetActor ) {
      const storedDamage = +targetActor.getFlag("lostlands", "energyDrainDamage") || 0;
      await targetToken.actor.setFlag("lostlands", "energyDrainDamage", storedDamage + totalEnergyDrainDmg);
    }

    return attackingActor.updateEmbeddedDocuments("Item", attackerItemUpdates);
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
    return attack(attacker, target, options);
  }
  if (weaponItem.data.data.quantity < 1) {
    ui.notifications.error("Item must have a quantity greater than 0 to use");
    weapons.shift();
    return attack(attacker, target, options);
  }
  const weaponHeld = !!weaponItem.data.data.held_left || !!weaponItem.data.data.held_right;
  if (weaponItem.data.data.attributes.holdable && !weaponHeld) {
    ui.notifications.error("Item must be held to use");
    weapons.shift();
    return attack(attacker, target, options);
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
    return attack(attacker, target, options); 
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
    return attack(attacker, target, options);
  }

  // handle double weapon
  const isDoubleWeapon = !!weapAttrs.double_weapon?.value;
  if (isDoubleWeapon) {
    const dmgs = weapDmg.toLowerCase().replace(/\s/g,'').split('/') || []; // valid format 1d2/1d3
    if (dmgs.length !== 2) {
      ui.notifications.error("Invalid double weapon damage specified");
      weapons.shift();
      return attack(attacker, target, options);
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
    return attack(attacker, target, options);
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
  if ( Util.stringMatch(atkTime,'riposte') || Util.stringMatch(atkTime,'counter') ) {
    atkTimeText = ` ${atkTime}s and`;
    if (offhand) {
      weapons.shift();
      return attack(attacker, target, options);
    }
    // reset init of mainhand weapon
    // weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.atk_init': 'immediate'});
  }
  
  // unload/reload loadable item
  if (loadable) {
    if (doReload) {
      weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.attributes.loaded.value': true});
      chatMsgData.content += `${attackerName} reloads ${weapName}.`;
      weapons.shift();
      return attack(attacker, target, options);
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
    return attack(attacker, target, options);
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
      const callback = () => attack(attacker, target, options);
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
    return attack(attacker, target, options);
  }

  // check if target is beyond reach/range
  const weaponRange = +weapAttrs.range?.value;
  const meleeAtk = Util.stringMatch(atkType, 'melee');
  const missileAtk = Util.stringMatch(atkType, 'missile');
  const isShooting = Util.stringMatch(atkForm,"shoot");
  const isSwing = Util.stringMatch(atkForm, 'swing');
  const isSpiked = weapCategory.includes('spiked');

  if (missileAtk && !weaponRange) {
    ui.notifications.error("Invalid range specified");
    weapons.shift();
    return attack(attacker, target, options);
  }
  if (!missileAtk && (maxReach == null || maxReach < 0)) {
    ui.notifications.error("Invalid reach specified");
    weapons.shift();
    return attack(attacker, target, options);
  }
  const maxRange = missileAtk ? weaponRange : maxReach;
  if (range > +maxRange) {
    if (range <= Math.max(...reachValues.map(v => Number(v) * Constant.SQUARE_SIZE))) {
      ui.notifications.warn(`Must hold ${weapName} in two hands to use its max reach`);
    } else {
      ui.notifications.error(`Target is beyond the ${missileAtk ? 'range' : 'reach'} of ${weapName}`);
    }
    weapons.shift();
    return attack(attacker, target, options);
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
      return attack(attacker, target, options);
    }
  }

  // mod dialog
  if ( options.showModDialog && !options.shownModDialog ) {
    const fields = [
      {label: 'To-hit modifiers', key: 'dialogAtkMod'}
    ];
    if (!attacker.skipDmgDialog) fields.push({label: 'Damage modifiers', key: 'dialogDmgMod', placeholder: 'e.g. x2, +3d6'});
    return Dialog.modDialog(options, 'Attack', fields, () => attack(attacker, target, options));
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
    return attack(attacker, target, options);
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
  const targetSize = Constant.SIZE_VALUES[targetRollData?.size];
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
        return attack(attacker, target, options);
      }
    } else if (isShooting) {
      // must be holding with two hands to use a bow/crossbow
      if (!weaponHeldTwoHands) {
        ui.notifications.error(`Must hold ${weapName} with both hands to use`);
        weapons.shift();
        return attack(attacker, target, options);
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
        return attack(attacker, target, options);
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
  let totalAtkResult = await Util.rollDice(totalAtk);
  const hitSound = weapon.hitSound || weapAttrs.hit_sound?.value || Constant.ATK_MODES[atkMode]?.HIT_SOUND;
  const missSound = weapon.missSound || weapAttrs.miss_sound?.value || Constant.ATK_MODES[atkMode]?.MISS_SOUND;
  let resultSound = missSound;
  let hitDesc = '';
  let inchesText = '';
  let hitVerb = ' hits';
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
      if ( !offhand && isCountering && targetWeapSpeedItem && (await Util.rollDice('d6') + targetWeapSpeed > await Util.rollDice('d6') + weapSpeed) ) {
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
      // const maxImpaleAreas = ['chest','skull','eye'];
      const doubleBleedAreas = ['neck','groin','armpit'];
      const intBleedAreas = ['knee','hip','gut','chest','shoulder','elbow','skull'];
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
      
      // 20 always hits
      if( d20Result === 20 && totalAtkResult < targetAc) {
        totalAtkResult = targetAc;
      }

      // apply 1/2 weapPen 
      const penAtkBonus = Math.min(Math.floor(weapPen/2), targetAc - unarmoredAc);
      if (penAtkBonus) {
        totalAtk += `+${penAtkBonus}`; 
        totalAtkResult += penAtkBonus;
      }

      isHit = totalAtkResult >= targetAc;
      resultText += `${isBrutalHit ? ' brutally hard' : ''} at ${!aimArea && targetName ? `${targetName}'s`: `the`}${hitLoc ? ` ${hitLoc}`:``} (${Util.chatInlineRoll(totalAtk)} vs. AC ${targetAc})`;


      // reset power thrust to fluid
      if (Util.stringMatch(atkStyle, 'power') && Util.stringMatch(atkForm,'thrust')) {
        weaponItem._id && attackerItemUpdates.push({'_id': weaponItem._id, 'data.atk_style': 'fluid'});
      }
      
  
      if (isHit) {
        resultSound = hitSound;
        const armorUpdates = [];
        let dent = false;
        let lastLayerDr = 0;
        const appliedArmors = sortedWornArmors.filter(a => applyArmor(a));
  
        // critical hits
        const skillfulHitChance = totalAtkResult - targetAc + weapSpeed;
        const critMulti = coverageArea ? (Constant.HIT_LOCATIONS[coverageArea]?.crit_chance_multi || 0) : 1;
        const painCritChance = critMulti * skillfulHitChance; // TODO curved swords have lower min reach
        const critRoll = await Util.rollDice('d100');
        const isSkillfulHit = targetHelpless || critRoll <= skillfulHitChance;
        const isCriticalHit = targetHelpless || !immuneCriticalHits && critRoll <= painCritChance;
        if (isSkillfulHit) {
            await (async () => {
              const armor = appliedArmors[0];
              const armorName = armor?.name;
              const isBulky = !!armor?.data.data.attributes.bulky?.value;
              // if pierce and armor is bulky, bypass armor but uses up skillful crit dmg
              if (isPierce && isBulky) {

                hitDesc += ` and finds a gap in ${armorName}`;
                appliedArmors.shift();

              // if slash and armor is bulky, chance to penetrate leather straps but uses up skillful crit dmg
              } else if (isSlash && isBulky) {

                const penArmor = await penetrateArmor('leather', dmgType, weapPen, lastLayerDr);
                if (!penArmor) return;
                const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates);
                if (!armorAbsorb.absorbed) return;
                
                hitDesc += ` and tears the straps of ${armorName}`;
              }
            })();
        }
  
        // brutal hit gives "free" chance to smash top level of armor
        if (isBrutalHit && appliedArmors.length) {
          await (async () => {
            const armor = appliedArmors[0];
            const armorName = armor?.name;
            const regex = new RegExp(`${armorName}$`);
            const armorMaterial = armor?.data.data.attributes.material?.value || '';
            const penArmor = await penetrateArmor(armorMaterial, dmgType, weapPen, lastLayerDr);
            if (!penArmor) return;
  
            lastLayerDr = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].dr;
            const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates, isSpiked);
            if (!armorAbsorb.absorbed) return;
  
            hitDesc = hitDesc.replace(regex,'') + armorAbsorb.hitDesc;
            dent = armorAbsorb.armorDented;
            stanceDmgMod -= armorAbsorb.absorbDr;
          })();
        }

        // penetration / impale
        const impaleChance = Constant.BASE_IMPALE_CHANCE - 5 * weapSize;
        const doImpale = !immuneImpale && (isSkillfulHit || await Util.rollDice('d100') <= impaleChance);
        if (doImpale) {
          const maxTargetImpales = coverageArea ? (appliedArmors.length + Constant.HIT_LOCATIONS[coverageArea].max_impale) : targetSize + 1;
          const maxImpales = Math.min(weapSize + 2, maxTargetImpales);
          let critDmgMulti = Constant.HIT_LOCATIONS[coverageArea]?.crit_dmg_multi ?? 1;
          let lastLayerDr = 0;
          let stuck = false;

          for (let i = 0; i < maxImpales; i++) {
            // armor penetration if armor layers remain
            if (appliedArmors.length) {
              const armor = appliedArmors[0];
              const armorName = armor?.name;
              const regex = new RegExp(`${armorName}$`);
              const armorMaterial = armor?.data.data.attributes.material?.value || '';
              const penArmor = await penetrateArmor(armorMaterial, dmgType, weapPen, lastLayerDr);
              if (!penArmor) break;
  
              const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates, isSpiked);
              if (!armorAbsorb.absorbed) continue;
  
              lastLayerDr = armorAbsorb.absorbDr
              hitDesc = hitDesc.replace(regex,'') + armorAbsorb.hitDesc;
              dent = armorAbsorb.armorDented;
  
            // special damage effects if no armor layers remain
            } else {

              let rolledDmg = await Util.rollDice(weapDmg);

              // first layer is flesh bone for chest/skull TODO need to use hide layer for monsters
              let penMaterial = 'none';
              if (coverageArea) {
                penMaterial = (Util.stringMatch(coverageArea, 'skull') || Util.stringMatch(coverageArea, 'chest') && !isShooting && !isPierce)
                  ? 'cuir bouilli' : penMaterial;
              } else {
                const hide = targetActor.data.data.attributes.hide?.value;
                penMaterial = Constant.ARMOR_VS_DMG_TYPE[hide] ? hide : penMaterial;console.log('hide',hide);
              }
              
              const penFlesh = !totalImpaleDmg ? await penetrateArmor(penMaterial, dmgType, weapPen, lastLayerDr)
                : await Util.rollDice('d100') <= impaleChance;
              if (!penFlesh) break;

              if (isPierce || isShooting) {
                hitVerb = ' stabs';
              } else if (isSlash) {
                rolledDmg = Math.ceil(rolledDmg / 2);
                hitVerb = ' cuts';
              } else {
                rolledDmg = isSpiked ? Math.ceil(rolledDmg / 2) : Math.ceil(rolledDmg / 3);
                hitVerb = ' tears the flesh';
              }

              if (isCriticalHit) {
                critDmg += (rolledDmg * critDmgMulti);
              } 

              totalImpaleDmg += rolledDmg;

            }
            // beyond second impale, weapon gets stuck
            if (i > 1 && (!isBlunt || isSpiked)) stuck = true;
          }
  
          // apply damage and append results string to hitDesc
          dmgEffect = !stuck ? dmgEffect : Util.replacePunc(dmgEffect) + weaponStuckDesc;
        }
  
        // convert slashing and piercing damage to blunt if blunting armor remains
        // blunting armor is bulky if blunt, metal if slashing, and metal and bulky if piercing
        const bluntingArmor = appliedArmors.find(i =>
          isPierce && (i.data.data.attributes.bulky?.value && i.data.data.attributes.metal?.value)
          || isSlash && (i.data.data.attributes.bulky?.value || i.data.data.attributes.metal?.value)
        );

        if (bluntingArmor) {
          hitDesc += !hitDesc.includes(bluntingArmor.name) ? ` and fails to penetrate ${bluntingArmor.name} but` : '';
          // // apply worst of current or blunt dr
          // const bluntAcObj = targetRollData.ac[coverageArea]['blunt'] || {};
          // dr = Math.max(dr, bluntAcObj.dr ?? 0);
          dmgType = 'blunt';
          isBlunt = true;
          isSlash = false;
          isPierce = false;
        }

        
        // knockdowns
        const knockDownMulti = doubleKnockdownAreas.includes(coverageArea) ? 2 : 1;
        let knockdownChance = knockDownMulti * 5 * weapImp - 20 * (targetSize - 2);
        if (!isSwing && isPierce) knockdownChance = 0;
        const isKnockdown = !immuneKnockdown && !targetProne && await Util.rollDice('d100') <= knockdownChance;
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
            let knockDesc = ''
            if (knockdownDmg > 8 && (2 * Math.random() > 1)) {
              knockDesc += knockbackDesc;
              skipWeaps = true;
            } else if ( isStunned || (knockdownDmg > 2 && (2 * Math.random() > 1)) ) {
              knockDesc += knockdownDesc;
              skipWeaps = true;
            } else {
              if (['gut','chest'].includes(coverageArea)) {
                knockDesc += knockWindDesc;
              } else {
                knockDesc += staggerDesc;
              }
            }

            dmgEffect = knockDesc + dmgEffect;
  
            // remove any other weapons
            if (skipWeaps) while (weapons.length) weapons.shift();
          })();
          // add prone condition manually
        }
  
        // bleeding
        const attrBleedChance = isSlash && isSwing ? weapBleed * 2
          : isSpiked && isSwing ? weapBleed
          : totalImpaleDmg ? weapBleed
          : 0;
        const impaleDmgBleedChance = (isPierce || isShooting) ? totalImpaleDmg : totalImpaleDmg * 2;
        let bleedChance = impaleDmgBleedChance + attrBleedChance;
        if (easyBleedAreas.includes(coverageArea) && isSwing && !isPierce) bleedChance *= 2;
        const doBleed = !immuneBleed && await Util.rollDice('d100') <= bleedChance;
        if (doBleed) {
          // slashing weapons cut through non-blunting armor first
          if (isSlash && !isShooting) {
            const armor = appliedArmors[0];
            const armorName = armor?.name;
            const armorAbsorb = armorAbsorption(appliedArmors, dent, dmgType, armorUpdates, isSpiked);
            if (armorAbsorb.absorbed) hitDesc += ` and cuts through ${armorName}`;
          }
          // determine severity
          let bleedDesc = (isBlunt && intBleedAreas.includes(coverageArea) && !totalImpaleDmg) ? Constant.internalBleedDesc(coverageArea)
            : (!isBlunt && totalImpaleDmg > 5 && doubleBleedAreas.includes(coverageArea)) ? majorBleedDesc
            : minorBleedDesc;
          if (dmgEffect.includes(weaponStuckDesc)) {
            bleedDesc = bleedDesc.replace(minorBleedDesc,'').replace(majorBleedDesc, bloodWellDesc);
          }
          dmgEffect = Util.replacePunc(dmgEffect) + bleedDesc;
          // add bleed/heavy bleed condition manually
        }
  
        

  
        // apply hit verb
        hitDesc += /but$/.test(hitDesc) ? `${hitVerb}` : ` and${hitVerb}`;

        const injuryDmgType = (!isBlunt && isShooting) ? "piercing" : dmgType;
        inchesText = getPenInchesDesc(injuryDmgType, coverageArea, targetSize, totalImpaleDmg);
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
        } else if (totalAtkResult < unarmoredAc && (Util.stringMatch(targetActor?.type, 'character') || Util.stringMatch(targetRollData.type, 'humanoid'))) {
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
          const isWood = Util.stringMatch(deflectingArmor?.data.data.attributes.material?.value, 'wood');
          missDesc = ` ${deflectingArmorName ? 
           ` but the ${isShooting ? 'missile' : 'blow'}${isShooting && isWood ? ` thunks into ` : isShield ? ` is deflected by` : ` glances off`} ${deflectingArmorName}` : 
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
    // consider any shot weapon as piercing for the purpose of inch desc and injury determination
    const injuryDmgType = (!isBlunt && isShooting) ? "piercing" : dmgType;
    injuryObj = Constant.HIT_LOCATIONS[coverageArea]?.injury?.[injuryDmgType] || {};
    let injuryWeapDmg = maxWeapDmg; //weapDmgResult - dr + attrDmgMod + stanceDmgMod;
    if (isBlunt && !isSwing) injuryWeapDmg = Math.min(weapImp, injuryWeapDmg);
    const injuryDmg = totalDmgResult > targetHp ? totalDmgResult - targetHp : 0;
    const isGruesome = injuryWeapDmg > 8 && injuryDmg > 8 && !!injuryObj['gruesome'];
    const injury = (isGruesome ? injuryObj['gruesome'] :
      injuryDmg > 5 ? injuryObj['critical'] :
      injuryDmg > 2 ? injuryObj['serious'] :
      injuryObj['light']) || {};



    target.totalDmg = (target.totalDmg || 0) + (isHit ? totalDmgResult : 0);
    target.energyDrainDamage = (target.energyDrainDamage || 0) + (isHit && energyDrain ? totalDmgResult : 0);
  
    // add damage and injury to result
    if (isHit) {
  
      if (totalDmgResult < 2) {
        resultText = resultText.replace('hits', 'grazes');
      }
  // TODO touch attack macro for grapples/hooks etc. or add hook to atk modes?
  // TODO handle bleed dmg like disease
  // TODO fix disease macros, collect list of GM macros
  // TODO add XP macro
  // TODO finalize death & dying mechanic
  // MAJOR TODO armor should have HP proportional to coverage area, and base_AC is proportionally reduced as HP is reduced -- only reduce to half of base_ac, then it falls apart
      if (target.totalDmg > targetHp) {
        

        if (targetHp > 0) {
          attacker.kill = true;
          attacker.followAttack = false;
          while (weapons.length) weapons.shift();
        } 

        // finalize resultText & inchesText
        if (Util.stringMatch(injuryDmgType, 'blunt')) {
          if (injury.dmgEffect?.includes('poke through the skin') || injury.dmgEffect?.includes('red pulp')) {
            const verbReplace = ' tears the flesh';
            resultText = resultText.replace(hitVerb, verbReplace);
            inchesText = getPenInchesDesc(injuryDmgType, coverageArea, targetSize, totalImpaleDmg, injuryDmg, injury.fatal, isGruesome);
          }
        } else if (Util.stringMatch(injuryDmgType, 'slashing') || Util.stringMatch(injuryDmgType, 'piercing')){
          const verbReplace = isSlash ? ' cuts' : isPierce ? ' stabs' : hitVerb;
          resultText = resultText.replace(hitVerb, verbReplace);
          inchesText = getPenInchesDesc(injuryDmgType, coverageArea, targetSize, totalImpaleDmg, injuryDmg, injury.fatal, isGruesome);
        }


        // finalize dmgText and add injuryText
        let injuryText = injury.text.replace('them', targetName);
        // replace cleaves with slices for curved swords
        if (isCurvedSword) {
          injuryText = injuryText.replace('cleaves','slices');
        }
        dmgText += injuryText || '';

        // finalize dmgEffect and add injury dmgEffect
        if (injury.removal) {
          dmgEffect = dmgEffect.replace(weaponStuckDesc,'');
        }
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
          if (injury.dmgEffect.includes(Constant.knockoutDesc)) {
            dmgEffect = dmgEffect.replace(Constant.knockoutDesc,'');
          }
          dmgEffect = Util.replacePunc(dmgEffect.replace(injury.dmgEffect,'')) + injury.dmgEffect;
        }
        if (Util.actorIsDead(targetActor)) {
          dmgEffect = dmgEffect.replace(majorBleedDesc,'')
            .replace(Constant.knockoutDesc,'')
            .replace(staggerDesc,'')
            .replace(knockWindDesc,'');
        }
      }

      // replace bleed description if weapon is stuck
      if (dmgEffect.includes(Util.replacePunc(weaponStuckDesc))) {
        attacker.followAttack = false;
        dmgEffect = dmgEffect.replace(minorBleedDesc,'').replace(majorBleedDesc,bloodWellDesc);
      }
  
      // add dmgEffect to dmgText
      dmgText = dmgEffect ? Util.replacePunc(dmgText) + dmgEffect : dmgText;

      resultText += inchesText;
      if (critDmg) resultText += `${inchesText ? ` in` : ''} a vulnerable spot`;
      resultText += dmgText;


        // prepare target update
      if (targetRollData) {
        const targetHp = +targetActor?.data.data.hp?.value || 0;
        const dmg = +totalDmgResult || 0;
        const hpUpdate = targetHp - dmg;
        const update = {"data.hp.value": hpUpdate};

        const energyDrainDmg = target.energyDrainDamage;
        if (energyDrainDmg) {
          const maxHp = +targetToken?.actor.data.data.hp?.max;
          Object.assign(update, {"data.hp.max": maxHp - energyDrainDmg});
        }
        
        if (hpUpdate < targetHp) Object.assign(targetUpdate, update);
      }
    }
  })();






  // finalize chat msg content for this attack
  const rangeText = missileAtk && range ? ` ${range}'` : '';
  const pluralize = name => /h$/.test(name) ? `${Util.lowerCaseFirst(name)}es` : `${Util.lowerCaseFirst(name)}s`;

  let content = chatMsgData.content || (`${attackerName}` + prepText + aimText + atkTimeText + atkText + resultText);
  const flavor = attacker.flavor || chatMsgData.flavor || (Util.stringMatch(atkForm, 'attack') ? `${weapName}, ` : `${weapName}${atkStyle && atkStyle !== 'stable' ? ` ${atkStyle}` : ''} ${atkForm.toLowerCase()}${rangeText}${atkHeight ? ` ${atkHeight}${endHeight && endHeight !== atkHeight ? `-to-${endHeight}` : ''}` : ''}`+`${targetActor ? ` vs. ${targetName}` : ''}`);
  const bubbleString = attacker.bubbleString || chatMsgData.bubbleString || (Util.stringMatch(atkForm, 'attack') ? `${attackerName} ${pluralize(weapName)}${targetActor ? ` ${targetName}` : ''}` :
    `${attackerName} ${atkForm}s ${weapName}${targetActor ? ` at ${targetName}` : ''}.`);

  // add follow up attack to content
  const followAttackText = ` and ${attackerName} is fast enough to attack again!`
  if (attacker.followAttack) {
    content += followAttackText;
  }

  content = content.trim();
  if (!/!+$|\.+$/.test(content)) {
    content = content.trim() + '.';
  }

  Util.macroChatMessage(token, {
    content,
    flavor,
  }, false);
  Util.chatBubble(token, bubbleString);    


  
  // sounds
  resultSound && Util.playSound(`${resultSound}`, token, {push: true, bubble: false});
  if (attacker.kill) Util.playVoiceSound(Constant.VOICE_MOODS.KILL, attackingActor, token, {push: true, bubble: true, chance: 0.7});

  // update target with results of this attack
  if(doTargetUpdates) {
    await targetActor.update(targetUpdate);
    await targetActor.updateEmbeddedDocuments("Item", targetItemUpdates);
  }


  weapons.shift();
  // remove rest of attacks if this attack drops target
  if (target.totalDamage >= targetHp) {
    while (weapons.length) weapons.shift();
  }
  
  
  // wait if there are more attacks left to handle
  if (weapons?.length) await Util.wait(500);

  return attack(attacker, target, options);
}

function formatMods(modsArr) {
  if (!Array.isArray(modsArr)) return '';
  
  return modsArr.filter(m => m).reduce((prev, curr) => curr < 0 ? prev + `-${Math.abs(curr)}` : prev + `+${curr}`, '');
}

function getPenInchesDesc(dmgType, coverageArea, targetSize, specDmg, injuryDmg=0, fatal=false, gruesome=false) {
  if (!specDmg && !injuryDmg) return '';

  if (injuryDmg) {
    injuryDmg = Util.stringMatch(dmgType, 'piercing') ? injuryDmg
    : Util.stringMatch(dmgType, 'slashing') ? Math.ceil(injuryDmg / 2)
    : Math.ceil(injuryDmg / 3);
  }

  const targetSizeMulti = targetSize === 0 ? 1/2
    : targetSize === 1 ? 2/3
    : targetSize === 2 ? 1
    : targetSize === 3 ? 3/2
    : 2;

  const isFat = Util.stringMatch(coverageArea, 'gut');
  const isTorso = Constant.AIM_AREAS.torso.includes(coverageArea);
  const isHead = Constant.AIM_AREAS.head.includes(coverageArea);
  // handle all fatal head excluding neck injuries as skull
  if (fatal && isHead && !Util.stringMatch(coverageArea, 'neck')) {
    coverageArea = 'skull';
  }
  // handle all gruesome torso injuries as gut
  if (gruesome && isTorso) {
    coverageArea = 'gut';
  }

  const unwornIndex = Constant.HIT_LOC_WEIGHT_INDEXES.WEIGHT_UNWORN;
  let longLimit = coverageArea ? Constant.HIT_LOCATIONS[coverageArea].weights[unwornIndex] : 12;
  let deepLimit = coverageArea ? (Constant.HIT_LOCATIONS[coverageArea].max_impale * 3) : 6;
  const isBilateral = Constant.HIT_LOCATIONS[coverageArea].bilateral;
  if (isBilateral) longLimit = Math.ceil(longLimit / 2);

  if (gruesome) {
    longLimit = Math.floor(longLimit * 1.5);
    deepLimit = Math.floor(deepLimit * 2);
    injuryDmg = Math.floor(injuryDmg * 1.5);
  }
  if (fatal) {
    injuryDmg = Math.floor(injuryDmg * 1.5);
  }

  let dmg = Math.max(specDmg, injuryDmg);
  dmg = Math.ceil(dmg * targetSizeMulti);
  longLimit = Math.ceil(longLimit * targetSizeMulti);
  deepLimit = Math.ceil(deepLimit * targetSizeMulti);

  if (Util.stringMatch(dmgType, 'slashing')) {
    const inchDmg = dmg * 2;
    if (!injuryDmg) deepLimit = 1;
    let inchesDeep = Math.min(deepLimit, Math.floor(inchDmg / 3));
    if (isFat) inchesDeep++;
    const inches = Math.max(2, inchesDeep + 1, Math.min(longLimit, inchDmg));
    return ` ${inches} inches long${inchesDeep ? ` and ${inchesDeep} inch${inchesDeep > 1 ? 'es' : ''} deep` : ''}`;
  }

  if (Util.stringMatch(dmgType, 'piercing')) {
    const inchDmg = Math.ceil(dmg / 2);
    let inchesDeep = Math.min(deepLimit, inchDmg);
    if (isFat) inchesDeep++;
    return ` ${inchesDeep} inch${inchesDeep > 1 ? 'es' : ''} deep`;
  }

  const inchDmg = dmg;
  const inches = Math.min(longLimit, inchDmg);
  return ` ${inches} inch${inches > 1 ? 'es' : ''} apart`;
}

function applyArmor(armor) {
  const currentAC = +armor?.data.data.attributes.base_ac?.value;
  const maxAc = +armor?.data.data.attributes.base_ac?.max;

  return Math.random() <= currentAC / maxAc; 
}

async function penetrateArmor(armorMaterial, dmgType, weapPen, lastLayerDr) {
  const armorBaseAc = Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.base_AC || 0;
  const armorAc = armorBaseAc + (Constant.ARMOR_VS_DMG_TYPE[armorMaterial]?.[dmgType].ac || 0);
  // const penChance = Constant.BASE_IMPALE_CHANCE + weapPen * 10 - (armorAc + lastLayerDr) * 10;
  // const result = await Util.rollDice('d100');
  const pen = await Util.rollDice('d6') + weapPen > await Util.rollDice('d6') + armorAc + lastLayerDr;
  return pen;
}

function armorAbsorption(appliedArmors, armorDented, dmgType, armorUpdates, isSpiked=false) {
  const armor = appliedArmors[0];
  if (!armor) return {};

  const isSteel = Util.stringMatch(armor?.data.data.attributes.material?.value, 'steel');
  const isBulky = !!armor?.data.data.attributes.bulky?.value;
  const isMetal = !!armor?.data.data.attributes.metal?.value;
  const isWood = Util.stringMatch(armor?.data.data.attributes.material?.value, 'wood');
  const absorbed = dmgType !== 'blunt' || isSpiked || isBulky || isWood;

  // plate armor is dented or broken if already dented
  armorDented = !armorDented && isSteel;

  const absorbDr = absorbed ? Number(armor?.data.data.ac?.[dmgType]?.dr) || 0 : 0;

  const skipArmor = !absorbed || absorbed && !armorDented;
  skipArmor && appliedArmors.shift();
  let hitDesc = '';

  if (absorbed) {
    const baseAc = Number(armor.data.data.attributes.base_ac?.value);
    let verb = armorDented ? 'dents' : (isBulky && isMetal) ? 'punctures' : (isBulky || isWood) ? 'cracks through' : 'tears through';
    hitDesc = ` and ${verb} ${armor.name}`;
    // only damage armor if not dented
    if (!armorDented) {
      const itemUpdate = {'_id': armor._id, 'data.attributes.base_ac.value': Math.max(0, baseAc - 1)};
      if (baseAc < 2) { // TODO use condition instead of base AC
        hitDesc = isWood ? ` and smashes ${armor.name} to splinters` : ` and tears ${armor.name} to pieces`;
        const qty = +armor.data.data.quantity || 0;
        qty && Object.assign(itemUpdate, {'data.quantity': qty - 1});
      }
      armorUpdates.push(itemUpdate);
    }
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