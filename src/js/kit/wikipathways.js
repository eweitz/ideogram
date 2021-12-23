
/**
 * Fetch GPML for pathway and find ID of Interaction between two genes,
 * and the ID of the two DataNodes for each of those interactions.
 *
 * WikiPathways SVG isn't detailed enough to reliably determine the specific
 * interaction elements relating two genes, given only the gene symbols.  This
 * fetches augmented GPML data for the pathway, and queries it to get only
 * interactions between the two genes.
 */
 async function findGpmlConnections(gene1, gene2, pathwayId) {
  const wpBaseUrl = 'https://webservice.wikipathways.org/';
  const pathwayUrl = wpBaseUrl + `getPathway?pwId=${pathwayId}&format=json`;
  const wpResponse = await fetch(pathwayUrl);
  const wpData = await wpResponse.json();
  // console.log('wpData', wpData)
  const rawGpml = wpData.pathway.gpml;
  console.log('rawGpml', rawGpml)
  const gpml = new DOMParser().parseFromString(rawGpml, 'text/xml');
  // console.log('gpml', gpml)
  // console.log('gene1', gene1)
  const nodes = gpml.querySelectorAll(
    `DataNode[TextLabel="${gene1}"],` +
    `DataNode[TextLabel="${gene2}"]`
  );

  const genes = Array.from(nodes).map(node => {
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
    Array.from(graphics.children).forEach(child => {
      if (child.nodeName !== 'Point') return;
      const point = child;
      const graphRef = point.getAttribute('GraphRef');
      // const group = point.getAttribute('GraphRef');

      if (graphRef === null) return;
      // console.log('graphRef', graphRef)
      if (matchingGraphIds.includes(graphRef)) {
        numMatchingPoints += 1;
        endGraphRefs.push(graphRef);
      }
      // if (numMatchingPoints > 0) {
      //   console.log('graphics.parentNode', graphics.parentNode)
      // }
    });
    // console.log('numMatchingPoints', numMatchingPoints)
    if (numMatchingPoints >= 2) {
      const interactionGraphId = graphics.parentNode.getAttribute('GraphId');
      const connection = {
        'interactionId': interactionGraphId,
        'endIds': endGraphRefs
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
  const baseUrl = 'https://cachome.github.io/wikipathways/';
  const diagramUrl = baseUrl + pathwayId + '.svg';
  const response = await fetch(diagramUrl);
  if (response.ok) {

    const searchedGene =
      Object.entries(ideo.annotDescriptions.annots)
        .find(([k, v]) => v.type === 'searched gene')[0];
    // console.log('searchedGene', searchedGene)
    const cxns = await findGpmlConnections(annot.name, searchedGene, pathwayId);

    let selectors = `[name=${annot.name}]`;
    if (cxns.length > 0) {
      selectors = cxns[0].endIds.map(id => '#' + id).join(',');
    }
    // https://webservice.wikipathways.org/findInteractions?query=ACE2&format=json

    const rawDiagram = await response.text();

    const pathwayDiagram = `<div class="pathway-diagram">${rawDiagram}</div>`;

    annot.displayName += pathwayDiagram;

    document.querySelector('#_ideogramTooltip').innerHTML = annot.displayName;

    Ideogram.d3.select('svg.Diagram')
      .attr('width', 350)
      .attr('height', 300);

    const matches = document.querySelectorAll(selectors);
    console.log('matches', matches)
    const m0 = matches[0].getCTM();
    const m0Rect = matches[0].getBoundingClientRect();
    const m0Box = matches[0].getBBox();
    const m0MinX = m0.e/m0.a;
    const m0MinY = m0.f/m0.d;

    let minX = m0MinX;
    let minY = m0MinY;
    let width;
    let height;

    width = 350;
    height = 300;

    matches[0].children[0].setAttribute('fill', '#F55');

    if (matches.length > 1) {
      matches[1].children[0].setAttribute('fill', '#C4C');
      // const m1 = matches[1].getCTM();
      // const m1Rect = matches[1].getBoundingClientRect();
      // const m1Box = matches[1].getBBox();
      // console.log('m0', m0)
      // console.log('m1', m1)
      // const m1MinX = m1.e/m1.a;
      // const m1MinY = m1.f/m1.d;
      // // const m1MinX = m1.e/m1.a + m1Rect.width;
      // // const m1MinY = m1.f/m1.d - m1Rect.height;
      // if (m1MinX < m0MinX) minX = m1MinX;
      // if (m1MinY < m0MinY) minY = m1MinY;

      // let pairWidth = 0;
      // if (m0Rect.left < m1Rect.left) {
      //   // pairWidth = m1Rect.right - m0Rect.left;
      //   width += m1Box.width + 40;
      // }

      // // width += pairWidth;

      // console.log('m0Rect', m0Rect)
      // console.log('m1Rect', m1Rect)
      // console.log('m1MinX', m1MinX)
      // console.log('m0MinX', m0MinX)
      // console.log('m1MinY', m1MinY)
      // console.log('m0MinY', m0MinY)
      // console.log('pairWidth', pairWidth)
      // console.log('width', width)
      // // width += Math.abs(m1MinX - m0MinX);
      // // height += Math.abs(m1MinY - m0MinY);

      // minX -= 100;
      // minY -= 100;

      minX -= 150;
      minY -= 150;
    } else {
      minX -= 150;
      minY -= 150;
    }

    const viewBox = `${minX} ${minY} ${width} ${height}`;
    console.log('viewBox', viewBox);
    document.querySelector('svg.Diagram').setAttribute('viewBox', viewBox);

  }
}
