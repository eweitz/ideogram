"""Download AGPs from NCBI and format chromosome data, including centromeres"""

import urllib.request as request
from urllib.parse import quote
import ftplib
import os
import shutil
import json
import gzip
import logging

import convert_band_data


output_dir = 'data/bands/native/'

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


def get_chromosome_object(agp):
    """Extracts centromere coordinates and chromosome length from AGP data,
    and returns a chromosome object formatted in JSON"""

    chr = {}

    agp = agp.split('\n')

    for i, line in enumerate(agp):
        if len(line) == 0 or line[0] == '#':
            continue
        tabs = line.split("\t")
        acc = tabs[0]
        start = int(tabs[1])
        stop = int(tabs[2])
        comp_type = tabs[6]
        if 'acc' not in chr:
            chr['accession'] = acc
            chr['type'] = 'nuclear'
        if comp_type == 'centromere':
            chr['centromere'] = {
                'start': start,
                'length': stop - start
            }
        if i == len(agp) - 2:
            chr['length'] = stop
    return chr


def download_genome_agp(asm):

    agp_ftp_wd = asm['agp_ftp_wd']
    acc = asm['acc']
    organism = asm['organism']
    asm_output_dir = asm['asm_output_dir']
    asm_name = asm['name']
    asm_segment = asm['asm_segment']

    chrs = []
    chrs_seen = {}

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

        output_path = asm_output_dir + file_name

        if os.path.exists(asm_output_dir) == False:
            os.makedirs(asm_output_dir)

        # Example full URL of file:
        # 'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz'
        logger.info('Retrieving from FTP: ' + file_name)
        with open(output_path, 'wb') as file:
            ftp.retrbinary('RETR '+ file_name, file.write)

        with gzip.open(output_path, 'rb') as file:
            agp = file.read().decode('utf-8')

        chr = get_chromosome_object(agp)

        # Remove e.g. chr1.agp.gz in its respective directory
        os.remove(output_path)

        chr_acc = chr['accession']
        if chr_acc not in chrs_seen:
            chr['name'] = file_name.split('.')[0].split('chr')[1]
            chrs.append(chr)
            chrs_seen[chr_acc] = 1

        if "centromere" in str(agp):
            has_centromere_data = True
            orgs_with_centromere_data[organism] = 1
        else:
            chr_name = file_name.split(".")[0]
            logger.info(
                'No centromere data found in AGP for ' + organism + ' ' +
                'genome assembly ' + asm_name + ' chromosome ' + chr_name
            )
            continue

    if has_centromere_data == False:
        logger.info(
            'No centromere data found in AGP for ' + organism + ' ' +
            'for any chromosomes in genome assembly ' + asm_name
        )
    else:
        leaf = ''
        if organism in ('homo-sapiens', 'mus-musculus', 'rattus-norvegicus'):
            leaf = '-no-bands'
        output_path = output_dir + organism + leaf + ".js"

        adapted_chromosomes = []

        max_chr_length = 0
        for chr in chrs:
            if chr['length'] > max_chr_length:
                max_chr_length = chr['length']

        for chr in chrs:
            name = chr['name']
            length = chr['length']

            iscn_stop_q = str(round(length) / max_chr_length * 10000)
            length = str(length)

            if 'centromere' in chr:
                cen = chr['centromere']
                midpoint = cen['start'] + round(cen['length']/2)

                iscn_stop_p = str(round(midpoint / max_chr_length * 10000))

                midpoint = str(midpoint)

                p = name + ' p 1 0 ' + iscn_stop_p + ' 0 ' + midpoint
                q = (
                    name + ' q 1 ' + str(int(iscn_stop_p) + 1) + ' ' + iscn_stop_q +
                    ' ' + midpoint + ' ' + length
                )

                adapted_chromosomes += [p, q]
            else:
                adapted_chromosomes.append(
                    name + ' n 1 0 ' + iscn_stop_q + ' 0 ' + length
                )
        js_chrs = 'window.chrBands = ' + json.dumps(adapted_chromosomes)

        with open(output_path, 'w') as f:
            f.write(js_chrs)

    shutil.rmtree(output_dir + organism + '/')


def find_genomes_with_centromeres(asm_summary_response):

    data = asm_summary_response

    logger.info('numbers of keys in asm_summary_response:')
    logger.info(len(data['result'].keys()))

    for uid in data['result']:

        # Omit list of UIDs
        if uid == 'uids':
            continue

        result = data['result'][uid]
        acc = result['assemblyaccession'] # Accession.version
        name = result['assemblyname']
        taxid = result['taxid']
        organism = result['speciesname'].lower().replace(' ', '-').strip()

        # one fully banded (downstream), one not
        # if organism != 'homo-sapiens' and organism != 'pongo-abelii':
        #     continue
        asm_segment = acc + '_' + name.replace(' ', '_').replace('-', '_')

        # NCBI genomes FTP directories have path segments corresponding to a split
        # assembly accession, e.g. GCF_000001515 -> GCF/000/001/515.
        split_acc = ''
        for i, char in enumerate(acc.split('.')[0].replace('_', '')):
            split_acc += char
            if (i + 1) % 3 == 0:
                split_acc += '/'

        # Example: ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/515/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz
        agp_ftp_wd = (
            '/genomes/all/' + split_acc +
            asm_segment + '/' + asm_segment + '_assembly_structure/' +
            'Primary_Assembly/assembled_chromosomes/AGP/'
        )

        asm_output_dir = output_dir + organism + '/' + asm_segment + '/'

        asm = {
            'acc': acc,
            'name': name,
            'taxid': taxid,
            'organism': organism,
            'agp_ftp_wd': agp_ftp_wd,
            'asm_output_dir': asm_output_dir,
            'asm_segment': asm_segment
        }

        download_genome_agp(asm)

        asms.append(asm)

eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
esearch = eutils + 'esearch.fcgi?retmode=json';
esummary = eutils + 'esummary.fcgi?retmode=json';
elink = eutils + 'elink.fcgi?retmode=json';

asms = []

term = quote(
    '("reference genome"[filter] OR "representative genome"[filter]) AND '
    '("chromosome level"[filter] OR "complete genome"[filter]) AND ' +
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

logger.info('Calling convert_band_data.py')
convert_band_data.main()

logger.info('Ending get_chromosomes.py')
