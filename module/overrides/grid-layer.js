export function measureDistanceGrid(origin, target) {
  const ray = new Ray(origin, target);
  const segments = [{ ray }];
  return this.grid.measureDistances(segments, { gridSpaces: true })[0];
}
