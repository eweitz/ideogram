'''Convert differentially expressed gene (DEG) matrix into Ideogram annotations

Example call:
python3 deg_to_ideogram.py --gene-pos-path TODO --deg-path TODO
'''

import argparse
import json
import csv

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('--gene-pos-path',
                    help='Path to input gene position file')
parser.add_argument('--deg-path',
                    help='Path to input differentially expressed gene (DEG) matrix')
parser.add_argument('--output-dir',
                    help='Directory to send output data to',
                    default='ideogram/data/annotations/')

args = parser.parse_args()
gene_pos_path = args.gene_pos_path
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
    """Return indices of comparisons by factor, and names of comparisons

    A factor is something like "Space Flight" or "Ground Control".
    """
    # Headers for numeric expression values
    for i, header in enumerate(headers):
        if 'Log2fc_' in header:
            log2fc_index = i
            break

    comparisons_by_factor = {}

    for i, header in enumerate(headers[log2fc_index:]):
        if ')v(' not in header: continue # not a comparison, so skip
        metric = header.split('_')[0] # e.g. Log2fc, P.value, or Adj.p.value
        factors = []
        comparison = header.replace(metric + '_', '').strip('(').strip(')')
        for factor in comparison.split(')v('):
            factors.append(factor)

        index = log2fc_index + i

        factor_1 = slug(factors[0])
        if factor_1 in comparisons_by_factor:
            comparisons_by_factor[factor_1]['indices'].append(index)
            comparisons_by_factor[factor_1]['comparisons'].append(header)
        else:
            comparisons_by_factor[factor_1] = {
                'indices': [index],
                'comparisons': [header],
                'label': factors[0]
            }

    return comparisons_by_factor

def parse_deg_matrix(deg_matrix_path):
    """Get gene metadata and expression values from DEG matrix
    """

    gene_stats = {}
    gene_metadata = {}

    with open(deg_matrix_path, newline='') as f:
        reader = csv.reader(f)

        headers = next(reader, None)
        metadata_keys = [headers[2], headers[4]] # GENENAME, ENTREZID

        comparisons_by_factor = get_comparisons(headers)
        for factor in comparisons_by_factor:
            gene_stats[factor] = {}

        for row in reader:
            gene_symbol = row[1]
            gene_metadata[gene_symbol] = [row[2], row[4]]
            for factor in comparisons_by_factor:
                comparison_indices = comparisons_by_factor[factor]['indices']
                gene_stats[factor][gene_symbol] = [row[i] for i in comparison_indices]
    
    return [gene_metadata, metadata_keys, gene_stats, comparisons_by_factor]

def get_annots_by_chr(gene_coordinates, gene_expressions, gene_types, gene_metadata):
    """Merge coordinates and expressions, return Ideogram annotations
    """
    annots_by_chr_by_factor = {}

    # Some gene types (e.g. pseudogenes) exist in the genome annotation,
    # but are never expressed.  Don't count these.
    for gene_id in gene_coordinates:
        coordinates = gene_coordinates[gene_id]
        gene_symbol = coordinates['symbol']
        gene_type = coordinates['type']
        lacks_gene_type = True
        for factor in gene_expressions:
            if gene_symbol not in gene_expressions[factor]:
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

        for factor in gene_expressions:
            if symbol not in gene_expressions[factor]:
                continue

            if factor not in annots_by_chr_by_factor:
                annots_by_chr_by_factor[factor] = {}
            if chr not in annots_by_chr_by_factor[factor]:
                annots_by_chr_by_factor[factor][chr] = {'chr': chr, 'annots': []}

            expressions = gene_expressions[factor][symbol]
    
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

            annots_by_chr_by_factor[factor][chr]['annots'].append(annot)

    print('annots_by_chr_by_factor.keys()')
    print(annots_by_chr_by_factor.keys())

    return [annots_by_chr_by_factor, sorted_gene_types]

def slug(value):
    return value.lower()\
        .replace(')v(', '-v-')\
        .replace('(', '')\
        .replace(')', '')\
        .replace(' ', '-')\
        .replace('.', '-')\
        .replace('_', '-')

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

coordinates, gene_types, gene_pos_metadata = get_gene_coordinates(gene_pos_path)
metadata, metadata_keys, expressions, comparisons_by_factor = parse_deg_matrix(deg_path)

metadata_labels = get_key_labels(metadata_keys)
metadata_list = list(metadata_labels.keys())

[annots_by_chr_by_factor, sorted_gene_types] =\
    get_annots_by_chr(coordinates, expressions, gene_types, metadata)

for i, factor in enumerate(annots_by_chr_by_factor):
    annots_by_chr = annots_by_chr_by_factor[factor]

    comparisons = comparisons_by_factor[factor]['comparisons']
    comparison_labels = get_key_labels(comparisons)
    comparison_list = list(comparison_labels.keys())

    keys = ['name', 'start', 'length', 'gene-type'] + metadata_list + comparison_list
    annots_list = list(annots_by_chr.values())
    metadata = get_metadata(gene_pos_metadata, sorted_gene_types, comparison_labels)
    for factor2 in annots_by_chr_by_factor:
        factor_label = comparisons_by_factor[factor2]['label']
        metadata['labels'][factor2] = factor_label

    factors = list(annots_by_chr_by_factor.keys())

    split_factor = factor.split('-')

    if 'space-flight' in factor:
        suffix = ''
        other_factor = 'ground-control'
    elif 'flt' in factor and 'rr' not in factor.lower():
        # Seen in GLDS-168 (e.g. "FLT")
        suffix = ''
        other_factor = 'bsl-' + split_factor[1]
    elif factor == 'rr1-flt-wercc':
        # Seen in GLDS-242 (e.g. "RR1_FLT_wERCC")
        other_factor = 'rr1-bsl-wercc'
        suffix = ''
    else:
        suffix = '_' + factor
        factor_index = factors.index(factor) 
        if factor_index < len(factors) - 1:
            other_index = factor_index + 1
        else:
            other_index = factor_index - 1
        other_factor = factors[other_index]

    metadata['deg'] = {
        'factors': factors,
        'thisFactor': factor,
        'otherFactor': other_factor
    }

    annots = {'keys': keys, 'annots': annots_list, 'metadata': metadata}

    annots_json = json.dumps(annots)

    output_filename = deg_path.split('/')[-1].replace('.csv', '') + \
        '_ideogram_annots' + suffix + '.json'

    output_path = output_dir + output_filename

    output_filename = output_dir + output_filename
    with open(output_filename, 'w') as f:
        f.write(annots_json)

    print('Wrote ' + output_filename)