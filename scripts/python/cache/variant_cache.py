"""Cache data on variants related to human health, from NCBI ClinVar

Example:
python variant_cache.py
"""

import csv
import gzip
import json
import sys

# Avoid "field larger than field limit (131072)"
csv.field_size_limit(sys.maxsize)


clinical_concerns = [
    'Likely_pathogenic',
    'Pathogenic/Likely_pathogenic',
    'Pathogenic'
]
robust_review_statuses = [
    'criteria_provided,_multiple_submitters,_no_conflicts',
    'reviewed_by_expert_panel',
    'practice_guideline'
]

disease_ids_and_names = []
variant_types = []
molecular_consequences = []

def get_is_relevant(fields):
    is_clinical_concern = False
    is_robustly_reviewed = False
    for field in fields:
        [name, value] = field.split('=')

        if name == 'CLNSIG' and value in clinical_concerns:
            is_clinical_concern = True

        if name == 'CLNREVSTAT' and value in robust_review_statuses:
            is_robustly_reviewed = True

    return is_clinical_concern and is_robustly_reviewed

def trim_info_fields(fields):
    slim_fields = []
    names_to_keep = ['CLNREVSTAT', 'CLNSIG', 'CLNVC', 'MC', 'ORIGIN', 'RS']
    disease_indexes = []
    disease_names = []
    disease_ids = []
    for field in fields:
        [name, value] = field.split('=')

        if name == 'CLNDISDB': # "Clinical disease database"
            entries = value.split('|')
            for entry in entries:
                full_values = entry.split(',')
                has_mondo = False
                for fv in full_values:
                    split_fv = fv.split(':')
                    db_name = split_fv[0]
                    db_value = split_fv[-1]
                    if db_name == 'MONDO':
                        disease_ids.append(db_value)
                        has_mondo = True
                if not has_mondo:
                    disease_ids.append('-1')

        elif name == 'CLNDN': # "Clinical disease name"
            disease_names = value.split('|')

        elif name == 'CLNVC':
            if value not in variant_types:
                variant_types.append(value)
            variant_type = variant_types.index(value)
            slim_fields.append(str(variant_type))

        elif name == 'MC':
            entries = value.split(',')
            slim_mc = []
            for entry in entries:
                if entry not in molecular_consequences:
                    molecular_consequences.append(entry)
                molecular_consequence = molecular_consequences.index(entry)
                slim_mc.append(str(molecular_consequence))
            slim_fields.append(','.join(slim_mc))

        elif name in names_to_keep:
            if name == 'CLNSIG':
                value = clinical_concerns.index(value)
            elif name == 'CLNREVSTAT':
                value = robust_review_statuses.index(value)
            slim_fields.append(str(value))

    # Index disease names and IDs, and represent them compactly
    for (i, disease_id) in enumerate(disease_ids):
        if disease_id == '-1':
            continue
        disease_name = disease_names[i]
        disease_id_and_name = disease_id + '|' + disease_name
        if disease_id_and_name not in disease_ids_and_names:
            disease_ids_and_names.append(disease_id_and_name)
        disease_index = disease_ids_and_names.index(disease_id_and_name)
        disease_indexes.append(str(disease_index))
    disease_indexes_string = ','.join(disease_indexes)
    slim_fields.insert(0, disease_indexes_string)

    slim_info = '\t'.join(slim_fields)
    return slim_info


def write_gene_byte_index(filepath):
    """Write byte-offset index file of variants for a gene
    """
    variant_indexes_by_gene = {}
    variants_by_chromosome = {}
    genes_path = '../../../dist/data/cache/genes/homo-sapiens-genes.tsv'

    variant_line_offset = 0
    print('filepath', filepath)
    with open(filepath) as file:
        reader = csv.reader(file, delimiter="\t")
        for (i, row) in enumerate(reader):
            if row[0][0] == '#':
                variant_line_offset += 1
                continue
            variant = row
            chromosome = variant[0]
            bp_position = int(variant[1]) # base-pair position of start of variant
            if chromosome not in variants_by_chromosome:
                variants_by_chromosome[chromosome] = []
            variants_by_chromosome[chromosome].append([bp_position, i])

    print('variants_by_chromosome', variants_by_chromosome)

    with gzip.open(f"{genes_path}.gz", "rt") as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            if row[0][0] == '#':
                continue

            # Gene data
            chromosome = row[0]
            start = int(row[1])
            length = int(row[2])
            gene = row[4]
            print('gene', gene)

            if chromosome == 'Y':
                # ClinVar does not represent variants in chromosome Y by default;
                # see "papu" resources in ClinVar FTP for variants in chrY
                # pseudoautosomal region (PAR).
                continue

            if chromosome not in variants_by_chromosome:
                # ClinVar represents unlocalized sequences like GL000194.1 as
                # chromosomes, but they're not of interest here.
                continue

            # For each variant, check if it's in the gene.
            # If so, add the index of the variant to a list
            # of variant indexes for the gene
            variants_in_chromosome = variants_by_chromosome[chromosome]
            for variant in variants_in_chromosome:
                variant_bp_position = variant[0]
                if variant_bp_position >= start and variant_bp_position <= start + length:
                    variant_index = variant[1]
                    if gene not in variant_indexes_by_gene:
                        variant_indexes_by_gene[gene] = []
                    variant_indexes_by_gene[gene].append(variant_index)

        variant_gene_index_rows = []
        for gene in variant_indexes_by_gene:
            row = variant_indexes_by_gene[gene]
            row.insert(0, gene)
            variant_gene_index_rows.append(row)

    header = "# line\tbyte_offset"
    index = [header] # the byte offset for each line in variants.tsv
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
        byte_offset = 0
        while char != "": # end of file
            if byte_offset % 100_000 == 0:
                print(f"Lines byte-indexed, so far: {len(index)}")
            char = file.read(1)
            if char == "\n":
                index.append(byte_offset)
            byte_offset += 1
            file.seek(byte_offset)
            continue

    with open(f"{filepath}.li", "w") as file:
        file.write("\n".join([str(o) for o in index]))
    print(f"Lines byte-indexed, total: {len(index)}")

def cache_variants(output_path):

    output_rows = []

    # https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/clinvar_20241215.vcf.gz
    # Source: https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/
    with open('clinvar_20241215.vcf') as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            if row[0][0] == '#':
                continue
            # print('row', row)
            info = row[7]
            fields = info.split(';')
            is_relevant = get_is_relevant(fields)
            if not is_relevant:
                continue
            slim_info = trim_info_fields(fields)
            del row[5:7]
            row[5] = slim_info

            output_rows.append('\t'.join(row))

    content = '\n'.join(output_rows)

    disease_map = json.dumps(disease_ids_and_names)
    column_names = [
        '#CHROM', 'POS', 'ID', 'REF', 'ALT',
        'DISEASE_IDS', 'CLNREVSTAT', 'CLNSIG', 'CLNVC', 'MC', 'ORIGIN', 'RS'
    ]
    headers = '\n'.join([
        '# Cache data on variants related to human health, from NCBI ClinVar',
        '# Used by Gene Leads, a feature of Ideogram.js.  This is a compact representation of data from:',
        '# https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/clinvar_20241215.vcf.gz',
        '# ',
        '# It filters that data to include only the columns below, and only rows',
        '# where the variant has a clinical significance of at least "Likely_pathogenic"',
        '# and a review status of at least "criteria_provided,_multiple_submitters,_no_conflicts".',
        '# ',
        '# Keys:',
        '# disease_mondo_ids_and_names = ' + disease_map,
        '# variant_types = ' + str(variant_types),
        '# clinical_significances = ' + str(clinical_concerns),
        '# clinical_review_statuses = ' + str(robust_review_statuses),
        '# molecular_consequences = ' + str(molecular_consequences),
        '# ',
        '\t'.join(column_names)
    ])
    content = headers + '\n' + content

    with open(output_path, "w") as f:
        f.write(content)
    with gzip.open(f"{output_path}.gz", "wt") as f:
        f.write(content)

    print('Wrote output to: ' + output_path)

output_path = 'variants.tsv'

# cache_variants(output_path)
write_gene_byte_index(output_path)
