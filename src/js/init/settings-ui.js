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
}

/** Get HTML for setting header */
function getHeader(setting, name) {
  // Get a header for each setting
  let header;
  if (setting.type === 'number') {
    header = `<div class="setting">${setting.name}</div>`;
  } else {
    header = `
      <label class="setting">
        ${setting.name}
      </label>`;
  }
  return header;
}

/** Transform options to an array of list items (<li>'s) */
function getOptions(setting, name) {

  const typeAttr = `type="${setting.type}"`;

  if ('options' in setting === false) {
    // type="number"
    return `<input ${typeAttr}/><br/>`;
  }

  if (Array.isArray(setting.options) === false) return '';

  return setting.options.map(option => {
    let item;
    const id = slug(option);
    const attrs = `${typeAttr} id="${id}"`;
    if (setting.type === 'radio') {
      // TODO: Handle 'checked'
      const input = `<input ${attrs} name="${name}" value="${id}"/>`;
      const label = `<label for="${id}">${option}</label>`;
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
  return settings
    .map(themeObj => {
      const themeHead = `<br/><br/><b>${themeObj.theme}</b><br/>`;

      const themeList = themeObj.list
        .filter(setting => {
          return ['string', 'number', 'checkbox'].includes(setting.type);
        })
        .map(setting => {
          const name =
            ('id' in setting) ? setting.id : slug(setting.name);

          const header = getHeader(setting, name);
          const options = getOptions(setting, name);

          return header + options;
        }).join('<br/>');

      return themeHead + themeList;
    }).join('');
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

