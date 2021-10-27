export const ATTRIBUTE_TYPES = ["String", "Number", "Boolean", "Formula", "Resource"];
export const MAX_SPELL_LEVELS = {'spell_witch': 6, 'spell_cleric': 5, 'spell_magic': 9};
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
export const VOICE_MOODS = new Map([
  ["amused","https://img.icons8.com/external-wanicon-lineal-wanicon/50/000000/external-laughing-emoji-wanicon-lineal-wanicon.png"],
  ["angry","https://img.icons8.com/ios/50/000000/battle.png"],
  ["bored","https://img.icons8.com/ios/50/000000/bored.png"],
  ["death","https://img.icons8.com/ios/50/000000/dying.png"], //https://img.icons8.com/external-wanicon-lineal-wanicon/50/000000/external-death-halloween-wanicon-lineal-wanicon.png
  ["dying","https://img.icons8.com/ios/50/000000/wound.png"],
  ["hurt","https://img.icons8.com/ios/50/000000/action.png"],
  ["kill","https://img.icons8.com/ios/50/000000/murder.png"],
  ["lead","https://img.icons8.com/ios/50/000000/leadership.png"],
  ["ok","https://img.icons8.com/ios/50/000000/easy.png"],
  ["party_death","https://img.icons8.com/external-prettycons-lineal-prettycons/50/000000/external-rip-holidays-prettycons-lineal-prettycons.png"],
  ["party_fail","https://img.icons8.com/ios/50/000000/facepalm.png"],
  ["retreat","https://img.icons8.com/ios/50/000000/running-rabbit.png"],
  ["sleepy","https://img.icons8.com/external-tulpahn-detailed-outline-tulpahn/50/000000/external-sleepy-heart-feeling-tulpahn-detailed-outline-tulpahn.png"],
  ["toot","https://img.icons8.com/ios-glyphs/50/000000/air-element--v1.png"],
  ["what","https://img.icons8.com/ios/50/000000/question-mark--v1.png"]
]);
export const VOICE_SOUNDS = new Map();
// populate voice sound file paths
(async function() {
  for (const voice of VOICE_PROFILES) {
    const moodMap = new Map();
    for (const mood of VOICE_MOODS.keys()) {
      const pathArr = [];
      let response, i = 0;
      do {
        i++;
        try {
          response = await fetch(`systems/lostlands/sounds/${voice}/${mood}_${i}.mp3/`);
          response.ok && pathArr.push(`systems/lostlands/sounds/${voice}/${mood}_${i}.mp3/`);
        } catch (error) {
          console.log(`Problem loading sound file path: systems/lostlands/sounds/${voice}/${mood}_${i}.mp3/`)
        }
      } while (response.ok)
      moodMap.set(`${mood}`, pathArr);
    }
    VOICE_SOUNDS.set(`${voice}`, moodMap);
  }
  console.log('Completed loading voice sound file paths',VOICE_SOUNDS);
})();