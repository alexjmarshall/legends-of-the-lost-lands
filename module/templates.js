/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  // Define template paths to load
  const templatePaths = [
    // Attribute list partial.
    'systems/brigandine/templates/parts/item-sheet-body.html',
    'systems/brigandine/templates/parts/sheet-attributes.html',
    'systems/brigandine/templates/parts/sheet-groups.html',
    'systems/brigandine/templates/sidebar/entity-create.html',
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
