import { SimpleActor } from "./actor.js";
import { SimpleItem } from "./item.js";
import { SimpleItemSheet } from "./item-sheet.js";
import { SpellItemSheet } from "./spell-item-sheet.js";
import { FeatureItemSheet } from "./feature-item-sheet.js";
import { SimpleActorSheet } from "./actor-sheet.js";
import { ContainerActorSheet } from "./container-actor-sheet.js";
import { MerchantActorSheet } from "./merchant-actor-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import * as Macro from "./macro.js";
import * as Constant from "./constants.js";
import * as Util from "./utils.js";
import { TimeQ } from './time-queue.js';
import * as Fatigue from './fatigue.js';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Simple Lostlands System`);

  /**
   * Set an initiative formula for the system. This will be updated later.
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d6",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = SimpleActor;
  CONFIG.Item.documentClass = SimpleItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("lostlands", SimpleActorSheet, { makeDefault: true });
  Actors.registerSheet("lostlands", ContainerActorSheet, { makeDefault: false });
  Actors.registerSheet("lostlands", MerchantActorSheet, { makeDefault: false });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("lostlands", SimpleItemSheet, { makeDefault: true });
  Items.registerSheet("lostlands", SpellItemSheet, { makeDefault: false });
  Items.registerSheet("lostlands", FeatureItemSheet, { makeDefault: false });

  // Register system settings
  game.settings.register("lostlands", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  // Register initiative setting
  game.settings.register("lostlands", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d6",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // required Clo setting TODO be able to set this as environmental temperature, possibly reset every day by random modifier applied to reqClo by season
  game.settings.register("lostlands", "requiredClo", {
    name: "Required Clo",
    hint: "The warmth of clothing required to not suffer exposure damage. Equal to 36 - 10 - environmental temp.",
    scope: "world",
    type: Number,
    default: 1,
    config: true,
  });

  // Retrieve and assign the initiative formula setting
  const initFormula = game.settings.get("lostlands", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post notifications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    const isValid = Roll.validate(formula);
    if ( !isValid ) {
      if ( notify ) ui.notifications.error(`${game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid")}: ${formula}`);
      return;
    }
    CONFIG.Combat.initiative.formula = formula;
  }

  // Register time queue setting
  game.settings.register("lostlands", "timeQ", {
    name: "Time Queue",
    hint: "Don't touch this",
    scope: "world",
    type: String,
    config: false
  });

  game.lostlands = {
    SimpleActor,
    Macro,
    Util,
    Constant,
    TimeQ
  };

  /**
   * Slugify a string
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });

  // Check if value equals arg
  Handlebars.registerHelper('ifeq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });

  // Check if value in array
  Handlebars.registerHelper('ifin', function(elem, list, options) {
    if(list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // Check if value not in array
  Handlebars.registerHelper('ifnotin', function(elem, list, options) {
    if(list.indexOf(elem) < 0) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // Preload template partials
  await preloadHandlebarsTemplates();
});


Hooks.on("ready", () => {

  const removeInvalidEffects = async (time) => {
    const allChars = game.actors.filter(a => a.type === 'character');

    return Promise.all(
      allChars.map(async (char) => {
        try {
          const effects = char.effects.contents;
          for (const effect of effects) {
            const invalid = effect.data.duration?.startTime > time;
            if (invalid) {
              await effect.delete();
              await Util.wait(200);
            }
          }
        } catch (error) {
          ui.notifications.error(`Problem removing conditions from ${actor.name}. Refresh!`);
          throw error;
        }
      })
    );
  }

  Hooks.on(SimpleCalendar.Hooks.Ready, async () => {

    if (SimpleCalendar.api.isPrimaryGM()) {
      TimeQ.init();
      const now = Util.now();
      await Fatigue.syncFatigueClocks(now, true);
    }
    
    console.log(`Simple Calendar | is ready!`);

    let locked = false;
    Hooks.on(SimpleCalendar.Hooks.DateTimeChange, async (data) => {

      if ( locked || !SimpleCalendar.api.isPrimaryGM() ) return;
      locked = true;

      const oldTime = game.time.worldTime;
      const timeDiff = data.diff;
      const newTime =  oldTime + timeDiff;

      // if going back in time, clear event queue,
      //  remove effects that started later than new time
      //  and set flag to ensure clock events are rescheduled
      let resetClocks = false;
      if (newTime < oldTime) {
        await TimeQ.clear();
        await removeInvalidEffects(newTime);
        resetClocks = true;
      }

      await Fatigue.syncFatigueClocks(newTime, resetClocks);

      for await (const event of TimeQ.eventsBefore(newTime)) {
        let macro = game.macros.find(m => m._id === event.macroId);
        // add oldTime and newTime to macro scope
        Object.assign(event.scope, {oldTime, newTime});
        macro && await macro.execute(event.scope);
      }

      // sync requiredClo to current season when day changes //TODO weather macro
      const oldDay = SimpleCalendar.api.timestampToDate(oldTime)?.day;
      const newDay = SimpleCalendar.api.timestampToDate(newTime)?.day;
      if (oldDay != newDay) {
        const reqClo = Fatigue.reqClo();
        const currentReqCloSetting = game.settings.get("lostlands", "requiredClo");
        if (reqClo != currentReqCloSetting) {
          await game.settings.set("lostlands", "requiredClo", reqClo);
        }
      }

      locked = false;
    });
  });
});


/**
 * Macrobar hook
 */
Hooks.on("hotbarDrop", (bar, data, slot) => Macro.createLostlandsMacro(data, slot));

/**
 * Adds the actor template context menu
 */
Hooks.on("getActorDirectoryEntryContext", (html, options) => {
  // Define an actor as a template.
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("entityId"));
      return !actor.getFlag("lostlands", "isTemplate");
    },
    callback: li => {
      const actor = game.actors.get(li.data("entityId"));
      actor.setFlag("lostlands", "isTemplate", true);
    }
  });

  // Undefine an actor as a template
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const actor = game.actors.get(li.data("entityId"));
      return actor.getFlag("lostlands", "isTemplate");
    },
    callback: li => {
      const actor = game.actors.get(li.data("entityId"));
      actor.setFlag("lostlands", "isTemplate", false);
    }
  });
});

/**
 * Adds the item template context menu
 */
Hooks.on("getItemDirectoryEntryContext", (html, options) => {
  // Define an item as a template
  options.push({
    name: game.i18n.localize("SIMPLE.DefineTemplate"),
    icon: '<i class="fas fa-stamp"></i>',
    condition: li => {
      const item = game.items.get(li.data("entityId"));
      return !item.getFlag("lostlands", "isTemplate");
    },
    callback: li => {
      const item = game.items.get(li.data("entityId"));
      item.setFlag("lostlands", "isTemplate", true);
    }
  });

  // Undefine an item as a template
  options.push({
    name: game.i18n.localize("SIMPLE.UnsetTemplate"),
    icon: '<i class="fas fa-times"></i>',
    condition: li => {
      const item = game.items.get(li.data("entityId"));
      return item.getFlag("lostlands", "isTemplate");
    },
    callback: li => {
      const item = game.items.get(li.data("entityId"));
      item.setFlag("lostlands", "isTemplate", false);
    }
  });
});

// Play 'what' voice sound on token selection
// Deselect merchants on token selection
Hooks.on("controlToken", (token, selected) => {
  if (!selected) return;
  if (!game.user.isGM && token.actor.type === 'merchant') return token.release();
  const actor = token.actor;
  const actorHp = actor.data.data.hp?.value;
  if ( +actorHp < 1 ) return;
  Util.playVoiceSound(Constant.VOICE_MOODS.WHAT, actor, token, {push: false, bubble: false, chance: 0.5});
});

// Play 'ok' voice sound on token movement
Hooks.on("updateToken", (token, moved, data) => {
  if ( !moved.x && !moved.y ) return;
  Util.playVoiceSound(Constant.VOICE_MOODS.OK, token.actor, token.data, {push: true, bubble: false, chance: 0.7});
});

// Play 'hurt'/'death' voice sounds on HP decrease
Hooks.on("preUpdateActor", (actor, change) => {
  const hpUpdate = change.data?.hp?.value;
  const targetHp = actor.data.data.hp?.value;
  const maxHp = actor.data.data.hp?.max;
  const token = Util.getTokenFromActor(actor);

  if (hpUpdate <= -10  && targetHp > 0 ) {
    Util.macroChatMessage(actor, {
      flavor: 'Instant Death', 
      content: `${actor.name} dies instantly.`,
      type: CONST.CHAT_MESSAGE_TYPES.IC,
    }, false);
    return;
  }

  if (hpUpdate <= -10  && targetHp > -10 ) {
    Util.macroChatMessage(actor, {
      flavor: 'Death', 
      content: `${actor.name} dies.`,
      type: CONST.CHAT_MESSAGE_TYPES.IC,
    }, false);
    return;
  }

  if ( hpUpdate <= 0 && targetHp > 0 ) {
    Util.macroChatMessage(actor, {
      flavor: 'Incapacitated', 
      content: `${actor.name} collapses.`,
      type: CONST.CHAT_MESSAGE_TYPES.IC,
    }, false);
  }

  if (targetHp < 1) return;

  if (hpUpdate < 0) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DEATH, actor, token, {push: true, bubble: true, chance: 1});
  } else if ( hpUpdate < maxHp / 2 && targetHp >= maxHp / 2 ) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DYING, actor, token, {push: true, bubble: true, chance: 0.7});
  } else if (hpUpdate > 0 && hpUpdate < targetHp) {
    Util.playVoiceSound(Constant.VOICE_MOODS.HURT, actor, token, {push: true, bubble: true, chance: 0.5});
  }
});

Hooks.on("preCreateItem", (item, data) => {
  if (data.data?.attributes?.wearable?.value != null) {
    data.data.worn = false;
  }
  if (data.data?.attributes?.holdable?.value != null) {
    data.data.held_right = false;
    data.data.held_left = false;
  }
});

Hooks.on("preUpdateItem", (item, change) => {
  // reset held/worn values to false when changing holdable/wearable attribute or quantity
  let heldQtyLimit = 1;
  const charSize = Constant.SIZE_VALUES[item.actor?.data.data.attributes.size?.value] ?? 2;
  const itemSize = Constant.SIZE_VALUES[item.data.data.attributes.size?.value];
  if (item.name.toLowerCase().includes('javelin') && charSize > itemSize) heldQtyLimit = 3;
  else if (itemSize === 0 && charSize > itemSize) heldQtyLimit = 2;

  const invalidHold = (item.data.data.held_left || item.data.data.held_right) &&
    (change.data?.quantity < 1 || change.data?.quantity > heldQtyLimit);
  if (change.data?.attributes?.holdable?.value != null || invalidHold) {
    change.data.held_left = false;
    change.data.held_right = false;
  }
  const wearQtyLimit = 1;
  const invalidWear = item.data.data.worn && (change.data?.quantity < 1 || change.data?.quantity > wearQtyLimit);
  if (change.data?.attributes?.wearable?.value != null || invalidWear) {
    change.data.worn = false;
  }
  // reset atk mode if changing held status
  if (change.data?.held_left != null || change.data?.held_right != null) {
    const atkModes = item.data?.data?.attributes?.atk_modes?.value?.split(',').map(t => t.toLowerCase().replace(/\s/g, "")).filter(t => t) || [];
    if (atkModes.length) {
      change.data.atk_mode = atkModes[0];
    }
  }
});

Hooks.on("preCreateActiveEffect", (activeEffect, data, options, userId) => {
  if (!game.user.isGM) return false;
});

Hooks.on("createActiveEffect", (activeEffect, data, options, userId) => {
  const actor = activeEffect.parent;
  const effect = activeEffect.data.label;

  switch (effect) {
    case 'Dead':
      return Fatigue.deleteAllDiseases(actor);
    case 'Rest':
      return Macro.selectRestDice(actor);
  }
});

Hooks.on("deleteActiveEffect", async (activeEffect, data, options, userId) => {
  if (!game.user.isGM) return;
  const actor = activeEffect.parent;
  const effect = activeEffect.data.label;

  const applyRest = async (restDice) => {
    const sleepStartTime = activeEffect.data.duration.startTime;
    const sleepEndTime = Util.now();
    return Macro.applyRestOnWake(actor, sleepStartTime, sleepEndTime, restDice);
  };

  switch (effect) {
    case 'Asleep':
      return applyRest();
    case 'Rest':
      const restDice = actor.getFlag("lostlands", "restDice");
      await actor.unsetFlag("lostlands", "restDice");
      await Fatigue.resetFatigueType(actor, 'hunger');
      await Fatigue.resetFatigueType(actor, 'thirst');
      return applyRest(restDice);
  }
});
