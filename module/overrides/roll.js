/**
 * Expand an inline roll element to display it's contained dice result as a tooltip
 * @param {HTMLAnchorElement} a     The inline-roll button
 * @return {Promise<void>}
 */
export async function expandInlineResult(a) {
  if (!a.classList.contains('inline-roll')) return;
  if (a.classList.contains('expanded')) return;

  // Create a new tooltip
  const roll = Roll.fromJSON(unescape(a.dataset.roll));
  const tip = document.createElement('div');
  const toolTip = await roll.getTooltip();
  if (!toolTip.includes('class="tooltip-part"')) return;
  tip.innerHTML = toolTip;

  // Add the tooltip
  const tooltip = tip.children[0];
  a.appendChild(tooltip);
  a.classList.add('expanded');

  // Set the position
  const pa = a.getBoundingClientRect();
  const pt = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.min(pa.x, window.innerWidth - (pt.width + 3))}px`;
  tooltip.style.top = `${Math.min(pa.y + pa.height + 3, window.innerHeight - (pt.height + 3))}px`;
  const zi = getComputedStyle(a).zIndex;
  tooltip.style.zIndex = Number.isNumeric(zi) ? zi + 1 : 100;
}
