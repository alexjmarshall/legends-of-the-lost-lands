import * as Constant from "./constants.js";

export async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function stringMatch(str1, str2) {
  if (typeof str1 !== 'string' || typeof str2 !== 'string') {
    return false;
  }
  return str1.toLowerCase().replace(/\s/g,'').normalize() === str2.toLowerCase().replace(/\s/g,'').normalize();
}

export function sizeComparator(a, b) {
  const aSize = Constant.SIZE_VALUES[a.data.data.attributes.size.value];
  const bSize = Constant.SIZE_VALUES[b.data.data.attributes.size.value];
  if ( aSize < bSize ) return -1;
  if ( aSize > bSize ) return 1;
  if ( aSize === bSize ) return 0;
}

export function expandPrice(priceInCps) {
  if (!priceInCps) return;
  const gp = Math.floor(priceInCps / Constant.CURRENCY_RATIOS.cps_per_gp);
  priceInCps -= gp * Constant.CURRENCY_RATIOS.cps_per_gp;
  const sp = Math.floor(priceInCps / Constant.CURRENCY_RATIOS.cps_per_sp);
  const cp = priceInCps - sp * Constant.CURRENCY_RATIOS.cps_per_sp;
  return {gp, sp, cp};
}

export function getPriceString(priceInCps) {
  if (!priceInCps) return;
  const priceObj = expandPrice(priceInCps);
  return `${priceObj.gp ? `${priceObj.gp} gp, ` : ''}${priceObj.sp ? `${priceObj.sp} sp, ` : ''}${priceObj.cp ? `${priceObj.cp} cp, ` : ''}`.replace(/,\s*$/, '');
}

export const playVoiceSound = (() => {
  const speakingActorIds = new Map();

  return async function(mood, actor, token, {push = true, bubble = true, chance = 1}={}) {
    
    const actorId = actor.isToken ? actor.token._id : actor._id;
    if (speakingActorIds.has(actorId)) return;
    const isSleeping = game.cub.hasCondition("Asleep", actor, {warn: false});
    if (isSleeping) return;
    const voice = actor.data.data.voice;
    const soundsArr = Constant.VOICE_SOUNDS.get(`${voice}`)?.get(`${mood}`);
    if (!soundsArr) return;
    const numTracks = soundsArr.length;
    const trackNum = Math.floor(Math.random() * numTracks);
    if (Math.random() > chance) return;
    token = token ?? getTokenFromActor(actor);

    try {
      speakingActorIds.set(actorId);
      const sound = await playSound(soundsArr[trackNum], token, {push, bubble});
      return await wait(sound.duration * 1000);
    } catch (error) {
      throw new Error(error);
    } finally {
      speakingActorIds.delete(actorId);
    }
  }
})();

export function playSound(sound, token, {push = true, bubble = true}={}) {
  if (!sound) return;
  const soundPath = /^systems\/lostlands\/sounds\//.test(sound) ? sound : `systems/lostlands/sounds/${sound}.mp3`;
  if (token && bubble) {
    chatBubble(token, '<i class="fas fa-volume-up"></i>', false);
  }

  return AudioHelper.play({src: soundPath, volume: 1, loop: false}, push);
}

export function chatBubble(token, text, emote=true) {
  if (token == null) {
    token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] :
            getTokenFromActor(game.user.character);
  }
  if ( !token || !text ) return

  return canvas.hud.bubbles.say(token, text, {emote});
}

export async function macroChatMessage(tokenOrActor, {content, type, flavor, sound}, chatBubble=true) {
  if (!content) return;
  const token = getTokenFromActor(tokenOrActor) || tokenOrActor;
  const speaker = token ? {
    alias: token.name,
  } :
    ChatMessage.getSpeaker();
  type = type || CONST.CHAT_MESSAGE_TYPES.EMOTE;
  sound = sound ? `systems/lostlands/sounds/${sound}.mp3` : null;
  content = content.trim();

  // if content includes inline rolls, increase line height
  if (/[[.*\d.*]]/.test(content)) {
    content = `<div style="line-height:1.6em;">${content}</div>`;
  }

  return ChatMessage.create({speaker, content, type, flavor, sound}, {chatBubble});
}

export function getTokenFromActor(actor) {
  const token = actor?.isToken ? actor.token.data :
    canvas.tokens?.objects?.children.find(t => t.actor._id === actor?._id && t.name == actor?.name);
  return token;
}

export function getArrFromCSL(list) {
  if (typeof list === 'string' || list instanceof String) {
    return [...new Set(list?.split(',').map(t => t.trim()).filter(t => t))] || [];
  } else {
    throw new Error("Input list not a string.");
  }
}

export function selectedCharacter() {
  let actor = null;
  let token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : null;
  if (token) {
    actor = token.actor;
  } else {
    actor = game.user.character;
    token = actor ? getTokenFromActor(actor) : null;
  }
  if (!actor) {
    throw new Error("Select a character");
  } 
  return {token, actor};
}

export async function rollDice(formula) {
  return new Roll(formula).evaluate().total;
}

export function getItemFromActor(itemIdOrName, actor, itemType='Item') {
  const item = actor.data.items.get(itemIdOrName) || 
    actor.data.items.find(i => i.name.toLowerCase().replace(/\s/g,'') === itemIdOrName?.toLowerCase().replace(/\s/g,''));
  if (!item) throw new Error(`${itemType} ${itemIdOrName} not found on ${actor.name}`);
  return item;
}

export async function reduceItemQty(item, actor) {
  const itemQty = +item.data.data.quantity;
  if (!itemQty) {
    throw new Error(`${item.name} must have quantity greater than 0`);
  }
  return actor.updateEmbeddedDocuments("Item", [{
    '_id': item._id, 
    'data.quantity': itemQty - 1
  }]);
}

export function chatInlineRoll(content) {
  return `<span style="font-style:normal;">[[${content}]]</span>`
}

export function uniqueId() {
  function chr4() {
    return Math.random().toString(16).slice(-4);
  }
  return chr4() + chr4() + chr4() + chr4();
}

export async function getMacroByCommand(name, command) {
  if ( !name || !command ) return;
  let macro = game.macros.find(m => (m.data.command === command));
  if (!macro) {
    macro = await Macro.create({
      name,
      command,
      type: 'script',
      flags: { "lostlands.attrMacro": true }
    });
  }

  return macro;
}

export function charsOwnedByUser() {
  if (game.user.isGM) {
    return game.actors.filter(a => !a.hasPlayerOwner && a.isOwner && a.type === 'character');
  } else {
    return game.actors.filter(a => a.isOwner && a.type === 'character');
  }
}

export function isOwned(actor) {
  return charsOwnedByUser().some(a => a._id === actor._id);
}

export function pCTokens() {
  return canvas.tokens.objects.children.filter(t => t.actor.type === 'character' && t.actor.hasPlayerOwner);
}

export function sizeMulti(val, charSize) {
  return charSize > 2 ? val * 3 / 2 :charSize === 1 ? val * 2 / 3 : charSize < 1 ? val / 2 : val;
}

export function upperCaseFirst(string) {
  if (!string) return;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function lowerCaseFirst(string) {
  if (!string) return;
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export const now = () => game.time.worldTime;

export async function removeCondition(condition, actor, {warn=false}={}) {
  const hasCondition = game.cub.hasCondition(condition, actor, {warn});
  if (!hasCondition) return;

  await wait(300);
  await game.cub.removeCondition(condition, actor, {warn});
}

export async function addCondition(condition, actor, {warn=false}={}) {
  const hasCondition = game.cub.hasCondition(condition, actor, {warn});
  if (hasCondition) return;

  await wait(300);
  // wait until time has synced
  while (SimpleCalendar.api.timestamp() !== game.time.worldTime) {
    await wait(50);
    continue;
  }
  await game.cub.addCondition(condition, actor, {warn});
}

export function nextTime(interval, startTime, currentTime) {
  const seconds = intervalInSeconds(interval);
  let nextTime = Math.ceil(Math.max(0, currentTime - startTime) / seconds) * seconds + startTime;
  if (nextTime === currentTime) nextTime += seconds;

  return nextTime;
}

export function prevTime(interval, startTime, currentTime) {
  const seconds = intervalInSeconds(interval);
  let prevTime = Math.floor(Math.max(0, currentTime - startTime) / seconds) * seconds + startTime;

  return prevTime;
}

export function intervalInSeconds(interval) {
  return SimpleCalendar.api.timestampPlusInterval(0, interval);
}
