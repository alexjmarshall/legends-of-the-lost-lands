import { EntitySheetHelper } from '../helper.js';
import * as Constant from '../constants.js';
import * as CLASSES from '../rules/classes/index.js';
import { origins } from '../rules/origin.js';
import * as RACES from '../rules/races/index.js';
import { rollDice } from '../dice.js';
import { UNITS_OF_ACCOUNT } from '../rules/currency.js';
import { sizes } from '../rules/size.js';
import { VOICE_SOUNDS, playSound, voiceTypesByGender } from '../sound.js';
import { insertSpaceBeforeCapitalUnlessSlash } from '../string.js';
import { skills, SKILL_CATEGORIES } from '../rules/skills.js';
import { ABILITIES, abilities, FULL_ABILITIES, getScoreMod } from '../rules/abilities.js';
import { alignmentDescriptions } from '../rules/alignments.js';
import { portraits, basePath } from '../portrait.js';
import { getLevelUpdates, updateLevel } from '../actor-helper.js';
import { cloneItem } from '../item-helper.js';
import { confirmDialog } from '../dialog.js';

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
      closeOnSubmit: false,
    });
  }

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
    const selectedClass = Object.keys(allowedClassesObj)[0];
    context.classDescription = this._getClassDescription(selectedClass);

    // Alignment
    const allowedAlignments = this._getAllowedAlignments(selectedClass);
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
    context.spAbbr = UNITS_OF_ACCOUNT.sp.abbr;

    context.size = RACES[context.systemData.race].size();

    context.hp = this._getStartingHp(selectedOrigin, selectedClass, context.size, context.abilities.con);

    return context;
  }

  _getClassDescription(className) {
    if (className.includes('/')) {
      return {
        description: `<p>Multi-classed characters have each class's features and skills, and use the best saves, armor and weapon selection of either. (Note that spellcasting and many skills are penalized by wearing heavy armor).</p><p>Hit die is the average rounded down to the nearest whole number (e.g. d5 for classes of d6 and d4 hit dice).</p><p>XP required is the sum of each class's requirement at each level (e.g. level 2 for a Fighter/Mage will require 1000 XP + 1200 XP = 2200 XP).</p>`,
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
    <p><label>XP required:</label> ${selectedClass.XP_REQS[1]}</p>
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
      description: `<p>${selectedClass.description}</p>`,
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
    const firstLvlHp = className.includes('/')
      ? this._getMultiClassFirstLvlHp(className)
      : CLASSES[className].firstLvlHp;
    const conMod = getScoreMod(conScore);
    const hpGetter = () => Math.floor(rollDice(firstLvlHp) + origins[origin].hpBonus + sizes[size].hpModifier + conMod);
    return this._getOrSetFlag(`hp_${origin}${className}${size}${conScore}`, hpGetter);
  }

  _getStartingFp(className) {
    let classFactor = 0;
    if (className.includes('/')) {
      const classes = className.split('/').map((c) => CLASSES[c]);
      classFactor = CLASSES.MultiClass.getFpReserve(classes);
    } else {
      const cls = CLASSES[className];
      classFactor = cls.fpReserve;
    }
    return 30 + classFactor;
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

  _getAllowedAlignments(className) {
    // if multiclass, return only alignments that are allowed by both classes
    if (className.includes('/')) {
      const classes = className.split('/');
      return CLASSES[classes[0]].alignments.filter((a) => CLASSES[classes[1]].alignments.includes(a));
    }
    return CLASSES[className].alignments;
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
    const startingSpDesc = ` ${selectedOrigin.startingSp} ${UNITS_OF_ACCOUNT.sp.abbr}`;
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

    return abilitySets;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  // TODO check for reciprocal updaters
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    const tabLinks = html.find('.sheet-tabs a.item');
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

    // set all tabs after the one after the one with class of .active to .disabled
    // and remove .disabled from all tabs before the one with class of .active
    const setDisabledTabs = (activeTab) => {
      const allTabs = $(activeTab).parent().children();
      const activeTabIndex = allTabs.index(activeTab);
      allTabs.removeClass('disabled');
      allTabs.slice(activeTabIndex + 2).addClass('disabled');
    };
    setDisabledTabs(tabLinks.filter('.active')[0]);
    tabLinks.click((event) => {
      setDisabledTabs(event.currentTarget);
    });

    const portraitImgClickHandler = (event) => {
      const img = $(event.currentTarget);
      html.find('img.profile-img').attr('src', img.attr('src'));
      html.find('input[name="img"]').val(img.attr('src'));
    };

    // Age input changes
    ageInput.change((event) => {
      const age = event.target.value;
      html.find('span.data-fields-age').text(age);
    });
    // Height input changes
    heightInput.change((event) => {
      const height = event.target.value;
      html.find('span.data-fields-height').text(this._getHeightAndFeetInchesAsString(height));
    });
    // Weight input changes
    weightInput.change((event) => {
      const weight = event.target.value;
      html.find('span.data-fields-weight').text(weight);
    });
    // SP input changes
    spInput.change((event) => {
      const sp = event.target.value;
      html.find('span.data-fields-sp').text(sp);
    });
    // HP input changes
    hpValueInput.change((event) => {
      const hp = event.target.value;
      html.find('span.data-fields-hp').text(hp);
      // update hp max
      hpMaxInput.val(hp).trigger('change');
    });
    // Size input changes
    sizeInput.change((event) => {
      const size = event.target.value;
      html.find('span.data-fields-size').text(size);
    });

    // Gender-select changes
    genderSelect.change((event) => {
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
      html.find('img.profile-img').attr('src', `${basePath}${portraitOptions[0]}`);
    });

    // Select-race changes
    raceSelect.change((event) => {
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
      const alignment = event.target.value;
      // update alignment description
      const alignmentDescription = alignmentDescriptions[alignment];
      html.find('div.alignment-description').text(alignmentDescription);
    });

    // Select-abilities changes
    abilitiesSelect.change((event) => {
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
      const className = event.target.value;
      // update class description
      const { description, stats, specializedSkillsDesc, proficientSkillsDesc, featureListItems } =
        this._getClassDescription(className);
      html.find('div.class-description-desc').html(description);
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
      const allowedAlignments = this._getAllowedAlignments(className);
      const alignmentOptions = this._getAlignmentOptions(allowedAlignments);
      alignmentSelect.html(alignmentOptions.options).trigger('change');
      // update size attribute of alignmentSelect
      alignmentSelect.attr('size', alignmentOptions.size);
      // if size = 1, disable alignmentSelect
      alignmentSelect.prop('disabled', alignmentOptions.size === 1);
    });

    // Select-origin changes
    originSelect.change((event) => {
      const origin = event.target.value;
      // update origin description
      const { originDescription, hpBonusDesc, startingSpDesc, listItems } = this._getOriginDescription(origin);
      html.find('p.origin-description-desc').text(originDescription);
      html.find('span.origin-hp-bonus').text(hpBonusDesc);
      html.find('span.origin-starting-sp').text(startingSpDesc);
      html.find('span.origin-description-list').text(listItems);
      // update starting SP
      const sp = this._getStartingSp(origin);
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

  _coerceTypes(formData) {
    formData['data.age'] = Number(formData['data.age']);
    formData['data.attributes.ability_scores.str.value'] = Number(formData['data.attributes.ability_scores.str.value']);
    formData['data.attributes.ability_scores.int.value'] = Number(formData['data.attributes.ability_scores.int.value']);
    formData['data.attributes.ability_scores.dex.value'] = Number(formData['data.attributes.ability_scores.dex.value']);
    formData['data.attributes.ability_scores.con.value'] = Number(formData['data.attributes.ability_scores.con.value']);
    formData['data.attributes.ability_scores.wis.value'] = Number(formData['data.attributes.ability_scores.wis.value']);
    formData['data.attributes.ability_scores.cha.value'] = Number(formData['data.attributes.ability_scores.cha.value']);
    formData['data.height'] = Number(formData['data.height']);
    formData['data.weight'] = Number(formData['data.weight']);
    formData['data.hp.value'] = Number(formData['data.hp.value']);
    formData['data.hp.max'] = Number(formData['data.hp.max']);
    formData['sp'] = Number(formData['sp']);
    return formData;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    // fix types
    formData = this._coerceTypes(formData);
    formData['data.max_age'] = RACES[formData['data.race']].randomMaxAge();
    const startingFp = this._getStartingFp(formData['data.class']);
    formData['data.fp.value'] = startingFp;
    formData['data.fp.max'] = startingFp;

    // determine handedness
    const leftHanded = Math.random() < 0.1;
    if (leftHanded) formData['data.right_handed'] = false;

    const firstLevelUpdates = getLevelUpdates(this.actor, 1, formData);

    // add SP item
    const spItem = game.items.getName(UNITS_OF_ACCOUNT.sp.name);
    if (!spItem) {
      ui.notifications.error(`Could not find ${UNITS_OF_ACCOUNT.sp.name} in game items!`);
    } else {
      const createData = cloneItem(spItem);
      createData.data.quantity = formData['sp'];
      firstLevelUpdates.item.push(createData);
    }
    delete formData['sp'];

    formData = {
      ...formData,
      ...firstLevelUpdates.actor,
    };

    const yesCallback = async () => {
      this.actor.sheet.close();
      this.actor._sheet = null;
      await this.actor.setFlag('core', 'sheetClass', 'brigandine.SimpleActorSheet');
      await updateLevel(this.actor, formData, firstLevelUpdates.item);
    };
    // confirm with user
    confirmDialog(
      'Confirm Character Creation',
      `Are you sure you want to create ${formData.name || 'this character'} and begin the game?`,
      yesCallback
    );

    return;
  }
}
