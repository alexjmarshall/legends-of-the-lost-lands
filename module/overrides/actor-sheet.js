import { isSameEquipmentType, NON_PHYSICAL_ITEM_TYPES } from '../item-helper.js';

/**
 * Handle dropping of an item reference or item data onto an Actor Sheet
 * @param {DragEvent} event     The concluding DragEvent which contains drop data
 * @param {Object} data         The data transfer extracted from the event
 * @return {Promise<Object>}    A data object which describes the result of the drop
 * @private
 */
// TODO test and update all references to const/util files and cleanup
// TODO make sure to handle all actor types here
export async function _onDropItem(event, data, qtyDropped, options = {}) {
  if (!this.actor.isOwner) return false;
  const item = await Item.implementation.fromDropData(data);
  const itemData = item.toObject();
  const itemQty = +itemData.data.quantity;

  // Get the source actor and target actor
  const targetActor = this.actor;
  const sourceActor = data.tokenId
    ? canvas.tokens.objects.children.find((t) => t.id === data.tokenId)?.actor
    : game.actors.get(data.actorId);

  // Return if:
  // dragging a NON_PHYSICAL_ITEM_TYPE from an actor or to a container or merchant
  // dragging any item from a merchant and user is not GM
  const ITEM = game.brigandine.ITEM;
  const SPELLS = game.brigandine.SPELLS;
  const Constant = game.brigandine.Constant;
  const Util = game.brigandine.Util;
  if (
    (ITEM.NON_PHYSICAL_ITEM_TYPES.includes(itemData.type) && sourceActor) ||
    (ITEM.NON_PHYSICAL_ITEM_TYPES.includes(itemData.type) &&
      (targetActor.type === 'container' || targetActor.type === 'merchant')) ||
    (sourceActor?.type === 'merchant' && !game.user.isGM)
  ) {
    return false;
  }

  // Get the source item and source item siblings for sorting
  const sourceItem = sourceActor?.items.get(itemData._id);
  const siblings = sourceActor?.items.filter((i) => {
    return i.data.type === sourceItem?.data?.type && i.data._id !== sourceItem?.data?._id;
  });

  // Sell the item if dragging from a player character to a merchant TODO show dialog to sell or repair armour
  const overrideSell = game.user.isGM && event.ctrlKey;
  const handleSell =
    sourceItem &&
    sourceActor &&
    sourceActor.type === 'character' &&
    targetActor.type === 'merchant' &&
    !options.confirmedSell;
  if (!overrideSell && handleSell) {
    const priceValue = +sourceItem.data.data.value || 0;
    const attitude = await game.brigandine.Macro.reactionRoll(targetActor, sourceActor, { showModDialog: false }); // TODO
    const buyAdj = +Constant.ATTITUDE_BUY_ADJ[attitude] || 1;
    const buyFactor = +targetActor.data.data.attributes.buy_factor?.value || 1;
    const adjFactor = buyAdj * buyFactor;
    const priceInCps = Math.floor(priceValue * adjFactor);
    if (priceInCps < 1) {
      const chatData = {
        content: `${sourceActor.name} tries to sell ${
          sourceItem.name
        }, but it is worthless. ${Constant.ranAnnoyedMerchant()}`,
        flavor: `Sell`,
      };
      return Util.macroChatMessage(sourceActor, chatData, true);
    }
    // Determine dropped item quantity
    if (itemQty < 1) return;
    if (itemQty > 1 && !options.shownSplitDialog) {
      return _itemSellSplitDialog(itemQty, item, priceInCps, options, event, data);
    }
    if (!qtyDropped) qtyDropped = itemQty;
    const totalSellPrice = priceInCps * qtyDropped;
    const totalSellPriceString = Util.getPriceString(totalSellPrice);
    const merchantMoney = +targetActor.data.data.attributes.money?.value || 0;
    if (totalSellPrice > merchantMoney) return ui.notifications.error('The merchant does not have enough money.');

    // show confirmation dialog if haven't shown split item dialog
    if (!options.shownSplitDialog) {
      return Dialog.confirm({
        title: 'Confirm',
        content: `Sell ${qtyDropped} ${sourceItem.name}${qtyDropped > 1 ? 's' : ''} for ${totalSellPriceString}?`,
        yes: async () => {
          await finalizeSale();
          options.confirmedSell = true;
          return this._onDropItem(event, data, qtyDropped, options);
        },
        no: () => {},
        defaultYes: true,
      });
    }
    await finalizeSale();
  }

  // Determine dropped item quantity
  if (sourceItem && itemQty > 1 && !options.shownSplitDialog) return _itemSplitDialog(itemQty, options, event, data);
  if (!qtyDropped) qtyDropped = itemQty;
  itemData.data.quantity = qtyDropped;
  const currentSourceQty = +sourceItem?.data?.data?.quantity;
  const newSourceQty = currentSourceQty - qtyDropped;

  // Determine target item. If same actor, target item must be actual drop target
  const sameActor =
    targetActor.isToken || data.tokenId ? data.tokenId === targetActor.token?.id : data.actorId === targetActor.id;
  const targetItems = targetActor.items.filter(
    (i) =>
      i._id !== sourceItem?._id &&
      i.data.type === itemData.type &&
      i.data.name === itemData.name &&
      i.data.data.macro === itemData.data.macro &&
      foundry.utils.fastDeepEqual(i.data.data.attributes, itemData.data.attributes)
  );
  let targetItem = targetItems[0];
  if (sameActor) {
    const dropTarget = event.target.closest('[data-item-id]');
    const targetId = dropTarget ? dropTarget.dataset.itemId : null;
    targetItem = targetItems.find((i) => i.data._id === targetId) || null;
  }
  const currentTargetQty = +targetItem?.data.data.quantity || 0;

  // Check whether total weight transferred would exceed targetActor's limit
  const droppedItemWeight = qtyDropped * +itemData.data.weight;
  const targetEnc = +targetActor.data.data.enc;
  const targetLimit = +targetActor.data.data.attributes.capacity?.value;
  if (!sameActor && droppedItemWeight + targetEnc > targetLimit) return false;

  // Handle source and target being combined
  if (targetItem) {
    await targetActor.updateEmbeddedDocuments('Item', [
      { _id: targetItem._id, 'data.quantity': currentTargetQty + qtyDropped },
    ]);
    if (newSourceQty < 1) return sourceItem?.delete();
    return sourceActor?.updateEmbeddedDocuments('Item', [{ _id: sourceItem._id, 'data.quantity': newSourceQty }]);
  }

  // Handle source item being split
  if (itemQty > qtyDropped) {
    await this._onDropItemCreate(itemData);
    return sourceActor?.updateEmbeddedDocuments('Item', [{ _id: sourceItem._id, 'data.quantity': newSourceQty }]);
  }

  // If sourceActor and targetActor are the same, sort source and target items
  if (sameActor) return this._onSortItem(event, itemData);

  // Otherwise, create a new item and delete source item
  await this._onDropItemCreate(itemData);
  return sourceItem?.delete();

  function _itemSellSplitDialog(maxQty, itemData, priceInCps, options, ...data) {
    new Dialog({
      title: `Sell ${itemData.name}`,
      content: `<form>
          <div class="form-group">
            <label style="max-width:fit-content;max-width:-moz-fit-content;">How many?</label>
            <span id="selectedQty" style="flex:1;text-align:center;"></span>
            <input class="flex7" type="range" id="qty" min="1" max="${maxQty}" value="1">
          </div>
          <div class="form-group">
            <label style="max-width:fit-content;max-width:-moz-fit-content;margin-right:0.5em">Total price:</label>
            <span id="price"></span>
          </div>
        </form>`,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: `Sell`,
          callback: (html) => {
            const quantity = +html.find('[id=qty]').val();
            options.shownSplitDialog = true;
            this._onDropItem(...data, quantity, options);
          },
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
        },
      },
      default: 'one',
      render: (html) => {
        const qtyRange = html.find('[id=qty]'),
          qtySpan = html.find('[id=selectedQty]'),
          priceSpan = html.find('[id=price]');
        qtySpan.html(+qtyRange.val());
        priceSpan.html(game.brigandine.Util.getPriceString(+qtyRange.val() * priceInCps));
        qtyRange.on('input', () => {
          qtySpan.html(+qtyRange.val());
          priceSpan.html(game.brigandine.Util.getPriceString(+qtyRange.val() * priceInCps));
        });
      },
    }).render(true);
  }

  function _itemSplitDialog(initialQty, options, ...data) {
    new Dialog({
      title: 'Split Item',
      content: `<form>
          <div class="form-group">
          <label style="max-width:fit-content;max-width:-moz-fit-content;">How many?</label>
            <span id="selectedQty" style="flex:1;text-align:center;">${initialQty}</span>
            <input class="flex7" type="range" id="qty" min="1" max="${initialQty}" value="${initialQty}">
          </div>
        </form>`,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: `Submit`,
          callback: (html) => {
            const quantity = +html.find('[id=qty]').val();
            options.shownSplitDialog = true;
            this._onDropItem(...data, quantity, options);
          },
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
        },
      },
      default: 'one',
      render: (html) => {
        const qtySpan = html.find('[id=selectedQty]');
        const qtyRange = html.find('[id=qty]');
        qtyRange.on('input', () => qtySpan.html(+qtyRange.val()));
      },
    }).render(true);
  }

  async function finalizeSale() {
    const expandedPriceObj = Util.expandPrice(totalSellPrice);
    const keyToItemName = {
      gp: Constant.COINS_OF_ACCOUNT.gp.name,
      sp: Constant.COINS_OF_ACCOUNT.sp.name,
      cp: Constant.COINS_OF_ACCOUNT.cp.name,
    };
    const updates = [];
    const createItemUpdates = [];

    for (const [k, v] of Object.entries(expandedPriceObj)) {
      if (!v) continue;
      const itemName = keyToItemName[k];
      let item = sourceActor.items.find((i) => Util.stringMatch(i.name, itemName));

      // create item if does not exist
      if (!item) {
        const coinItemData = game.items.getName(itemName)?.data;
        if (!coinItemData) return ui.notifications.error(`Could not find ${itemName} in game items!`);
        const createData = Util.cloneItem(coinItemData);
        createData.data.quantity = v;
        createItemUpdates.push(coinItemData);
        continue;
      }

      const itemQty = +item.data.data.quantity;
      const itemUpdateQty = itemQty + v;
      if (item._id && itemQty !== itemUpdateQty) {
        updates.push({ _id: item._id, 'data.quantity': itemUpdateQty });
      }
    }

    if (createItemUpdates.length) await sourceActor.createEmbeddedDocuments('Item', createItemUpdates);
    await sourceActor.updateEmbeddedDocuments('Item', updates);
    const merchantMoneyUpdate = merchantMoney - totalSellPrice;
    await targetActor.update({ 'data.attributes.money.value': merchantMoneyUpdate });

    // create chat message
    const chatData = {
      content: `${sourceActor.name} sells ${qtyDropped} ${sourceItem.name}${qtyDropped > 1 ? 's' : ''} to ${
        targetActor.name
      } for ${totalSellPriceString}.`,
      sound: 'coins',
      flavor: 'Sell',
    };
    return Util.macroChatMessage(sourceActor, chatData, true);
  }
}

/**
 * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
 * @param {Event} event
 * @param {Object} itemData
 * @private
 */
export function _onSortItem(event, itemData) {
  // Get the drag source and its siblings
  const source = this.actor.items.get(itemData._id);
  const siblings = this.actor.items.filter((i) => {
    return isSameType(i, source) && i.data._id !== source.data._id;
  });

  // Get the drop target
  const dropTarget = event.target.closest('[data-item-id]');
  const targetId = dropTarget ? dropTarget.dataset.itemId : null;
  const target = siblings.find((s) => s.data._id === targetId);

  // Ensure we are only sorting like-types
  if (target && !isSameType(source, target)) return;

  // sortBefore if target is before source
  const sortBefore = !target || (target && target.data.sort < source.data.sort);

  // Perform the sort
  const sortUpdates = SortingHelpers.performIntegerSort(source, { target: target, siblings, sortBefore });
  const updateData = sortUpdates.map((u) => {
    const update = u.update;
    update._id = u.target.data._id;
    return update;
  });

  // Perform the update
  return this.actor.updateEmbeddedDocuments('Item', updateData);

  function isSameType(item1, item2) {
    if (!NON_PHYSICAL_ITEM_TYPES.includes(item1.data.type) && !NON_PHYSICAL_ITEM_TYPES.includes(item2.data.type)) {
      return isSameEquipmentType(item1, item2);
    }
    return item1.data.type === item2.data.type;
  }
}
