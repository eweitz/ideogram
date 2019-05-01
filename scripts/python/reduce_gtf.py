'''Reduce a GTF file to a simpler, gene-only TSV file
'''

import argparse

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('--input_path',
                    help='Path to input GTF file')
parser.add_argument('--output_dir',
                    help='Directory to send output data to',
                    default='../../data/annotations/')

args = parser.parse_args()
input_path = args.input_path
output_dir = args.output_dir

with open(input_path) as f:
    gtf = f.readlines()

genes = []

for line in gtf:
    if line[0] == '#':
        continue
    columns = line.split('\t')
    chr = columns[0] # chromosome or scaffold
    feature_type = columns[2] # gene, transcript, exon, etc.
    if feature_type != 'gene':
        continue
    start, stop = columns[3:5]
    raw_attrs = [x.strip() for x in columns[8].split('; ')]
    raw_attrs[-1] = raw_attrs[-1].replace('";', '')
    attrs = {}
    for raw_attr in raw_attrs:
        split_attr = raw_attr.split()
        attrs[split_attr[0]] = split_attr[1].strip('"')
    gene_id = attrs['gene_id']
    gene_name = attrs['gene_name'] if 'gene_name' in attrs else gene_id
    gene = [
        gene_id,
        gene_name,
        chr,
        start,
        stop,
        attrs['gene_biotype']
    ]
    genes.append('\t'.join(gene))
    
genes = '\n'.join(genes)

output_filename = input_path.split('/')[-1]
output_path = output_dir + output_filename
with open(output_path, 'w') as f:
    f.write(genes)

print('Wrote ' + output_path)
    
    







