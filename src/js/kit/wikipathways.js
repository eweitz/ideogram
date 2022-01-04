// Definitions for ArrowHead values in WikiPathways GPML
//
// See also: https://discover.nci.nih.gov/mim/formal_mim_spec.pdf
const interactionArrowMap = {
  'Arrow': ['acts on', 'acted on by'],
  'TBar': ['inhibits', 'is inhibited by'],
  'mim-binding': ['binds', 'binds'],
  'mim-catalysis': ['catalyzes', 'catalyzed by'],
  'mim-cleavage': ['cleaves', 'cleaved by'],
  'mim-conversion': ['converts', 'converted by'],
  // 'mim-covalent-bond': ['covalently binds',
  // 'mim-gap': 'MimGap',
  'mim-inhibition': ['inhibits', 'is inhibited by'],
  'mim-modification': ['modifies', 'is modified by'],
  'mim-necessary-stimulation':
    ['necessarily stimulates', 'is necessarily stimulated by'],
  'mim-stimulation': ['stimulates', 'is stimulated by'],
  'mim-transcription-translation':
    ['transcribes / translates', 'is transcribed / translated by']
};

/**
 * Fetch GPML for pathway and find ID of Interaction between two genes,
 * and the ID of the two DataNodes for each of those interactions.
 *
 * WikiPathways SVG isn't detailed enough to reliably determine the specific
 * interaction elements relating two genes, given only the gene symbols.  This
 * fetches augmented GPML data for the pathway, and queries it to get only
 * interactions between the two genes.
 */
 export async function findGpmlConnections(interactingGenes, pathwayId) {
  const [searchedGene, interactingGene] = interactingGenes;
  const wpBaseUrl = 'https://webservice.wikipathways.org/';
  const pathwayUrl = wpBaseUrl + `getPathway?pwId=${pathwayId}&format=json`;
  const wpResponse = await fetch(pathwayUrl);
  const wpData = await wpResponse.json();
  // console.log('wpData', wpData)
  const rawGpml = wpData.pathway.gpml;
  // console.log('rawGpml', rawGpml)
  const gpml = new DOMParser().parseFromString(rawGpml, 'text/xml');
  const nodes = gpml.querySelectorAll(
    `DataNode[TextLabel="${searchedGene}"],` +
    `DataNode[TextLabel="${interactingGene}"]`
  );

  const genes = Array.from(nodes).map(node => {
    // console.log('node.innerHTML', node.innerHTML);
    return {
      textLabel: node.getAttribute('TextLabel'),
      graphId: node.getAttribute('GraphId'),
      groupRef: node.getAttribute('GroupRef')
    };
  });

  // console.log('genes', genes)

  const geneGraphIds = genes.map(g => g.graphId);
  const geneGroupRefs = genes.map(g => g.groupRef);
  // console.log('geneGroupRefs', geneGroupRefs)
  const groupSelectors =
    geneGroupRefs.map(ggr => `Group[GroupId="${ggr}"]`).join(',');
  // console.log('groupSelectors', groupSelectors)
  const groups = gpml.querySelectorAll(groupSelectors);
  // console.log('groups', groups)
  const geneGroups = Array.from(groups).map(group => {
    return {
      graphId: group.getAttribute('GraphId'),
      groupId: group.getAttribute('GroupId')
    };
  });

  const geneGroupGraphIds = geneGroups.map(g => g.graphId);
  // console.log('geneGroupGraphIds', geneGroupGraphIds)

  const matchingGraphIds = geneGraphIds.concat(geneGroupGraphIds);

  // console.log('matchingGraphIds', matchingGraphIds)
  // console.log('geneGroupRefs', geneGroupRefs)
  const connections = [];

  const graphicsXml = gpml.querySelectorAll('Interaction Graphics');
  Array.from(graphicsXml).forEach(graphics => {
    const endGraphRefs = [];
    let numMatchingPoints = 0;
    let ixnType = null;
    // console.log('graphics', graphics)
    let searchedGeneIndex = null;
    Array.from(graphics.children).forEach(child => {
      if (child.nodeName !== 'Point') {
        // console.log('child.nodeName', child.nodeName);
        return;
      }
      const point = child;
      const graphRef = point.getAttribute('GraphRef');
      // const group = point.getAttribute('GraphRef');

      if (graphRef === null) return;
      // console.log('graphRef', graphRef)
      if (matchingGraphIds.includes(graphRef)) {
        numMatchingPoints += 1;
        endGraphRefs.push(graphRef);
        if (point.getAttribute('ArrowHead')) {
          const arrowHead = point.getAttribute('ArrowHead');
          const pointLabel = genes.find(g => g.graphId = graphRef).textLabel;
          const isStart = pointLabel === searchedGene;
          if (searchedGeneIndex === null) {
            searchedGeneIndex = isStart ? 0 : 1;
          }
          // console.log('pointLabel', pointLabel)
          // console.log('searchedGene', searchedGene)
          ixnType = interactionArrowMap[arrowHead][isStart ? 0 : 1];
        }
      }
      // if (numMatchingPoints > 0) {
      //   console.log('graphics.parentNode', graphics.parentNode)
      // }
    });
    // console.log('numMatchingPoints', numMatchingPoints)
    if (numMatchingPoints >= 2) {
      if (searchedGeneIndex === null) {
        const gi = genes.indexOf(genes.find(g => g.textLabel = searchedGene));
        searchedGeneIndex = gi;
        ixnType = 'interacts with';
        console.log('searchedGeneIndex', searchedGeneIndex)
      }
      ixnType = ixnType[0].toUpperCase() + ixnType.slice(1);
      const interactionGraphId = graphics.parentNode.getAttribute('GraphId');
      const connection = {
        'interactionId': interactionGraphId,
        'endIds': endGraphRefs,
        ixnType,
        genes,
        searchedGeneIndex // Whether searched gene is at start or end
      };
      connections.push(connection);
    }
  });

  console.log('connections', connections)
  // console.log('genes', genes)

  return connections;
}

export async function fetchInteractionDiagram(annot, descObj, ideo) {
  // Fetch raw SVG for pathway diagram
  const pathwayId = descObj.pathwayIds[0];
  // const baseUrl = 'https://eweitz.github.io/cachome/wikipathways/';
  const baseUrl = 'https://cachome.github.io/wikipathways/';
  // const baseUrl = 'http://localhost/wikipathways/data/';
  const diagramUrl = baseUrl + pathwayId + '.svg';
  const response = await fetch(diagramUrl);
  if (response.ok) {

    const searchedGene =
      Object.entries(ideo.annotDescriptions.annots)
        .find(([k, v]) => v.type === 'searched gene')[0];
    // console.log('searchedGene', searchedGene)
    const genes = [searchedGene, annot.name]
    const cxns = await findGpmlConnections(genes, pathwayId);

    let selectors = `[name=${annot.name}]`;
    let searchedGeneIndex = 0;
    let interactingGeneIndex;
    if (cxns.length > 0) {
      selectors = cxns[0].endIds.map(id => '#' + id).join(',');
      searchedGeneIndex = cxns[0].searchedGeneIndex;
      interactingGeneIndex = (searchedGeneIndex === 0) ? 1 : 0;
    }
    // https://webservice.wikipathways.org/findInteractions?query=ACE2&format=json

    const rawDiagram = await response.text();

    const pathwayDiagram = `<div class="pathway-diagram">${rawDiagram}</div>`;

    annot.displayName += pathwayDiagram;

    document.querySelector('#_ideogramTooltip').innerHTML = annot.displayName;

    Ideogram.d3.select('svg.Diagram')
      .attr('width', 350)
      .attr('height', 300);

    const viewport = document.querySelector('.svg-pan-zoom_viewport');
    viewport.removeAttribute('style');
    viewport.removeAttribute('transform');

    const matches = document.querySelectorAll(selectors);
    console.log('matches', matches)
    const match0 = matches[searchedGeneIndex]
    const m0 = match0.getCTM();
    const m0Rect = match0.getBoundingClientRect();
    const m0Box = match0.getBBox();
    const m0MinX = m0.e/m0.a;
    const m0MinY = m0.f/m0.d;

    let minX = m0MinX;
    let minY = m0MinY;
    let width;
    let height;

    width = 350;
    height = 300;

    // matches[0].children[0].setAttribute('fill', '#F55');
    // console.log('matches[0].children[0].style', matches[0].children[0].style)
    match0.children[0].style.fill = '#f55';

    if (matches.length > 1) {
      // console.log('matches.length > 1')
      // matches[1].children[0].setAttribute('fill', '#C4C');
      const match1 = matches[interactingGeneIndex];
      // console.log('match1')
      // console.log(match1)
      match1.children[0].style.fill = '#c4c';
      const m1 = matches[1].getCTM();
      const m1Rect = matches[1].getBoundingClientRect();
      const m1Box = matches[1].getBBox();
      console.log('m0', m0)
      console.log('m1', m1)
      const m1MinX = m1.e/m1.a;
      const m1MinY = m1.f/m1.d;
      // const m1MinX = m1.e/m1.a + m1Rect.width;
      // const m1MinY = m1.f/m1.d - m1Rect.height;
      if (m1MinX < m0MinX) minX = m1MinX;
      if (m1MinY < m0MinY) minY = m1MinY;

      let pairWidth = 0;
      if (m0Rect.left < m1Rect.left) {
        // pairWidth = m1Rect.right - m0Rect.left;
        width += m1Box.width + 40;
      }

      // width += pairWidth;

      // console.log('m0Rect', m0Rect)
      // console.log('m1Rect', m1Rect)
      // console.log('m1MinX', m1MinX)
      // console.log('m0MinX', m0MinX)
      // console.log('m1MinY', m1MinY)
      // console.log('m0MinY', m0MinY)
      // console.log('pairWidth', pairWidth)
      // console.log('width', width)
      // width += Math.abs(m1MinX - m0MinX);
      // height += Math.abs(m1MinY - m0MinY);

      // minX -= 100;
      // minY -= 100;

      // minX -= 150;
      // minY -= 150;
    } else {
      minX -= 150;
      minY -= 150;
    }

    minX = Math.round(minX);
    minY = Math.round(minY);
    width = Math.round(width);
    height = Math.round(height);

    const viewBox = `${minX} ${minY} ${width} ${height}`;
    console.log('viewBox', viewBox);
    document.querySelector('svg.Diagram').setAttribute('viewBox', viewBox);

  }
}
