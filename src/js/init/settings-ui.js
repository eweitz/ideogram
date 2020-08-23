import {slug} from '../lib';
import settings from './settings';

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

    #tools li:hover, #download li:hover {
      background: #DDD;
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

    #settings label {
      display: inline;
      text-decoration: underline;
      text-decoration-style: dotted;
      cursor: pointer;
    }

    #download {
      position: absolute;
      width: 150px;
      top: -8px;
      right: 111px;
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


function handleSettingsHeaderClick(ideo) {
  var links = document.querySelectorAll('li.ideo-settings-header > a');
  links.forEach(function(link) {
    link.addEventListener('click', function(event) {
      var targetLink = event.target,
        targetId;

      // Don't scroll
      event.preventDefault();

      // Deactivate all tabs
      links.forEach(function(link2) {
        link2.parentElement.classList.remove('active');
      });
      document.querySelectorAll('.tab-content > div').forEach(function(div) {
        div.classList.remove('active');
      });

      // Activate selected tab
      targetLink.parentElement.classList += ' active';
      targetId = targetLink.href.split('#')[1];
      document.getElementById(targetId).classList += ' active';
    });
  });
}

function handleToolClick() {
  const toolHeaders = document.querySelectorAll('#tools > ul > li');
  toolHeaders.forEach(toolHeader => {
    toolHeader.addEventListener('click', event => {
      const tool = toolHeader.id.split('-')[0];
      var panel;
      if (tool === 'settings') panel = getSettings();
      if (tool === 'download') panel = getDownload();
      if (tool === 'about') panel = getAbout();

      document.getElementById('gear')
        .insertAdjacentHTML('beforeend', panel);
    });
  });
}

function handleGearClick(ideo) {
  document.querySelector('#gear')
    .addEventListener('click', event => {
      var options = document.querySelector('#tools');
      if (options.style.display === 'none') {
        options.style.display = '';
      } else {
        options.style.display = 'none';
      }
    });

  handleToolClick(ideo);

  handleSettingsHeaderClick(ideo);
}

/** Ensure string value can be rendered as an HTML "title" attribute */
function toTitle(value) {
  if (typeof value !== 'undefined') {
    return value
      .trim()
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '')
      .replace(/\s{2,}/g, ' ');
  }
}

function getIdAttr(setting) {
  const id = 'id' in setting ? setting.id : slug(setting.name);
  return `setting-${slug(id)}`;
}

/** Get HTML label for setting header */
function getHeader(setting, option=null, optionId=null) {
  // Get a header for each setting

  let name; let id; let title;

  if (option) {
    name = option;
    id = optionId;
    title = '';
  } else {
    name = 'shortName' in setting ? setting.shortName : setting.name;
    id = getIdAttr(setting);
    title = ` title="${toTitle(setting.description)}"`;
  }

  const underline = option === null ? '' : ' no-underline';

  const attrs =
    `class="setting${underline}" for="${id}"${title}`;

  return `<label ${attrs}>${name}</label>`;
}

/** Transform options to an array of list items (<li>'s) */
function getOptions(setting, name) {

  const typeAttr = `type="${setting.type}"`;

  if ('options' in setting === false) {
    // type="number"
    const id = getIdAttr(setting);
    return `<input ${typeAttr} id="${id}"/><br/>`;
  }

  if (Array.isArray(setting.options) === false) return '';

  const description = toTitle(setting.description);

  if (setting.type === 'radio') {
    return setting.options.map(option => {

      const id = 'setting-' + slug(option);
      const attrs = `${typeAttr} id="${id}" title="${description}"`;

      const input = `<input ${attrs} name="${name}" value="${id}"/>`;
      const label = getHeader(setting, option, id);
      const item = '<br/>' + input + label;
      return item;
    }).join('') + '<br/>';
  }
}

function listTabs(themeObj, i) {
  const settingsList = themeObj.list
    .map(area => {

      const areaHeading = `<div class="area-header">${area.area}</div>`;

      const settingsByArea = area.settings
        .filter(setting => {
          const displayedTypes = ['string', 'number', 'checkbox', 'radio'];
          return displayedTypes.includes(setting.type);
        })
        .map(setting => {
          const name =
            ('id' in setting) ? setting.id : slug(setting.name);

          const header = getHeader(setting);
          const options = getOptions(setting, name);

          return '<div>' + header + options + '</div>';
        }).join('');

      return (
        areaHeading +
        '<div class="area-content">' + settingsByArea + '</div>'
      );
    }).join('<br/>');

  const theme = themeObj.theme;
  const activeClass = (i === 0) ? ' class="active"' : '';

  const htmlId = `${slug(theme)}-tab`;

  return `
    <div id="${htmlId}"${activeClass}>
      ${settingsList}
    </div>`;
}

/**
 * Get list of configurable Ideogram settings; each has a header and options
 *
 * Settings are grouped by theme and area.
 *
 * -> Theme (e.g. Basic, Chromosomes )
 * |-> Area (e.g. Biology, Data)
 *  |-> Setting (e.g. Organism, Height)
 *
 * @param {Array} settingThemes
 */
function list(settingThemes) {

  const navHeaders = settingThemes.map((themeObj, i) => {
    const activeClass = (i === 0) ? ' active"' : '';
    const theme = themeObj.theme;
    return `
      <li class="ideo-settings-header ${activeClass}">
        <a href="#${slug(theme)}-tab">${theme}</a>
      </li>`;
  }).join('');

  const nav = `
    <div class="tab-panel">
    <ul class="nav">
      ${navHeaders}
    </ul>`;

  const tabs = settingThemes.map((themeObj, i) => {
    return listTabs(themeObj, i);
  }).join('');

  const tabContent = `<div class="tab-content">${tabs}</div>`;

  return nav + tabContent;
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

function getDownload() {

  return `
    <div id="download">
      <li>Image</li>
      <li>Annotation data</li>
    </div>
  `;
}

function getSettings() {
  const settingsList = list(settings);
  return `
    <ul id="settings">
        ${settingsList}
    </ul>`;
}

function initSettings(ideo) {

  const settingsHtml = `
    ${style}
    <div id="gear" style="display: none">${gearIcon}</div>
    <div id="tools" style="display: none">
      <ul>
        <li id="download-tool">Download</li>
        <li id="about-tool">About</li>
      </ul>
    </div>`;


  document.querySelector(ideo.selector)
    .insertAdjacentHTML('beforebegin', settingsHtml);

  handleGearClick(ideo);

  showGearOnIdeogramHover(ideo);
}

export {initSettings};

