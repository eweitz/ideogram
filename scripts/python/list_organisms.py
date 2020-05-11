import argparse
import json
import math
import os
import urllib.request as request

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
# parser.add_argument('--output_dir',
#                     help='Directory to send output data to',
#                     default='../../data/annotations/')

args = parser.parse_args()
# output_dir = args.output_dir

groups = [
    'fungi',
    'invertebrate',
    'plant',
    'protozoa',
    'vertebrate_mammalian',
    'vertebrate_other'
]

asms_path = 'assembly_summary.txt'

asms = []

eutils_base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
esummary_base = eutils_base + '/esummary.fcgi'

def fetch_asm_summary(group, group_asms_path):
    '''Retrieve NCBI assembly summary TSV file by organism group
    '''

    if os.path.exists(group_asms_path) == False:
        # Example URL:
        # https://ftp.ncbi.nlm.nih.gov/genomes/genbank/vertebrate_mammalian/assembly_summary.txt
        url = f'https://ftp.ncbi.nlm.nih.gov/genomes/genbank/{group}/{asms_path}'
        with request.urlopen(url) as response:
            data = response.read().decode('utf-8')
        with open(group_asms_path, 'w') as f:
            f.write(data)

for group in groups:
    group_asms_path = f'{group}_{asms_path}'
    fetch_asm_summary(group, group_asms_path)

    with open(group_asms_path) as f:
        asms_file = f.readlines()

    # For reference, expected headers are:
    # assembly_accession, bioproject, biosample, wgs_master, refseq_category,
    # taxid, species_taxid, organism_name, infraspecific_name, isolate,
    # version_status, assembly_level, release_type, genome_rep, seq_rel_date,
    # asm_name, submitter, gbrs_paired_asm, paired_asm_comp, ftp_path,
    # excluded_from_refseq, relation_to_type_material
    headers = asms_file[1].replace('# ', '').strip().split('\t')

    for line in asms_file[2:]:
        columns = line.strip().split('\t')
        asm = dict(zip(headers, columns))

        categories = ['representative genome', 'reference genome']
        if asm['refseq_category'] not in categories: continue
        levels = ['Chromosome']
        if asm['assembly_level'] not in levels: continue

        asm['organism_group'] = group

        asms.append(asm)

def get_taxid_chunks(taxids):
    '''Return taxids in comma-delimited lists of 500
    Needed because NCBI EUtils limits parameters to 500 values each.
    '''
    taxid_chunks = []

    eutils_limit = 500

    num_requests = math.ceil(len(taxids) / eutils_limit)
    for num in range(0, num_requests):
        pos = num * eutils_limit
        upper = (num + 1) * eutils_limit
        if upper < len(taxids):
            size = upper
        else:
            size = pos + upper - len(taxids)
        taxids_segment = taxids[pos:size]
        taxids_chunk = ','.join(taxids_segment)
        taxid_chunks.append(taxids_chunk)

    return taxid_chunks

def add_common_names(asms):
    '''Add organism common names (e.g. human) to genome assembly objects
    '''
    # NCBI Taxonomy identifiers, an organism ID.  Human: 9606, etc.
    taxids = [asm['taxid'] for asm in asms]
    taxids = list(set(taxids)) # deduplicate

    names_by_taxid  = {}

    taxid_chunks = get_taxid_chunks(taxids)

    for taxid_chunk in taxid_chunks:
        eutils_url = f'{esummary_base}?db=taxonomy&format=json&id={taxid_chunk}'
        with request.urlopen(eutils_url) as response:
            data = json.loads(response.read().decode('utf-8'))
        taxid_json = data['result']
        del taxid_json['uids'] # Remove placeholder from relevant data

        if '10090' in taxid_json:
            print(taxid_json['10090'])

        for taxid in taxid_json:
            names_by_taxid[taxid] = taxid_json[taxid]['commonname']

    new_asms = []
    for asm in asms:
        new_asm = asm
        new_asm['organism_common_name'] = names_by_taxid[asm['taxid']]
        new_asms.append(new_asm)

    return new_asms

asms = add_common_names(asms)

print('len(asms)')
print(len(asms))