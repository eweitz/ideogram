import csv
import gzip

def get_is_relevant(fields):
    is_clinical_concern = False
    is_robustly_reviewed = False
    for field in fields:
        [name, value] = field.split('=')
        if name == 'CLNSIG' and value in ['Pathogenic', 'Likely_pathogenic', 'Pathogenic/Likely_pathogenic']:
            is_clinical_concern = True
        if name == 'CLNREVSTAT' and 'multiple_submitters' in value or value == 'reviewed_by_expert_panel':
            is_robustly_reviewed = True

    return is_clinical_concern and is_robustly_reviewed

def trim_info_fields(fields):
    slim_fields = []
    slim_names = ['CLNDN', 'CLNREVSTAT', 'CLNSIG', 'CLNVC', 'MC', 'ORIGIN', 'RS']
    for field in fields:
        name = field.split('=')[0]
        if name in slim_names:
            slim_fields.append(field)
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

output_path = 'clinvar_pathogenic_and_lp_20241215.vcf'
with open(output_path, "w") as f:
    f.write(content)
with gzip.open(f"{output_path}.gz", "wt") as f:
    f.write(content)
