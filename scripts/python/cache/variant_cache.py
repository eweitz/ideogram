"""Cache data on variants related to human health, from NCBI ClinVar

Example:
python variant_cache.py
"""

import csv
import json
import gzip

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
    '# '
    '# It filters that data to include only the columns below, and only rows',
    '# where the variant has a clinical significance of at least "Likely_pathogenic"',
    '# and a review status of at least "criteria_provided,_multiple_submitters,_no_conflicts".',
    '# ',
    '# Keys:'
    '# disease_mondo_ids_and_names = ' + disease_map,
    '# variant_types = ' + str(variant_types),
    '# clinical_significances = ' + str(clinical_concerns),
    '# clinical_review_statuses = ' + str(robust_review_statuses),
    '# molecular_consequences = ' + str(molecular_consequences),
    '\t'.join(column_names)
])
content = headers + '\n' + content

output_path = 'variants.tsv'
with open(output_path, "w") as f:
    f.write(content)
with gzip.open(f"{output_path}.gz", "wt") as f:
    f.write(content)
