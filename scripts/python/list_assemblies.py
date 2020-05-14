'''Write TSV file of high-quality genome assemblies by organism

Output file has one row per assembly, with columns for:

* Organism scientific name (e.g. Homo sapiens, Macaca fascicularis)
* Organism common name (e.g. human, crab-eating macaque)
* Assembly name (e.g. GRCh38, Macaca_fascicularis_5.0)
* Assembly accession (e.g. GCA_000001405.28, GCA_000364345.1)

EXAMPLES

python3 list_assemblies.py
'''

import argparse
import json
import math
import os
import urllib.request as request

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('--output-dir',
                    help='Directory to send output data to',
                    default='')

args = parser.parse_args()
output_dir = args.output_dir

if len(output_dir) > 0 and output_dir[0] != '':
    output_dir = '/' + output_dir

asms_path = 'assembly_summary.txt'
asms_path_historical = 'assembly_summary_historical.txt'

eutils_base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
esummary_base = eutils_base + '/esummary.fcgi'

def fetch_asm_summary(group, group_asms_path, group_asms_historical_path):
    '''Retrieve NCBI assembly summary TSV file by organism group

    Fetched files are written locally as a cache
    '''

    path_versions = {
        'current': group_asms_path,
        'historical': group_asms_historical_path,
    }
    for version in path_versions:
        path = path_versions[version]
        if version is 'current':
            leaf = f'{group}/{asms_path}'
        else:
            leaf = f'{group}/{asms_path_historical}'

        if os.path.exists(path) == False:
            # Example URL:
            # https://ftp.ncbi.nlm.nih.gov/genomes/genbank/vertebrate_mammalian/assembly_summary.txt
            url = f'https://ftp.ncbi.nlm.nih.gov/genomes/genbank/{leaf}'
            with request.urlopen(url) as response:
                data = response.read().decode('utf-8')
            with open(path, 'w') as f:
                f.write(data)

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

        for taxid in taxid_json:
            names_by_taxid[taxid] = taxid_json[taxid]['commonname']

    new_asms = []
    for asm in asms:
        new_asm = asm
        new_asm['organism_common_name'] = names_by_taxid[asm['taxid']]
        new_asms.append(new_asm)

    return new_asms

def parse_current_assemblies(group, group_asms_path):
    ''' Parse current genome assemblies
    '''

    asms = []

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

        if (
            asm['assembly_level'] != 'Chromosome' or
            asm['release_type'] != 'Major' or
            asm['refseq_category'] not in categories
        ):
            continue

        asm['organism_group'] = group

        asms.append(asm)

    return asms

def parse_historical_assemblies(group, group_asms_historical_path):
    asms = []

    with open(group_asms_historical_path) as f:
        asms_file = f.readlines()

    # See parse_current_assemblies for expected headers
    headers = asms_file[1].replace('# ', '').strip().split('\t')

    for line in asms_file[2:]:
        columns = line.strip().split('\t')
        asm = dict(zip(headers, columns))

        if (
            asm['assembly_level'] != 'Chromosome' or
            asm['release_type'] != 'Major' or
            asm['submitter'] != 'Genome Reference Consortium'
        ):
            continue

        asm['organism_group'] = group

        asms.append(asm)

    return asms

def get_assemblies():
    '''Fetch metadata on genome assemblies from NCBI, and write it locally

    Background: Genome assemblies are sequenced chromosomes for an organism.

    Here, we get metadata on each assembly, like its name (e.g. GRCh38),
    accession (an identifier like GCA_000001405.15), the organism's scientific
    and common names (Homo sapiens, human) and more.
    '''

    groups = [
        'fungi',
        'invertebrate',
        'plant',
        'protozoa',
        'vertebrate_mammalian',
        'vertebrate_other'
    ]

    asms = []

    for group in groups:
        group_asms = []
        group_asms_path = f'{group}_{asms_path}'
        group_asms_historical_path = f'{group}_{asms_path_historical}'
        fetch_asm_summary(group, group_asms_path, group_asms_historical_path)

        group_asms += parse_current_assemblies(group, group_asms_path)
        group_asms +=\
            parse_historical_assemblies(group, group_asms_historical_path)

        group_asms = sorted(group_asms, key=lambda asm: asm['organism_name'])
        asms += group_asms

    asms = add_common_names(asms)

    return asms

asms = get_assemblies()

asm_list = []

output_headers = [
    'organism_name',
    'organism_common_name',
    'asm_name',
    'assembly_accession'
]
for asm in asms:
    asm_entry = [asm[header] for header in output_headers]
    asm_list.append('\t'.join(asm_entry))

header = '# ' + '\t'.join(output_headers)
asm_list.insert(0, header)

content = '\n'.join(asm_list)

output_file = output_dir + 'assemblies.tsv'

open(output_file, 'w').write(content)

print(f'Wrote list of {len(asm_list)} assemblies to {output_file}')
