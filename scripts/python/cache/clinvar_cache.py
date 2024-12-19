import csv
import gzip


clinical_concerns = ['Likely_pathogenic', 'Pathogenic/Likely_pathogenic', 'Pathogenic']
robust_review_statuses = [
    'criteria_provided,_multiple_submitters,_no_conflicts',
    'reviewed_by_expert_panel',
    'practice_guideline'
]

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
    names_to_keep = ['CLNDN', 'CLNREVSTAT', 'CLNSIG', 'CLNVC', 'MC', 'ORIGIN', 'RS']
    for field in fields:
        [name, value] = field.split('=')
        if name in names_to_keep:
            if name == 'CLNSIG':
                value = clinical_concerns.index(value)
            elif name == 'CLNREVSTAT':
                value = robust_review_statuses.index(value)
            slim_fields.append(f"{name}={value}")
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
        row[7] = slim_info

        output_rows.append('\t'.join(row))

content = '\n'.join(output_rows)

output_path = 'clinvar_priority_20241215.vcf'
with open(output_path, "w") as f:
    f.write(content)
with gzip.open(f"{output_path}.gz", "wt") as f:
    f.write(content)
