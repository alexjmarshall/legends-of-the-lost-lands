/**
 * Handle how changes to a Token attribute bar are applied to the Actor.
 * This allows for game systems to override this behavior and deploy special logic.
 * @param {string} attribute    The attribute path
 * @param {number} value        The target attribute value
 * @param {boolean} isDelta     Whether the number represents a relative change (true) or an absolute change (false)
 * @param {boolean} isBar       Whether the new value is part of an attribute bar, or just a direct value
 * @return {Promise<documents.Actor>}  The updated Actor document
 */
export async function modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
  const current = foundry.utils.getProperty(this.data.data, attribute);

  // Determine the updates to make to the actor data
  let updates;
  if (isBar) {
    if (isDelta) value = Math.min(Number(current.value) + value, current.max);
    updates = { [`data.${attribute}.value`]: value };
  } else {
    if (isDelta) value = Number(current.value) + value;
    updates = { [`data.${attribute}`]: value };
  }

  /**
   * A hook event that fires when a token's resource bar attribute has been modified.
   * @function modifyTokenAttribute
   * @memberof hookEvents
   * @param {object} data           An object describing the modification
   * @param {string} data.attribute The attribute path
   * @param {number} data.value     The target attribute value
   * @param {boolean} data.isDelta  Whether the number represents a relative change (true) or an absolute change (false)
   * @param {boolean} data.isBar    Whether the new value is part of an attribute bar, or just a direct value
   * @param {objects} updates       The update delta that will be applied to the Token's actor
   */
  const allowed = Hooks.call('modifyTokenAttribute', { attribute, value, isDelta, isBar }, updates);
  return allowed !== false ? this.update(updates) : this;
}
