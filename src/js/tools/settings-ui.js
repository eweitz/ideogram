import {slug} from '../lib';

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

function getSettings() {
  const settingsList = list(settings);
  return `
    <ul id="settings">
        ${settingsList}
    </ul>`;
}

export {getSettings};
