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
    Constant
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

  // Register Fatigue Clock setting
  game.settings.register("lostlands", "fatigueClock", {
    name: "Fatigue Clock",
    hint: "Untick to deactivate the Fatigue Clock",
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
  // return if update does not decrease hp, or if actor is already unconscious
  if ( hpUpdate == null || hpUpdate >= targetHp || targetHp < 1 ) return;
  if (hpUpdate < 1) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DEATH, actor, null, {push: true, bubble: true, chance: 1});
  } else if ( hpUpdate < halfMaxHp && targetHp >= halfMaxHp ) {
    Util.playVoiceSound(Constant.VOICE_MOODS.DYING, actor, null, {push: true, bubble: true, chance: 0.7});
  } else {
    Util.playVoiceSound(Constant.VOICE_MOODS.HURT, actor, null, {push: true, bubble: true, chance: 0.5});
  }
});

const checkSimpleCalendarLoad = setInterval(onSimpleCalendarLoad, 1000);

function onSimpleCalendarLoad() {

  if (!SimpleCalendar) return;
  clearInterval(checkSimpleCalendarLoad);

  Hooks.on(SimpleCalendar.Hooks.Ready, () => {

    console.log(`Simple Calendar is ready!`);
    const secondsInADay = SimpleCalendar.api.timestampPlusInterval(0, {day: 1});
    const timeInDays = time => Math.floor(time / secondsInADay);
    const timeInWeeks = time => Math.floor(time / (secondsInADay * 7));
    async function applyFatigueDamage (PC, currentTime, timeDiff, propName, 
      dmg={
        dice: '',
        flavor: '',
        interval: () => {}
      }, 
      emit={
        sound: '',
        bubbleText: '',
        interval: () => {}
      }
    ){

      try {
        const dice = dmg.dice || 'd6';
        const flavor = dmg.flavor || 'fatigue';
        const dmgInterval = dmg.interval;
        const sound = emit.sound || 'stomach_rumble';
        const bubbleText = emit.bubbleText || '';
        const emitInterval = emit.interval;
        const targetHp = PC.data.data.hp?.value;
        if (targetHp < 0) return;
        const lastTime = PC.data.data[propName];
        const newTime = currentTime + timeDiff;
        if (newTime < currentTime) return;
        if (!lastTime || newTime < lastTime) {
          return await PC.update({data: { [propName]: newTime }});
        }
        const timeSince = currentTime - lastTime;
        const newTimeSince = newTime - lastTime;
        const token = Util.getTokenFromActor(PC);

        // emit sound/bubble
        const doEmit = !!emitInterval(timeSince, newTimeSince);
        if (doEmit) {
          sound && Util.playSound(sound, token, {push: true, bubble: !bubbleText});
          bubbleText && Util.chatBubble(token, `${PC.name} ${bubbleText}`);
        }

        // apply damage
        const numDmgDice = dmgInterval(timeSince, newTimeSince);
        if (numDmgDice) {
          const formula = `${numDmgDice}${dice}`;
          const result = await Util.rollDice(`${formula}`);
          await PC.update({"data.hp.value": targetHp - result});
          Util.macroChatMessage(token, {
            content: `${PC.name} takes [[${result}]] damage from ${flavor.toLowerCase()}!`,
            flavor
          }, false);
        }
        
      } catch (error) {
        ui.notifications.error(`Problem applying fatigue damage to ${PC.name}`);
        console.error(error);
      }
    };

    const weeksSince = (t1, t2) => timeInWeeks(t2) - timeInWeeks(t1);
    const daysSince = (t1, t2) => timeInDays(t2) - timeInDays(t1);
    const daysSinceAfterFirst = (t1, t2) => timeInDays(t2) > 1 ? timeInDays(t2) - timeInDays(t1) : 0;

    const applyHungerDamage = async (...args) => await applyFatigueDamage(
      ...args,
      "last_eat_time",
      {dice: 'd6', flavor: 'Hunger', interval: weeksSince},
      {sound: 'stomach_rumble', interval: daysSince}
    );
    const applyThirstDamage = async (...args) => await applyFatigueDamage(
      ...args, 
      "last_drink_time", 
      {dice: 'd6', flavor: 'Thirst', interval: daysSinceAfterFirst},
      {bubbleText: 'feels thirsty...', interval: daysSince}
    );

    Hooks.on(SimpleCalendar.Hooks.DateTimeChange, async data => {

      const clockIsActive = game.settings.get("lostlands", "fatigueClock");
      if ( !clockIsActive || !game.user.isGM ) return;
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
