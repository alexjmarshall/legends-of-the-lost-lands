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
  const gp = Math.floor(priceInCps / 50);
  priceInCps -= gp * 50;
  const sp = Math.floor(priceInCps / 5);
  const cp = priceInCps - sp * 5;
  return {gp, sp, cp};
}

export function getPriceString(priceInCps) {
  const priceObj = expandPrice(priceInCps);
  return `${priceObj.gp ? `${priceObj.gp} gp, ` : ''}${priceObj.sp ? `${priceObj.sp} sp, ` : ''}${priceObj.cp ? `${priceObj.cp} cp, ` : ''}`.replace(/,\s*$/, '');
}

export const playVoiceSound = (() => {
  const speakingActorIds = new Map();

  return async function(mood, actor, token, options={push: true, bubble: true, chance: 1}) {
    const push = options.push ?? true;
    const bubble = options.bubble ?? true;
    const chance = options.chance ?? 1;
    const voice = actor.data.data.voice;
    token = token || getTokenFromActor(actor);
    if (!voice) return;
    const actorId = actor.isToken ? actor.token.id : actor.id;
    if (speakingActorIds.has(actorId)) return;
    speakingActorIds.set(actorId);
    const soundsArr = Constant.VOICE_SOUNDS?.get(`${voice}`)?.get(`${mood}`);
    if (!soundsArr) return;
    const numTracks = soundsArr.length;
    const trackNum = Math.floor(Math.random() * numTracks);
    
    if ( Math.random() < chance ) {
      const sound = await playSound(soundsArr[trackNum], token, {push, bubble});
      await wait(sound.duration * 1000);
    }
    speakingActorIds.delete(actorId);
  }
})();

export function playSound(sound, token, options={push: true, bubble: true}) {
  const push = options.push ?? true;
  const bubble = options.bubble ?? true;
  const soundPath = /^systems\/lostlands\/sounds\//.test(sound) ? sound : `systems/lostlands/sounds/${sound}.mp3`;
  if (!sound) return;
  if (token && bubble) {
    chatBubble(token, '<i class="fas fa-volume-up"></i>');
  }

  return AudioHelper.play({src: soundPath, volume: 1, loop: false}, push);
}

export function chatBubble(token, text, emote=true) {
  if (!text) return;
  return canvas.hud.bubbles.say(token, text, {emote});
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
  if (!actor) throw new Error("Select a character");
  return {token, actor};
}

export async function rollDice(formula) {
  try {
    return new Roll(formula).evaluate().total;
  } catch {
    throw new Error(`Problem rolling dice: ${formula}`);
  }
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

export function macroChatMessage(token, data, chatBubble=true) {
  if (!data.content) return;
  const type = data.type || CONST.CHAT_MESSAGE_TYPES.EMOTE;
  const flavor = data.flavor;
  const sound = data.sound ? `systems/lostlands/sounds/${data.sound}.mp3` : null;
  const speaker = ChatMessage.getSpeaker(token);
  let content = data.content.trim();
  // if content includes inline rolls, increase line height
  if (/[[.*\d.*]]/.test(data.content)) {
    content = `<div style="line-height:1.6em;">${content}</div>`;
  }
  return ChatMessage.create({speaker, content, type, flavor, sound}, {chatBubble: chatBubble});
}

export function chatInlineRoll(content) {
  return `<span style="font-style:normal;">[[${content}]]</span>`
}