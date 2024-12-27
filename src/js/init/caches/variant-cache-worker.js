import {
  fetchAndParse, getFullId, inspectWorker,
  cacheFetch, cacheRangeFetch, getCacheUrl
} from './cache-lib';


function parseDiseaseElement(diseaseArray, i) {
  const [rawId, rawName] = diseaseArray[i];
  const id = 'MONDO:' + rawId
  const name = rawName.replace('_', ' ');
  return [id, name];
}

/** Transform custom-compressed array into disease name-by-id map */
function parseDiseaseKey(line) {
  const diseaseNamesById = {};

  // E.g. ["0012345|Disease_name_1", "0000042|Particular_condition", ...]
  const diseaseArray = getArray(line);

  for (let i = 0; i < diseaseArray.length; i++) {
    const [id, name] = parseDiseaseElement(diseaseArray, i);
    diseaseNamesById[id] = name;
  }

  return [diseaseArray, diseaseNamesById];
}

/** Transform custom-compressed molecular consequence array */
function parseMolecularConsequenceKey(line) {
  const molecularConsequenceById = {}

  // E.g. ['SO:0001574|splice_acceptor_variant', 'SO:0001234|foo', ...]
  const molecularConsequenceArray = getArray(line);

  for (let i = 0; i < molecularConsequenceArray.length; i++) {
    const [id, rawName] = molecularConsequenceArray[i];
    const name = rawName.replace('_', ' ');
    molecularConsequenceById[id] = name;
  }

  return [molecularConsequenceArray, molecularConsequenceById];
}

/** Get disease names and IDs for this variant, given raw compressed values */
function parseDiseases(rawDiseases, diseaseArray) {
  const diseases = [];

  console.log('rawDiseases', rawDiseases)
  // The raw "diseases" value in variants.tsv is a list of integer index values,
  // which map to the id-name values in disease_mondo_ids_and_names from the
  // variants.tsv.li file.
  const diseaseIndexValues = rawDiseases.split(',');

  for (let i = 0; i < diseaseIndexValues.length; i++) {
    const diseaseIndexValue = parseInt(diseaseIndexValues[i]);
    const [id, name] = parseDiseaseElement(diseaseArray, diseaseIndexValue);
    const disease = {id, name};
    diseases.push(disease);
  }

  return diseases;
}

/** Like parseDiseases, but for molecular consequences */
function parseMolecularConsequences(rawMolecularConsequences, mcArray) {
  const molecularConsequences = [];

  const mcIndexValues = rawMolecularConsequences.split(',');

  for (let i = 0; i < mcIndexValues.length; i++) {
    const mcIndexValue = parseInt(mcIndexValues[i]);
    const [id, name] = mcArray[mcIndexValue];
    const mc = {id, name};
    molecularConsequences.push(mc);
  }

  return molecularConsequences;
}

function parseKey(index, key) {
  return key[index].replace('_', ' ');
}

/**
 * Parse a line in variants.tsv, return a useful variant object
 *
 * The line has the format:
 * #CHROM	POS	ID	REF	ALT	DISEASE_IDS	CLNREVSTAT	CLNSIG	CLNVC	MC	ORIGIN	RS
 */
function parseVariant(line, variantCache) {

  const [
    chromosome,
    position,
    rawClinvarId,
    refAllele, // Allele in the reference genome
    altAllele, // Allele that makes this a "variant"
    rawDiseases,
    rawReviewStatus,
    rawClinicalSignificance,
    rawVariantType,
    rawMolecularConsequences,
    rawOrigin,
    rawRsNumber
  ] = line.split('\t')

  const keys = variantCache.keys;
  console.log('variantCache', variantCache)
  console.log('line', line)
  console.log('rawDiseases', rawDiseases)

  const clinvarVariantId = 'VCV' + rawClinvarId;
  const diseases = parseDiseases(rawDiseases, keys.diseaseArray);
  const reviewStatus = parseKey(rawReviewStatus, keys.reviewStatuses);
  const clinicalSignificance = parseKey(
    rawClinicalSignificance, keys.clinicalSignificances
  );
  const variantType = parseKey(rawVariantType, keys.variantTypes);
  const molecularConsequences = parseMolecularConsequences(
    rawMolecularConsequences, keys.molecularConsequences
  );
  const dbSnpId = 'rs' + rawRsNumber;

  const variant = {
    chromosome, position,
    clinvarVariantId,
    refAllele,
    altAllele,
    diseases,
    reviewStatus,
    clinicalSignificance,
    variantType,
    molecularConsequences,
    dbSnpId
  };

  return variant;
}

async function getVariants(gene, ideo) {
  const variants = [];

  const cache = ideo.variantCache;
  const byteRange = cache.byteRangesByName[gene];

  // Easier debuggability
  if (!ideo.cacheRangeFetch) ideo.cacheRangeFetch = cacheRangeFetch;

  if (!byteRange) return null;

  console.log('cache', cache)

  const config = ideo.config;
  let cacheDir = null;
  if (config.cacheDir) cacheDir = config.cacheDir;
  const cacheType = 'variants';
  const extension = 'tsv';

  const orgName = 'homo-sapiens';
  const cacheUrl = getCacheUrl(orgName, cacheDir, cacheType, extension);
  console.log('cacheUrl', cacheUrl)

  // Get variant data only for the requested gene
  const data = await cacheRangeFetch(cacheUrl, byteRange);
  const lines = data.split('\n');

  console.log('byteRange', byteRange)
  console.log('lines.length', lines.length)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const variant = parseVariant(line, cache);
    variants.push(variant);
  }

  return variants;
}

function getArray(line) {
  // console.log('line', line)
  const value = line.split('= ')[1];
  console.log('value', value)
  return JSON.parse(value);
}

/** Parse a tissue cache TSV file */
export function parseVariantCacheIndex(rawTsv, perfTimes, byteRangesByName) {
  let diseaseArray;
  let diseaseNamesById; // Per MONDO ontology
  let variantTypes; // e.g. "single_nucleotide_variant", "Indel"
  let clinicalSignificances;
  let reviewStatuses;
  let molecularConsequenceArray;
  let molecularConsequenceById;

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines
    if (line[0] === '#') {
      // Parse keys
      const firstChars = line.slice(0, 50);
      if (firstChars.includes('disease_mondo_ids_and_names')) {
        [diseaseArray, diseaseNamesById] = parseDiseaseKey(line);
      } else if (firstChars.includes('variant_types')) {
        variantTypes = getArray(line);
      } else if (firstChars.includes('clinical_significances')) {
        clinicalSignificances = getArray(line);
      } else if (firstChars.includes('clinical_review_statuses')) {
        reviewStatuses = getArray(line);
      } else if (firstChars.includes('molecular_consequences')) {
        [molecularConsequenceArray, molecularConsequenceById] =
          parseMolecularConsequenceKey(line);
      }
      continue;
    }

    // Only process comments, because
    // other variant index lines (byteRangesByName) are processed upstream
    break;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return {
    getVariants,
    byteRangesByName,
    keys: {
      diseaseArray,
      diseaseNamesById,
      variantTypes,
      clinicalSignificances,
      reviewStatuses,
      molecularConsequenceArray,
      molecularConsequenceById
    }
  };
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('tissueCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('paralog', result[0]);
// });
