import { getTokenFromActor } from './actor-helper.js';

export function chatBubble(token, text, emote = true) {
  if (token == null) {
    token =
      canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : getTokenFromActor(game.user.character);
  }
  if (!token || !text) return;

  return canvas.hud.bubbles.say(token, text, { emote });
}

export async function macroChatMessage(tokenOrActor, { content, type, flavor, sound }, chatBubble = true) {
  if (!content) return;
  const token = getTokenFromActor(tokenOrActor) || tokenOrActor;
  let speaker = ChatMessage.getSpeaker();
  if (speaker.alias !== token.name) {
    speaker = { alias: token.name };
  }

  type = type || CONST.CHAT_MESSAGE_TYPES.EMOTE;
  sound = sound ? `${Constant.ASSETS_PATH}/sounds/${sound}.ogg` : null;
  content = content.trim();

  // if content includes inline rolls, increase line height
  if (/[[.*\d.*]]/.test(content)) {
    content = `<div style="line-height:1.6em;">${content}</div>`;
  }

  return ChatMessage.create({ speaker, content, type, flavor, sound }, { chatBubble });
}

export function chatInlineRoll(content) {
  return `<span style="font-style:normal;">[[${content}]]</span>`;
}

export function uniqueId() {
  function chr4() {
    return Math.random().toString(16).slice(-4);
  }
  return chr4() + chr4() + chr4() + chr4();
}
