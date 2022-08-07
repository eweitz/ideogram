import initGeneCache from './gene-cache';
import initParalogCache from './paralog-cache';
import initInteractionCache from './interaction-cache';
import initGeneStructureCache from './gene-structure-cache';

export async function initCaches(ideo) {

  const config = ideo.config;
  if (!config.useCache) return;

  const organism = config.organism;
  if (config.cacheDir) cacheDir = config.cacheDir;

  let cacheDir = null;

  const cachePromise = Promise.all([
    // initGeneCache(organism, ideo, cacheDir),
    initGeneCache(organism, ideo, cacheDir),
    initParalogCache(organism, ideo, cacheDir),
    initInteractionCache(organism, ideo, cacheDir)
  ]);

  initGeneStructureCache(organism, ideo, cacheDir);

  return cachePromise;
}
