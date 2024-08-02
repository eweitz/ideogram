const PVJS_URL = 'https://cdn.jsdelivr.net/npm/@wikipathways/pvjs@5.0.1/dist/pvjs.vanilla.js';
const SVGPANZOOM_URL = 'https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.5.0/dist/svg-pan-zoom.min.js';
const CONTAINER_ID = 'ideo-pathway-container';

/** Request pvjs / kaavio JSON for a WikiPathways biological pathway diagram */
async function fetchPathwayViewerJson(pwId) {
  const origin = 'https://raw.githubusercontent.com'
  const repoAndBranch = '/wikipathways/wikipathways-assets/main';

  // E.g. https://raw.githubusercontent.com/wikipathways/wikipathways-assets/main/pathways/WP5445/WP5445.json
  const url = `${origin}${repoAndBranch}/pathways/${pwId}/${pwId}.json`;

  const response = await fetch(url);
  const pathwayJson = await response.json();

  window.pathwayJson = pathwayJson;
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
  console.log('entityDom')
  console.log(entityDom)

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
function addHeader(pwId, pathwayJson, pathwayContainer) {
  const pathwayName = pathwayJson.pathway.name;
  const url = `https://wikipathways.org/pathways/${pwId}`;
  const linkAttrs = `href="${url}" target="_blank"`;

  // Link to full page on WikiPathways, using pathway title
  const pathwayLink = `<a ${linkAttrs}>${pathwayName}</a>`;

  const style =
    'style="float: right; background-color: #aaa; border: none; ' +
    'color: white; font-weight: bold; font-size: 16px; padding: 0px 4px; ' +
    'border-radius: 3px; cursor: pointer;"';
  const buttonAttrs = `class="_ideoPathwayCloseButton" ${style}`;
  const closeButton = `<button ${buttonAttrs}}>x</button>`;

  const headerBar =
    `<div class="_ideoPathwayHeader">${pathwayLink}${closeButton}</div>`;
  pathwayContainer.insertAdjacentHTML('afterBegin', headerBar);

  const closeButtonDom = document.querySelector('._ideoPathwayCloseButton');
  closeButtonDom.addEventListener('click', function(event) {
    const pathwayContainer = document.querySelector(`#${CONTAINER_ID}`);
    pathwayContainer.remove();
  });
}

/** Fetch and render WikiPathways diagram for given pathway ID */
export async function drawPathway(
  pwId, sourceGene, destGene, dimensions={height: 440, width: 900},
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
        drawPathway(pwId, sourceGene, destGene, dimensions, retryAttempt++);
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
  const ideoContainerDom = document.querySelector('#ideogram-container');
  if (oldPathwayContainer) {
    oldPathwayContainer.remove();
  }

  const dim = dimensions;
  const widthCss = `width: 900px;`
  const pvjsDimensions = `height: ${dim.height}px; ${widthCss}`;
  const containerDimensions = `height: ${dim.height + 20}px; ${widthCss}`;
  const style = `border: 0.5px solid #DDD; ${containerDimensions} margin: auto;`;
  const pvjsContainerHtml = `<div id="ideo-pvjs-container" style="${pvjsDimensions}"></div>`;
  const containerHtml = `<div id="${CONTAINER_ID}" style="${style}">${pvjsContainerHtml}</div>`;
  ideoContainerDom.insertAdjacentHTML('beforeEnd', containerHtml);
  const pathwayContainer = document.querySelector(containerSelector);
  const pvjsContainer = document.querySelector('#ideo-pvjs-container');

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
  window.pathwayViewer = pathwayViewer;

  addHeader(pwId, pathwayJson, pathwayContainer);

  // zoomToEntity(sourceEntityId);
}
