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

  game.lostlands = {
    SimpleActor,
    Macro,
    Util,
    Constant,
    fatigueClock: true
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

  // Register initiative setting.
  game.settings.register("lostlands", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d6",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("lostlands", "initFormula");
  _simpleUpdateInit(initFormula);

  /**
   * Update the initiative formula.
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

  /**
   * Slugify a string.
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

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop", (bar, data, slot) => Macro.createLostlandsMacro(data, slot));

/**
 * Adds the actor template context menu.
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

  // Undefine an actor as a template.
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
 * Adds the item template context menu.
 */
Hooks.on("getItemDirectoryEntryContext", (html, options) => {
  // Define an item as a template.
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

  // Undefine an item as a template.
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
  Util.playVoiceSound(Constant.VOICE_MOODS.WHAT, actor, token, {push: false, chatBubble: false, chance: 0.5});
});

// Play 'ok' voice sound on token movement
Hooks.on("updateToken", (token, moved, data) => {
  if ( !moved.x && !moved.y ) return;
  Util.playVoiceSound(Constant.VOICE_MOODS.OK, token.actor, token.data, {push: true, chatBubble: false, chance: 0.7});
});

// Play 'hurt'/'death' voice sounds on HP decrease
Hooks.on("preUpdateActor", (actor, change) => {
  const hpUpdate = change.data?.hp?.value;
  const targetHp = actor.data.data.hp?.value;
  const halfMaxHp = actor.data.data.hp?.max / 2;
  // return if update does not decrease hp, or if actor is already unconscious
  if ( hpUpdate == null || hpUpdate >= targetHp || targetHp < 1 ) return;
  if (hpUpdate < 1) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DEATH, actor, null, {push: true, chatBubble: true, chance: 1});
  } else if ( hpUpdate < halfMaxHp && targetHp >= halfMaxHp ) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DYING, actor, null, {push: true, chatBubble: true, chance: 0.7});
  } else {
    Util.playVoiceSound(Constant.VOICE_MOODS.HURT, actor, null, {push: true, chatBubble: true, chance: 0.5});
  }
});

const checkSimpleCalendarLoad = setInterval(onSimpleCalendarLoad, 1000);
function onSimpleCalendarLoad() {
  if (!SimpleCalendar) return;
  clearInterval(checkSimpleCalendarLoad);
  Hooks.on(SimpleCalendar.Hooks.Ready, () => {
    console.log(`Simple Calendar is ready!`);
    const secondsinOneDay = SimpleCalendar.api.timestampPlusInterval(0, {day: 1});
    const timeInDays = time => Math.floor(time / secondsinOneDay);
    const timeInWeeks = time => Math.floor(time / (secondsinOneDay * 7));
    const applyFatigueDamage = async (PC, currentTime, timeDiff, propName, dmgDiceFunc) => {
      const targetHp = PC.data.data.hp?.value;
      if (targetHp < 0) return;
      const lastTime = PC.data.data[propName];
      const newTime = currentTime + timeDiff;
      if (!lastTime || newTime < lastTime) {
        console.log(lastTime, newTime);
        return await PC.update({data: { [propName]: newTime }});
      }
      const timeSince = currentTime - lastTime;
      const newTimeSince = newTime - lastTime;
      const diffDaysSince = timeInDays(newTimeSince) - timeInDays(timeSince);
      const fatigued = diffDaysSince > 0;
      if (!fatigued) return;
      const damageDice = dmgDiceFunc(timeSince, newTimeSince);
      if (damageDice) {
        const damage = await new Roll(`${damageDice}d6`).evaluate().total;
        return await PC.update({"data.hp.value": targetHp - damage});
      }
      AudioHelper.play({src: `systems/lostlands/sounds/stomach_rumble.mp3`, volume: 1, loop: false}, true);
      const token = canvas.tokens.objects.children.find(t => t.actor.id === PC.id);
      canvas.hud.bubbles.say(token, `<i class="fas fa-volume-up"></i>`, {emote: true});
    };
    const applyHungerDamage = async (...args) => {
      const propName = "last_eat_time";
      const dmgFunc = (timeSince, newTimeSince) => timeInWeeks(newTimeSince) - timeInWeeks(timeSince);
      return await applyFatigueDamage(...args, propName, dmgFunc);
    };
    const applyThirstDamage = async (...args) => {
      const propName = "last_drink_time";
      const dmgFunc = (timeSince, newTimeSince) => timeInDays(newTimeSince) > 1 ? timeInDays(newTimeSince) - timeInDays(timeSince) : 0;
      return await applyFatigueDamage(...args, propName, dmgFunc);
    };

    Hooks.on(SimpleCalendar.Hooks.DateTimeChange, async data => {
      if (game.lostlands.fatigueClock === false) return;
      if (!game.user.isGM) return;
      const PCs = game.actors.filter(a => a.type === 'character' && a.hasPlayerOwner === true);
      const currentTime = game.time.worldTime;
      const timeDiff = data.diff;
      const timeArgs = [currentTime, timeDiff];
      for (const PC of PCs) {
        await applyHungerDamage(PC, ...timeArgs);
        await applyThirstDamage(PC, ...timeArgs);
      }
    });
  });
};
