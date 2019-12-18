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

provider = 'ncbi'
if 'Ensembl' in gtf[0]:
    provider = 'ensembl'

# Chromosome or scaffolds.  Needed for NCBI RefSeq, but not Ensembl.
chrs_by_accession = {}

for line in gtf:
    if line[0] == '#':
        continue
    columns = line.split('\t')
    chr = columns[0] # chromosome or scaffold
    feature_type = columns[2] # gene, transcript, exon, etc.

    raw_attrs = [x.strip() for x in columns[8].split(';')]
    raw_attrs[-1] = raw_attrs[-1].replace('";', '')

    attrs = {}
    for raw_attr in raw_attrs:
        if provider == 'ncbi':
            split_attr = raw_attr.split('=')
        else:
            split_attr = raw_attr.split()
        if len(split_attr) == 0: continue
        attrs[split_attr[0]] = split_attr[1].strip('"')

    if provider == 'ncbi' and feature_type == 'region':
        # Map chromosome accessions to names, e.g. NC_000067.6 -> 1
        chr_accession = chr
        if 'genome' not in attrs:
            # Skip regions that aren't chromosomes, e.g. scaffolds
            continue
        chr_name = attrs['Name']
        chrs_by_accession[chr_accession] = chr_name

    if feature_type != 'gene':
        continue

    start, stop = columns[3:5]

    if provider == 'ncbi':
        gene_id = attrs['Dbxref'].split('GeneID:')[1].split(',')[0]
        gene_name = attrs['Name']
        gene_type = attrs['gene_biotype']
        if chr in chrs_by_accession:
            chr = chrs_by_accession[chr]
        else:
            # Skip unlocalized genes
            continue
    else:
        chr = chr.replace('chr', '')
        gene_id = attrs['gene_id']
        gene_name = attrs['gene_name'] if 'gene_name' in attrs else gene_id
        gene_type = attrs['gene_type']

    gene = [
        gene_id,
        gene_name,
        chr,
        start,
        stop,
        gene_type
    ]
    genes.append('\t'.join(gene))
    
genes = '\n'.join(genes)

headers = [
    ["Gene_ID", "Gene_name", "Chromosome", "Start", "Stop", "Gene_type"]
]

output_filename = input_path.split('/')[-1].replace('.gtf', '.tsv').replace('.gff', '.tsv')
output_path = output_dir + 'gen_pos_' + output_filename
with open(output_path, 'w') as f:
    f.write(genes)

print('Wrote ' + output_path)
    
    







