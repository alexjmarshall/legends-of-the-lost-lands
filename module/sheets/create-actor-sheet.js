import { EntitySheetHelper } from '../helper.js';
import * as Constant from '../constants.js';
import * as CLASSES from '../rules/classes/index.js';
import { origins } from '../rules/origin.js';
import * as RACES from '../rules/races/index.js';
import { rollDice } from '../helper/dice.js';
import { COINS_OF_ACCOUNT } from '../rules/currency.js';
import { sizes } from '../rules/size.js';
import { VOICE_SOUNDS, playSound, voiceTypesByGender } from '../helper/sound.js';
import { insertSpaceBeforeCapitalUnlessSlash } from '../helper/string.js';
import { skills, SKILL_CATEGORIES } from '../rules/skills.js';
import { ABILITIES, abilities, FULL_ABILITIES, getScoreMod } from '../rules/abilities.js';
import { alignmentDescriptions } from '../rules/alignments.js';
import { portraits, basePath } from '../helper/portrait.js';

// save stats generated for characters here
const charGenSave = {};

const numAbilitySets = 12;

export class CreateActorSheet extends ActorSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['brigandine', 'sheet', 'actor', 'create-actor'],
      template: 'systems/brigandine/templates/create-actor-sheet.html',
      width: 682,
      height: 950,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'genderrace' }],
      submitOnChange: false,
      submitOnClose: false,
      closeOnSubmit: true,
    });
  }

  /*
  heading: 
    Img Picker
    1st row Character Name (text input)
    2nd row Height Weight Age GP (spans)

    present as tabs, but must use Next/Previous buttons, all other tabs but current are disabled

    each tab has two columns, one for the choice, next for a description
    choice column can also have a picture of current selection under a select menu

    all generated stats have a map with a value for each key, generate if not already in map, then store

    Tab -- onChange
    Gender (radio) -- gender onChange height and weight
    Race (select) -- height and weight, languages, class list
    Abilities (radio) -- class list, height and weight
    Origin (select) -- starting hp, starting sp
    Class (grouped select) -- starting spells, languages, alignment
    Alignment (radio) -- 
    Languages (multiselect) -- 
    Appearance (img picker) --

    on click Submit, show confirmation dialog with all stats listed
    -- if confirm, open Purchase Equipment
    -- after Purchase Equipment, update actor, add items, add spells, update to level 1, open character sheet

    TODO change update level function to return update data, so can combine with submit data
    also update to take origin into account for skills and 1st level HP
    also race effect on hit die, starting HP and size
    remember when calculating skills, use base lvl value, before any active effects! (how to access? -- actora.data._source -- readonly!)

   */

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.data;
    context.dtypes = Constant.ATTRIBUTE_TYPES;
    context.isGM = game.user.isGM;
    context.isPlayer = !context.isGM;

    // Gender & Race
    context.race = this._getRaceDescription(context.systemData.race);

    // Abilities
    const abilitySets = this._getAbilitySets(context.systemData.race);
    context.abilityOptions = this._getAbilityOptions(abilitySets);
    const firstAbilitySet = abilitySets[0];
    context.abilities = Object.fromEntries(firstAbilitySet.map((ability) => [ability.name, ability.score]));
    context.abilities.numAbilitySets = numAbilitySets;
    context.abilitiesHeading = Object.keys(ABILITIES)
      .reduce((acc, ability) => `${acc}${ability}&nbsp;&nbsp;`, '&nbsp;')
      .trim();

    // Class
    const allowedClassesObj = this._getClassOptionsObj(context.systemData.race, firstAbilitySet);
    context.classOptions = this._getClassOptions(allowedClassesObj);
    console.log('classOptions', context.classOptions);
    const selectedClass = Object.keys(allowedClassesObj)[0];
    context.classDescription = this._getClassDescription(selectedClass);

    // Alignment
    const allowedAlignments = CLASSES[selectedClass].alignments;
    const selectedAlignment = allowedAlignments[0];
    context.alignment = this._getAlignmentOptions(allowedAlignments);
    context.alignmentDescription = alignmentDescriptions[selectedAlignment];

    // Origin
    const allowedOrigins = CLASSES[selectedClass].allowedOrigins;
    const selectedOrigin = allowedOrigins[0];
    context.origin = this._getOriginOptions(allowedOrigins);
    context.origin.description = this._getOriginDescription(selectedOrigin);

    // Appearance
    context.voiceOptions = this._getVoiceOptions(context.systemData.gender);
    const portraitOptions = this._getPortraitOptions(context.systemData.gender);
    context.portraitImgs = this._getPortraitImgs(portraitOptions);
    if (!portraitOptions.includes(context.data.img)) {
      context.data.img = `${basePath}${portraitOptions[0]}`;
    }

    // Confirm
    const heightWeight = this._getHeightAndWeight(
      context.systemData.race,
      context.systemData.gender,
      context.abilities.str,
      0
    );
    context.height = heightWeight.height;
    context.heightFeetInches = this._getHeightAndFeetInchesAsString(heightWeight.height);
    context.weight = heightWeight.weight;
    context.age = this._getAge(context.systemData.race, context.systemData.class);
    context.sp = this._getStartingSp(context.systemData.origin);
    context.spAbbr = COINS_OF_ACCOUNT.sp.abbr;

    context.size = RACES[context.systemData.race].size();

    context.hp = this._getStartingHp(selectedOrigin, selectedClass, context.size, context.abilities.con);

    return context;
  }

  _getClassDescription(className) {
    console.log('getClassDescription', className);
    if (className.includes('/')) {
      return {
        description: `Multi-classed characters have access to each class's features and use the best skill progressions, saves, armor and weapon selection of either class. (Note that spellcasting and many skills are penalized by wearing heavy armor). Hit die is the average rounded down to the nearest whole number (e.g. d5 for classes of d6 and d4 hit dice). XP required is the sum of each class's requirement at each level (e.g. level 2 for a Fighter/Mage will require 1000 XP + 1200 XP = 2200 XP).`,
        stats: '',
        specializedSkillsDesc: '',
        proficientSkillsDesc: '',
        featureListItems: '',
      };
    }
    const selectedClass = CLASSES[className];
    const stats = `
    ${
      selectedClass.primeReqs.length
        ? `<p><label>Prime requisite(s):</label> ${selectedClass.primeReqs
            .map((p) => FULL_ABILITIES[p])
            .join(', ')
            .trim()}`
        : ''
    }
    <p><label>XP required:</label> ${selectedClass.XP_REQS[0]}</p>
    <p><label>Starting HP:</label> ${selectedClass.firstLvlHp}</p>
    <p><label>Hit die:</label> ${selectedClass.hitDie}</p>
    <p><label>Armor:</label> ${selectedClass.armorDescription}</p>
    <p><label>Shields:</label> ${selectedClass.shieldsDescription}</p>
    <p><label>Weapons:</label> ${selectedClass.weaponDescription}</p>
    `;
    const featureListItems = selectedClass.featureDescriptions?.map((desc) => `<li>${desc}</li>`).join('') || '';
    const nonCombatOrSpellSkill = (s) =>
      skills[s].category !== SKILL_CATEGORIES.COMBAT && skills[s].category !== SKILL_CATEGORIES.SPELLS;
    const nonCombatSpecializedSkills = selectedClass.specializedSkills?.filter(nonCombatOrSpellSkill);
    const nonCombatProficientSkills = selectedClass.proficientSkills?.filter(nonCombatOrSpellSkill);
    const specializedSkillsDesc = nonCombatSpecializedSkills?.length
      ? '<label>Specialized skills:</label> ' + nonCombatSpecializedSkills.join(', ').trim()
      : '';
    const proficientSkillsDesc = nonCombatProficientSkills?.length
      ? '<label>Proficient skills:</label> ' + nonCombatProficientSkills.join(', ').trim()
      : '';

    return {
      description: selectedClass.description,
      stats,
      specializedSkillsDesc,
      proficientSkillsDesc,
      featureListItems,
    };
  }

  _getClassOptionsObj(raceName, abilitySet) {
    const allowedClasses = this._getClasses(raceName, abilitySet);
    const classGroups = {};

    // Group classes by their parent class
    allowedClasses.forEach((className) => {
      let cls = CLASSES[className];
      let parentName = '';
      let childName = '';
      let insertFirst = false;
      // get the base class name from a class we know has the base class as its immediate parent
      const baseClassName = Object.getPrototypeOf(CLASSES.Fighter.prototype).constructor.name;

      if (!cls) {
        childName = className;
        parentName = 'Multi-Class';
      } else {
        childName = cls.name;
        // to find the parent name, keep going up the prototype chain
        // until we find either a playable class or the base class
        do {
          cls = Object.getPrototypeOf(cls.prototype).constructor;
          parentName = cls.name;
        } while (!CLASSES[parentName] && parentName !== baseClassName);

        if (parentName === baseClassName) {
          parentName = childName;
          insertFirst = true;
        }
      }

      if (!classGroups[parentName]) {
        classGroups[parentName] = [];
      }

      if (insertFirst) {
        classGroups[parentName].unshift(childName);
      } else {
        classGroups[parentName].push(childName);
      }
    });

    // sort parent class keys in alphabetical order
    const sortedClassGroups = {};
    Object.keys(classGroups)
      .sort()
      .forEach((key) => {
        sortedClassGroups[key] = classGroups[key];
      });

    // move multi-class key to the bottom
    const multiClass = sortedClassGroups['Multi-Class'];
    if (multiClass) {
      delete sortedClassGroups['Multi-Class'];
      sortedClassGroups['Multi-Class'] = multiClass;
    }

    return sortedClassGroups;
  }

  _getAlignmentOptions(allowedAlignments) {
    console.log('getAlignmentOptions', allowedAlignments);
    const options = allowedAlignments
      .map((a, idx) => `<option ${idx === 0 ? 'selected' : ''} value='${a}'>${a}</option>`)
      .join('');
    return {
      options,
      size: allowedAlignments.length,
    };
  }

  _getClassOptions(classGroups) {
    // Generate HTML options with optgroup
    console.log('getClassOptions', classGroups);
    const parentNames = Object.keys(classGroups);
    let options = '';
    let size = parentNames.length;
    parentNames.forEach((parentName) => {
      const childClasses = classGroups[parentName];

      options += `<optgroup label="${parentName}">`;

      childClasses.forEach((className) => {
        options += `<option ${
          parentNames.indexOf(parentName) === 0 && childClasses.indexOf(className) === 0 ? 'selected' : ''
        } value="${className}">${insertSpaceBeforeCapitalUnlessSlash(className)}</option>`;
        size++;
      });

      options += `</optgroup>`;
    });

    if (size > 30) size--; // reduce size to make fit-content styling look better

    return { options, size };
  }

  _getClasses(raceName, abilitySet) {
    const race = RACES[raceName];
    const racialClasses = race.allowedClasses;
    const meetsAbilityRequirements = (cls) => {
      const reqs = CLASSES[cls].abilityReqs || [];
      for (const ability of reqs) {
        const abilityScore = abilitySet.find((s) => s.name === ability.name).score;
        if (abilityScore < ability.min || abilityScore > ability.max) return false;
      }
      return true;
    };
    const playableClasses = racialClasses.filter(meetsAbilityRequirements);
    const validMultiClasses = race.allowedMultiClasses.filter(
      (multi) => playableClasses.includes(multi[0]) && playableClasses.includes(multi[1])
    );
    return [...playableClasses, ...validMultiClasses.map((multi) => multi.join('/'))];
  }

  _getPortraitOptions(gender) {
    return portraits.filter((p) => p.startsWith(`${gender}_`));
  }

  _getPortraitImgs(portraitPaths) {
    return portraitPaths
      .map((img) => `<img class='portrait-img-option' src='${basePath}${img}' alt='${img}' />`)
      .join('');
  }

  _getVoiceOptions(gender) {
    const voiceProfiles = voiceTypesByGender(gender);
    const removePrefix = (str) => (str.startsWith('M_') || str.startsWith('F_') ? str.substring(2) : str);
    return voiceProfiles.map((voice) => `<option value='${voice}'>${removePrefix(voice)}</option>`).join('');
  }

  _onVoicePreview(event) {
    const button = $(event.currentTarget);
    const tab = button.closest('.tab.appearance');
    const select = tab.find('.voice-select');
    const voice = select.find(':selected').val();
    const { type } = this.actor;
    const soundsArr = Object.values(VOICE_SOUNDS[type]?.[voice]).flat();
    if (!soundsArr) return;
    const numTracks = soundsArr.length;
    const trackNum = Math.floor(Math.random() * numTracks);
    playSound(soundsArr[trackNum], null, { push: false, bubble: false });
  }

  _getOriginOptions(allowedOrigins) {
    const originOptions = allowedOrigins
      .map((origin, idx) => `<option ${idx === 0 ? 'selected' : ''} value='${origin}'>${origin}</option>`)
      .join('');
    return { originOptions, size: allowedOrigins.length };
  }

  _getMultiClassFirstLvlHp(multiClass) {
    const classes = multiClass.split('/');
    const hp1 = CLASSES[classes[0]]?.firstLvlHp || '0';
    const hp2 = CLASSES[classes[1]]?.firstLvlHp || '0';
    return `(${hp1} + ${hp2}) / 2`;
  }

  _getStartingHp(origin, className, size, conScore) {
    console.log('getStartingHp key', `hp_${origin}${className}${size}${conScore}`);
    const firstLvlHp = className.includes('/')
      ? this._getMultiClassFirstLvlHp(className)
      : CLASSES[className].firstLvlHp;
    const conMod = getScoreMod(conScore);
    const hpGetter = () => Math.floor(rollDice(firstLvlHp) + origins[origin].hpBonus + sizes[size].hpModifier + conMod);
    return this._getOrSetFlag(`hp_${origin}${className}${size}${conScore}`, hpGetter);
  }

  _getStartingSp(origin) {
    const spGetter = origins[origin].startingWealth;
    return this._getOrSetFlag(`sp_${origin}`, spGetter);
  }

  _getAge(race, className) {
    const ageGetter = () => RACES[race]?.randomStartingAge(className);
    return this._getOrSetFlag(`age_${race}${className}`, ageGetter);
  }

  _getHeightAndWeight(race, gender, str, abilitesIdx) {
    console.log('getHeightAndWeight key', `heightweight_${race}${gender}${abilitesIdx}`);
    const heightWeightGetter = () => RACES[race].randomHeightWeight(gender, str);
    return this._getOrSetFlag(`heightweight_${race}${gender}${abilitesIdx}`, heightWeightGetter);
  }

  _getHeightAndFeetInchesAsString(height) {
    return `${Math.floor(height / 12)}' ${height % 12}"`;
  }

  _getOrSetFlag(key, getter) {
    let charSaves = charGenSave[this.actor.id];
    if (!charSaves) {
      charGenSave[this.actor.id] = {};
      charSaves = charGenSave[this.actor.id];
    }
    if (!charSaves[key]) {
      charSaves[key] = getter();
    }
    return charSaves[key];
  }

  _getRaceDescription(race) {
    const selectedRace = RACES[race];
    const raceDescription = selectedRace.description;
    const listItems = selectedRace.featureDescriptions?.map((desc) => `<li>${desc}</li>`).join('') || '';
    return { raceDescription, listItems };
  }

  _getOriginDescription(origin) {
    const selectedOrigin = origins[origin];
    const originDescription = selectedOrigin.description;
    const listItems = ' ' + selectedOrigin.skills?.join(', ').trim() || '';
    const hpBonus = selectedOrigin.hpBonus;
    const hpBonusDesc = ` ${hpBonus > 0 ? '+' : ''}${hpBonus}`;
    const startingSpDesc = ` ${selectedOrigin.startingSp} ${COINS_OF_ACCOUNT.sp.abbr}`;
    return { originDescription, hpBonusDesc, startingSpDesc, listItems };
  }

  _getAbilityOptions(abilitySets) {
    const abilityOptions = [];
    for (const set of abilitySets) {
      // convert the scores to a single string like "STR: 12, INT: 14, DEX: 8, CON: 10, WIS: 13, CHA: 11"
      const abilitiesString = set
        .reduce((acc, ability) => {
          const scoreString = ability.score < 10 ? `&nbsp;${ability.score}` : ability.score;
          return `${acc}${scoreString}&nbsp;&nbsp;&nbsp;`;
        }, '')
        .trim();
      const abilityOption = `<option ${abilitySets.indexOf(set) === 0 ? 'selected' : ''} value='${JSON.stringify(
        set
      )}'>${abilitiesString}</option>`;
      abilityOptions.push(abilityOption);
    }
    return abilityOptions.join('');
  }

  _getAbilitySets(race) {
    return this._getOrSetFlag(`${race}`, () => this._abilitySetGetter(race));
  }

  _abilitySetGetter(race) {
    const selectedRace = RACES[race];
    const abilitySets = [];

    for (let i = 0; i < numAbilitySets; i++) {
      const genAbiilities = [];
      do {
        genAbiilities.length = 0;
        for (const ability of abilities) {
          let abilityScore = rollDice('3d6');
          // add racial modifier
          abilityScore += selectedRace.abilityScoreModifiers[ability] || 0;
          // restrict to 3-18
          if (abilityScore < 3) abilityScore = 3;
          if (abilityScore > 18) abilityScore = 18;
          const genAbility = {
            name: ability,
            score: abilityScore,
          };
          genAbiilities.push(genAbility);
        }
      } while (
        // reroll the set if none of the 4 main abilities are at least 9
        !genAbiilities.some(
          (ability) =>
            [ABILITIES.STR, ABILITIES.INT, ABILITIES.DEX, ABILITIES.WIS].includes(ability.name) && ability.score >= 9
        )
      );
      abilitySets.push(genAbiilities);
    }

    // TODO remove this
    if (race === 'Human') {
      // make last set all 18s to see all classes
      abilitySets[numAbilitySets - 1] = [
        { name: ABILITIES.STR, score: 18 },
        { name: ABILITIES.INT, score: 18 },
        { name: ABILITIES.DEX, score: 18 },
        { name: ABILITIES.CON, score: 18 },
        { name: ABILITIES.WIS, score: 18 },
        { name: ABILITIES.CHA, score: 18 },
      ];
    }
    return abilitySets;
  }

  // TODO select options for alignment
  // languages assign randomly at the end
  // alignment and languages separate tabs?
  // -- function to determine options by class
  // -- call on getData and when class changes
  // multi-select for languages
  // -- backing hidden input with CSV string of selected languages
  // -- update this multi-select changes
  // -- function to determine options by race and class
  // -- maybe checkboxes instead of multi-select?
  // -- call on getData and when class changes

  /* -------------------------------------------- */

  /** @inheritdoc */
  // TODO check for reciprocal updaters
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    const ageInput = html.find('input[name="data.age"]');
    const heightInput = html.find('input[name="data.height"]');
    const weightInput = html.find('input[name="data.weight"]');
    const spInput = html.find('input[name="sp"]');
    const hpValueInput = html.find('input[name="data.hp.value"]');
    const hpMaxInput = html.find('input[name="data.hp.max"]');
    const sizeInput = html.find('input[name="data.size"]');
    const raceSelect = html.find('select.select-race');
    const alignmentSelect = html.find('select.select-alignment');
    const genderSelect = html.find('select.select-gender');
    const abilitiesSelect = html.find('select.select-abilities');
    const strInput = html.find('input[name="data.attributes.ability_scores.str.value"]');
    const intInput = html.find('input[name="data.attributes.ability_scores.int.value"]');
    const dexInput = html.find('input[name="data.attributes.ability_scores.dex.value"]');
    const conInput = html.find('input[name="data.attributes.ability_scores.con.value"]');
    const wisInput = html.find('input[name="data.attributes.ability_scores.wis.value"]');
    const chaInput = html.find('input[name="data.attributes.ability_scores.cha.value"]');
    const originSelect = html.find('select.select-origin');
    const classSelect = html.find('select.select-class');
    const profileImg = html.find('img.profile-img');
    const portraitImgClickHandler = (event) => {
      const img = $(event.currentTarget);
      profileImg.attr('src', img.attr('src'));
    };

    // Age input changes
    ageInput.change((event) => {
      console.log('ageInput change', event.target.value);
      const age = event.target.value;
      html.find('span.data-fields-age').text(age);
    });
    // Height input changes
    heightInput.change((event) => {
      console.log('heightInput change', event.target.value);
      const height = event.target.value;
      html.find('span.data-fields-height').text(this._getHeightAndFeetInchesAsString(height));
    });
    // Weight input changes
    weightInput.change((event) => {
      console.log('weightInput change', event.target.value);
      const weight = event.target.value;
      html.find('span.data-fields-weight').text(weight);
    });
    // SP input changes
    spInput.change((event) => {
      console.log('spInput change', event.target.value);
      const sp = event.target.value;
      html.find('span.data-fields-sp').text(sp);
    });
    // HP input changes
    hpValueInput.change((event) => {
      console.log('hpValueInput change', event.target.value);
      const hp = event.target.value;
      html.find('span.data-fields-hp').text(hp);
      // update hp max
      hpMaxInput.val(hp).trigger('change');
    });
    // Size input changes
    sizeInput.change((event) => {
      console.log('sizeInput change', event.target.value);
      const size = event.target.value;
      html.find('span.data-fields-size').text(size);
    });

    // Gender-select changes
    genderSelect.change((event) => {
      console.log('genderSelect change', event.target.value);
      const gender = event.target.value;
      // update height and weight
      const heightWeight = this._getHeightAndWeight(
        raceSelect.val(),
        gender,
        strInput.val(),
        abilitiesSelect[0].selectedIndex
      );
      heightInput.val(heightWeight.height).trigger('change');
      weightInput.val(heightWeight.weight).trigger('change');
      // update voice profiles
      const voiceOptions = this._getVoiceOptions(gender);
      html.find('select.voice-select').html(voiceOptions).trigger('change');
      // update portrait options
      const portraitOptions = this._getPortraitOptions(gender);
      const portraitImgs = this._getPortraitImgs(portraitOptions);
      html.find('div.portrait-img-options').html(portraitImgs);
      html.find('div.portrait-img-options > img').click(portraitImgClickHandler);
      // update profile img
      profileImg.attr('src', `${basePath}${portraitOptions[0]}`);
    });

    // Select-race changes
    raceSelect.change((event) => {
      console.log('raceSelect change', event.target.value);
      const race = event.target.value;
      // update race description
      const { raceDescription, listItems } = this._getRaceDescription(race);
      html.find('div.race-description-desc').text(raceDescription);
      html.find('ul.race-description-list').html(listItems);
      // update size
      sizeInput.val(RACES[race].size()).trigger('change');
      // update ability scores
      const abilitySets = this._getAbilitySets(race);
      abilitiesSelect.html(this._getAbilityOptions(abilitySets)).trigger('change');
    });

    // Select-alignment changes
    alignmentSelect.change((event) => {
      console.log('alignmentSelect change', event.target.value);
      const alignment = event.target.value;
      // update alignment description
      const alignmentDescription = alignmentDescriptions[alignment];
      html.find('div.alignment-description').text(alignmentDescription);
    });

    // Select-abilities changes
    abilitiesSelect.change((event) => {
      console.log('abilitiesSelect change', raceSelect.val());
      const selectedSet = JSON.parse(event.target.value);
      strInput.val(selectedSet.find((s) => s.name === ABILITIES.STR).score);
      intInput.val(selectedSet.find((s) => s.name === ABILITIES.INT).score);
      dexInput.val(selectedSet.find((s) => s.name === ABILITIES.DEX).score);
      conInput.val(selectedSet.find((s) => s.name === ABILITIES.CON).score);
      wisInput.val(selectedSet.find((s) => s.name === ABILITIES.WIS).score);
      chaInput.val(selectedSet.find((s) => s.name === ABILITIES.CHA).score);
      // update height and weight
      const heightWeight = this._getHeightAndWeight(
        raceSelect.val(),
        genderSelect.val(),
        strInput.val(),
        event.target.selectedIndex
      );
      heightInput.val(heightWeight.height).trigger('change');
      weightInput.val(heightWeight.weight).trigger('change');
      // update class list
      const allowedClassesObj = this._getClassOptionsObj(raceSelect.val(), selectedSet);
      const classOptions = this._getClassOptions(allowedClassesObj);
      classSelect.html(classOptions.options).trigger('change');
      // update size attribute of classSelect
      classSelect.attr('size', classOptions.size);
    });

    // Select-class changes
    classSelect.change((event) => {
      console.log('classSelect change', event.target.value);
      const className = event.target.value;
      // update class description
      const { description, stats, specializedSkillsDesc, proficientSkillsDesc, featureListItems } =
        this._getClassDescription(className);
      html.find('p.class-description-desc').text(description);
      html.find('div.class-description-stats').html(stats);
      html.find('ul.class-description-list').html(featureListItems);
      html.find('span.class-specialized-skills').html(specializedSkillsDesc);
      html.find('span.class-proficient-skills').html(proficientSkillsDesc);
      // update starting age
      const age = this._getAge(raceSelect.val(), className);
      ageInput.val(age).trigger('change');
      // update starting HP
      const hp = this._getStartingHp(originSelect.val(), className, sizeInput.val(), conInput.val());
      hpValueInput.val(hp).trigger('change');
      // update alignment options
      const allowedAlignments = CLASSES[className].alignments;
      const alignmentOptions = this._getAlignmentOptions(allowedAlignments);
      alignmentSelect.html(alignmentOptions.options).trigger('change');
      // update size attribute of alignmentSelect
      alignmentSelect.attr('size', alignmentOptions.size);
      // if size = 1, disable alignmentSelect
      alignmentSelect.prop('disabled', alignmentOptions.size === 1);
    });

    // Select-origin changes
    originSelect.change((event) => {
      console.log('originSelect change', event.target.value);
      const origin = event.target.value;
      // update origin description
      const { originDescription, hpBonusDesc, startingSpDesc, listItems } = this._getOriginDescription(origin);
      html.find('p.origin-description-desc').text(originDescription);
      html.find('span.origin-hp-bonus').text(hpBonusDesc);
      html.find('span.origin-starting-sp').text(startingSpDesc);
      html.find('span.origin-description-list').text(listItems);
      // update starting SP
      const sp = this._getStartingSp(origin);
      console.log(sp);
      spInput.val(sp).trigger('change');
      // update starting HP
      const hp = this._getStartingHp(origin, classSelect.val(), sizeInput.val(), conInput.val());
      hpValueInput.val(hp).trigger('change');
    });

    // Voice Controls
    html.find('.voice-preview').click(this._onVoicePreview.bind(this));

    // Update profile img on click of portrait img option
    html.find('div.portrait-img-options > img').click(portraitImgClickHandler);
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  async _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest('.item');
    const itemId = li?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    const type = button.dataset.type;
    const data = { name: game.i18n.localize('SIMPLE.ItemNew'), type: type };

    // Handle different actions
    switch (button.dataset.action) {
      case 'create': {
        const cls = getDocumentClass('Item');
        return cls.create(data, { parent: this.actor });
      }
      case 'edit':
        return item.sheet.render(true);
      case 'delete': {
        const actor = this.actor;
        const itemQty = +item.data.data.quantity || 0;
        if (itemQty <= 1) return item.delete();
        return new Dialog({
          title: 'Delete Item',
          content: `<form>
            <div class="flexrow">
              <label class="flex1">How many?</label>
              <label class="flex1" style="text-align:center;" id="splitValue"></label>
              <input class="flex3" type="range" min="1" id="splitRange">
            </div>
          </form>`,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: 'Submit',
              callback: async (html) => {
                const quantityVal = +html.find('#splitRange').val();
                if (quantityVal >= itemQty) return item.delete();
                await actor.updateEmbeddedDocuments('Item', [
                  { _id: item._id, 'data.quantity': itemQty - quantityVal },
                ]);
              },
            },
            two: {
              icon: '<i class="fas fa-times"></i>',
              label: 'Cancel',
            },
          },
          render: (html) => {
            const initialVal = itemQty;
            const splitRange = html.find('#splitRange');
            splitRange.attr('max', itemQty);
            splitRange.val(initialVal);
            const splitValue = html.find('#splitValue');
            splitValue.html(initialVal);
            splitRange.on('input', () => {
              splitValue.html(splitRange.val());
            });
          },
        }).render(true);
      }
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    console.log('formData', formData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
