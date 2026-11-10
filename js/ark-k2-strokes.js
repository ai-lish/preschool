(function attachArkK2Strokes(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ArkK2Strokes = api;
})(typeof window !== 'undefined' ? window : globalThis, function createArkK2Strokes() {
  'use strict';

  function pathLength(points) {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
    }
    return total;
  }

  function nearestProgress(point, target) {
    let walked = 0;
    let bestDistance = Infinity;
    let bestProgress = 0;
    const total = pathLength(target) || 1;
    for (let index = 1; index < target.length; index += 1) {
      const first = target[index - 1];
      const second = target[index];
      const dx = second[0] - first[0];
      const dy = second[1] - first[1];
      const lengthSquared = dx * dx + dy * dy || 1;
      const ratio = Math.max(0, Math.min(1, ((point[0] - first[0]) * dx + (point[1] - first[1]) * dy) / lengthSquared));
      const px = first[0] + ratio * dx;
      const py = first[1] + ratio * dy;
      const distance = Math.hypot(point[0] - px, point[1] - py);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestProgress = (walked + Math.sqrt(lengthSquared) * ratio) / total;
      }
      walked += Math.sqrt(lengthSquared);
    }
    return { distance: bestDistance, progress: bestProgress };
  }

  function followsStroke(actual, target) {
    if (actual.length < 3 || pathLength(actual) < pathLength(target) * 0.28) return false;
    const start = nearestProgress(actual[0], target);
    const end = nearestProgress(actual[actual.length - 1], target);
    if (start.distance > 170 || end.distance > 210 || end.progress - start.progress < 0.45) return false;
    const strides = actual.filter((_, index) => index % Math.max(1, Math.floor(actual.length / 12)) === 0);
    const aligned = strides.map(point => nearestProgress(point, target));
    const nearRatio = aligned.filter(point => point.distance <= 155).length / Math.max(1, aligned.length);
    let forwardSteps = 0;
    for (let index = 1; index < aligned.length; index += 1) {
      if (aligned[index].progress + 0.04 >= aligned[index - 1].progress) forwardSteps += 1;
    }
    const forwardRatio = forwardSteps / Math.max(1, aligned.length - 1);
    return nearRatio >= 0.62 && forwardRatio >= 0.68;
  }

  return Object.freeze({ pathLength, nearestProgress, followsStroke });
});
