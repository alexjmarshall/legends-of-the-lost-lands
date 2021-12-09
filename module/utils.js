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

export function expandPrice(priceInCps) {
  if (!priceInCps) return;
  const gp = Math.floor(priceInCps / 50);
  priceInCps -= gp * 50;
  const sp = Math.floor(priceInCps / 5);
  const cp = priceInCps - sp * 5;
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
    
    const actorId = actor.isToken ? actor.token.id : actor.id;
    if (speakingActorIds.has(actorId)) return;
    const isSleeping = game.cub.hasCondition("Asleep", actor);
    if (isSleeping) return;
    const voice = actor.data.data.voice;
    const soundsArr = Constant.VOICE_SOUNDS.get(`${voice}`)?.get(`${mood}`);
    if (!soundsArr) return;
    const numTracks = soundsArr.length;
    const trackNum = Math.floor(Math.random() * numTracks);
    if (Math.random() > chance) return;
    token = token || getTokenFromActor(actor);

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
    chatBubble(token, '<i class="fas fa-volume-up"></i>');
  }

  return AudioHelper.play({src: soundPath, volume: 1, loop: false}, push);
}

export function chatBubble(token, text, emote=true) {
  token = token || canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] :
          game.user.character ? getTokenFromActor(game.user.character) : null;
  if ( !token || !text ) return
  return canvas.hud.bubbles.say(token, text, {emote});
}

export async function macroChatMessage(token, actor, {content, type, flavor, sound}, chatBubble=true) {
  if (!content) return;

  const speaker = ChatMessage.getSpeaker(token);
  type = type || CONST.CHAT_MESSAGE_TYPES.EMOTE;
  sound = sound ? `systems/lostlands/sounds/${sound}.mp3` : null;
  content = content.trim();

  // if chat msg is an emote, prefix content with actor's name
  if (type == CONST.CHAT_MESSAGE_TYPES.EMOTE) {
    content = `${actor.name} ${content}`;
  }

  // if content includes inline rolls, increase line height
  if (/[[.*\d.*]]/.test(content)) {
    content = `<div style="line-height:1.6em;">${content}</div>`;
  }

  return ChatMessage.create({speaker, content, type, flavor, sound}, {chatBubble});
}

export function getTokenFromActor(actor) {
  const token = actor.isToken ? actor.token.data :
    canvas.tokens.objects.children.find(t => t.actor.id === actor.id);
  return token;
}

export function selectedCharacter() {
  let actor = null, token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : null;
  if (token) {
    actor = token.actor;
  } else {
    actor = game.user.character;
    token = actor ? getTokenFromActor(actor) : null;
  }
  if (!actor) {
    ui.notifications.error("Select a character");
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
  if (!itemQty) throw new Error(`${item.name} must have quantity greater than zero`);
  return actor.updateEmbeddedDocuments("Item", [{
    '_id': item._id, 
    'data.quantity': itemQty - 1
  }]);
}

export function chatInlineRoll(content) {
  if (!content) return;
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
  return !!charsOwnedByUser().find(a => a.id === actor.id);
}

export function pCTokens() {
  return canvas.tokens.objects.children.filter(t => t.actor.type === 'character' && t.actor.hasPlayerOwner);
}

export function upperCaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const now = () => game.time.worldTime;

export async function removeCondition(condition, actor, {warn=false}={}) {
  const slow = !!game.cub.getCondition(condition, undefined, {warn})?.activeEffect?.changes?.length;
  const hasCondition = game.cub.hasCondition(condition, actor);
  if (hasCondition) {
    await game.cub.removeCondition(condition, actor, {warn});
    slow && await wait(300);
  }
}

export async function addCondition(condition, actor, {warn=false}={}) {
  const slow = !!game.cub.getCondition(condition, undefined, {warn})?.activeEffect?.changes?.length;
  const hasCondition = game.cub.hasCondition(condition, actor);
  if (!hasCondition) {
    // wait until time has synced
    while (SimpleCalendar.api.timestamp() !== game.time.worldTime) {
      await wait(50);
      continue;
    }
    await game.cub.addCondition(condition, actor, {warn});
    // wait if condition includes active effects to ensure actor has updated
    slow && await wait(300);
  }
}

export function nextTime(interval, startTime, currentTime) {
  const seconds = intervalInSeconds(interval);
  let nextTime = Math.ceil((currentTime - startTime) / seconds) * seconds + startTime;
  if (nextTime === currentTime) nextTime += seconds;

  return nextTime;
}

export function prevTime(interval, startTime, currentTime) {
  const seconds = intervalInSeconds(interval);
  const prevTime = Math.floor((currentTime - startTime) / seconds) * seconds + startTime;

  return prevTime;
}

export async function removeEffectsStartingAfter(time) {
  const allChars = game.actors.filter(a => a.type === 'character');
  for (const char of allChars) {
    try {
      const effects = char.effects.contents;
      for (const effect of effects) {
        const invalid = effect.data.duration?.startTime > time;
        invalid && await effect.delete();
      }
    } catch (error) {
      ui.notifications.error(`Problem removing conditions from ${actor.name}. Refresh!`);
      throw new Error(error);
    }
  }
}

export function intervalInSeconds(interval) {
  return SimpleCalendar.api.timestampPlusInterval(0, interval);
}
