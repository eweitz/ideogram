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

def parse_deg_matrix(deg_matrix_path):
    """Get gene metadata and expression values from DEG matrix
    """

    gene_expressions = {}
    gene_metadata = {}

    with open(deg_matrix_path, newline='') as f:
        reader = csv.reader(f)

        first_line = next(reader, None)
        # Headers for gene metadata
        metadata_keys = first_line[1:3]

        # Headers for numeric expression values
        for i, header in enumerate(first_line):
            if 'Log2fc_' in header:
                log2fc_index = i
                break

        # Exclude reciprocal comparisons, which trivially equate via -n
        metric_indices = []
        for i, header in enumerate(first_line[log2fc_index:]):
            if ')v(' not in header: continue # not a comparison, so skip
            # Detect e.g. "FLT" in "Log2fc_(FLT_C1)v(GC_C2)" from GLDS-242
            # or "Space Flight" in "Log2fc_(Space Flight)v(Ground Control)" from GLDS-4
            first_comparator = header.split(')v(')[0].split('_')[1]
            if 'FLT' in first_comparator or 'Space Flight':
                metric_indices.append(log2fc_index + i)

        metric_keys = [first_line[i] for i in metric_indices]

        for row in reader:
            gene_symbol = row[1]
            gene_metadata[gene_symbol] = row[1:3]
            gene_expressions[gene_symbol] = [row[i] for i in metric_indices]

    print(metadata_keys)
    print(list(gene_metadata.items())[0])
    return [gene_metadata, metadata_keys, gene_expressions, metric_keys]

def get_annots_by_chr(gene_coordinates, gene_expressions, gene_types, gene_metadata):
    """Merge coordinates and expressions, return Ideogram annotations
    """
    annots_by_chr = {}

    # Some gene types (e.g. pseudogenes) exist in the genome annotation,
    # but are never expressed.  Don't count these.
    for gene_id in gene_coordinates:
        coordinates = gene_coordinates[gene_id]
        gene_symbol = coordinates['symbol']
        if gene_symbol not in gene_expressions:
            gene_type = coordinates['type']
            gene_types[gene_type] -= 1

    # Sort keys by descending count value, then
    # make a list of those keys (i.e., without values)
    sorted_items = sorted(gene_types.items(), key=lambda x: -int(x[1]))
    sorted_gene_types = [x[0] for x in sorted_items]

    for gene_id in gene_coordinates:
        coordinates = gene_coordinates[gene_id]
        symbol = coordinates['symbol']
        if symbol not in gene_expressions:
            continue
        expressions = gene_expressions[symbol]

        chr = coordinates['chromosome']

        if chr not in annots_by_chr:
            annots_by_chr[chr] = {'chr': chr, 'annots': []}

        start = int(coordinates['start'])
        stop = int(coordinates['stop'])
        length = stop - start

        annot = [
            symbol,
            start,
            length,
            sorted_gene_types.index(coordinates['type'])
        ] + gene_metadata[symbol]

        # Convert numeric strings to floats, and clean as needed
        for exp_value in expressions:
            if exp_value == 'NA':
                # print(symbol + ' had an "NA" expression value; setting to -1')
                exp_value = -1
            annot.append(round(float(exp_value), 3))

        annots_by_chr[chr]['annots'].append(annot)

    return [annots_by_chr, sorted_gene_types]


def get_key_labels(keys):
    key_labels = {}
    for key in keys:
        key_labels[key] = key.lower()\
                .replace(')v(', '-v-')\
                .replace('(', '')\
                .replace(')', '')\
                .replace(' ', '-')\
                .replace('.', '-')\
                .replace('_', '-')

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
metadata, metadata_keys, expressions, metric_keys = parse_deg_matrix(deg_path)

metadata_labels = get_key_labels(metadata_keys)
metadata_list = list(metadata_labels.keys())

print(metadata_list)
metric_labels = get_key_labels(metric_keys)
metric_list = list(metric_labels.keys())

print(metric_list)

[annots_by_chr, sorted_gene_types] = get_annots_by_chr(coordinates, expressions, gene_types, metadata)

keys = ['name', 'start', 'length', 'gene-type'] + metadata_list + metric_list
annots_list = list(annots_by_chr.values())
metadata = get_metadata(gene_pos_metadata, sorted_gene_types, metric_labels)

annots = {'keys': keys, 'annots': annots_list, 'metadata': metadata}

annots_json = json.dumps(annots)

output_filename = deg_path.split('/')[-1] \
                    .replace('.csv', '') + '_ideogram_annots' + '.json'

output_path = output_dir + output_filename

output_filename = output_dir + output_filename
with open(output_filename, 'w') as f:
    f.write(annots_json)

print('Wrote ' + output_filename)