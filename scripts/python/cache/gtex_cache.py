import urllib.request
import csv
import json
import os
import sys
import urllib.parse

# Enable importing local modules when directly calling as script
if __name__ == "__main__":
    cur_dir = os.path.join(os.path.dirname(__file__))
    sys.path.append(cur_dir + "/..")

from lib import download_gzip

base_url = 'https://gtexportal.org/api/v2'

def write_json_file(output, output_path):
    with open(output_path, 'w') as f:
        output_json = json.dumps(output)
        f.write(output_json)

    print(f'Wrote output to {output_path}')

def fetch_tissues():
    """Return all GTEx tissues that have >= 70 samples
    """
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

    return tissues

def fetch_top_genes_by_tissue(tissue):
    """For the given tissue, request top 1% of genes as ranked by median expression
    """
    top_genes = []

    tissue_id = tissue['id']
    items = round(tissue['expressed_gene_count'] * 0.01)
    params = f'?filterMtGene=true&sortBy=median&sortDirection=desc&tissueSiteDetailId={tissue_id}&page=0&itemsPerPage={items}'
    url = f'{base_url}/expression/topExpressedGene{params}'

    print(f'Requesting {url}')
    response = urllib.request.urlopen(url)
    data = json.loads(response.read().decode('utf-8'))

    raw_top_genes = data['data']
    for gene in raw_top_genes:
        # Including median enables sort, etc. downstream
        top_gene = [gene['geneSymbol'], round(gene['median'], 2)]
        top_genes.append(top_gene)

    return top_genes

def process_top_genes_by_tissue():
    """Make JSON file of top 1% of genes for each tissue in GTEx
    """
    tissues = fetch_tissues()

    top_genes_by_tissue = {}
    for tissue in tissues:
        top_genes = fetch_top_genes_by_tissue(tissue)
        tissue_id = tissue['id']
        top_genes_by_tissue[tissue_id] = top_genes

    output = {
        'genes': top_genes_by_tissue,
        'tissues': tissues,
        'genes_key': ['gene_symbol', 'median_expression_tpm']
    }
    output_path = 'cache/gtex_top_genes_by_tissue.json'
    write_json_file(output, output_path)

def process_top_tissues_by_gene():
    """Make JSON file of top 3 tissues (by expression in GTEx) for each gene
    """

    # To manually fetch GTEx file:
    # 1.  Go to https://www.gtexportal.org/home/downloads/adult-gtex#bulk_tissue_expression
    # 2.  Note the "GTEx Analysis V8" section, and "RNA-Seq" table shown by default
    # 3.  Find the row that says:
    #     "GTEx_Analysis_2017-06-05_v8_RNASeQCv1.1.9_gene_median_tpm.gct.gz"
    #     and notes the file size of "6.6 MB"
    # 4.  Click the download button.  This source data is public.
    gct_path = "GTEx_Analysis_2017-06-05_v8_RNASeQCv1.1.9_gene_median_tpm.gct"
    url = (
        "https://storage.googleapis.com/storage/v1/b/adult-gtex/o/" +
        urllib.parse.quote_plus(f"bulk-gex/v8/rna-seq/{gct_path}.gz") +
        "?alt=media"
    )
    download_gzip(url, gct_path, cache=True)

    top_tissues_by_gene = {}

    with open(gct_path) as file:
        reader = csv.reader(file, delimiter="\t")

        for i, row in enumerate(reader):
            if i < 3:
                continue

            gene_name = row[1]

            tissue_expressions = []
            expressions = [float(expression) for expression in row[2:]]

            for j, median_expression in enumerate(expressions):
                if median_expression > 0:
                    tissue_id = j
                    tissue_expressions.append([tissue_id, median_expression])

            sorted_tissue_expressions = sorted(tissue_expressions, key=lambda e: e[1])
            sorted_tissues = [e[0] for e in sorted_tissue_expressions]
            top_tissues = sorted_tissues[:3]

            top_tissues_by_gene[gene_name] = top_tissues

    output_path = 'cache/gtex_top_tissues_by_gene.json'
    write_json_file(top_tissues_by_gene, output_path)

# process_top_genes_by_tissue()

process_top_tissues_by_gene()
