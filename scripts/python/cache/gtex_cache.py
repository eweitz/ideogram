import urllib.request
import json

base_url = 'https://gtexportal.org/api/v2'
url = f'{base_url}/dataset/tissueSiteDetail?page=0&itemsPerPage=250'
response = urllib.request.urlopen(url)
data = json.loads(response.read().decode('utf-8'))

raw_tissues = data['data']
tissues = []
for raw_tissue in raw_tissues:
    samples = raw_tissue['rnaSeqSampleSummary']['totalCount']
    if samples < 70:
        # Omit tissues that have relatively few samples,
        # like GTEx Portal deprioritizes
        continue
    tissue = {
        'id': raw_tissue['tissueSiteDetailId'],
        'abbr': raw_tissue['tissueSiteDetailAbbr'],
        'ontologyId': raw_tissue['ontologyId'],
        'color': raw_tissue['colorHex'],
        'expressed_gene_count': raw_tissue['expressedGeneCount'],
    }
    tissues.append(tissue)

top_genes_by_tissue = {}
for tissue in tissues:
    tissue_id = tissue['id']
    items = round(tissue['expressed_gene_count'] * 0.01)
    params = f'?filterMtGene=true&sortBy=median&sortDirection=desc&tissueSiteDetailId={tissue_id}&page=0&itemsPerPage={items}'
    url = f'{base_url}/expression/topExpressedGene{params}'

    print(f'Requesting {url}')
    response = urllib.request.urlopen(url)
    data = json.loads(response.read().decode('utf-8'))

    raw_top_genes = data['data']
    top_genes = []
    for gene in raw_top_genes:
        top_gene = [gene['geneSymbol'], round(gene['median'], 2)]
        # top_gene = gene['geneSymbol']
        top_genes.append(top_gene)
    top_genes_by_tissue[tissue_id] = top_genes

output = {
    'genes': top_genes_by_tissue,
    'tissues': tissues,
    'genes_key': ['gene_symbol', 'median_expression_tpm']
}

output_path = 'cache/gtex_top_genes_by_tissue.json'
with open(output_path, 'w') as f:
    output_json = json.dumps(output)
    f.write(output_json)

print(f'Wrote output to {output_path}')
