"""Download AGPs from NCBI and format chromosome data, including centromeres"""

import urllib.request as request
import ftplib
import socket
from urllib.parse import quote
import urllib.error
import os
import shutil
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

orgs_with_centromere_data = {}

ftp_domain = 'ftp.ncbi.nlm.nih.gov'
ftp = ftplib.FTP(ftp_domain)
ftp.login()

def download_genome_agp(asm):

    agp_ftp_wd = asm['agp_ftp_wd']
    acc = asm['acc']
    organism = asm['organism']
    output_dir = asm['output_dir']
    asm_name = asm['name']

    has_centromere_data = False

    logger.info('Changing FTP working directory to: ' + agp_ftp_wd)
    try:
        ftp.cwd(agp_ftp_wd)
    except ftplib.error_perm as e:
        logger.info(e)
        return

    file_names = ftp.nlst()

    logger.info('List of files in FTP working directory')
    logger.info(file_names)
    for file_name in file_names:
        # Download each chromomsome's compressed AGP file

        output_path = output_dir + file_name

        if os.path.exists(output_dir) == False:
            os.makedirs(output_dir)

        # Example full URL of file:
        # 'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz'
        logger.info('Retrieving from FTP: ' + file_name)
        with open(output_path, 'wb') as file:
            ftp.retrbinary('RETR '+ file_name, file.write)

        with gzip.open(output_path, 'rb') as file:
            agp = file.read()

        if "centromere" in str(agp):
            has_centromere_data = True
            orgs_with_centromere_data[organism] = 1
        else:
            chr_name = file_name.split(".")[0]
            logger.info(
                'No centromere data found in AGP for ' + organism + ' ' +
                'genome assembly ' + asm_name + ' chromosome ' + chr_name
            )
            #return
            continue

        output_path_agp = output_path.replace(".gz", "")
        with open(output_path_agp, 'wb') as outfile:
            outfile.write(agp)

        # Remove e.g. chr1.agp.gz in its respective directory
        os.remove(output_path)

    if has_centromere_data == False:

        # Remove directory for this particular assembly.
        # Useful when organism has multiple retrieved assemblies, but
        # not all of them have centromere data.
        shutil.rmtree(output_dir)

        if organism not in orgs_with_centromere_data:
            shutil.rmtree('data/chromosomes/' + organism + '/')
        logger.info(
            'No centromere data found in AGP for ' + organism + ' ' +
            'for any chromosomes in genome assembly ' + asm_name
        )

def find_genomes_with_centromeres(asm_summary_response):

    data = asm_summary_response

    logger.info('numbers of keys in asm_summary_response:')
    logger.info(len(data['result'].keys()))

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

        asm_segment = acc + '_' + name.replace(' ', '_').replace('-', '_')

        # Example: ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz
        agp_ftp_wd = (
            '/genomes/all/' +
            asm_segment + '/' + asm_segment + '_assembly_structure/' +
            'Primary_Assembly/assembled_chromosomes/AGP/'
        )

        output_dir = 'data/chromosomes/' + organism + '/' + asm_segment + '/'

        asm = {
            'acc': acc,
            'name': name,
            'rs_uid': rs_uid,
            'taxid': taxid,
            'organism': organism,
            'agp_ftp_wd': agp_ftp_wd,
            'output_dir': output_dir
        }

        download_genome_agp(asm)

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

uid_list = ','.join(uid_list)

asm_summary = esummary + '&db=assembly&id=' + uid_list

logger.info('Fetching ' + asm_summary)
# Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=assembly&id=733711
with request.urlopen(asm_summary) as response:
    data = json.loads(response.read().decode('utf-8'))

find_genomes_with_centromeres(data)

ftp.quit()

logger.info('Ending get_chromosomes.py')
