import argparse
import urllib.request
import csv
import json
import os
import sys
import urllib.parse
import statistics

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
    """Return all GTEx tissues
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

def get_summary(expressions):
    """Get min, q1, median, q3, and max; and 10-quantile (i.e. decile) counts
    """
    sorted_expressions = sorted(expressions)
    q1, median, q3 = statistics.quantiles(sorted_expressions, n=4)
    min = sorted_expressions[0]
    max = sorted_expressions[-1]

    # boxplot summary statistics
    raw_summary = [min, q1, median, q3, max]
    summary = []
    for s in raw_summary:
        if s > 0:
            summary.append(round(s, 2))

    if len(summary) == 5:
        num_bins = 10
        size = (max - min) / num_bins
        quantile_counts = [0] * num_bins
        for j in range(1, num_bins + 1):
            prev_bin_exp = min + (j - 1) * size
            bin_exp = min + j * size
            for expression in sorted_expressions:
                if prev_bin_exp < expression <= bin_exp:
                    quantile_counts[j - 1] += 1
        # if i % 500 == 0:
        #     print('kde_counts', kde_counts)
        summary += quantile_counts

    return summary

def summarize_top_tissues_by_gene(input_dir):
    """Make JSON file top tissues (by expression in GTEx) for each gene

    The output has 5 metrics (min, q1, median, q3, max) per tissue per gene.
    """

    if input_dir[-1] != "/":
        input_dir += "/"

    # To manually fetch GTEx files:
    # 1.  Go to https://www.gtexportal.org/home/downloads/adult-gtex/bulk_tissue_expression
    # 2.  Find the row that says:
    #     "GTEx_Analysis_2017-06-05_v8_RNASeQCv1.1.9_gene_tpm.gct.gz"
    #     and notes the file size of "1.5 GB"
    # 3.  Click the download button.  This source data is public.
    # 4.  Unzip the file
    # 5.  Go to https://www.gtexportal.org/home/downloads/adult-gtex/metadata
    # 6.  Find row that says:
    #     "GTEx_Analysis_v8_Annotations_SampleAttributesDS.txt"
    #     and notes the file size of "11 MB"
    # 7.  Click the download button, and save the resulting file
    #     URL: https://storage.cloud.google.com/adult-gtex/annotations/v8/metadata-files/GTEx_Analysis_v8_Annotations_SampleAttributesDS.txt
    gct_path = (
        input_dir +
        "bulk-gex_v8_rna-seq_GTEx_Analysis_2017-06-05_v8_RNASeQCv1.1.9_gene_tpm.gct"
    )

    ds_path = (
        input_dir +
        "annotations_v8_metadata-files_GTEx_Analysis_v8_Annotations_SampleAttributesDS.txt"
    )

    num_samples_by_tissue = {}
    tissues_by_sample_id = {}

    with open(ds_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for i, row in enumerate(reader):
            if i < 1:
                continue
            sample_id = row[0]
            tissue_detail = row[6]
            tissues_by_sample_id[sample_id] = tissue_detail
            if tissue_detail not in num_samples_by_tissue:
                num_samples_by_tissue[tissue_detail] = 1
            else:
                num_samples_by_tissue[tissue_detail] += 1

    # print('tissues_by_sample_id', tissues_by_sample_id)
    summary_by_gene_by_tissue = {}
    tissues_by_index = [] # Tissue detail by column index
    tissues_by_index_unique = []

    output = []

    with open(gct_path) as file:
        reader = csv.reader(file, delimiter="\t")

        for i, row in enumerate(reader):
            # if i > 500:
            #     # for debug
            #     continue

            # The matrix is generally genes as rows, samples as columns.
            # Each sample is from one tissue in one donor.
            if i < 3:

                if i < 2:
                    # Skip version and matrix dimension rows
                    continue

                # print('row', row)
                for j, sample_id in enumerate(row):
                    # Initialize tissues_by_index
                    if j < 2:
                        tissues_by_index.append('na')
                        continue
                    # print('sample_id', sample_id)
                    tissue = tissues_by_sample_id[sample_id]
                    tissues_by_index.append(tissue)
                    if tissue not in tissues_by_index_unique:
                        tissues_by_index_unique.append(tissue)
                        tissues_by_index_unique = sorted(tissues_by_index_unique)

                continue

            # print('num_samples_by_tissue', num_samples_by_tissue)

            # Omit tissues with < 70 samples
            filtered_tissues_by_index_unique = []
            for tissue in tissues_by_index_unique:
                if num_samples_by_tissue[tissue] >= 70:
                    filtered_tissues_by_index_unique.append(tissue)
            tissues_by_index_unique = filtered_tissues_by_index_unique

            gene = row[1]

            expressions_by_tissue = {}
            for j, raw_expression in enumerate(row):
                if j < 2:
                    # Skip Ensembl ID and gene name columns
                    continue

                tissue = tissues_by_index[j]
                expression = float(raw_expression)
                if tissue in tissues_by_index_unique:
                    if tissue in expressions_by_tissue:
                        expressions_by_tissue[tissue].append(expression)
                    else:
                        expressions_by_tissue[tissue] = [expression]

            output_row = [gene]
            for tissue in expressions_by_tissue:
                expressions = expressions_by_tissue[tissue]
                summary = get_summary(expressions)

                if gene not in summary_by_gene_by_tissue:
                    summary_by_gene_by_tissue[gene] = {}

                summary_by_gene_by_tissue[gene][tissue] = summary

            trimmed_summary_by_gene_by_tissue = {}
            trimmed_summary_by_gene_by_tissue[gene] = {}
            medians_by_tissue_index = []
            j = 0
            for tissue in summary_by_gene_by_tissue[gene]:
                summary = summary_by_gene_by_tissue[gene][tissue]
                if len(summary) == 15: # 5 for box plot, 10 for KDE deciles
                    median = summary[2]
                else:
                    median = 0
                medians_by_tissue_index.append([tissue, median])
            sorted_medians_by_tissue_index = sorted(
                medians_by_tissue_index,
                key=lambda x: x[1],
                reverse=True
            )
            top_tissues_by_median = [
                tm[0] for tm in sorted_medians_by_tissue_index[:10]
            ]
            for tissue in top_tissues_by_median:
                summary = summary_by_gene_by_tissue[gene][tissue]
                if len(summary) < 5:
                    # Skip summaries that lack enough points for a median
                    continue
                summary = ';'.join([str(s) for s in summary])
                if summary == '':
                    # Observed for e.g. MEF2AP1, a pseudogene
                    continue
                tissue_index = tissues_by_index_unique.index(tissue)
                tissue_and_summary = f'{tissue_index};{summary}'
                output_row.append(tissue_and_summary)


            if i % 500 == 0:
                print(f'Last tissue summary for gene {i} {gene}:')
                print(tissue_and_summary)

            if len(output_row) == 1:
                # Skip genes with no measured expression, like MEF2AP1, a pseudogene
                # print(f'Inadequate expression, so skipping gene: {gene}')
                continue

            output_row = '\t'.join(output_row)

            output.append(output_row)
            if gene == 'WASH7P':
                print('summary_by_gene_by_tissue[gene]', summary_by_gene_by_tissue[gene])
                # print('expressions for WASH7P:', expressions)

        output = '\n'.join(output)
        with open('cache/homo-sapiens-tissues-detail.tsv', 'w') as file:
            file.write(output)

    # output_path = 'cache/gtex_boxplot_summary_by_gene.json'
    # write_json_file(summary_by_gene, output_path)


def merge_tissue_dimensions():
    with open("cache/gtex_top_genes_by_tissue.json") as f:
        raw_json = json.loads(f.read())

    with open("cache/homo-sapiens-tissues-detail.tsv") as f:
        detail_content = f.read()

    tissues_list = [
        [t["id"], t["color"], str(t["num_samples"])] for t in raw_json["tissues"]
        if t["num_samples"] >= 70
    ]


    # One (and only one) tissue is non-naturally ordered in GTEx tissue lists
    # This manually adjusts to use natural order
    tissue_ids = [t[0] for t in tissues_list]
    fibroblasts = 'Cells_Cultured_fibroblasts'
    lymphocytes = 'Cells_EBV-transformed_lymphocytes'
    if (
        fibroblasts in tissue_ids and
        lymphocytes in tissue_ids
    ):
        print('Naturalize order for cell tissues')
        fibroblasts_i = tissue_ids.index(fibroblasts)
        fibroblasts_new_i = fibroblasts_i - 1
        lymphocytes_new_i = fibroblasts_i
        fibroblasts_el = tissues_list[fibroblasts_i]
        lymphocytes_el = tissues_list[fibroblasts_i - 1]
        tissues_list[fibroblasts_new_i] = fibroblasts_el
        tissues_list[lymphocytes_new_i] = lymphocytes_el

    tissues_str = [','.join(t) for t in tissues_list]
    print('len(tissues_list)', len(tissues_list))

    print('tissues_str', tissues_str)
    meta_info = f"## tissues: {';'.join(tissues_str)}"
    headers = '\t'.join(['# gene', 'tissue_metrics'])
    output = meta_info + '\n' + headers + '\n' + detail_content

    output_path = 'cache/homo-sapiens-tissues.tsv'
    with open(output_path, 'w') as f:
        f.write(output)
    print(output_path)

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

# write_line_byte_index('cache/homo-sapiens-tissues.tsv')

class TissueCache:

    def __init__(

    ):
        return

# Command-line handler
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--output-dir",
        help=(
            "Directory to put outcome data.  (default: %(default))"
        ),
        default="data/"
    )
    parser.add_argument(
        "--input-dir",
        help=(
            "Directory for GTEx gene TPMs file " +
            "(i.e., for bulk-gex_v8_rna-seq_GTEx_Analysis_2017-06-05_v8_RNASeQCv1.1.9_gene_tpm.gct)"
        )
    )
    args = parser.parse_args()
    input_dir = args.input_dir
    output_dir = args.output_dir

    summarize_top_tissues_by_gene(input_dir)
    merge_tissue_dimensions()
    write_line_byte_index('cache/homo-sapiens-tissues.tsv')
