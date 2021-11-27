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

  // Register Rest Mode and restDice settings
  game.settings.register("lostlands", "restMode", {
    name: "Rest Mode",
    hint: "Tick to turn on Rest Mode",
    scope: "world",
    type: Boolean,
    default: false,
    config: true
  });
  game.settings.register("lostlands", "restDice", {
    name: "Rest Dice",
    hint: "Select dice to heal while resting",
    scope: "world",
    type: String,
    default: Constant.DEFAULT_REST_DICE,
    config: false
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

  // Register time queue and fatigue clock interval Id settings
  game.settings.register("lostlands", "timeQ", {
    name: "Time Queue",
    hint: "Don't touch this",
    scope: "world",
    type: String,
    config: false
  });
  game.settings.register("lostlands", "fatigue_clock_interval_id", {
    name: "Fatigue Clock Interval Id",
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

  Hooks.on(SimpleCalendar.Hooks.Ready, async () => {

    const scheduleFatigueDamage = async (interval, currentTime) => {
      
      const lastMidnight = SimpleCalendar.api.dateToTimestamp({hour: 0, minute: 0, second: 0});
      const startTimestamp = (interval, currentTime) => {
        const intervalInSeconds = SimpleCalendar.api.timestampPlusInterval(0, interval);
        return Math.floor((currentTime - lastMidnight) / intervalInSeconds) * intervalInSeconds + lastMidnight;
      };
      const start = startTimestamp(interval, currentTime);

      const oldIntervalId = game.settings.get("lostlands", "fatigue_clock_interval_id");
      oldIntervalId && TimeQ.cancel(oldIntervalId);
      const macro = await Util.getMacroByCommand("applyPartyFatigue", 
                    `return game.lostlands.Macro.applyPartyFatigue(execTime,seconds,newTime,oldTime);`);
      const intervalId = await TimeQ.doEvery(interval, start, macro.id);
      await game.settings.set("lostlands", "fatigue_clock_interval_id", intervalId);

      await TimeQ.save();

      // reset PC flags if non-existent or in the future
      const pCs = Util.pCTokens().map(t => t.actor);
      const fatigueResets = new Map([
        [ (pc) => pc.getFlag("lostlands", "last_eat_time"), Util.resetHunger ],
        [ (pc) => pc.getFlag("lostlands", "last_drink_time"), Util.resetThirst ],
        [ (pc) => pc.getFlag("lostlands", "last_rest_time"), Util.resetRest ],
        [ (pc) => pc.getFlag("lostlands", "last_sleep_time"), Util.resetSleep ],
      ]);
      return Promise.all(pCs.map(async (pc) => {
        for (const [getStartTime, resetTime] of fatigueResets) {
          const lastTime = getStartTime(pc);
          if (!lastTime || lastTime > currentTime) {
            await resetTime(pc, lastMidnight);
          }
        }
      }));
    };

    const startFatigueClock = async (currentTime) => {
      return scheduleFatigueDamage({hour: 1}, currentTime);
    };

    const removeAllConditions = async () => {
      const pCs = Util.pCTokens().map(t => t.actor);
      return Promise.all(pCs.map(async (pc) => {
        try {
          let conditions = game.cub.getConditions(pc, {warn: false})?.conditions;
          if (conditions == null) return;
          if (!Array.isArray(conditions)) conditions = [conditions];
          for (const condition of conditions) {
            await Util.removeCondition(condition.name, pc);
          }
        } catch (error) {
          ui.notifications.error(`Problem removing conditions from ${pc.name}. Refresh!`);
        }
      }));
    };

    if (SimpleCalendar.api.isPrimaryGM()) {
      TimeQ.init();
      const now = Util.now();
      // pop off any events schedule before now
      for (const event of TimeQ.eventsBefore(now)) {
        continue;
      }
      await startFatigueClock(now);
    }
    
    console.log(`Simple Calendar is ready!`);

    let locked = false;
    Hooks.on(SimpleCalendar.Hooks.DateTimeChange, async (data) => {

      if ( locked || !SimpleCalendar.api.isPrimaryGM() ) return;
      locked = true;

      const oldTime = game.time.worldTime;
      const newTime =  SimpleCalendar.api.dateToTimestamp(data.date);
      const timeDiff = data.diff;

      // clear event queue and restart fatigue clocks if going back in time
      if (timeDiff < 0) {
        removeAllConditions();
        TimeQ.clear();
        locked = false;
        return startFatigueClock(newTime);
      }
      
      for (const event of TimeQ.eventsBefore(newTime)) {
        let macro = game.macros.find(m => m.id === event.macroId);
        // add oldTime and newTime to macro scope
        Object.assign(event.scope, {oldTime, newTime});
        macro && await macro.execute(event.scope);
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
  const halfMaxHp = actor.data.data.hp?.max / 2;
  const token = Util.getTokenFromActor(actor);

  // return if update does not decrease hp, or if actor is already unconscious
  if ( hpUpdate == null || hpUpdate >= targetHp || targetHp < 1 ) return;
  if (hpUpdate < 0) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DEATH, actor, token, {push: true, bubble: true, chance: 1});
    if (actor.type === 'character') {
      Util.macroChatMessage(token, {flavor: 'Death', content: `${actor.name} has fallen. May the Gods have mercy.`}, false);
    }
  } else if ( hpUpdate < halfMaxHp && targetHp >= halfMaxHp ) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DYING, actor, token, {push: true, bubble: true, chance: 0.7});
  } else {
    Util.playVoiceSound(Constant.VOICE_MOODS.HURT, actor, token, {push: true, bubble: true, chance: 0.5});
  }
});

Hooks.on("preCreateActiveEffect", (activeEffect, data, options, userId) => {
  if (!game.user.isGM) return false;
  const actor = activeEffect.parent;

  if (activeEffect.data.label === 'Asleep') {
    Util.removeCondition("Sleepy", actor);
  }
});

Hooks.on("preDeleteActiveEffect", (activeEffect, data, options, userId) => {
  if (!game.user.isGM) return false;
  const actor = activeEffect.parent;

  // if deleting Asleep, update last sleep time if started sleeping 3+ hours ago
  if (activeEffect.data.label === 'Asleep') {
    const now = Util.now();
    const startTime = activeEffect.data.duration.startTime;
    if (startTime <= now - Constant.SECONDS_IN_HOUR * 3) {
      Util.resetSleep(actor, now);
    }
  }
});
