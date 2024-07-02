/* eslint-disable no-console */
/* eslint-disable no-undef */
import { SimpleActor } from './actor.js';
import { SimpleItem } from './item.js';
import { SimpleItemSheet } from './sheets/item-sheet.js';
import { SpellItemSheet } from './sheets/spell-item-sheet.js';
import { FeatureItemSheet } from './sheets/feature-item-sheet.js';
import { SimpleActorSheet } from './sheets/actor-sheet.js';
import { ContainerActorSheet } from './sheets/container-actor-sheet.js';
import { CreateActorSheet } from './sheets/create-actor-sheet.js';
import { MerchantActorSheet } from './sheets/merchant-actor-sheet.js';
import { PartyActorSheet } from './sheets/party-actor-sheet.js';
import { preloadHandlebarsTemplates } from './templates.js';
import * as Macro from './macro.js';
import * as Constant from './constants.js';
import * as ITEM from './item-helper.js';
import * as SPELLS from './rules/spells.js';
import * as Util from './utils.js';
import { TimeQ } from './time-queue.js';
import * as Exhaustion from './exhaustion.js';
import * as Race from './rules/races/index.js';
import * as Overrides from './overrides/index.js';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once('init', async function () {
  console.log(`Initializing Brigandine System`);

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d6',
    decimals: 2,
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = SimpleActor;
  CONFIG.Item.documentClass = SimpleItem;

  // Define custom status effects
  CONFIG.statusEffects = Constant.STATUS_EFFECTS;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('brigandine', SimpleActorSheet, { makeDefault: true });
  Actors.registerSheet('brigandine', CreateActorSheet, { makeDefault: false });
  Actors.registerSheet('brigandine', ContainerActorSheet, { makeDefault: false });
  Actors.registerSheet('brigandine', MerchantActorSheet, { makeDefault: false });
  Actors.registerSheet('brigandine', PartyActorSheet, { makeDefault: false });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('brigandine', SimpleItemSheet, { makeDefault: true });
  Items.registerSheet('brigandine', SpellItemSheet, { makeDefault: false });
  Items.registerSheet('brigandine', FeatureItemSheet, { makeDefault: false });

  // Register system settings
  game.settings.register('brigandine', 'macroShorthand', {
    name: 'SETTINGS.SimpleMacroShorthandN',
    hint: 'SETTINGS.SimpleMacroShorthandL',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  // Register initiative setting
  game.settings.register('brigandine', 'initFormula', {
    name: 'SETTINGS.SimpleInitFormulaN',
    hint: 'SETTINGS.SimpleInitFormulaL',
    scope: 'world',
    type: String,
    default: '1d6',
    config: true,
    onChange: (formula) => _simpleUpdateInit(formula, true),
  });

  // required Clo setting
  game.settings.register('brigandine', 'temp', {
    name: 'World Temperature',
    hint: 'Current ambient temperature in Celsius',
    scope: 'world',
    type: Number,
    default: 1,
    config: true,
  });

  // Retrieve and assign the initiative formula setting
  const initFormula = game.settings.get('brigandine', 'initFormula');
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post notifications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if (!isValid) {
      if (notify) ui.notifications.error(`${game.i18n.localize('SIMPLE.NotifyInitFormulaInvalid')}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  // Register time queue setting
  game.settings.register('brigandine', 'timeQ', {
    name: 'Time Queue',
    hint: "Don't touch this",
    scope: 'world',
    type: String,
    default: '[]',
    config: false,
  });

  game.brigandine = {
    SimpleActor,
    Macro,
    Util,
    Constant,
    ITEM,
    SPELLS,
    TimeQ,
    Race,
  };

  /**
   * Slugify a string
   */
  Handlebars.registerHelper('slugify', function (value) {
    return value.slugify({ strict: true });
  });

  // Check if value equals arg
  Handlebars.registerHelper('ifeq', function (arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  // Check if value in array
  Handlebars.registerHelper('ifin', function (elem, list, options) {
    if (list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // Check if value not in array
  Handlebars.registerHelper('ifnotin', function (elem, list, options) {
    if (list.indexOf(elem) < 0) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // Preload template partials
  await preloadHandlebarsTemplates();

  // Replace core class functions with libWrapper
  libWrapper.register('brigandine', 'KeyboardManager.prototype._onDigit', Overrides._onDigit, 'OVERRIDE');
  libWrapper.register('brigandine', 'Roll.expandInlineResult', Overrides.expandInlineResult, 'OVERRIDE');
  libWrapper.register('brigandine', 'Actor.prototype.modifyTokenAttribute', Overrides.modifyTokenAttribute, 'OVERRIDE');
  libWrapper.register('brigandine', 'Macro.prototype._executeChat', Overrides._executeChat, 'OVERRIDE');
  libWrapper.register('brigandine', 'Macro.prototype._executeScript', Overrides._executeScript, 'OVERRIDE');
  libWrapper.register('brigandine', 'Macro.prototype.execute', Overrides.execute, 'OVERRIDE');
  libWrapper.register('brigandine', 'TextEditor._onClickInlineRoll', Overrides._onClickInlineRoll, 'OVERRIDE');
  libWrapper.register('brigandine', 'ActorSheet.prototype._onDropItem', Overrides._onDropItem, 'OVERRIDE');
  libWrapper.register('brigandine', 'ActorSheet.prototype._onSortItem', Overrides._onSortItem, 'OVERRIDE');
  libWrapper.register('brigandine', 'Hotbar.prototype._onClickMacro', Overrides._onClickMacro, 'OVERRIDE');
  libWrapper.register('brigandine', 'ChatLog.prototype._onDiceRollClick', Overrides._onDiceRollClick, 'OVERRIDE');
  // Add new core class functions
  GridLayer.prototype.measureDistanceGrid = Overrides.measureDistanceGrid;
});

Hooks.on('ready', () => {
  if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
    ui.notifications.error("Brigandine system requires the 'libWrapper' module. Please install and activate it.");
  }

  // update party actors' MV
  // TODO need to do this here? or on update an actor's MV
  // TODO maybe scrap this -- make macro to update party's MV rate
  const partyActors = game.actors.filter((a) => a.type === 'party');
  partyActors.forEach((p) => {
    const data = p.data.data;
    const attrs = data.attributes;
    const membersVal = attrs.members.value || '';
    const members = Util.getArrFromCSV(membersVal)
      .map((name) => game.actors.getName(name))
      .filter((a) => a);
    const memberMVs = members.map((a) => +a.data.data.mv).filter((m) => m != null && !isNaN(m));
    const slowestMV = memberMVs.length ? Math.min(...memberMVs) : Constant.DEFAULT_BASE_MV;
    const mv = slowestMV || Constant.DEFAULT_BASE_MV;
    console.log(`Updating party ${p.data.name} MV to ${mv}`, members);
    data.mv = mv;
  });

  const removeInvalidEffects = async (time) => {
    const allActors = game.actors;

    return Promise.all(
      allActors.map(async (actor) => {
        try {
          const effects = actor.effects.contents;
          const effectIds = [];
          for (const effect of effects) {
            const duration = effect.data.duration || {};
            const invalid = duration.startTime > time || duration.startTime + (duration.seconds || 0) < time;
            if (invalid && effect._id) effectIds.push(effect._id);
          }
          return await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
        } catch (error) {
          ui.notifications.error(`Problem removing effect from ${actor.name}. Refresh!`);
          throw error;
        }
      })
    );
  };

  Hooks.on(SimpleCalendar?.Hooks.Ready, async () => {
    if (SimpleCalendar.api.isPrimaryGM()) {
      TimeQ.init();
      const now = Util.now();
      await Exhaustion.syncExhaustionClocks(now, true);
      await removeInvalidEffects(now);
    }

    // eslint-disable-next-line no-console
    console.log(`Simple Calendar | is ready!`);

    let locked = false;
    Hooks.on(SimpleCalendar.Hooks.DateTimeChange, async (data) => {
      if (locked || !SimpleCalendar.api.isPrimaryGM()) return;
      locked = true;

      const oldTime = game.time.worldTime;
      const timeDiff = data.diff;
      const newTime = oldTime + timeDiff;

      // if going back in time, clear event queue,
      //  remove effects that started later than new time
      //  and set flag to ensure clock events are rescheduled
      let resetClocks = false;
      if (newTime < oldTime) {
        await TimeQ.clear();
        resetClocks = true;
      }

      await Exhaustion.syncExhaustionClocks(newTime, resetClocks);

      for await (const event of TimeQ.eventsBefore(newTime)) {
        let macro = game.macros.find((m) => m._id === event.macroId);
        // add oldTime and newTime to macro scope
        Object.assign(event.scope, { oldTime, newTime });
        macro && (await macro.execute(event.scope));
      }

      await removeInvalidEffects(newTime);

      locked = false;
    });
  });
});

/**
 * Macrobar hook
 */
Hooks.on('hotbarDrop', (bar, data, slot) => Macro.createBrigandineMacro(data, slot));

/**
 * Adds the actor template context menu
 */
Hooks.on('getActorDirectoryEntryContext', (html, options) => {
  // Define an actor as a template.
  options.push({
    name: game.i18n.localize('SIMPLE.DefineTemplate'),
    icon: '<i class="fas fa-stamp"></i>',
    condition: (li) => {
      const actor = game.actors.get(li.data('entityId'));
      return !actor.getFlag('brigandine', 'isTemplate');
    },
    callback: (li) => {
      const actor = game.actors.get(li.data('entityId'));
      actor.setFlag('brigandine', 'isTemplate', true);
    },
  });

  // Undefine an actor as a template
  options.push({
    name: game.i18n.localize('SIMPLE.UnsetTemplate'),
    icon: '<i class="fas fa-times"></i>',
    condition: (li) => {
      const actor = game.actors.get(li.data('entityId'));
      return actor.getFlag('brigandine', 'isTemplate');
    },
    callback: (li) => {
      const actor = game.actors.get(li.data('entityId'));
      actor.setFlag('brigandine', 'isTemplate', false);
    },
  });
});

/**
 * Adds the item template context menu
 */
Hooks.on('getItemDirectoryEntryContext', (html, options) => {
  // Define an item as a template
  options.push({
    name: game.i18n.localize('SIMPLE.DefineTemplate'),
    icon: '<i class="fas fa-stamp"></i>',
    condition: (li) => {
      const item = game.items.get(li.data('entityId'));
      return !item.getFlag('brigandine', 'isTemplate');
    },
    callback: (li) => {
      const item = game.items.get(li.data('entityId'));
      item.setFlag('brigandine', 'isTemplate', true);
    },
  });

  // Undefine an item as a template
  options.push({
    name: game.i18n.localize('SIMPLE.UnsetTemplate'),
    icon: '<i class="fas fa-times"></i>',
    condition: (li) => {
      const item = game.items.get(li.data('entityId'));
      return item.getFlag('brigandine', 'isTemplate');
    },
    callback: (li) => {
      const item = game.items.get(li.data('entityId'));
      item.setFlag('brigandine', 'isTemplate', false);
    },
  });
});

// Play 'what' voice sound on token selection
// Deselect merchants on token selection
Hooks.on('controlToken', (token, selected) => {
  if (!selected) return;
  if (!game.user.isGM && token.actor.type === 'merchant') return token.release();
  const actor = token.actor;
  const actorHp = actor.data.data.hp?.value;
  if (+actorHp < 1) return;
  Util.playVoiceSound(Constant.VOICE_MOODS.what, actor, token, { push: false, bubble: false, chance: 0.5 });
});

// Play 'ok' voice sound on token movement
Hooks.on('updateToken', (token, change) => {
  if (change.x && change.y) {
    Util.playVoiceSound(Constant.VOICE_MOODS.ok, token.actor, token.data, { push: true, bubble: false, chance: 0.7 });
  }
});

// TODO extract code to rules/actor functions
// TODO if modifying actor main hp directly, also modify location hp proportionately (up to max)
// TODO if modifying actor location hp directly, also modify actor main hp proportionately
// Hooks.on('preUpdateActor', (actor, change) => {
//   const hpUpdate = change.data?.hp?.value;
//   const targetHp = actor.data.data.hp?.value;
//   const maxHp = actor.data.data.hp?.max;
//   const targetXp = actor.data.data.xp_req?.value;
//   const xpUpdate = change.data?.xp_req?.value;
//   const maxXp = actor.data.data.xp_req?.max;
//   const token = Util.getTokenFromActor(actor);
//   const maxNegHP =
//     actor.type === 'humanoid' || actor.type === 'character'
//       ? 0 - (actor.data.data.attributes.ability_scores?.con?.value ?? 10)
//       : 0;

//   // level up sound
//   if (targetXp < maxXp && xpUpdate >= maxXp) {
//     Util.playSound('level_up', null, { push: false, bubble: false });
//   }

//   if (hpUpdate < maxNegHP && targetHp >= maxNegHP) {
//     Util.macroChatMessage(
//       actor,
//       {
//         flavor: 'Death',
//         content: `${actor.name} dies.${actor.type === 'character' ? ' May the Gods have mercy.' : ''}`,
//       },
//       false
//     );
//     return;
//   }

//   if (hpUpdate <= 0 && targetHp > 0) {
//     Util.macroChatMessage(
//       actor,
//       {
//         flavor: 'Incapacitated',
//         content: `${actor.name} collapses.`,
//       },
//       false
//     );
//   }

//   if (targetHp < 1) return;

//   // Play 'hurt'/'death' voice sounds on HP decrease
//   if (hpUpdate < 0) {
//     Util.playVoiceSound(Constant.VOICE_MOODS.death, actor, token, { push: true, bubble: true, chance: 1 });
//   } else if (hpUpdate < maxHp / 2 && targetHp >= maxHp / 2) {
//     Util.playVoiceSound(Constant.VOICE_MOODS.dying, actor, token, { push: true, bubble: true, chance: 0.7 });
//   } else if (hpUpdate > 0 && hpUpdate < targetHp) {
//     Util.playVoiceSound(Constant.VOICE_MOODS.hurt, actor, token, { push: true, bubble: true, chance: 0.5 });
//   }
// });

// TODO break grapple if one hand no longer free
// Hooks.on('preUpdateItem', (item, change) => {
//   let heldQtyLimit = 1;
//   const charSize = Constant.SIZE_VALUES[item.actor?.data.data.attributes.size?.value] ?? 2;
//   const itemSize = Constant.SIZE_VALUES[item.data.data.attributes.size?.value];
//   if (item.name.toLowerCase().includes('javelin') && charSize > itemSize) heldQtyLimit = 3;
//   else if (itemSize < 1 && charSize > itemSize) heldQtyLimit = 2;

//   const invalidHold =
//     (item.data.data.held_offhand || item.data.data.held_mainhand) &&
//     (change.data?.quantity < 1 || change.data?.quantity > heldQtyLimit);
//   if (invalidHold) {
//     change.data.held_offhand = false;
//     change.data.held_mainhand = false;
//   }
//   const wearQtyLimit = 1; // TODO for invalid hold and invalid wear, need to use same function as in actor.js
//   const invalidWear = item.data.data.worn && (change.data?.quantity < 1 || change.data?.quantity > wearQtyLimit);
//   if (invalidWear) {
//     change.data.worn = false;
//   }

//   // TODO cleanup and use default values
//   if (change.data?.held_offhand != null || change.data?.held_mainhand != null) {
//     // || change.data?.data?.attributes?.atk_modes
//     const atkModes =
//       item.data?.data?.attributes?.atk_modes?.value
//         ?.split(',')
//         .map((t) => t.toLowerCase().replace(/\s/g, ''))
//         .filter((t) => Object.keys(Constant.ATK_MODES).includes(t)) || [];

//     if (atkModes.length) {
//       change.data.atk_mode = atkModes[0];
//       change.data.atk_height = 'mid';
//       change.data.atk_style = 'stable';
//       change.data.atk_timing = 'attack';
//     } else {
//       change.data.atk_mode = null;
//       change.data.atk_height = null;
//       change.data.atk_style = null;
//       change.data.atk_timing = null;
//     }
//   }
//   // TODO check for shield type
//   if (change.data?.worn != null && !!item.data?.data?.attributes?.shape) {
//     change.data.held_height = 'mid';
//     change.data.shield_style = 'stable';
//   }
// });

// Hooks.on('preCreateActiveEffect', (activeEffect, data, options, userId) => {
//   if (!game.user.isGM) return false;
// });

// Hooks.on('createActiveEffect', (activeEffect, data, options, userId) => {
//   const actor = activeEffect.parent;
//   const effect = activeEffect.data.label;

//   switch (effect) {
//     case 'Dead':
//       return Exhaustion.deleteAllDiseases(actor);
//     case 'Rest':
//       return Macro.selectRestDice(actor);
//   }
// });

// Hooks.on('deleteActiveEffect', async (activeEffect, data, options, userId) => {
//   if (!game.user.isGM) return;
//   const actor = activeEffect.parent;
//   const effect = activeEffect.data.label;

//   const applyRest = async (restDice) => {
//     const sleepStartTime = activeEffect.data.duration.startTime;
//     const sleepEndTime = Util.now();
//     return Macro.applyRestOnWake(actor, sleepStartTime, sleepEndTime, restDice);
//   };

//   switch (effect) {
//     case 'Asleep':
//       return applyRest();
//     case 'Rest': {
//       const restDice = actor.getFlag('brigandine', 'restDice');
//       await actor.unsetFlag('brigandine', 'restDice');
//       await Exhaustion.resetExhaustionType(actor, 'hunger');
//       await Exhaustion.resetExhaustionType(actor, 'thirst');
//       return applyRest(restDice);
//     }
//   }
// });
