/**
 * @fileoverview Code unique to Gene Leads example UI, and extraneous to reuse
 */

const urlParams = parseUrlParams();

const organism = 'org' in urlParams ? urlParams.org : 'homo-sapiens';

const examplesByOrganism = {
  'homo-sapiens': ['RAD51', 'CD4', 'APOE', 'p53'],
  'tupaia-belangeri': ['RAD51', 'CD4', 'APOE'],
  'mus-musculus': ['Pten', 'Rad51', 'Sox2'],
  'rattus-norvegicus': ['Rad51', 'Pten', 'Sox2'],
  'drosophila-melanogaster': ['dpp', 'N', 'Ubx'],
  'caenorhabditis-elegans': ['rad-51', 'daf-16', 'hsf-1'],
  'saccharomyces-cerevisiae': ['rad51', 'atp6', 'cytb'],
  'arabidopsis-thaliana': ['PHYA', 'FLC', 'FT'],
  'danio-rerio': ['bmp4', 'myod1', 'cyp1a'],
  'pan-troglodytes': ['RAD51', 'CD4', 'APOE'],
  'macaca-mulatta': ['RAD51', 'CD4', 'APOE'],
  'macaca-fascicularis': ['RAD51', 'CD4', 'APOE'],
  'felis-catus': ['OXTR', 'MAPK9', 'FGF5'],
  'canis-lupus-familiaris': ['OXTR', 'MAPK9', 'FGF5'],
  'equus-caballus': ['RAD51', 'CD4', 'APOE'],
  'bos-taurus': ['RAD51', 'CD4', 'APOE'],
  'sus-scrofa': ['RAD51', 'CD4', 'APOE'],
  'petromyzon-marinus': ['FGB', 'SDS-1', 'CCK'],
  'zea-mays': ['aprl6', 'pdi6', 'adh1'],
  'oryza-sativa': ['psbA', 'ndhE', 'rps19'],
  'anopheles-gambiae': ['ND1', 'CYTB', 'ATP6'],
  'plasmodium-falciparum': ['coxIII', 'PFBI', 'PFFE1']
};


const fileIcon =
`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-text" viewBox="0 0 16 16">
  <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
  <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
</svg>`;

const deltaIcon =
`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-triangle" viewBox="0 0 16 16">
<path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
</svg>`;

function parseUrlParams() {
  let rawParams = document.location.search;
  const urlParams = {};
  var param, key, value;
  if (rawParams !== '') {
    rawParams = rawParams.split('?')[1].split('&');
    rawParams.forEach(rawParam => {
      param = rawParam.split('=');
      key = param[0];
      value = param[1];
      urlParams[key] = value;
    });
  }
  return urlParams;
}

// Record app state in URL
function updateUrl() {
  const params = Object.keys(urlParams).map(key => {
    return key + '=' + urlParams[key];
  }).join('&');
  history.pushState(null, null, '?' + params);
}

/** Parse differential expression items, return as table for tooltip */
function parseDE(items) {
  if (items.length < 1) return '';

  const rows = '<tbody><tr>' + items.map(item => {
    return (
      `<td>${item.group}</td>` +
      `<td>${item.log2fc}</td>` +
      `<td>${item.adjustedPval}</td>`
      + `<td>${item.scoresRank}</td>`
    );
  }).join('</tr><tr>') + '</tr></tbody>';

  const head =
    '<thead><th>Group</th><th>log2(FC)</th><th>Adj. p-value</th><th>Rank in group</th></thead>';

  // const summary = 'summary="Differential expression"';
  const summary = "<div>Differential expression</div>"
  const style = 'style="border-collapse: collapse; margin: 0 auto;"';
  const result = `${summary}<table ${style}>${head}${rows}</table>`;

  return result;
}

function getOrganism() {
  const selectedOrg =
    document.querySelector('option:checked').text
      .split('(')[1].split(')')[0]
      .replace(/ /g, '-').toLowerCase();

  return selectedOrg;
}

function getGene() {
  const searchInput = document.getElementById('search-genes').value.trim();

  // Handles e.g. "BRCA1,BRCA2", "BRCA1 BRCA2", and "BRCA1, BRCA2"
  const geneSymbols = searchInput.split(/[, ]/).filter(d => d !== '')
  const geneSymbol = geneSymbols[0];
  return geneSymbol;
}

function updateExamples(organism) {
  const rawExamples = examplesByOrganism[organism];

  const examples = rawExamples.map(example => {
    return `<a href="?q=${example}&org=${organism}">${example}</a>`;
  });

  const formattedExamples = examples.join(', ');

  document.querySelector('#examples').innerHTML =
    `Examples: ${formattedExamples}`;
}

updateExamples(organism);
