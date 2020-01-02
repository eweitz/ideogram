'''Reduce a GTF file to a simpler gene position TSV file.

This CLI converts a GTF genome annotation file from GENCODE, Ensembl, or NCBI
into a smaller, simpler, and more metadata-rich TSV gene position ("gen_pos")
file.  The purpose is to speed up, simplify, and enrich downstream pipelines
that require only data on genes, and not e.g. transcripts or exons.

URLs for example GTF files:
* Human (Homo sapiens), from GENCODE:
ftp://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_32/gencode.v32.basic.annotation.gtf.gz

* Mouse (Mus musculus), from GENCODE:
ftp://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_mouse/release_M23/gencode.vM23.basic.annotation.gtf.gz

* Thale cress (Arabidopsis thaliana), from Ensembl:
ftp://ftp.ensemblgenomes.org/pub/release-45/plants/gtf/arabidopsis_thaliana/Arabidopsis_thaliana.TAIR10.45.gtf.gz

* Worm (Caenorhabditis elegans), from Ensembl:
ftp://ftp.ensemblgenomes.org/pub/release-45/metazoa/gtf/caenorhabditis_elegans/Caenorhabditis_elegans.WBcel235.45.gtf.gz


* Rat (Rattus norvegicus), from Ensembl:
ftp://ftp.ensembl.org/pub/release-98/gtf/rattus_norvegicus/Rattus_norvegicus.Rnor_6.0.98.chr.gtf.gz

PREREQUISITES
* GTF file, local and unzipped
* Python 3

EXAMPLES
# Convert Arabidopsis GTF to gene position file
python3 reduce_gtf.py --input_path=/Users/alice/Downloads/Arabidopsis_thaliana.TAIR10.45.gtf --organism="Arabidopsis thaliana"
'''

import argparse
import re

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('--input_path',
                    help='Path to input GTF file')
parser.add_argument('--organism',
                    help='Scientific name of organism (e.g. Mus musculus)')
parser.add_argument('--output_dir',
                    help='Directory to send output data to',
                    default='../../data/annotations/')

args = parser.parse_args()
organism = args.organism
input_path = args.input_path
output_dir = args.output_dir

with open(input_path) as f:
    gtf = f.readlines()

genes = []

provider = 'ncbi'
if 'Ensembl' in gtf[0]:
    provider = 'GENCODE'
if 'genome-build' in gtf[0]:
    provider = 'Ensembl'


def natural_sort(l):
    """For sorting chromosomes names.  Extends https://stackoverflow.com/a/4836734.

    Includes special handling for C. elegans chromosomes
    """
    has_roman_numerals = False
    romans = ['I', 'II', 'III', 'IV', 'V']
    if 'I' in l and 'II' in l:
        has_roman_numerals = True
        unsorted_list = [str(romans.index(item)) if item in romans else item for item in l]
    else:
        unsorted_list = l
    convert = lambda text: int(text) if text.isdigit() else text.lower()
    alphanum_key = lambda key: [ convert(c) for c in re.split('([0-9]+)', key) ]
    sorted_list = sorted(unsorted_list, key=alphanum_key)

    if has_roman_numerals:
        sorted_list = [romans[int(item)] if item.isdigit() else item for item in sorted_list]
    return sorted_list

# Chromosome or scaffolds.  Needed for NCBI RefSeq, but not Ensembl.
chrs_by_accession = {}

genes_by_chr = {}

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
        if len(split_attr) < 2: continue
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
        gene_type = attrs['gene_type'] if provider == 'GENCODE' else attrs['gene_biotype']

    gene = '\t'.join([
        gene_id,
        gene_name,
        chr,
        start,
        stop,
        gene_type
    ])
    
    if chr in genes_by_chr:
        genes_by_chr[chr].append(gene)
    else:
        genes_by_chr[chr] = [gene]


sorted_chrs = natural_sort(list(genes_by_chr.keys()))

genes = []
for chr in sorted_chrs:
    genes += genes_by_chr[chr]
genes = '\n'.join(genes)

first_line = gtf[0].strip()
if provider == 'GENCODE':
    assembly = first_line.split('genome (')[1].split(')')[0]
    annotation = first_line.split(', ')[1]
elif provider == 'Ensembl':
    assembly = first_line.split('genome-build ')[1]
    annotation = input_path.split('.')[-2]

headers = [
    [f'# Organism: {organism}; assembly: {assembly}; annotation: {provider} {annotation}'],
    ['# Gene_ID', 'Gene_symbol', 'Chromosome', 'Start', 'End', 'Gene_type']
]

headers = ['\t'.join(row) for row in headers]
headers = '\n'.join(headers) + '\n'

content = headers + genes

output_filename = input_path.split('/')[-1].replace('.gtf', '.tsv').replace('.gff', '.tsv')
output_path = output_dir + 'gen_pos_' + output_filename
with open(output_path, 'w') as f:
    f.write(content)

print('Wrote ' + output_path)