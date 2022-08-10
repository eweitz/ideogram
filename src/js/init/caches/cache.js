import initGeneCache from './gene-cache';
import initParalogCache from './paralog-cache';
import initInteractionCache from './interaction-cache';
import initGeneStructureCache from './gene-structure-cache';

/**
 * Populates in-memory content caches from on-disk service worker (SW) caches.
 *
 * This warms the following content caches:
 * - Gene cache: gene symbol -> full name, Ensembl ID, genomic coordinates
 * - Paralog cache: gene symbol -> paralogs (evolutionarily related genes)
 * - Interaction cache: gene symbol -> adjacent genes in biochemical pathways
 * - Gene structure cache: gene symbol -> canonical transcript, exons, UTRs
 *
 * Used for related genes kit now, likely worth generalizing in the future.
 *
 * This approaches makes navigating related genes ideogram instant and
 * possible completely offline (i.e. a progressive web component) -- but only
 * once caches are populated.
 */
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
