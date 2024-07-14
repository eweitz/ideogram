const PVJS_URL = 'https://cdn.jsdelivr.net/npm/@wikipathways/pvjs@5.0.1/dist/pvjs.vanilla.js';

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
 * The pvjs library has several exports, but none quite work without significant
 * dependencies, e.g. React.
 *
 * TODO: Modify pvjs upstream to distribute module imports without e.g. React
 */
async function loadPvjsScript() {
  const scriptElement = document.createElement('script');
  scriptElement.setAttribute('src', PVJS_URL);
  document.querySelector('body').appendChild(scriptElement);
}

/** Fetch and render WikiPathways diagram for given pathway ID */
export async function drawPathway(pwId, retryAttempt=0) {
  const pvjsScript = document.querySelector(`script[src="${PVJS_URL}"]`);
  if (!pvjsScript) {loadPvjsScript();}

  const containerId = 'pathway-container'
  const containerSelector = `#${containerId}`

  // Try drawing pathway, retry each .25 s for 10 s if Pvjs hasn't loaded yet
  if (typeof Pvjs === 'undefined') {
    if (retryAttempt <= 40) {
      setTimeout(() => {
        drawPathway(pwId, retryAttempt++);
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

  const oldPathwayContainer = document.querySelector(containerSelector);
  const ideoContainerDom = document.querySelector('#ideogram-container');
  if (oldPathwayContainer) {
    oldPathwayContainer.innerHTML = '';
  }

  const style = 'height: 400px; width: 900px';
  const containerHtml = `<div id="${containerId}" style="${style}"></div>`;
  ideoContainerDom.insertAdjacentHTML('beforeEnd', containerHtml);
  const pathwayContainer = document.querySelector(containerSelector);

  // Pvjs parameters
  // Source: https://github.com/wikipathways/pvjs/blob/fb321e5b8796ecc3312c9a604f75b7ace94a81aa/src/Pvjs.tsx#L392
  // Docs: https://github.com/wikipathways/pvjs#-props
  const pvjsProps = {
    theme: 'plain',
    opacities: [],
    highlights: [],
    panned: [],
    zoomed: [],
    pathway: pathwayJson.pathway,
    entitiesById: pathwayJson.entitiesById,
    detailPanelOpen: false,
    // showPanZoomControls: false,
    selected: null
  };

  // const pathwayViewer = new Pvjs(pvjsProps);
  const pathwayViewer = new Pvjs(pathwayContainer, pvjsProps);
  window.pathwayViewer = pathwayViewer;

}
