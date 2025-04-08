import snarkdown from 'snarkdown';
import tippy from 'tippy.js';
import {getTippyConfig} from '../lib';

const PVJS_URL = 'https://cdn.jsdelivr.net/npm/@wikipathways/pvjs@5.0.1/dist/pvjs.vanilla.js';
const SVGPANZOOM_URL = 'https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.5.0/dist/svg-pan-zoom.min.js';
const CONTAINER_ID = '_ideogramPathwayContainer';

/** Request pvjs / kaavio JSON for a WikiPathways biological pathway diagram */
async function fetchPathwayViewerJson(pwId) {
  const origin = 'https://raw.githubusercontent.com'
  const repoAndBranch = '/wikipathways/wikipathways-assets/main';

  // E.g. https://raw.githubusercontent.com/wikipathways/wikipathways-assets/main/pathways/WP5445/WP5445.json
  const url = `${origin}${repoAndBranch}/pathways/${pwId}/${pwId}.json`;

  const response = await fetch(url);
  const pathwayJson = await response.json();

  Ideogram.pathwayJson = pathwayJson;
  return pathwayJson;
}

/**
 * Load pvjs via classic HTML <script> tag, dynamically written to page
 *
 * pvjs NPM package has several exports, but none quite work without significant
 * dependencies, e.g. React.
 *
 * TODO: Modify pvjs upstream to distribute module imports without e.g. React
 */
async function loadPvjsScript() {
  const pvjsScript = document.createElement('script');
  pvjsScript.setAttribute('src', PVJS_URL);
  document.querySelector('body').appendChild(pvjsScript);
}

/**
 * Load svg-pan-zoom via classic HTML <script> tag, dynamically written to page
 */
async function loadSvgpanzoomScript() {
  const svgpanzoomScript = document.createElement('script');
  svgpanzoomScript.setAttribute('src', SVGPANZOOM_URL);
  document.querySelector('body').appendChild(svgpanzoomScript);
}

/** Get pathway entities that have a term matching query text, e.g. a gene */
function findEntitiesByText(text, pathwayJson) {
  const matchedEntities =
    Object.entries(pathwayJson.entitiesById).filter(([id, entity]) => {
      return entity.textContent?.split(' ').some(token => token === text);
    });
  return matchedEntities;
}

/** Get IDs of entities that have a term matching query text, e.g. a gene */
function getEntityIds(text, pathwayJson) {
  const matchedEntities = findEntitiesByText(text, pathwayJson);
  const entityIds = matchedEntities.map(e => e[0]);
  return entityIds;
}

/** Get highlights to color nodes that match query text, e.g. a gene */
function getHighlights(text, pathwayJson, color) {
  const entityIds = getEntityIds(text, pathwayJson);
  const highlights = entityIds.map(entityId => [null, entityId, color]);
  return highlights;
}

function zoomToEntity(entityId, retryAttempt=0) {
  let entityDom = document.querySelector(`#${entityId}`);
  const parentClasses = Array.from(entityDom.parentNode.classList);
  const isInGroup = parentClasses.includes('Group');
  if (isInGroup) {
    entityDom = entityDom.parentNode;
  }

  // Try drawing pathway, retry each .25 s for 10 s if Pvjs hasn't loaded yet
  if (typeof entityDom === 'undefined') {
    if (retryAttempt <= 40) {
      setTimeout(() => {
        zoomToEntity(entityId, retryAttempt++);
      }, 250);
      return;
    } else {
      throw Error(
        'Zoomed entity DOM is undefined.  ' +
        'Possible causes include unavailable network or CDN.'
      );
    }
  }

  const panZoom = svgPanZoom('.Diagram');
  // const clientRect = entityDom.getBoundingClientRect();

  const svgMatrix = entityDom.transform.baseVal[0].matrix;

  const transformLeft = svgMatrix.e;
  const transformTop = svgMatrix.f;
  // const scale = 0.5161290261053255

  const viewport = document.querySelector('.svg-pan-zoom_viewport')

  const viewportMatrix = viewport.transform.baseVal[0].matrix;
  const viewportScale = viewportMatrix.a;
  const viewportLeft = viewportMatrix.e;

  // panZoom.zoomAtPointBy(3, {x: 282*0.47+213-30, y: 107.5*0.47-10});
  panZoom.zoomAtPointBy(3, {
    x: transformLeft * viewportScale + viewportLeft - 60,
    y: transformTop * viewportScale - 10
  });

  window.viewport = viewport;
  window.panZoom = panZoom;
  window.entityDom = entityDom;
  // window.clientRect = clientRect
  window.svgMatrix = svgMatrix
  window.transformLeft = transformLeft
  window.transformTop = transformTop
  window.viewportScale = viewportScale
  window.viewportLeft = viewportLeft

  // panZoom.zoomAtPoint(2, sourceEntityDom.getBoundingClientRect());
  // panZoom.zoomAtPoint(2, sourceEntityDom.getBoundingClientRect());
}

/** Add header bar to pathway diagram with name, link, close button, etc. */
function addHeader(pwId, pathwayJson, pathwayContainer, showClose=true) {
  const pathwayName = pathwayJson.pathway.name;
  const url = `https://wikipathways.org/pathways/${pwId}`;
  const linkAttrs = `href="${url}" target="_blank" style="margin-left: 4px;"`;

  // Link to full page on WikiPathways, using pathway title
  const pathwayLink = `<a ${linkAttrs}>${pathwayName}</a>`;

  let closeButton;
  if (showClose) {
    // Close button
    const style =
      'style="float: right; background-color: #aaa; border: none; ' +
      'color: white; font-weight: bold; font-size: 16px; padding: 0px 4px; ' +
      'border-radius: 3px; cursor: pointer;"';
    const buttonAttrs = `class="_ideoPathwayCloseButton" ${style}`;
    closeButton = `<button ${buttonAttrs}}>x</button>`;
  } else {
    closeButton = '';
  }

  const headerBar =
    `<div class="_ideoPathwayHeader">${pathwayLink}${closeButton}</div>`;
  pathwayContainer.insertAdjacentHTML('afterBegin', headerBar);

  if (showClose) {
    const closeButtonDom = document.querySelector('._ideoPathwayCloseButton');
    closeButtonDom.addEventListener('click', function(event) {
      const pathwayContainer = document.querySelector(`#${CONTAINER_ID}`);
      pathwayContainer.remove();
    });
  }
}

/**
 *
 */
function removeCptacAssayPortalClause(inputText) {
  // eslint-disable-next-line max-len
  const regex = /Proteins on this pathway have targeted assays available via the \[https:\/\/assays\.cancer\.gov\/available_assays\?wp_id=WP\d+\s+CPTAC Assay Portal\]\./g;
  // eslint-disable-next-line max-len
  const regex2 = /Proteins on this pathway have targeted assays available via the \[CPTAC Assay Portal\]\(https:\/\/assays\.cancer\.gov\/available_assays\?wp_id=WP\d+\)\./g;

  return inputText.replace(regex, '').replace(regex2, '');
}


function removePhosphoSitePlusClause(inputText) {
  // eslint-disable-next-line max-len
  const regex = 'Phosphorylation sites were added based on information from PhosphoSitePlus (R), www.phosphosite.org.';

  return inputText.replace(regex, '');
}

/** Convert Markdown links to standard <a href="... links */
function convertMarkdownLinks(markdown) {
  const html = snarkdown(markdown);

  const htmlWithClassedLinks =
    html.replace(
      /<a href="([^"]+)">/g,
      '<a href="$1" class="_ideoPathwayDescriptionLink" target="_blank">'
    );

  return htmlWithClassedLinks;
}

function formatDescription(rawText) {
  rawText = rawText.replaceAll('\r\n\r\n', '\r\n');
  rawText = rawText.replaceAll('\r\n', '<br/><br/>');
  const denoisedPhospho = removePhosphoSitePlusClause(rawText);
  const denoisedText = removeCptacAssayPortalClause(denoisedPhospho);
  const linkedText = convertMarkdownLinks(denoisedText);
  const trimmedText = linkedText.trim();
  return trimmedText;
}

function getDescription(pathwayJson) {
  const rawText =
  pathwayJson.pathway.comments.filter(
    c => c.source === 'WikiPathways-description'
  )[0].content;
  const descriptionText = formatDescription(rawText);

  const style = `style="font-weight: bold"`;

  const description =
    `<div>` +
      // `<div class="ideoPathwayDescription" ${style}>Description</div>` +
      descriptionText +
    `</div>`;

  return description;
}

function parsePwAnnotations(entitiesById, keys, ontology) {
  const pwKeys = keys.filter(k => entitiesById[k].ontology === ontology);
  const pwAnnotations = pwKeys.map(k => entitiesById[k]);
  return pwAnnotations;
}

export function getPathwayAnnotations(pathwayJson, selectedOntology) {
  const entitiesById = pathwayJson.entitiesById;
  const keys = Object.keys(entitiesById).filter(k => k.startsWith('http://identifiers.org'));
  const sentenceCases = {
    'Cell Type': 'Cell type'
  };
  const ontologies = [
    'Cell Type',
    'Disease'
    // 'Pathway Ontology' // maybe later
  ];
  let selectedOntologies = ontologies;
  if (selectedOntology) {
    selectedOntologies = ontologies.find(
      ontology => ontology.toLowerCase() === selectedOntology.toLowerCase()
    );
  }
  const pathwayAnnotationsList = selectedOntologies.map(ontology => {
    const pwAnnotations = parsePwAnnotations(entitiesById, keys, ontology);
    const links = pwAnnotations.map(pwa => {
      const id = pwa.xrefIdentifier.replace(':', '_');
      const url = `https://purl.obolibrary.org/obo/${id}`;
      const cls = 'class="_ideoPathwayOntologyLink"';
      return `<a href="${url}" target="_blank" ${cls}>${pwa.term}</a>`;
    }).join(', ');

    const refinedOntology = sentenceCases[ontology] ?? ontology;
    const safeOntology = ontology.replaceAll(' ', '_');
    const cls = `class="ideoPathwayOntology__${safeOntology}"`;

    if (links === '') return '';

    return `<div ${cls}>${refinedOntology}: ${links}</div>`;
  }).join('');

  if (pathwayAnnotationsList.length === 0) {
    return '';
  }

  const style = `style="font-weight: bold"`;

  const pathwayAnnotations =
  `<div>` +
    // `<div class="ideoPathwayAnnotations" ${style}>Pathway annotations</div>` +
    pathwayAnnotationsList +
  `</div>`;

  return pathwayAnnotations;
}

/** Get list of unique genes in pathway */
export function getPathwayGenes() {
  const entities = Object.values(Ideogram.pathwayJson.entitiesById);
  const genes = entities.filter(entity => {
    return ['GeneProduct', 'RNA', 'Protein'].includes(entity.wpType);
  }).map(e => e.textContent);
  const uniqueGenes = Array.from(new Set(genes));
  return uniqueGenes;
}


function addFooter(pathwayJson, pathwayContainer, showOntologies) {
  const description = getDescription(pathwayJson);
  const pathwayAnnotations =
    showOntologies ? getPathwayAnnotations(pathwayJson) : '';
  const footer =
    `<br/>` +
    `<div class="_ideoPathwayFooter">` +
      description +
      `<br/>` +
      pathwayAnnotations +
    `</div>`;
  pathwayContainer.insertAdjacentHTML('beforeEnd', footer);
}

/** Fetch and render WikiPathways diagram for given pathway ID */
export async function drawPathway(
  pwId, sourceGene, destGene,
  outerSelector='#_ideogramOuterWrap',
  dimensions={height: 440, width: 900},
  showClose=true,
  geneNodeHoverFn,
  pathwayNodeClickFn,
  showDescription,
  showOntologies,
  showDefaultTooltips,
  retryAttempt=0
) {
  const pvjsScript = document.querySelector(`script[src="${PVJS_URL}"]`);
  if (!pvjsScript) {loadPvjsScript();}

  // const svgpanzoomScript =
  //   document.querySelector(`script[src="${SVGPANZOOM_URL}"]`);
  // if (!svgpanzoomScript) {loadSvgpanzoomScript();}

  const containerSelector = `#${CONTAINER_ID}`;

  // Try drawing pathway, retry each .25 s for 10 s if Pvjs hasn't loaded yet
  if (
    typeof Pvjs === 'undefined'
    // || typeof svgPanZoom === 'undefined'
  ) {
    if (retryAttempt <= 40) {
      setTimeout(() => {
        drawPathway(
          pwId, sourceGene, destGene,
          outerSelector, dimensions, showClose,
          geneNodeHoverFn, pathwayNodeClickFn,
          showDescription,
          retryAttempt++
        );
      }, 250);
      return;
    } else {
      throw Error(
        'Pvjs is undefined.  ' +
        'Possible causes include unavailable network or CDN.'
      );
    }
  }

  // Get pathway diagram data
  const pathwayJson = await fetchPathwayViewerJson(pwId);

  const sourceEntityId = getEntityIds(sourceGene, pathwayJson)[0];
  const destEntityId = getEntityIds(destGene, pathwayJson)[0];

  const sourceHighlights = getHighlights(sourceGene, pathwayJson, 'red');
  const destHighlights = getHighlights(destGene, pathwayJson, 'purple');
  const highlights = sourceHighlights.concat(destHighlights);

  const oldPathwayContainer = document.querySelector(containerSelector);
  const ideoContainerDom = document.querySelector(outerSelector);
  if (oldPathwayContainer) {
    oldPathwayContainer.remove();
  }

  const width = dimensions.width;
  const height = dimensions.height;
  const pvjsDimensions = `height: ${height}px; width: ${width - 2}px;`;
  const containerDimensions = `height: ${height + 20}px; width: ${width}px;`;
  const style =
    `border: 0.5px solid #DDD; border-radius: 3px; ` +
    `position: relative; margin: auto; background-color: #FFF; z-index: 99; ` +
    `${containerDimensions} margin: auto;`;
  const pvjsContainerHtml = `<div id="_ideogramPvjsContainer" style="${pvjsDimensions}"></div>`;
  const containerAttrs =
    `id="${CONTAINER_ID}" style="${style}" ` +
    `data-ideo-pathway-searched="${sourceGene}" ` +
    `data-ideo-pathway-interacting="${destGene}"`;
  const containerHtml = `<div ${containerAttrs}>${pvjsContainerHtml}</div>`;
  ideoContainerDom.insertAdjacentHTML('beforeEnd', containerHtml);
  const pathwayContainer = document.querySelector(containerSelector);
  const pvjsContainer = document.querySelector('#_ideogramPvjsContainer');

  // Pvjs parameters
  // Source: https://github.com/wikipathways/pvjs/blob/fb321e5b8796ecc3312c9a604f75b7ace94a81aa/src/Pvjs.tsx#L392
  // Docs: https://github.com/wikipathways/pvjs#-props
  const pvjsProps = {
    theme: 'plain',
    opacities: [],
    highlights,
    panned: [sourceEntityId], // TODO: Pvjs documents this, but it's unsupported
    zoomed: [sourceEntityId], // TODO: Pvjs documents this, but it's unsupported
    pathway: pathwayJson.pathway,
    entitiesById: pathwayJson.entitiesById,
    detailPanelOpen: false,
    // showPanZoomControls: false,
    selected: null
  };

  // const pathwayViewer = new Pvjs(pvjsProps);
  const pathwayViewer = new Pvjs(pvjsContainer, pvjsProps);
  addHeader(pwId, pathwayJson, pathwayContainer, showClose);

  if (showDescription) {
    addFooter(pathwayJson, pathwayContainer, showOntologies);
  }

  // zoomToEntity(sourceEntityId);

  const detail = {
    pathwayViewer,
    pwId, sourceGene, destGene, dimensions
  };

  // Notify listeners of event completion
  const ideogramPathwayEvent = new CustomEvent('ideogramDrawPathway', {detail});
  document.dispatchEvent(ideogramPathwayEvent);

  // Add mouseover handler to gene nodes in this pathway diagram
  pathwayContainer.querySelectorAll('g.GeneProduct').forEach(geneNode => {
    const geneName = geneNode.getAttribute('name');
    let tooltipContent = geneName;
    geneNode.addEventListener('mouseover', (event) => {
      if (geneNodeHoverFn) {
        tooltipContent = geneNodeHoverFn(event, geneName);
        geneNode.setAttribute('data-tippy-content', tooltipContent);
      }
    });

    if (showDefaultTooltips) {
      geneNode.setAttribute(`data-tippy-content`, tooltipContent);
    }
  });
  if (showDefaultTooltips) {
    const tippyConfig = getTippyConfig();
    tippyConfig.trigger = 'mouseenter';
    tippy('g.GeneProduct[data-tippy-content]', tippyConfig);
  }

  // Add click handler to pathway nodes in this pathway diagram
  if (pathwayNodeClickFn) {
    pathwayContainer.querySelectorAll('g.Pathway').forEach(pathwayNode => {

      // Add customizable click handler
      pathwayNode.addEventListener('click', (event) => {
        const domClasses = Array.from(pathwayNode.classList);
        const pathwayId = domClasses
          .find(c => c.startsWith('WikiPathways_'))
          .split('WikiPathways_')[1]; // e.g. WikiPathways_WP2815 -> WP2815

        pathwayNodeClickFn(event, pathwayId);
      });

      if (showDefaultTooltips) {
        // Indicate this new pathway can be rendered on click
        const tooltipContent = 'Click to show pathway';
        pathwayNode.setAttribute('data-tippy-content', tooltipContent);
      }
    });

    if (showDefaultTooltips) {
      tippy('g.Pathway[data-tippy-content]', tippyConfig);
    }
  }
}
