import csv
import json
import gzip


clinical_concerns = ['Likely_pathogenic', 'Pathogenic/Likely_pathogenic', 'Pathogenic']
robust_review_statuses = [
    'criteria_provided,_multiple_submitters,_no_conflicts',
    'reviewed_by_expert_panel',
    'practice_guideline'
]

# Disease names by MONDO IDs
disease_names_by_id = {}

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
    disease_names = []
    disease_ids = []
    for field in fields:
        [name, value] = field.split('=')

        if name == 'CLNDISDB': # "Clinical disease database"
            entries = value.split('|')
            for entry in entries:
                full_values = entry.split(',')
                for fv in full_values:
                    split_fv = fv.split(':')
                    db_name = split_fv[0]
                    db_value = split_fv[-1]
                    if db_name == 'MONDO':
                        disease_ids.append(db_value)

        elif name == 'CLNDN': # "Clinical disease name"
            disease_names = value.split('|')

        if name in names_to_keep:
            if name == 'CLNSIG':
                value = clinical_concerns.index(value)
            elif name == 'CLNREVSTAT':
                value = robust_review_statuses.index(value)
            slim_fields.append(f"{name}={value}")

    for (i, disease_id) in enumerate(disease_ids):
        if disease_id not in disease_names_by_id:
            disease_names_by_id[disease_id] = disease_names[i]

    disease_ids_string = ','.join(disease_ids)
    slim_fields.insert(0, disease_ids_string)

    slim_info = ';'.join(slim_fields)
    return slim_info

output_rows = []

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

disease_map = json.dumps(disease_names_by_id)
column_names = ['#CHROM', 'POS', 'ID', 'REF', 'ALT', 'INFO']
headers = '\n'.join([
    '# disease_names_by_mondo_id = ' + disease_map,
    '\t'.join(column_names)
])
content = headers + '\n' + content


output_path = 'clinvar_priority_20241215.vcf'
with open(output_path, "w") as f:
    f.write(content)
with gzip.open(f"{output_path}.gz", "wt") as f:
    f.write(content)
