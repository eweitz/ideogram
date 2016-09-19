import urllib.request as request
from urllib.parse import quote
import urllib.error
import os
import json
import io
import gzip
import subprocess
import logging

output_dir = 'data/chromosomes/'

if os.path.exists(output_dir) == False:
    os.mkdir(output_dir)

# create logger with 'get_chromosomes'
logger = logging.getLogger('get_chromosomes')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler(output_dir + 'get_chromosomes.log')
fh.setLevel(logging.DEBUG)
# create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.ERROR)
# create formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)
# add the handlers to the logger
logger.addHandler(fh)
logger.addHandler(ch)

logger.info('Starting get_chromosomes.py')

def download_genome_agp(results, asm):

    agp_base_url = asm['agp_base_url']
    agp_base_dir = asm['agp_base_dir']
    acc = asm['acc']
    organism = asm['organism']
    output_dir = asm['output_dir']
    asm_name = asm['name']

    for uid in results:
        if uid == "uids":
            continue

        result = results[uid];

        split_subtype = result['subtype'].split("|")
        if 'chromosome' not in split_subtype:
            continue

        cn_index = result['subtype'].split("|").index("chromosome")

        chr_name = 'chr' + result['subname'].split("|")[cn_index];
        #if (typeof chrName !== "undefined" && chrName.substr(0, 3) === "chr") {
        #// Convert "chr12" to "12", e.g. for banana (GCF_000313855.2)
        #chrName = chrName.substr(3);
        #}

        # Example: 'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz'
        agp_url = agp_base_url + chr_name + ".agp.gz"

        try:
            # Look for e.g. chr1.agp.gz
            logger.info('Fetching ' + agp_url)
            with request.urlopen(agp_url) as response:
                compressed_file = io.BytesIO(response.read())
        except urllib.error.URLError as e:
            # Look for e.g. chr1.comp.agp.gz
            try:
                agp_url = agp_base_url + chr_name + ".comp.agp.gz"
                logger.info('Fetching ' + agp_url)
                with request.urlopen(agp_url) as response:
                    compressed_file = io.BytesIO(response.read())
            except urllib.error.URLError as e:
                logger.info('AGP not found for ' + organism + ' genome assembly ' + asm_name)
                return

        decompressed_file = gzip.GzipFile(fileobj=compressed_file)

        agp = decompressed_file.read()
        has_centromere_data = False

        if "centromere" in str(agp):
            has_centromere_data = True

        if has_centromere_data == False:
            logger.info('No centromere data found in AGP for ' + organism + ' genome assembly ' + asm_name)
            return
            #continue

        if os.path.exists(output_dir) == False:
            os.mkdir(output_dir)

        output_name = agp_base_dir + '_' + chr_name + '.agp'
        with open(output_name, 'wb') as outfile:
            outfile.write(agp)

def find_genomes_with_centromeres(asm_summary_response):

    data = asm_summary_response

    for uid in data['result']:

        # Omit list of UIDs
        if uid == 'uids':
            continue

        result = data['result'][uid]
        acc = result['assemblyaccession'] # RefSeq accession
        name = result['assemblyname']
        rs_uid = result['rsuid']
        taxid = result['taxid']
        organism = result['speciesname'].lower().replace(' ', '-')

        #if organism != 'plasmodium-falciparum':
        #    continue

        asm_segment = acc + '_' + name.replace(' ', '_')

        # Example: ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz
        agp_base_url = (
            'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/' +
            asm_segment + '/' + asm_segment + '_assembly_structure/' +
            'Primary_Assembly/assembled_chromosomes/AGP/'
        )

        try:
            request.urlopen(agp_base_url)
        except urllib.error.URLError as e:
            logger.info(e)
            continue

        nuccore_link = elink + "&db=nuccore&linkname=gencoll_nuccore_chr&from_uid=" + result['rsuid'];

        with request.urlopen(nuccore_link) as response:
            nuccore_data = json.loads(response.read().decode('utf-8'))

        links = nuccore_data['linksets'][0]['linksetdbs'][0]['links']

        links = ','.join(str(x) for x in links)

        nt_summary = esummary + "&db=nucleotide&id=" + links;
        with request.urlopen(nt_summary) as response:
            nt_response = json.loads(response.read().decode('utf-8'))

        results = nt_response['result']

        output_dir = 'data/chromosomes/' + organism + '/'
        agp_base_dir = output_dir + asm_segment + '_'

        asm = {
            'acc': acc,
            'name': name,
            'rs_uid': rs_uid,
            'taxid': taxid,
            'organism': organism,
            'agp_base_url': agp_base_url,
            'agp_base_dir': agp_base_dir,
            'output_dir': output_dir
        }

        download_genome_agp(results, asm)

        asms.append(asm)

eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
esearch = eutils + 'esearch.fcgi?retmode=json';
esummary = eutils + 'esummary.fcgi?retmode=json';
elink = eutils + 'elink.fcgi?retmode=json';

asms = []

term = quote(
    '("latest refseq"[filter] AND "chromosome level"[filter]) AND ' +
    '(animals[filter] OR plants[filter] OR fungi[filter] OR protists[filter])'
)

asm_search = esearch + '&db=assembly&term=' + term + '&retmax=10000'

# Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?retmode=json&db=assembly&term=("latest refseq"[filter] AND "chromosome level"[filter]) AND (animals[filter] OR plants[filter] OR fungi[filter] OR protists[filter])&retmax=10000
with request.urlopen(asm_search) as response:
    data = json.loads(response.read().decode('utf-8'))

# Returns ~1000 ids
uid_list = data['esearchresult']['idlist']

logger.info('Assembly UIDs returned in search results: ' + str(len(uid_list)))

# asm_uid_lists = []
# for i in range(0, len(uid_list) % 100):
#     asm_uid_list = []
#     for j in range(0, 100):
#         #logger.info(100*i + j)
#         if 100*i + j < len(uid_list):
#             asm_uid = uid_list[100*i + j]
#             asm_uid_list.append(asm_uid)
#     asm_uid_lists.append(asm_uid_list)
#
# uids = ''
# for asm_uid_list in asm_uid_lists:
#     uids += ','.join(asm_uid_list)

uid_list = ','.join(uid_list)

asm_summary = esummary + '&db=assembly&id=' + uid_list

logger.info('Fetching ' + asm_summary)
# Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=assembly&id=733711
with request.urlopen(asm_summary) as response:
    data = json.loads(response.read().decode('utf-8'))

find_genomes_with_centromeres(data)

logger.info('Ending get_chromosomes.py')
