export const ATTRIBUTE_TYPES = ["String", "Number", "Boolean", "Formula", "Resource"];
export const SPELL_TYPES = {
  SPELL_CLERIC: "spell_cleric",
  SPELL_MAGIC: "spell_magic",
  SPELL_WITCH: "spell_witch"
};
export const MAX_SPELL_LEVELS = {
  [SPELL_TYPES.SPELL_CLERIC]: 5,
  [SPELL_TYPES.SPELL_MAGIC]: 9,
  [SPELL_TYPES.SPELL_WITCH]: 6
};
export const FIGHTER_XP_PROGRESSION = [ // put all class XP progressions in one base object
  {xpRequired: 240000, updateData: {"data.level": 9, "data.bab": 9, "data.st": 9, "data.xp.max": 360000}},
  {xpRequired: 120000, updateData: {"data.level": 8, "data.bab": 8, "data.st": 9, "data.xp.max": 240000}},
  {xpRequired: 60000, updateData: {"data.level": 7, "data.bab": 7, "data.st": 10, "data.xp.max": 120000}},
  {xpRequired: 30000, updateData: {"data.level": 6, "data.bab": 6, "data.st": 11, "data.xp.max": 60000}},
  {xpRequired: 15000, updateData: {"data.level": 5, "data.bab": 5, "data.st": 11, "data.xp.max": 30000}},
  {xpRequired: 7000, updateData: {"data.level": 4, "data.bab": 4, "data.st": 12, "data.xp.max": 15000}},
  {xpRequired: 3000, updateData: {"data.level": 3, "data.bab": 3, "data.st": 13, "data.xp.max": 7000}},
  {xpRequired: 1000, updateData: {"data.level": 2, "data.bab": 2, "data.st": 13, "data.xp.max": 3000}},
  {xpRequired: 0, updateData: {"data.level": 1, "data.bab": 1, "data.st": 14, "data.xp.max": 1000}}
];
const VOICE_PROFILES = [
  "F_Barb", 
  "F_Bard", 
  "F_Drow", 
  "F_Fgt01", 
  "F_Fgt02",
  "F_Fgt03",
  "F_Fgt04",
  "F_Fgt05",
  "F_HOrc1",
  "F_HoW1",
  "F_HoW2",
  "F_HoW3",
  "F_Mage1",
  "F_Mage2",
  "F_Mage3",
  "F_Mage4",
  "F_Mage5",
  "F_Sorc1",
  "F_Thief1",
  "F_Thief2",
  "M_Barb",
  "M_Bard",
  "M_Drow",
  "M_Fgt01",
  "M_Fgt02",
  "M_Fgt03",
  "M_Fgt04",
  "M_Fgt05",
  "M_HOrc1",
  "M_HoW1",
  "M_HoW2",
  "M_HoW3",
  "M_Mage1",
  "M_Mage2",
  "M_Mage3",
  "M_Mage4",
  "M_Mage5",
  "M_Monk1",
  "M_Sorc1",
  "MThief1",
  "MThief2"
];
export const VOICE_MOODS = {
  AMUSED: "amused",
  ANGRY: "angry",
  BORED: "bored",
  DEATH: "death",
  DYING: "dying",
  HURT: "hurt",
  KILL: "kill",
  LEAD: "lead",
  OK: "ok",
  PARTY_DEATH: "party_death",
  PARTY_FAIL: "party_fail",
  RETREAT: "retreat",
  SLEEPY: "sleepy",
  TOOT: "toot",
  WHAT: "what"
};
export const VOICE_MOOD_ICONS = new Map([
  [VOICE_MOODS.AMUSED,"https://img.icons8.com/external-wanicon-lineal-wanicon/50/000000/external-laughing-emoji-wanicon-lineal-wanicon.png"],
  [VOICE_MOODS.ANGRY,"https://img.icons8.com/ios/50/000000/battle.png"],
  [VOICE_MOODS.BORED,"https://img.icons8.com/ios/50/000000/bored.png"],
  [VOICE_MOODS.DEATH,"https://img.icons8.com/ios/50/000000/dying.png"],
  [VOICE_MOODS.DYING,"https://img.icons8.com/ios/50/000000/wound.png"],
  [VOICE_MOODS.HURT,"https://img.icons8.com/ios/50/000000/action.png"],
  [VOICE_MOODS.KILL,"https://img.icons8.com/ios/50/000000/murder.png"],
  [VOICE_MOODS.LEAD,"https://img.icons8.com/ios/50/000000/leadership.png"],
  [VOICE_MOODS.OK,"https://img.icons8.com/ios/50/000000/easy.png"],
  [VOICE_MOODS.PARTY_DEATH,"https://img.icons8.com/external-prettycons-lineal-prettycons/50/000000/external-rip-holidays-prettycons-lineal-prettycons.png"],
  [VOICE_MOODS.PARTY_FAIL,"https://img.icons8.com/ios/50/000000/facepalm.png"],
  [VOICE_MOODS.RETREAT,"https://img.icons8.com/ios/50/000000/running-rabbit.png"],
  [VOICE_MOODS.SLEEPY,"https://img.icons8.com/external-tulpahn-detailed-outline-tulpahn/50/000000/external-sleepy-heart-feeling-tulpahn-detailed-outline-tulpahn.png"],
  [VOICE_MOODS.TOOT,"https://img.icons8.com/ios-glyphs/50/000000/air-element--v1.png"],
  [VOICE_MOODS.WHAT,"https://img.icons8.com/ios/50/000000/question-mark--v1.png"]
]);
export const VOICE_SOUNDS = new Map();
// populate voice sound file paths
(async function() {
  for (const voice of VOICE_PROFILES) {
    const moodMap = new Map();
    const response = await fetch(`systems/lostlands/sounds/${voice}/DirContents.txt/`);
    const fileList = await response.text();
    const fileArr = fileList.replace(/DirContents.txt[\s\S]?/,'').split(/\n/).filter(item => item);
    for (const mood of Object.values(VOICE_MOODS)) {
      const pathArr = fileArr.filter(f => new RegExp(`\^${mood}_\\d+.mp3`).test(f)).map(f => `systems/lostlands/sounds/${voice}/${f}`);
      moodMap.set(`${mood}`, pathArr);
    }
    VOICE_SOUNDS.set(`${voice}`, moodMap);
  }
  console.log('Completed loading voice sound file paths', VOICE_SOUNDS);
})();
