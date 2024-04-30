import * as Constant from './constants.js';

export async function wait(ms) {
  if (isNaN(ms)) return;
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function stringMatch(str1, str2) {
  if (typeof str1 !== 'string' || typeof str2 !== 'string') {
    return false;
  }
  return str1.toLowerCase().replace(/\s/g, '').normalize() === str2.toLowerCase().replace(/\s/g, '').normalize();
}

export function sizeComparator(a, b) {
  const aSize = Constant.SIZE_VALUES[a.data.data.attributes.size.value];
  const bSize = Constant.SIZE_VALUES[b.data.data.attributes.size.value];
  if (aSize < bSize) return -1;
  if (aSize > bSize) return 1;
  if (aSize === bSize) return 0;
}

export function expandPrice(priceInCps) {
  if (!priceInCps) return;
  const gp = Math.floor(priceInCps / Constant.UNITS_OF_ACCOUNT.gp.value);
  priceInCps -= gp * Constant.UNITS_OF_ACCOUNT.gp.value;
  const sp = Math.floor(priceInCps / Constant.UNITS_OF_ACCOUNT.sp.value);
  const cp = priceInCps - sp * Constant.UNITS_OF_ACCOUNT.sp.value;
  return { gp, sp, cp };
}

export function getPriceString(priceInCps) {
  if (!priceInCps) return;
  const priceObj = expandPrice(priceInCps);
  let priceString = '';
  for (const [unit, value] of Object.entries(priceObj)) {
    if (value) priceString += `${value} ${Constant.UNITS_OF_ACCOUNT[unit].abbr}, `;
  }
  return priceString.replace(/,\s*$/, '');
}

export function replacePunc(str) {
  return str.replace(/!+\s*$|\.+\s*$/, '');
}

export function getArrFromCSL(list) {
  if (typeof list === 'string' || list instanceof String) {
    return (
      [
        ...new Set(
          list
            ?.split(',')
            .map((t) => t.trim())
            .filter((t) => t)
        ),
      ] || []
    );
  } else {
    const err = 'Input list not a string.';
    ui.notifications.error(err);
    throw err;
  }
}

export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

export function actorIsDead(actor) {
  if (!actor) return false;
  const maxNegHp =
    actor.type === 'humanoid' || actor.type === 'character'
      ? Number(0 - (actor.data.data.attributes.ability_scores?.con?.value ?? 10))
      : 0;
  const currentHp = Number(actor.data.data.hp?.value);

  return currentHp <= maxNegHp;
}

export function selectedCharacter() {
  let actor = null;
  let token = canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : null;
  if (token) {
    actor = token.actor;
  } else {
    actor = game.user.character;
    token = actor ? getTokenFromActor(actor) : null;
  }
  if (!actor) {
    const err = 'Select a character';
    ui.notifications.error(err);
    throw err;
  }
  return { token, actor };
}

export function getItemFromActor(itemIdOrName, actor) {
  const item =
    actor.data.items.get(itemIdOrName) ||
    actor.data.items.find(
      (i) => i.name.toLowerCase().replace(/\s/g, '') === itemIdOrName?.toLowerCase().replace(/\s/g, '')
    );
  if (!item) {
    const err = `${itemIdOrName} not found on ${actor.name}`;
    ui.notifications.error(err);
    throw err;
  }
  return item;
}

export async function reduceItemQty(item, actor) {
  const itemQty = +item.data.data.quantity;
  if (!itemQty) {
    const err = `${item.name} must have quantity greater than 0`;
    ui.notifications.error(err);
    throw err;
  }
  return actor.updateEmbeddedDocuments('Item', [
    {
      _id: item._id,
      'data.quantity': itemQty - 1,
    },
  ]);
}

export async function getMacroByCommand(name, command) {
  if (!name || !command) return;
  let macro = game.macros.find((m) => m.data.command === command);
  if (!macro) {
    macro = await Macro.create({
      name,
      command,
      type: 'script',
      flags: { 'brigandine.attrMacro': true },
    });
  }

  return macro;
}

export function charsOwnedByUser() {
  if (game.user.isGM) {
    return game.actors.filter((a) => !a.hasPlayerOwner && a.isOwner && a.type === 'character');
  } else {
    return game.actors.filter((a) => a.isOwner && a.type === 'character');
  }
}

export function isOwned(actor) {
  return charsOwnedByUser().some((a) => a._id === actor._id);
}

export function pCTokens() {
  return canvas.tokens.objects.children.filter((t) => t.actor.type === 'character' && t.actor.hasPlayerOwner);
}

export function upperCaseFirst(string) {
  if (!string) return;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function lowerCaseFirst(string) {
  if (!string) return;
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export const now = () => game.time.worldTime;

export async function removeCondition(condition, actor, { warn = false } = {}) {
  const hasCondition = game.cub.hasCondition(condition, actor, { warn });
  if (!hasCondition) return;

  await wait(300);
  await game.cub.removeCondition(condition, actor, { warn });
}

export async function addCondition(condition, actor, { warn = false } = {}) {
  const hasCondition = game.cub.hasCondition(condition, actor, { warn });
  if (hasCondition) return;

  await wait(300);
  // wait until time has synced
  while (SimpleCalendar.api.timestamp() !== game.time.worldTime) {
    await wait(50);
    continue;
  }
  await game.cub.addCondition(condition, actor, { warn });
}

export function nextTime(interval, startTime, currentTime) {
  const seconds = intervalInSeconds(interval);
  let nextTime = Math.ceil(Math.max(0, currentTime - startTime) / seconds) * seconds + startTime;
  if (nextTime === currentTime) nextTime += seconds;

  return nextTime;
}

export function prevTime(interval, startTime, currentTime) {
  const seconds = intervalInSeconds(interval);
  let prevTime = Math.floor(Math.max(0, currentTime - startTime) / seconds) * seconds + startTime;

  return prevTime;
}

export function intervalInSeconds(interval) {
  return SimpleCalendar.api.timestampPlusInterval(0, interval);
}

export function formatAtkMode(mode) {
  const form = Constant.ATK_MODES[mode]?.ATK_FORM;
  return upperCaseFirst(mode.replace(/^.*\(/, `${form} (`).replace(/(\([a-z]\))/, (match, p1) => p1.toUpperCase()));
}

export function resultStyle(bgColour) {
  return `background: ${bgColour}; padding: 1px 4px; border: 1px solid #4b4a44; border-radius: 2px; white-space: nowrap; word-break: break-all; font-style: normal;`;
}

export async function playTokenAnimation(token, name, partialPath) {
  // TODO make PRs to CTA module
  const MAX_ANIMATION_LENGTH = 5000;
  if (!CTA) return;
  const texturePath = `${Constant.ASSETS_PATH}/animations/${partialPath}.webm`;
  const textureData = {
    texturePath,
    scale: 2,
    speed: 1,
    multiple: 1,
    rotation: 'static',
    xScale: 0.5,
    yScale: 0.5,
    opacity: 1,
    belowToken: false,
    radius: 0,
    equip: false,
  };
  // addAnimation(token, textureData, pushActor, name, oldID)
  await CTA.addAnimation(token, textureData, false, name, false);
  await wait(MAX_ANIMATION_LENGTH);
  // removeAnimByName(token, name, removeActor, fadeOut)
  await CTA.removeAnimByName(token, name, false, false);
}

export function sortEquipmentByType(items) {
  const equipment = {};
  const types = [
    {
      title: 'Weapons',
      condition: (i) =>
        !i.data?.data?.attributes?.admin?.treasure?.value &&
        (i.type === 'melee_weapon' || i.type === 'throw_weapon' || i.type === 'missile_weapon' || i.type === 'bow'),
    },
    {
      title: 'Armor',
      condition: (i) =>
        !i.data?.data?.attributes?.admin?.treasure?.value &&
        (i.type === 'armor' || i.type === 'helm' || i.type === 'shield'),
    },
    {
      title: 'Clothing',
      condition: (i) => !i.data?.data?.attributes?.admin?.treasure?.value && i.type === 'clothing',
    },
    {
      title: 'Gems & Jewelry',
      condition: (i) => !i.data?.data?.attributes?.admin?.treasure?.value && (i.type === 'gem' || i.type === 'jewelry'),
    },
    {
      title: 'Ammunition',
      condition: (i) => !i.data?.data?.attributes?.admin?.treasure?.value && i.type === 'ammo',
    },
    {
      title: 'Potions',
      condition: (i) => !i.data?.data?.attributes?.admin?.treasure?.value && i.type === 'potion',
    },
    {
      title: 'Wands, Staves & Rods',
      condition: (i) => !i.data?.data?.attributes?.admin?.treasure?.value && i.type === 'charged_item',
    },
    {
      title: 'Containers',
      condition: (i) => !i.data?.data?.attributes?.admin?.treasure?.value && i.type === 'container',
    },
    {
      title: 'Misc. Magic',
      condition: (i) =>
        !i.data?.data?.attributes?.admin?.treasure?.value &&
        i.type === 'item' &&
        i.data?.data?.attributes?.admin?.magic?.value,
    },
    {
      title: 'Other',
      condition: (i) =>
        !i.data?.data?.attributes?.admin?.treasure?.value &&
        i.type === 'item' &&
        !i.data?.data?.attributes?.admin?.magic?.value,
    },
    {
      title: 'Currency',
      condition: (i) => !i.data?.data?.attributes?.admin?.treasure?.value && i.type === 'currency',
    },
    {
      title: 'Treasure',
      condition: (i) => i.data?.data?.attributes?.admin?.treasure?.value,
    },
  ];
  types.forEach((t) => {
    const equipItems = items.filter(t.condition).map((i) => ({
      item: i,
      holdable: i.data?.data?.attributes?.admin?.holdable?.value,
      wearable: i.data?.data?.attributes?.admin?.wearable?.value,
    }));
    if (!equipItems.length) return;
    equipment[t.title] = equipItems;
  });

  return equipment;
}
