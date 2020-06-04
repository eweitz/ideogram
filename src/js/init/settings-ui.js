import {slug} from '../lib';
import settings from './settings';

const style = `
  <style>

    #settings-gear {
      position: absolute;
      right: 0;
      cursor: pointer;
      height: 18px;
      width: 18px;
    }

    #settings {
      position: absolute;
      z-index: 9999;
      background: white;
      border: 1px solid #DDD;
    }

    #settings label {
      display: inline;
    }

    #settings li {
      list-style-type: none;
    }

    #settings .setting {
      margin-right: 4px;
    }

    .tab-panel input[type="number"]{
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

    .tab-panel {
      margin-left: 15px;
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
const gearIcon = '<svg viewBox="0 0 512 512"><path fill="#777" d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z"/></svg>';
// Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
// License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)


function handleSettingsToggle(ideo) {
  document.querySelector('#settings-gear')
    .addEventListener('click', event => {
      var options = document.querySelector('#settings');
      if (options.style.display === 'none') {
        options.style.display = '';
      } else {
        options.style.display = 'none';
      }
    });

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

      // Active selected tab
      targetLink.parentElement.classList += ' active';
      targetId = targetLink.href.split('#')[1];
      document.getElementById(targetId).classList += ' active';
    });
  });
}

function toAttr(value) {
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
  return `setting-label-${slug(id)}`;
}

/** Get HTML label for setting header */
function getHeader(setting, option=null) {
  // Get a header for each setting

  let name;
  if (option) {
    name = option;
  } else {
    name = 'shortName' in setting ? setting.shortName : setting.name;
  }
  const description = toAttr(setting.description);
  const id = getIdAttr(setting);

  const attrs = `class="setting" for="${id}" title="${description}"`;

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

  const description = toAttr(description);

  return setting.options.map(option => {
    let item;
    const id = slug(option);
    const attrs = `${typeAttr} id="${id}"`;
    if (setting.type === 'radio') {
      // TODO: Handle 'checked'
      const input = `<input ${attrs} name="${name}" value="${id}"/>`;
      const label = getHeader(setting, option);
      item = input + label;
    }
    return `<li>${item}</li>`;
  }).join('');
}

/**
 * Get list of configurable Ideogram settings; each has a header and options
 *
 * @param {Array} settings
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

  const tabs = settings.map((themeObj, i) => {

    const themeList = themeObj.list
      .filter(setting => {
        return ['string', 'number', 'checkbox'].includes(setting.type);
      })
      .map(setting => {
        const name =
          ('id' in setting) ? setting.id : slug(setting.name);

        const header = getHeader(setting);
        const options = getOptions(setting, name);

        return header + options;
      }).join('<br/>');

    const theme = themeObj.theme;
    const activeClass = (i === 0) ? ' class="active"' : '';

    const htmlId = `${slug(theme)}-tab`;
    return `
      <div id="${htmlId}"${activeClass}>
        ${themeList}
      </div>`;
  }).join('');

  const tabContent = `<div class="tab-content">${tabs}</div>`;

  return nav + tabContent;
}

function initSettings(ideo) {

  const settingsList = list(settings);

  const settingsHtml = `
    ${style}
    <div id="settings-gear">${gearIcon}</div>
    <div id="settings" style="display: none">
      <ul>
        ${settingsList}
      </ul>
    </div>`;

  document.querySelector(ideo.selector)
    .insertAdjacentHTML('beforebegin', settingsHtml);
  handleSettingsToggle(ideo);
}

export {initSettings};

