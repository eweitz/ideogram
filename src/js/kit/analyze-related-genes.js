/** Get time in milliseconds between a start time (t0) and now */
function timeDiff(t0) {
  return Math.round(performance.now() - t0);
}

/** Initialize performance analysis settings */
function initAnalyzeRelatedGenes(ideo) {
  ideo.time = {
    rg: { // times for related genes
      t0: performance.now()
    }
  };
  if ('_didRelatedGenesFirstPlot' in ideo) {
    delete ideo._didRelatedGenesFirstPlot;
  }
}

function getRelatedGenesByType() {
  const ideo = this;
  const relatedGenes = ideo.annotDescriptions.annots;

  const related = Object.values(relatedGenes);
  const paralogous = related.filter(r => r.type === 'paralogous gene');
  const interacting = related.filter(r => r.type === 'interacting gene');
  const searched = Object.entries(relatedGenes)
    .filter((entry) => entry[1].type === 'searched gene')[0][0];

  return {related, paralogous, interacting, searched};
}

function getRelatedGenesTooltipAnalytics(annot) {
  const ideo = this;

  const timeSincePrevTooltip = performance.now() - ideo.time.prevTooltipOff;
  const prevAnnotDomId = ideo.time.prevTooltipAnnotDomId;

  if (timeSincePrevTooltip < 300 && annot.domId === prevAnnotDomId) {
    return null;
  }

  const tooltipGene = annot.name;

  // e.g. "interacting gene" -> "interacting"
  const tooltipRelatedType =
    ideo.annotDescriptions.annots[annot.name].type.split(' ')[0];

  const countsByType = getCountsByType(ideo);

  const analytics = Object.assign(
    {tooltipGene, tooltipRelatedType}, countsByType
  );

  return analytics;
}

/** Compute granular related genes plotting analytics */
function analyzePlotTimes(type, ideo) {
  // Paralogs and interacting genes:
  // http://localhost:8080/examples/vanilla/related-genes?q=RAD51
  //
  // No paralogs:
  // http://localhost:8080/examples/vanilla/related-genes?q=BRCA1&org=mus-musculus
  //
  // No interacting genes:
  // http://localhost:8080/examples/vanilla/related-genes?q=DMC1
  //
  // No paralogs, no interacting genes:
  // http://localhost:8080/examples/vanilla/related-genes?q=BRCA1&org=macaca-mulatta


  const otherTypes = {
    paralogous: 'interacting',
    interacting: 'paralogous'
  };
  const related = ideo.getRelatedGenesByType();
  const otherType = otherTypes[type];
  const numThisRelated = related[type].length;
  const numOtherRelated = related[otherType] ? related[otherType].length : 0;

  if (!ideo._didRelatedGenesFirstPlot) {
    // 1st of 2 attempted plot logs
    ideo._didRelatedGenesFirstPlot = true;

    ideo.time.rg.totalFirstPlot = timeDiff(ideo.time.rg.t0);

    if (numThisRelated > 0) {
      ideo.time.rg.timestampFirstPlot = performance.now();
      ideo._relatedGenesFirstPlotType = type;
    }
  } else {
    // 2nd of 2 attempted plot logs
    if (numThisRelated > 0 && numOtherRelated > 0) {
      // Paralogs and interacting genes were found, e.g. human RAD51
      const timestampFirstPlot = ideo.time.rg.timestampFirstPlot;
      ideo.time.rg.totalLastPlotDiff = timeDiff(timestampFirstPlot);
    } else if (numThisRelated > 0 && numOtherRelated === 0) {
      // Other attempt did not plot, and this did, so log this as 1st
      // Often seen when no interacting genes found, e.g. human DMC1
      ideo.time.rg.timestampFirstPlot = performance.now();
      ideo.time.rg.totalFirstPlot = timeDiff(ideo.time.rg.t0);
      ideo._relatedGenesFirstPlotType = type;
      ideo.time.rg.totalLastPlotDiff = 0;

    } else if (numThisRelated === 0 && numOtherRelated > 0) {
      // This attempt did not plot, the other did, so log 1st plot as also last
      // Often seen when no paralogs found, e.g. mouse BRCA1
      ideo.time.rg.totalLastPlotDiff = 0;
    } else {
      // No related genes found, so note only the searched gene is plotted
      // Example: Macaca mulatta BRCA1
      ideo._relatedGenesFirstPlotType = 'searched';
      ideo.time.rg.totalLastPlotDiff = 0;
    }
  }
}

function getCountsByType(ideo) {
  const related = ideo.getRelatedGenesByType();

  const numRelatedGenes = related['related'].length;
  const numParalogs = related['paralogous'].length;
  const numInteractingGenes = related['interacting'].length;
  const searchedGene = related['searched'];

  return {
    numRelatedGenes, numParalogs, numInteractingGenes, searchedGene
  };
}

/** Summarizes number and kind of related genes, performance, etc. */
function analyzeRelatedGenes(ideo) {

  const countsByType = getCountsByType(ideo);

  const timeTotal = ideo.time.rg.total;
  const timeTotalFirstPlot = ideo.time.rg.totalFirstPlot;
  const timeTotalLastPlotDiff = ideo.time.rg.totalLastPlotDiff;
  const timeParalogs = ideo.time.rg.paralogs;
  const timeInteractingGenes = ideo.time.rg.interactions;
  const timeSearchedGene = ideo.time.rg.searchedGene;
  const firstPlotType = ideo._relatedGenesFirstPlotType;

  const analytics = Object.assign({
    firstPlotType,
    timeTotal, timeTotalFirstPlot, timeTotalLastPlotDiff,
    timeSearchedGene, timeInteractingGenes, timeParalogs
  }, countsByType);

  ideo.relatedGenesAnalytics = analytics;
}

export {
  initAnalyzeRelatedGenes, analyzePlotTimes, analyzeRelatedGenes, timeDiff,
  getRelatedGenesByType, getRelatedGenesTooltipAnalytics
};
