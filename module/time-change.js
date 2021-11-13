import { partyRest } from "./macro.js";
import * as Util from "./utils.js";
import * as Constant from "./constants.js";

export const timeChangeHandlers = (data) => {
  
  const secondsInAnHour = SimpleCalendar.api.timestampPlusInterval(0, {hour: 1});
  const secondsInADay = SimpleCalendar.api.timestampPlusInterval(0, {day: 1});
  const timeInDays = time => Math.floor(time / secondsInADay);
  const timeInThreeDays = time => Math.floor(time / secondsInADay / 3);
  const days = (t1, t2) => timeInDays(t2) - timeInDays(t1);
  const threeDays = (t1, t2) => timeInThreeDays(t2) - timeInThreeDays(t1);
  const daysAfterFirst = (t1, t2) => timeInDays(t2) > 1 ? timeInDays(t2) - timeInDays(t1) : 0;
  const fatigueClockOff = !game.settings.get("lostlands", "fatigueClock");
  const pcTokens = canvas.tokens.objects.children.filter(t => t.actor.type === 'character' && t.actor.hasPlayerOwner);

  if (!game.user.isGM) return;
  const currentTime = game.time.worldTime;
  const timeDiff = data.diff;
  const newTime = currentTime + timeDiff;
  const timeArgs = [currentTime, newTime];

  if (fatigueClockOff) {
    // assume party is resting in a safe place
    // apply party rest with dialog for rest quality and no fatigue damage
    return applyPartyRest(...timeArgs);
  }

  for (const token of pcTokens) {
    await applyHungerDamage(token, ...timeArgs);
    await applyThirstDamage(token, ...timeArgs);
    await applyColdDamage(token, ...timeArgs);
  }

  async function applyPartyRest(currentTime, newTime) {

    // count first 8 hours as 1 rest, then add days after that time point
    const eightHoursFromCT = currentTime + secondsInAnHour * 8;
    if (newTime < eightHoursFromCT) return;
    const numRestDays = 1 + timeInDays(newTime - eightHoursFromCT);
    const options = {
      numDays: numRestDays,
      showModDialog: true
    }

    // reset last eat and drink times
    for (const token of pcTokens) {
      const actor = token.actor;
      await actor.update({
        "data.last_drink_time": newTime,
        "data.last_eat_time": newTime
      });
    }

    return partyRest(options);
  }

  async function applyHungerDamage(...args) {

    return applyFatigueDamage(
      ...args,
      "last_eat_time",
      {dice: 'd3', flavor: 'Hunger', interval: threeDays},
      {sound: 'stomach_rumble', interval: days}
    );
  }

  async function applyThirstDamage(...args) {

    return applyFatigueDamage(
      ...args, 
      "last_drink_time", 
      {dice: 'd6', flavor: 'Thirst', interval: daysAfterFirst}
    );
  }

  async function applyColdDamage(...args) {

    const actor = token.actor;
    const dice = 'd6';
    const reqClo = Util.reqClo();
    const actorClo = +actorClo.data.data.clo;
    const steps = reqClo - actorClo;
    const intervalsByStep = {
      1: sixHours, // remove this? just -2 atk
      2: hours,
      3: tenMinutes,
      4: twoMinutes
    };
    const interval = intervalsByStep[steps];
    if (!interval) return;

    // determine interval based on steps of inappropriateness
    return applyFatigueDamage(
      ...args, 
      "last_cold_time", 
      {dice: 'd6', flavor: 'Thirst', interval: daysAfterFirst}
    );
  }

  async function applyFatigueDamage (token, currentTime, newTime, propName, 
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
  ) {
    // return if going backwards in time
    if (newTime < currentTime) return;

    const PC = token.actor;
    const dice = dmg.dice || 'd6';
    const flavor = dmg.flavor || 'fatigue';
    const dmgInterval = dmg.interval;
    const sound = emit.sound || 'stomach_rumble';
    const bubbleText = emit.bubbleText || '';
    const emitInterval = emit.interval;
    const lastTime = PC.data.data[propName];
    const targetMaxHp = PC.data.data.hp?.max;
    const targetHp = PC.data.data.hp?.value;
    if (targetHp < 0) return;

    try {

      if ( !lastTime || newTime < lastTime ) {
        return PC.update({data: { [propName]: newTime }});
      }
      const timeSince = currentTime - lastTime;
      const newTimeSince = newTime - lastTime;

      // emit sound/bubble
      const doEmit = emitInterval(timeSince, newTimeSince) > 0;
      if (doEmit) {
        sound && Util.playSound(sound, token, {push: true, bubble: !bubbleText});
        bubbleText && Util.chatBubble(token, `${PC.name} ${bubbleText}`);
      }

      // apply damage
      const numDmgDice = dmgInterval(timeSince, newTimeSince);
      if (numDmgDice > 0) {

        let diceTermString = '';
        for (let i = 0; i < numDmgDice; i++) {
          diceTermString += `${dice}+`;
        }
        diceTermString = diceTermString.replace(/\+$/, '');

        const result = await Util.rollDice(diceTermString);
        const hpUpdate = targetHp - result;
        const hpMaxUpdate = Math.max(1, (targetMaxHp - result + 1));

        await PC.update({
          "data.hp.value": hpUpdate,
          "data.hp.max": hpMaxUpdate
        });

        if (hpUpdate >= 0) {
          Util.macroChatMessage(token, {
            content: `${Util.chatInlineRoll(result)} damage from ${flavor.toLowerCase()}!`,
            flavor
          }, false);
        }
      }
      
    } catch (error) {
      ui.notifications.error(`Problem applying fatigue damage to ${PC.name}`);
      console.error(error);
    }
  }
}
