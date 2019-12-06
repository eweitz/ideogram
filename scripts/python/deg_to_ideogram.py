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

    gene_coordinates = {}
    for line in lines:
        # Example line: "AT1G01190	CYP78A8	1	82984	84946	protein_coding"
        columns = [column.strip() for column in line.split('\t')]

        gene_id = columns[0]

        gene = {
            'chromosome': columns[2], # Chromosome name, e.g. "1" or "X"
            'start': columns[3], # Genomic start coordinate
            'stop': columns[4], # Genomic stop coordinate
            'symbol': columns[1], # Gene symbol, e.g. "BRCA1"
            'type': columns[5], # Gene type, e.g. "protein_coding"
        }

        gene_coordinates[gene_id] = gene

    return gene_coordinates

def get_gene_expressions(deg_matrix_path):
    """Parse DEG matrix, return dictionary of statistics and corresponding keys
    """

    gene_expressions = {}

    with open(deg_matrix_path, newline='') as f:
        reader = csv.reader(f)
        # for row in reader:
        #     print(row)

        # CSV/TSV headers for numeric expression values
        metric_keys = next(reader, None)[7:]
        
        for row in reader:
            gene_symbol = row[1]
            gene_expressions[gene_symbol] = row[7:]

    return [gene_expressions, metric_keys]

def get_annots_by_chr(gene_coordinates, gene_expressions):
    """Merge coordinates and expressions, return Ideogram annotations
    """
    annots_by_chr = {}

    seen_gene_types = set()

    # print('gene_coordinates')
    # print(gene_coordinates)

    for gene in gene_coordinates:
        coordinates = gene_coordinates[gene]
        gene_symbol = coordinates['symbol']
        if gene_symbol not in gene_expressions:
            continue
        expressions = gene_expressions[gene_symbol]

        chr = coordinates['chromosome']

        if chr not in annots_by_chr:
            annots_by_chr[chr] = {'chr': chr, 'annots': []}

        start = int(coordinates['start'])
        stop = int(coordinates['stop'])
        length = stop - start

        seen_gene_types.add(coordinates['type'])

        annot = [
            coordinates['symbol'],
            start,
            length,
            coordinates['type']
        ]

        # Convert numeric strings to floats, and clean as needed
        for exp_value in expressions:
            annot.append(round(float(exp_value), 3))

        annots_by_chr[chr]['annots'].append(annot)

    return annots_by_chr

coordinates = get_gene_coordinates(gene_pos_path)
expressions, metric_keys = get_gene_expressions(deg_path)

annots_by_chr = get_annots_by_chr(coordinates, expressions)

annots_list = list(annots_by_chr.values())

keys = ['name', 'start', 'length', 'gene-type'] + metric_keys

metadata = {'species': 'Mus musculus', 'assembly': 'GRCm38'}

annots = {'keys': keys, 'annots': annots_list, 'metadata': metadata}

annots_json = json.dumps(annots)

output_filename = deg_path.split('/')[-1] \
                    .replace('.csv', '') + '_ideogram_annots' + '.json'
        
output_path = output_dir + output_filename

output_filename = output_dir + output_filename
with open(output_filename, 'w') as f:
    f.write(annots_json)

print('Wrote ' + output_filename)