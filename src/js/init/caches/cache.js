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

  // Start all these in parallel.  Only initGeneCache blocks; it internally
  // resolves a Promise, whereas the others return upon completing their
  // respective initializations.
  const cachePromise = Promise.all([
    initGeneCache(organism, ideo, cacheDir),
    initParalogCache(organism, ideo, cacheDir),
    initInteractionCache(organism, ideo, cacheDir)
  ]);

  initGeneStructureCache(organism, ideo, cacheDir);

  return cachePromise;
}
