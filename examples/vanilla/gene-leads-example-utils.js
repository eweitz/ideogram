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
}


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
