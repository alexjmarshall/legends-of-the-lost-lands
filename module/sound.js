import { ASSETS_PATH } from './constants.js';
import { chatBubble } from './chat.js';

export const VOICE_MOODS = {
  amused: {
    title: 'amused',
    icon: 'https://img.icons8.com/external-wanicon-lineal-wanicon/50/000000/external-laughing-emoji-wanicon-lineal-wanicon.png',
  },
  angry: {
    title: 'amused',
    icon: 'https://img.icons8.com/ios/50/000000/battle.png',
  },
  bored: {
    title: 'bored',
    icon: 'https://img.icons8.com/ios/50/000000/bored.png',
  },
  death: {
    title: 'death',
    icon: 'https://img.icons8.com/ios/50/000000/dying.png',
  },
  dying: {
    title: 'wounded',
    icon: 'https://img.icons8.com/ios/50/000000/wound.png',
  },
  hurt: {
    title: 'hurt',
    icon: 'https://img.icons8.com/ios/50/000000/action.png',
  },
  kill: {
    title: 'kill',
    icon: 'https://img.icons8.com/ios/50/000000/murder.png',
  },
  lead: {
    title: 'lead',
    icon: 'https://img.icons8.com/ios/50/000000/leadership.png',
  },
  ok: {
    title: 'ok',
    icon: 'https://img.icons8.com/ios/50/000000/easy.png',
  },
  party_death: {
    title: 'rip',
    icon: 'https://img.icons8.com/external-prettycons-lineal-prettycons/50/000000/external-rip-holidays-prettycons-lineal-prettycons.png',
  },
  party_fail: {
    title: 'facepalm',
    icon: 'https://img.icons8.com/ios/50/000000/facepalm.png',
  },
  retreat: {
    title: 'retreat',
    icon: 'https://img.icons8.com/ios/50/000000/running-rabbit.png',
  },
  sleepy: {
    title: 'sleepy',
    icon: 'https://img.icons8.com/external-tulpahn-detailed-outline-tulpahn/50/000000/external-sleepy-heart-feeling-tulpahn-detailed-outline-tulpahn.png',
  },
  toot: {
    title: 'toot',
    icon: 'https://img.icons8.com/ios-glyphs/50/000000/air-element--v1.png',
  },
  what: {
    title: 'what',
    icon: 'https://img.icons8.com/ios/50/000000/question-mark--v1.png',
  },
};

export const VOICE_SOUNDS = {};
// populate voice sounds on startup
(async function () {
  const getFileArr = async (partialPath) => {
    const response = await fetch(`${ASSETS_PATH}/sounds/voice${partialPath}/DirContents.txt/`);
    const fileList = await response.text();
    return fileList
      .replace(/DirContents.txt[\s\S]?/, '')
      .split(/\n/)
      .filter((i) => i)
      .map((i) => i.trim());
  };
  const voiceTypeList = await getFileArr('');
  for (const voiceType of voiceTypeList) {
    VOICE_SOUNDS[voiceType] = {};
    const voiceProfiles = await getFileArr(`/${voiceType}`);
    for (const voiceProfile of voiceProfiles) {
      VOICE_SOUNDS[voiceType][voiceProfile] = {};
      const partialPath = `/${voiceType}/${voiceProfile}`;
      const voiceFiles = await getFileArr(partialPath);
      Object.keys(VOICE_MOODS).forEach((mood) => {
        const pathArr = voiceFiles
          .filter((f) => new RegExp(`^${mood}_\\d+.ogg`).test(f))
          .map((f) => `${ASSETS_PATH}/sounds/voice${partialPath}/${f}`);
        VOICE_SOUNDS[voiceType][voiceProfile][mood] = pathArr;
      });
    }
  }
  console.log('Completed loading voice sound file paths', VOICE_SOUNDS);
})();

export const voiceTypesByGender = (gender) =>
  Object.keys(VOICE_SOUNDS['character']).filter((t) => t.startsWith(`${gender}_`));

export const playVoiceSound = (() => {
  const speakingActorIds = new Map();

  return async function (mood, actor, token, { push = true, bubble = true, chance = 1 } = {}) {
    const actorId = actor.isToken ? actor.token._id : actor._id;
    const actorType = actor.type;
    const attrType = actor.data.data.attributes?.type?.value;
    const voiceType = actorType === 'monster' && Object.keys(VOICE_SOUNDS).includes(attrType) ? attrType : actorType;
    if (speakingActorIds.has(actorId)) return;
    const isSleeping = actor.data.effects.some((e) => e.label === 'Asleep');
    if (isSleeping) return;
    const voice = actor.data.data.voice;
    const soundsArr = VOICE_SOUNDS[voiceType]?.[voice]?.[mood];
    if (!soundsArr) return;
    const numTracks = soundsArr.length;
    const trackNum = Math.floor(Math.random() * numTracks);
    if (Math.random() > chance) return;
    token = token ?? getTokenFromActor(actor);

    try {
      speakingActorIds.set(actorId);
      const sound = await playSound(soundsArr[trackNum], token, { push, bubble });
      return await wait(sound.duration * 1000);
    } finally {
      speakingActorIds.delete(actorId);
    }
  };
})();

export async function playSound(sound, token, { push = true, bubble = true } = {}) {
  if (!sound) return;
  const soundPath = sound.includes(`${ASSETS_PATH}/sounds`) ? sound : `${ASSETS_PATH}/sounds/${sound}.ogg`;
  if (token && bubble) {
    chatBubble(token, '<i class="fas fa-volume-up"></i>', false);
  }

  return AudioHelper.play({ src: soundPath, volume: 1, loop: false }, push);
}
