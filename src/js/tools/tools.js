import {getSettings, handleSettingsHeaderClick} from './settings-ui';
import version from '../version';

const style = `
  <style>

    #gear {
      position: absolute;
      right: 8px;
      top: 24px;
      z-index: 8001;
      cursor: pointer;
      height: 18px;
      width: 18px;
    }

    #tools {
      position: absolute;
      width: 120px;
      right: 32px;
      top: 16px;
      z-index: 8000;
      background: white;
      margin: 0;
      border: 1px solid #CCC;
      border-radius: 4px;
      box-shadow: -2px 4px 6px #CCC;
    }

    #tools ul {
      margin-block-start: 0;
      margin-block-end: 0;
      padding-inline-start: 0;
    }

    #tools li, #download li {
      padding: 2px 12px 2px 12px;
      cursor: pointer;
    }

    #tools li:hover,
    #tools li.active,
    #download li:hover {
      background: #DDD;
    }

    #tools li.ideo-disabled,
    #tools li.active.ideo-disabled,
    #download li.ideo-disabled {
      background: #FFF;
      color: #CCC;
      cursor: default;
    }

    #download {
      position: absolute;
      right: 8px;
      top: 16px;
      z-index: 8000;
      background: white;
      margin: 0;
      padding-inline-start: 0;
    }

    #settings {
      position: absolute;
      right: 8px;
      top: 16px;
      z-index: 8000;
      background: white;
      margin: 0;
      padding-inline-start: 0;
    }

    #about {
      position: absolute;
      right: 24px;
      top: -8px;
      z-index: 8000;
      background: white;
      width: 300px;
      border: 1px solid #CCC;
      padding: 10px;
      border-radius: 4px;
      box-shadow: -2px 4px 6px #CCC;
      cursor: default;
    }

    #close {
      float: right;
      border: 1px solid #DDD;
      border-radius: 4px;
      padding: 0 6px;
      background: #EEE;
      font-weight: bold;
      cursor: pointer;
    }

    #settings label {
      display: inline;
      text-decoration: underline;
      text-decoration-style: dotted;
      cursor: pointer;
    }

    #download {
      position: absolute;
      width: 150px;
      top: -2px;
      right: 120px;
      z-index: 8000;
      background: white;
      margin: 0;
      border: 1px solid #CCC;
      border-radius: 4px;
      box-shadow: -2px 4px 6px #CCC;
    }

    li {
      list-style-type: none;
    }

    #settings .no-underline {
      text-decoration: none;
    }

    #settings .setting {
      margin-right: 8px;
    }

    #settings input[type="checkbox"], #settings input[type="radio"] {
      position: relative;
      top: 2px;
    }

    .area-header {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      clear: both;
    }

    .area-content {
      display: flex;
      flex-wrap: wrap;
    }

    .area-content > div {
      margin-right: 30px;
      margin-bottom: 15px;
    }

    .tab-panel input[type="number"] {
      width: 50px;
    }

    .tab-panel ul {
      width: 600px;
      list-style: none;
      border-bottom: 1px solid #CCC;
      box-sizing: border-box;
      margin-bottom: 0;
      padding-left: 0;
    }

    .tab-panel .nav:before, .tab-panel .nav:after {
      content: " ";
      display: table;
      clear: both;
    }

    .tab-panel li {
      float: left;
      margin-right: 2px;
      display: block;
      margin-bottom: -1px;
    }

    .tab-panel li > a {
      padding: 10px 15px;
      text-decoration: none;
      border-radius: 4px 4px 0 0;
      display: block;
      position: relative;
    }

    .tab-panel li.active > a {
      border: 1px solid #CCC;
      border-bottom: none;
      background-color: white;
    }

    .tab-panel .tab-content {
      width: 600px;
    }

    .tab-panel .tab-content > div {
      display: none;
      padding-top: 20px;
      clear: both;
    }

    .tab-panel .tab-content > div {
      padding: 20px 10px 5px 10px;
    }

    .tab-panel .tab-content > div.active {
      display: block;
      border: 1px solid #CCC;
      border-top: none;
    }

  </style>`;

// eslint-disable-next-line max-len
const gearIcon = '<svg viewBox="0 0 512 512"><path fill="#AAA" d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z"/></svg>';
// Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
// License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)

function deactivate(items) {
  items.forEach(item => {item.classList.remove('active');});
}

function closeTools() {
  const toolHeaders = document.querySelectorAll('#tools > ul > li');
  deactivate(toolHeaders);
  const itemsToClose =
    document.querySelectorAll('.ideo-modal, .ideo-tool-panel');
  itemsToClose.forEach(item => {item.remove();});

  document.querySelector('#tools').style.display = 'none';
}

/**
 * As needed, hide tool panels that are triggered by hovering
 */
function handleHideForHoverables(trigger, tool, toolHeader, toolHeaders) {
  if (trigger === 'mouseenter') {

    // Hide panel when hover leaves tool header, if new target element
    // is part of the tools UI (and not the panel itself)
    toolHeader.addEventListener('mouseleave', event => {
      const toElement = event.toElement;
      const toId = toElement.id;
      const panelElement = document.querySelector('.ideo-tool-panel');
      const toolsElement = document.querySelector('#tools');
      if (
        toolsElement.contains(toElement) &&
        panelElement && !panelElement.contains(toElement) &&
        toId !== tool
      ) {
        deactivate(toolHeaders);
        panelElement.remove();
      }
    });
  }
}

/** Determine action that should trigger a tool panel to display */
function getTrigger(toolHeader) {
  const shouldHover =
    Array.from(toolHeader.classList).includes('ideo-tool-hover');
  const trigger = shouldHover ? 'mouseenter' : 'click';
  return trigger;
}

/** Shows clicked tool as active, displays resulting panel */
function handleToolClick(ideo) {
  const toolHeaders = document.querySelectorAll('#tools > ul > li');

  toolHeaders.forEach(toolHeader => {

    const trigger = getTrigger(toolHeader);

    toolHeader.addEventListener(trigger, event => {

      // Show only clicked tool header as active
      deactivate(toolHeaders);
      toolHeader.classList += ' active';

      const tool = toolHeader.id.split('-')[0];
      const panel = getPanel(tool, ideo);

      if (trigger === 'mouseenter') {
        toolHeader.insertAdjacentHTML('beforeend', panel);
        handleHideForHoverables(trigger, tool, toolHeader, toolHeaders);
      } else {
        document.querySelector('#gear').insertAdjacentHTML('beforeend', panel);
      }
    });
  });

  // Upon clicking "close" (x), remove tools UI
  document.querySelectorAll('#close').forEach(closeButton => {
    closeButton.addEventListener('click', () => {closeTools();});
  });
}

function handleGearClick(ideo) {
  document.querySelector('#gear')
    .addEventListener('click', event => {
      var options = document.querySelector('#tools');
      if (options.style.display === 'none') {
        options.style.display = '';
        hideOnClickOutside();
      } else {
        options.style.display = 'none';
        closeTools();
      }
    });

  handleToolClick(ideo);

  handleSettingsHeaderClick(ideo);
}

function showGearOnIdeogramHover(ideo) {
  const container = document.querySelector(ideo.selector);
  const gear = document.querySelector('#gear');
  const panel = document.querySelector('#tools');

  container.addEventListener('mouseover', () => gear.style.display = '');
  container.addEventListener('mouseout', () => {
    // Hide gear only if panel is not shown
    if (panel.style.display === 'none') {
      gear.style.display = 'none';
    }
  });

  gear.addEventListener('mouseover', () => gear.style.display = '');
}

function getPanel(tool, ideo) {
  var panel;
  if (tool === 'settings') panel = getSettings();
  if (tool === 'download') panel = getDownload(ideo);
  if (tool === 'about') panel = getAbout();
  return panel.trim();
}

function getDownload(ideo) {

  const numAnnots = document.querySelectorAll('.annot').length;
  const annotsClass = (numAnnots > 0) ? '' : 'ideo-disabled';

  return `
    <div id="download" class="ideo-tool-panel">
      <li>Image</li>
      <li class="${annotsClass}">Annotation data</li>
    </div>
  `;
}

function getAbout() {
  const ideogramLink = `
    <a href="https://github.com/eweitz/ideogram" target="_blank" rel="noopener">
      Ideogram.js</a>`;
  const closeButton = '<span id="close">x</span>';
  return `
    <div id="about" class="ideo-modal">
      ${ideogramLink}, version ${version} ${closeButton}<br/>
      <i>Chromosome visualization for the web</i>
    </div>`;
}

function hideOnClickOutside(selector) {
  const elements = document.querySelectorAll('#gear, #tools');
  const outsideClickListener = event => {
    let clickedOutsideCount = 0;
    elements.forEach((element) => {
      if (!element.contains(event.target)) {
        clickedOutsideCount += 1;
      }
    });
    if (clickedOutsideCount === elements.length) {
      closeTools();
      removeClickListener();
    }
  };

  const removeClickListener = () => {
    document.removeEventListener('click', outsideClickListener);
  };

  document.addEventListener('click', outsideClickListener);
}

function initTools(ideo) {

  const triangle = '<span style="float: right">&blacktriangleright;</span>';

  const toolsHtml = `
    ${style}
    <div id="gear" style="display: none">${gearIcon}</div>
    <div id="tools" style="display: none">
      <ul>
        <li id="download-tool" class="ideo-tool-hover">Download ${triangle}</li>
        <li id="about-tool">About</li>
      </ul>
    </div>`;


  document.querySelector(ideo.selector)
    .insertAdjacentHTML('beforebegin', toolsHtml);

  handleGearClick(ideo);

  showGearOnIdeogramHover(ideo);
}

export {initTools};

