// Device performance tiering — decides pixel ratio, shadows, particle
// budgets and geometry detail so the scene stays smooth across devices.

export function detectPerformanceTier() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isTablet = /iPad|Tablet/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 768;

  let tier = 'high';
  if (reduced || isMobile || small || cores <= 4 || mem <= 3) tier = 'low';
  else if (isTablet || cores <= 6 || mem <= 4) tier = 'medium';

  return {
    tier,
    pixelRatio: tier === 'high' ? Math.min(window.devicePixelRatio, 2) : tier === 'medium' ? 1.5 : 1,
    shadows: tier !== 'low',
    maxLights: tier === 'high' ? 4 : tier === 'medium' ? 2 : 1,
    antialias: tier !== 'low',
    particleBudget: tier === 'high' ? 600 : tier === 'medium' ? 250 : 80,
    geometryDetail: tier === 'high' ? 1 : tier === 'medium' ? 0.6 : 0.4,
  };
}
