'''Convert differentially expressed gene (DEG) matrix into Ideogram annotations

This pipeline converts a DEG matrix file containing gene expression summary
statistics into an Ideogram.js annotations JSON file.  The resulting JSON file
is used for exploratory data analysis as demonstrated at:

https://eweitz.github.io/ideogram/differential-expression

The DEG matrix has several groups of columns, with headers ordered like so:

* metadata: "REFSEQ","SYMBOL","GENENAME","ENSEMBL","ENTREZID","STRING_id","GOSLIM_IDS"
* replicates: <sample_prefix>-<group>-<replicate_number>, e.g. "Mmus-C57-6T-TMS-FLT-Rep1"
* stats: "All.mean","All.stdev","F.p.value"
* stats_by_group: Group.<stat>_(<group>), e.g. "Group.Mean_(Space Flight)"
* stats_by_comparison: <stat>_(<group1>)v(<group2>), e.g. "Log2fc_(Ground Control)v(Space Flight)"

Example call:
python3 deg_to_ideogram.py --gen-pos-path TODO --deg-path TODO
'''

import argparse
import json
import csv

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('--gen-pos-path',
                    help='Path to input gene position file built by reduce_gtf.py')
parser.add_argument('--deg-path',
                    help='Path to input differentially expressed gene (DEG) matrix')
parser.add_argument('--output-dir',
                    help='Directory to send output data to',
                    default='ideogram/data/annotations/')

args = parser.parse_args()
gene_pos_path = args.gen_pos_path
deg_path = args.deg_path
output_dir = args.output_dir

if output_dir[-1] != '/':
    output_dir += '/'

def get_gene_coordinates(gene_pos_path):
    """Parse gene position file, return dictionary of coordinates for each gene
    """
    with open(gene_pos_path) as f:
        lines = f.readlines()

    gene_types = {}
    gene_coordinates = {}

    for line in lines:
        if line[0] == '#': continue

        # Example line: "AT1G01190	CYP78A8	1	82984	84946	protein_coding"
        columns = [column.strip() for column in line.split('\t')]

        gene_id = columns[0]

        gene_type = columns[5]
        if gene_type not in gene_types:
            gene_types[gene_type] = 0
        else:
            gene_types[gene_type] += 1

        gene = {
            'chromosome': columns[2], # Chromosome name, e.g. "1" or "X"
            'start': columns[3], # Genomic start coordinate
            'stop': columns[4], # Genomic stop coordinate
            'symbol': columns[1], # Gene symbol, e.g. "BRCA1"
            'type': gene_type, # Gene type, e.g. "protein_coding"
        }

        gene_coordinates[gene_id] = gene

    gene_pos_metadata = {}
    header_fields = lines[0][2:].strip().split('; ')
    for h in header_fields:
        k, v = h.split(': ')
        gene_pos_metadata[k.lower()] = v

    return [gene_coordinates, gene_types, gene_pos_metadata]

def get_comparisons(headers):
    """Return indices of comparisons by group, and names of comparisons

    A group is something like "Space Flight" or "Ground Control".
    """
    # Headers for numeric expression values
    for i, header in enumerate(headers):
        if 'Log2fc_' in header:
            log2fc_index = i
            break

    comparisons_by_group = {}

    for i, header in enumerate(headers[log2fc_index:]):
        if ')v(' not in header: continue # not a comparison, so skip
        metric = header.split('_')[0] # e.g. Log2fc, P.value, or Adj.p.value
        groups = []
        comparison = header.replace(metric + '_', '').strip('(').strip(')')
        for group in comparison.split(')v('):
            groups.append(group)

        index = log2fc_index + i

        group_1 = slug(groups[0])
        if group_1 in comparisons_by_group:
            comparisons_by_group[group_1]['indices'].append(index)
            comparisons_by_group[group_1]['comparisons'].append(header)
        else:
            comparisons_by_group[group_1] = {
                'indices': [index],
                'comparisons': [header],
                'label': groups[0]
            }

    return comparisons_by_group

def parse_deg_matrix(deg_matrix_path):
    """Get gene metadata and expression values from DEG matrix
    """

    gene_stats = {}
    gene_metadata = {}

    with open(deg_matrix_path, newline='') as f:
        reader = csv.reader(f)

        headers = next(reader, None)
        metadata_keys = [headers[2], headers[4]] # GENENAME, ENTREZID

        comparisons_by_group = get_comparisons(headers)
        for group in comparisons_by_group:
            gene_stats[group] = {}

        for row in reader:
            gene_symbol = row[1]
            gene_metadata[gene_symbol] = [row[2], row[4]]
            for group in comparisons_by_group:
                comparison_indices = comparisons_by_group[group]['indices']
                gene_stats[group][gene_symbol] = [row[i] for i in comparison_indices]

    metadata_labels = get_key_labels(metadata_keys)
    metadata_list = list(metadata_labels.keys())
    
    return [gene_metadata, metadata_list, gene_stats, comparisons_by_group]

def get_annots_by_chr(gene_coordinates, gene_expressions, gene_types, gene_metadata):
    """Merge coordinates and expressions, return Ideogram annotations
    """
    annots_by_chr_by_group = {}

    # Some gene types (e.g. pseudogenes) exist in the genome annotation,
    # but are never expressed.  Don't count these.
    for gene_id in gene_coordinates:
        coordinates = gene_coordinates[gene_id]
        gene_symbol = coordinates['symbol']
        gene_type = coordinates['type']
        lacks_gene_type = True
        for group in gene_expressions:
            if gene_symbol not in gene_expressions[group]:
                lacks_gene_type = False
        if lacks_gene_type is False:
            gene_types[gene_type] -= 1

    # Sort keys by descending count value, then
    # make a list of those keys (i.e., without values)
    sorted_items = sorted(gene_types.items(), key=lambda x: -int(x[1]))
    sorted_gene_types = [x[0] for x in sorted_items]

    first_key = list(gene_expressions.keys())[0]
    
    for gene_id in gene_coordinates:
        coordinates = gene_coordinates[gene_id]
        symbol = coordinates['symbol']

        chr = coordinates['chromosome']

        start = int(coordinates['start'])
        stop = int(coordinates['stop'])
        length = stop - start

        for group in gene_expressions:
            if symbol not in gene_expressions[group]:
                continue

            if group not in annots_by_chr_by_group:
                annots_by_chr_by_group[group] = {}
            if chr not in annots_by_chr_by_group[group]:
                annots_by_chr_by_group[group][chr] = {'chr': chr, 'annots': []}

            expressions = gene_expressions[group][symbol]
    
            annot = [
                symbol,
                start,
                length,
                sorted_gene_types.index(coordinates['type'])
            ] + gene_metadata[symbol]

            # Convert numeric strings to floats, and clean as needed
            for i, exp_value in enumerate(expressions):
                if exp_value == 'NA':
                    # print(symbol + ' had an "NA" expression value; setting to -1')
                    exp_value = -1
                annot.append(round(float(exp_value), 3))

            annots_by_chr_by_group[group][chr]['annots'].append(annot)

    return [annots_by_chr_by_group, sorted_gene_types]

def slug(value):
    return value.lower()\
        .replace(')v(', '-v-')\
        .replace('(', '')\
        .replace(')', '')\
        .replace(' ', '-')\
        .replace('.', '-')\
        .replace('_', '-')\
        .replace('&', 'and')

def get_key_labels(keys):
    key_labels = {}
    for key in keys:
        key_labels[key] = slug(key)

    key_labels = dict((v, k) for k, v in key_labels.items())

    return key_labels


def get_metadata(gene_pos_metadata, sorted_gene_types, key_labels):
    labels = {'gene-type': [t.replace('_', ' ') for t in sorted_gene_types]}
    labels.update(key_labels)

    metadata = {
        'organism': gene_pos_metadata['organism'],
        'assembly': gene_pos_metadata['assembly'],
        'annotation': gene_pos_metadata['annotation'],
        'labels': labels
    }

    return metadata


def get_deg_metadata(group, annots_by_chr_by_group):

    groups = list(annots_by_chr_by_group.keys())

    split_group = group.split('-')

    if 'space-flight' in group:
        suffix = ''
        other_group = 'ground-control'
    elif 'flt' in group and 'rr' not in group.lower():
        suffix = ''
        if len(split_group) > 2:
            other_group = '-'.join(split_group[:2]) + '-gc'
        else:
            # Seen in GLDS-242 (e.g. "FLT-C1")
            other_group = 'bsl-' + split_group[1]
    elif group == 'rr1-flt-wercc':
        # Seen in GLDS-168
        other_group = 'rr1-bsl-wercc'
        suffix = ''
    else:
        suffix = '_' + group
        group_index = groups.index(group) 
        if group_index < len(groups) - 1:
            other_index = group_index + 1
        else:
            other_index = group_index - 1
        other_group = groups[other_index]

    deg_metadata = {
        'groups': groups,
        'thisgroup': group,
        'othergroup': other_group
    }

    return deg_metadata, suffix


coordinates, gene_types, gene_pos_metadata = get_gene_coordinates(gene_pos_path)
metadata, metadata_list, expressions, comparisons_by_group = parse_deg_matrix(deg_path)

[annots_by_chr_by_group, sorted_gene_types] =\
    get_annots_by_chr(coordinates, expressions, gene_types, metadata)

content_by_suffix = {}

for i, group in enumerate(annots_by_chr_by_group):
    annots_by_chr = annots_by_chr_by_group[group]
    annots_list = list(annots_by_chr.values())

    comparisons = comparisons_by_group[group]['comparisons']
    comparison_labels = get_key_labels(comparisons)
    comparison_list = list(comparison_labels.keys())

    keys = ['name', 'start', 'length', 'gene-type'] + metadata_list + comparison_list

    metadata = get_metadata(gene_pos_metadata, sorted_gene_types, comparison_labels)
    for group2 in annots_by_chr_by_group:
        group_label = comparisons_by_group[group2]['label']
        metadata['labels'][group2] = group_label

    deg_metadata, suffix = get_deg_metadata(group, annots_by_chr_by_group)

    metadata['deg'] = deg_metadata

    annots = {'keys': keys, 'annots': annots_list, 'metadata': metadata}

    annots_json = json.dumps(annots)
    content_by_suffix[suffix] = annots_json

# Ensure we have a default suffix (indicated by '') so Ideogram can load
# annotations data given only an accession
if '' not in content_by_suffix:
    default_suffix = None
    print(content_by_suffix.keys())
    for suffix in content_by_suffix:
        if 'control' not in suffix:
            # Try to find a suffix indicating strongest treatment group
            default_suffix = suffix
            break
    if default_suffix is None:
        # Fallback; just use the first suffix as default if none found yet
        first_suffix = list(content_by_suffix.keys())[0]
        default_suffix = first_suffix
    content_by_suffix[''] = content_by_suffix[default_suffix]
    del content_by_suffix[default_suffix]

for suffix in content_by_suffix:
    annots_json = content_by_suffix[suffix]
    output_filename = deg_path.split('/')[-1].replace('.csv', '') + \
        '_ideogram_annots' + suffix + '.json'

    output_path = output_dir + output_filename

    output_filename = output_dir + output_filename
    with open(output_filename, 'w') as f:
        f.write(annots_json)

    print('Wrote ' + output_filename)