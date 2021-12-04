import { EntitySheetHelper } from "./helper.js";
import * as Constant from "./constants.js";
import * as Util from "./utils.js";
import { buyMacro, reactionRoll } from "./macro.js";

export class MerchantActorSheet extends ActorSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["lostlands", "sheet", "actor"],
      template: "systems/lostlands/templates/merchant-actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "items"}],
      scrollY: [".description", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData() {
    const context = super.getData();
    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("lostlands", "macroShorthand");
    context.systemData = context.data.data;
    context.dtypes = Constant.ATTRIBUTE_TYPES;
    context.isGM = game.user.isGM;
    context.isPlayer = !context.isGM;
    // item price
    const merchantActor = context.actor.isToken ? context.actor :
      canvas.tokens.objects.children.find(t => t.actor.id === context.actor.id && t.data.actorLink === true)?.actor;
    const character = game.user.character;
    const attitude = merchantActor && character ? await reactionRoll(merchantActor, character, {showModDialog: false, showChatMsg: false}) :
      Constant.ATTITUDES.UNCERTAIN;
    const sellAdj = Constant.ATTITUDE_SELL_ADJ[attitude];
    const items = context.data.items.filter(i => i.type === 'item');
    const sellFactor = +context.systemData.attributes.sell_factor?.value || 1;
    items.forEach(item => {
      let priceInCps = Math.ceil(+item.data.attributes.gp_value?.value * sellFactor * sellAdj * 50);
      item.data.price = Util.expandPrice(priceInCps);
    });
    context.data.items = items;

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Attribute Management
    html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".item-row").dblclick(this._onItemControl.bind(this));

    // Remove draggable from item rows if user is not GM
    if(!game.user.isGM) html.find("li.item[data-item-id]").attr("draggable", false);
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
    const li = button.closest(".item");
    const itemId = li?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    const type = button.dataset.type;
    const data = {name: game.i18n.localize("SIMPLE.ItemNew"), type: type};
    
    // Handle different actions
    switch ( button.dataset.action ) {
      case "buy":
        const itemPrice = $(li)?.find('.item-price');
        const goldPrice = +itemPrice?.find('.gold-price').text(),
              silverPrice = +itemPrice?.find('.silver-price').text(),
              copperPrice = +itemPrice?.find('.copper-price').text();
        if ( isNaN(goldPrice) || isNaN(silverPrice) || isNaN(copperPrice) ) {
          return ui.notifications.error("There was a problem reading the price of this item");
        }
        const totalPriceInCp = Math.round((copperPrice + silverPrice * 5 + goldPrice * 50));
        return buyMacro(item, totalPriceInCp, this.actor);
      case "create":
        if (!game.user.isGM) return;
        const cls = getDocumentClass("Item");
        return cls.create(data, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        if (!game.user.isGM) return;
        const actor = this.actor;
        const itemQty = +item.data.data.quantity || 0;
        if(itemQty <= 1) return item.delete();
        return new Dialog({
          title: "Delete Item",
          content: 
          `<form>
            <div class="flexrow">
              <label class="flex1">How many?</label>
              <label class="flex1" style="text-align:center;" id="splitValue"></label>
              <input class="flex3" type="range" min="1" id="splitRange">
            </div>
          </form>`,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: "Submit",
              callback: async html => {
                const quantityVal = +html.find("#splitRange").val();
                if(quantityVal >= itemQty) return item.delete();
                await actor.updateEmbeddedDocuments("Item", [{_id: item._id, "data.quantity": itemQty - quantityVal}]);
              }
            },
            two: {
              icon: '<i class="fas fa-times"></i>',
              label: "Cancel"
            }
          },
          render: html => {
            const initialVal = itemQty;
            const splitRange = html.find('#splitRange');
            splitRange.attr("max",itemQty);
            splitRange.val(initialVal);
            const splitValue = html.find('#splitValue');
            splitValue.html(initialVal);
            splitRange.on('input', () => {
              splitValue.html(splitRange.val());
            });
          }
        }).render(true);
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
