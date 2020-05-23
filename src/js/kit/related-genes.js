/**
 * @fileoverview Tailored module used in "Related genes" example
 *
 * This file simplifies client code for reusing a "related genes" ideogram --
 * which finds and displays related genes for a searched gene.
 *
 * Related genes here are either "interacting genes" or "paralogs".
 * Interacting genes are genes that immediate upstream or downstream of the
 * searched gene in a biochemical pathway. Paralogs are evolutionarily
 * similar genes in the same species.
 *
 * Data sources:
 *   - Interacting genes: WikiPathways
 *   - Paralogs: Ensembl
 *   - Genomic coordinates: Ensembl, via MyGene.info
 *
 * The functionality provided by this module helps users discover and explore
 * genes related to their gene of interest.
 *
 * A reference implementation is available at:
 * https://eweitz.github.io/ideogram/related-genes
 */

/**
 * Determines if interaction node might be a gene
 *
 * Some interaction nodes are biological processes; this filters out many.
 * Filtering these out makes downstream queries faster.
 *
 * ixn {Object} Interaction from WikiPathways
 * gene {Object} Gene from MyGene.info
 */
function maybeGeneSymbol(ixn, gene) {
  return (
    ixn !== '' &&
    !ixn.includes(' ') &&
    !ixn.includes('/') && // e.g. Akt/PKB
    ixn.toLowerCase() !== gene.name.toLowerCase()
  );
}

/**
 * Retrieves interacting genes from WikiPathways API
 *
 * Docs:
 * https://webservice.wikipathways.org/ui/
 * https://www.wikipathways.org/index.php/Help:WikiPathways_Webservice/API
 *
 * Examples:
 * https://webservice.wikipathways.org/findInteractions?query=ACE2&format=json
 * https://webservice.wikipathways.org/findInteractions?query=RAD51&format=json
 */
async function fetchInteractingGenes(gene, ideo) {
  const ixns = {};
  const seenNameIds = {};
  const orgNameSimple = ideo.config.organism.replace(/-/g, ' ');
  const queryString = `?query=${gene.name}&format=json`;
  const url =
    `https://webservice.wikipathways.org/findInteractions${queryString}`;

  const response = await fetch(url);
  const data = await response.json();

  // For each interaction, get nodes immediately upstream and downstream.
  // Filter out pathway nodes that are definitely not gene symbols, then
  // group pathways by (likely) gene symbol. Each interacting gene can have
  // multiple pathways.
  data.result.forEach(interaction => {
    if (interaction.species.toLowerCase() === orgNameSimple) {
      const right = interaction.fields.right.values;
      const left = interaction.fields.left.values;
      const rawIxns = right.concat(left);
      const name = interaction.name;
      const id = interaction.id;

      rawIxns.forEach(rawIxn => {
        const nameId = name + id;
        if (maybeGeneSymbol(rawIxn, gene) && !(nameId in seenNameIds)) {
          seenNameIds[nameId] = 1;
          const ixn = {name: name, pathwayId: id};
          if (rawIxn in ixns) {
            ixns[rawIxn].push(ixn);
          } else {
            ixns[rawIxn] = [ixn];
          }
        }
      });
    }
  });

  return ixns;
}

/**
 * Queries MyGene.info API, returns parsed JSON
 *
 * Docs:
 * https://docs.mygene.info/en/v3/
 *
 * Example:
 * https://mygene.info/v3/query?q=symbol:cdk2%20OR%20symbol:brca1&species=9606&fields=symbol,genomic_pos,name
 */
async function fetchMyGeneInfo(queryString) {
  const myGeneBase = 'https://mygene.info/v3/query';
  const response = await fetch(myGeneBase + queryString);
  const data = await response.json();
  return data;
}

/**
 * Summarizes interactions for a gene
 *
 * This comprises most of the content for tooltips for interacting genes.
 */
function describeInteractions(gene, ixns) {

  let description = gene.name;

  if (typeof ixns !== 'undefined') {
    // ixns is undefined when querying e.g. CDKN1B in human
    const pathwaysBase = 'https://www.wikipathways.org/index.php/Pathway:';
    const links = ixns.map(ixn => {
      const url = `${pathwaysBase}${ixn.pathwayId}`;
      return `<a href="${url}" target="_blank">${ixn.name}</a>`;
    }).join('<br/>');

    let pathwayText = 'pathway';
    if (ixns.length > 1) pathwayText += 's';

    description += `
      <br/><br/>
      Interacts in ${pathwayText}:<br/>
      ${links}`;
  }

  return description;
}

/**
 * Retrieves position and other data on interacting genes from MyGene.info
 */
async function fetchInteractingGeneAnnots(interactions, ideo) {

  const annots = [];
  const geneList = Object.keys(interactions);

  if (geneList.length === 0) return annots;

  const ixnParam = geneList.map(ixn => {
    return `symbol:${ixn.trim()}`;
  }).join(' OR ');

  const taxid = ideo.config.taxid;
  const queryString =
    `?q=${ixnParam}&species=${taxid}&fields=symbol,genomic_pos,name`;
  const data = await fetchMyGeneInfo(queryString);

  data.hits.forEach(gene => {

    // If hit lacks position, skip processing
    if ('genomic_pos' in gene === false) return;

    const annot = parseAnnotFromMgiGene(gene, ideo, 'purple');
    annots.push(annot);

    const ixns = interactions[gene.symbol];

    const description = describeInteractions(gene, ixns);

    ideo.annotDescriptions[gene.symbol] = description;
  });

  return annots;
}

/**
 * Fetch paralogs of searched gene
 */
async function fetchParalogPositions(annot, annots, ideo) {
  const taxid = ideo.config.taxid;
  const orgUnderscored = ideo.config.organism.replace(/[ -]/g, '_');

  const params = `&format=condensed&type=paralogues&target_taxon=${taxid}`;
  let path = `/homology/id/${annot.id}?${params}`;
  const ensemblHomologs = await Ideogram.fetchEnsembl(path);
  const homologs = ensemblHomologs.data[0].homologies;

  // Fetch positions of paralogs
  const homologIds = homologs.map(homolog => homolog.id);
  path = '/lookup/id/' + orgUnderscored;
  const body = {
    ids: homologIds,
    species: orgUnderscored,
    object_type: 'gene'
  };
  const ensemblHomologGenes = await Ideogram.fetchEnsembl(path, body, 'POST');

  Object.entries(ensemblHomologGenes).map((idGene, i) => {
    const gene = idGene[1];

    // Seen in related genes for SIRT2 in Pan troglodytes
    if ('display_name' in gene === false) return;

    const annot = {
      name: gene.display_name,
      chr: gene.seq_region_name,
      start: gene.start,
      stop: gene.end,
      id: gene.id,
      color: 'pink'
    };

    // Add to start of array, so searched gene gets top z-index
    annots.unshift(annot);
    ideo.annotDescriptions[annot.name] = gene.description;
  });

  return annots;
}

/**
 * Transforms MyGene.info (MGI) gene into Ideogram annotation
 */
function parseAnnotFromMgiGene(gene, ideo, color='red') {
  // Filters out placements on alternative loci scaffolds, an advanced
  // genome assembly feature we are not concerned with in ideograms.
  //
  // Example:
  // https://mygene.info/v3/query?q=symbol:PTPRC&species=9606&fields=symbol,genomic_pos,name
  let genomicPos = null;
  if (Array.isArray(gene.genomic_pos)) {
    genomicPos = gene.genomic_pos.filter(pos => {
      return pos.chr in ideo.chromosomes[ideo.config.taxid];
    })[0];
  } else {
    genomicPos = gene.genomic_pos;
  }

  const annot = {
    name: gene.symbol,
    chr: genomicPos.chr,
    start: genomicPos.start,
    stop: genomicPos.end,
    id: genomicPos.ensemblgene,
    color: color
  };

  return annot;
}

/**
 * For given gene, finds and draws interacting genes and paralogs
 *
 * @param geneSymbol {String} Gene symbol, e.g. RAD51
 */
async function plotRelatedGenes(geneSymbol) {

  const ideo = this;

  ideo.annotDescriptions = {};

  const ideoSel = ideo.selector;
  const annotSel = ideoSel + ' .annot';
  document.querySelectorAll(annotSel).forEach(el => el.remove());

  ideo.startHideAnnotTooltipTimeout();

  // Refine style
  document.querySelectorAll('.chromosome').forEach(chromosome => {
    chromosome.style.cursor = '';
  });

  const chrHeight = ideo.config.chrHeight;
  const chrHeightPadded = chrHeight + 10;
  let ideoLeft =
    document.querySelector('#_ideogramInnerWrap').style['max-width'];
  ideoLeft = parseInt(ideoLeft.slice(0, -2)) + chrHeightPadded;
  var legendLeft = ideoLeft - chrHeightPadded - 40;

  const topPx = chrHeight + 30;
  const style =
    `float: left; position: relative; top: -${topPx}px; left: ${legendLeft}px;`;

  // Fetch positon of searched gene
  const taxid = ideo.config.taxid;
  const queryString =
    `?q=symbol:${geneSymbol}&species=${taxid}&fields=symbol,genomic_pos,name`;
  const data = await fetchMyGeneInfo(queryString);

  const gene = data.hits[0];
  ideo.annotDescriptions[gene.symbol] = gene.name;

  let annots = [];

  const annot = parseAnnotFromMgiGene(gene, ideo);
  annots.push(annot);

  const interactions = await fetchInteractingGenes(annot, ideo);
  const interactingAnnots =
    await fetchInteractingGeneAnnots(interactions, ideo);
  annots = annots.concat(interactingAnnots);

  await fetchParalogPositions(annot, annots, ideo);

  annots.sort((a, b) => {return b.name.length - a.name.length;});

  ideo.drawAnnots(annots);

  document.querySelector('#_ideogramLegend').style = style;
}

/**
 * Enhance tooltip shown on hovering over gene annotation
 */
function decorateGene(annot) {
  const ideo = this;
  const org = ideo.getScientificName(ideo.config.taxid);
  const term = `(${annot.name}[gene])+AND+(${org}[orgn])`;
  const url = `https://ncbi.nlm.nih.gov/gene/?term=${term}`;
  const description = ideo.annotDescriptions[annot.name].split(' [')[0];
  annot.displayName =
    `<a target="_blank" href="${url}">${annot.name}</a>
    <br/>
    ${description}
    <br/>`;
  return annot;
}

const shape = 'triangle';

const legend = [{
  name: '<b>Click gene to search</b>',
  rows: [
    {name: 'Interacting gene', color: 'purple', shape: shape},
    {name: 'Paralogous gene', color: 'pink', shape: shape},
    {name: 'Searched gene', color: 'red', shape: shape}
  ]
}];

/**
 * Wrapper for Ideogram constructor, with generic "Related genes" options
 *
 * This function is made available as a static method on Ideogram.
 *
 * @param {Object} config Ideogram configuration object
 */
function _initRelatedGenes(config) {

  Object.assign(config, {
    showFullyBanded: false,
    rotatable: false,
    legend: legend,
    onWillShowAnnotTooltip: decorateGene
  });

  const ideogram = new Ideogram(config);

  return ideogram;
}

export {_initRelatedGenes, plotRelatedGenes};
