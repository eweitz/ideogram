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
        tissue = {
            'id': raw_tissue['tissueSiteDetailId'],
            'abbr': raw_tissue['tissueSiteDetailAbbr'],
            'ontology_id': raw_tissue['ontologyId'],
            'color': raw_tissue['colorHex'],
            'expressed_gene_count': raw_tissue['expressedGeneCount'],
            'num_samples': raw_tissue['rnaSeqSampleSummary']['totalCount']
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
            if gene_name == 'WASH7P':
                print('len(expressions)', len(expressions))
                print('expressions for WASH7P:', expressions)

            for j, median_expression in enumerate(expressions):
                if median_expression > 0:
                    tissue_id = j
                    tissue_expressions.append([str(tissue_id), median_expression])

            sorted_tissue_expressions = sorted(tissue_expressions, key=lambda e: e[1], reverse=True)

            if gene_name == 'WASH7P':
                print('tissue_expressions for WASH7P:', tissue_expressions)
                print('sorted_tissue_expressions for WASH7P:', sorted_tissue_expressions)

            top_tissues = sorted_tissue_expressions

            top_tissues_by_gene[gene_name] = top_tissues

    output_path = 'cache/gtex_top_tissues_by_gene.json'
    write_json_file(top_tissues_by_gene, output_path)

def merge_tissue_dimensions():
    with open("cache/gtex_top_genes_by_tissue.json") as f:
        raw_json = json.loads(f.read())
        top_genes_by_tissue = raw_json["genes"]

    tissues_names = [tissue["id"] for tissue in raw_json["tissues"]]

    with open("cache/gtex_top_tissues_by_gene.json") as f:
        raw_top_tissues_by_gene = json.loads(f.read())
        top_tissues_by_gene = {}
        for gene in raw_top_tissues_by_gene:
            raw_indexes = raw_top_tissues_by_gene[gene]
            if gene == 'WASH7P':
                print('raw_indexes for WASH7P', raw_indexes)
            top_tissue_indexes = list(
                filter(lambda e: int(e[0]) < len(tissues_names), raw_indexes)
            )
            top_tissues_by_gene[gene] = top_tissue_indexes

    tissues_by_top_genes = {}
    for tissue in top_genes_by_tissue:
        for entry in top_genes_by_tissue[tissue]:
            top_gene, median_expression_tpm = entry
            if top_gene not in tissues_by_top_genes:
                tissues_by_top_genes[top_gene] = []
            tissue_index = tissues_names.index(tissue)
            tissues_by_top_genes[top_gene].append([str(tissue_index), median_expression_tpm])

    rows = []
    detail_rows = []

    for gene in top_tissues_by_gene:
        row = [gene]
        detail_row = [gene]

        # Add top 3 tissues for each gene
        tissue_entries = top_tissues_by_gene[gene]
        tissue_indexes = [e[0] for e in tissue_entries]
        top_tissue_indexes = ','.join(tissue_indexes[:3])
        if top_tissue_indexes == '':
            continue
        top_tissue_entries = ','.join([';'.join([
            str(round(f, 3)) if isinstance(f, float) else f for f in e
        ]) for e in tissue_entries[:10]])
        row.append(top_tissue_indexes)
        detail_row.append(top_tissue_entries)

        # If gene is among top 1% expressed in any tissues,
        # then add up to 3 such tissues
        if gene in tissues_by_top_genes:
            entries = tissues_by_top_genes[gene]
            sorted_entries = sorted(entries, key=lambda e: e[1], reverse=True)
            sorted_tissues = [e[0] for e in sorted_entries]
            sorted_top_tissues = sorted_tissues[:3]
            tissue_indexes = ','.join(sorted_top_tissues)
            row.append(tissue_indexes)

        rows.append(row)
        detail_rows.append(detail_row)

    tissues_list = [
        [tissue["id"], tissue["color"]] for tissue in raw_json["tissues"]
    ]
    tissues_str = [t[0] + ',' + t[1] for t in tissues_list]
    print('len(tissues_list)', len(tissues_list))

    meta_info = f"## tissues: {';'.join(tissues_str)}"
    headers = '\t'.join(['# gene', 'top_tissues', 'top_gene_in_tissues'])
    content = '\n'.join(['\t'.join(row) for row in rows])
    detail_content = '\n'.join(['\t'.join(row) for row in detail_rows])
    output = meta_info + '\n' + headers + '\n' + content
    detail_output = meta_info + '\n' + headers + '\n' + detail_content

    output_path = 'cache/homo-sapiens-tissues.tsv'
    with open(output_path, 'w') as f:
        f.write(output)
    print(output_path)

    detail_output_path = 'cache/homo-sapiens-tissues-detail.tsv'
    with open(detail_output_path, 'w') as f:
        f.write(detail_output)
    print(detail_output_path)

def write_line_byte_index(filepath):
    """Write byte-offset index file of each line in a file at filepath
    """
    header = "# gene\tline_byte_offset"
    index = [header] # the byte offset of each line, and the gene it represents
    genes = []

    with open(filepath) as file:
        lines = file.readlines()
    for line in lines:
        if line[0] == '#':
            continue
        gene = line.split('\t')[0]
        genes.append(gene)

    print('genes[0:3]', genes[0:3])
    print('genes[-3:]', genes[-3:])

    with open(filepath) as file:
        char = file.read(1)
        offset = 0
        while char != "": # end of file
            if offset % 100_000 == 0:
                print(f"Lines byte-indexed, so far: {len(index)}")
            char = file.read(1)
            if char == "\n":
                try:
                    gene = genes[len(index) - 2]
                except IndexError as e:
                    print('len(genes)', len(genes))
                    print('len(index)', len(index))
                entry = f"{gene}\t{offset}"
                index.append(entry)
            offset += 1
            file.seek(offset)
            continue

    with open(f"{filepath}.li", "w") as file:
        file.write("\n".join([str(o) for o in index]))
    print(f"Lines byte-indexed, total: {len(index)}")

# process_top_genes_by_tissue()

# process_top_tissues_by_gene()

# merge_tissue_dimensions()

write_line_byte_index('cache/homo-sapiens-tissues-detail.tsv')
