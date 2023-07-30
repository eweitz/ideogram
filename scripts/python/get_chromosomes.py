"""Download AGPs from NCBI and format chromosome data, including centromeres"""

import urllib.request as request
import urllib.error
from urllib.parse import quote
import ftplib
import os
import json
import gzip
import io
from concurrent.futures import ThreadPoolExecutor
import time
import traceback
import pprint

import fetch_chromosomes.settings as settings
import fetch_chromosomes.convert_band_data as convert_band_data
import fetch_chromosomes.fetch_cytobands_from_dbs as fetch_cytobands_from_dbs
import fetch_chromosomes.utils as utils

output_dir = '../../data/bands/native/'

logger = settings.get_logger('get_chromosomes')

if os.path.exists(output_dir) == False:
    os.mkdir(output_dir)

orgs_with_centromere_data = {}

ftp_domain = 'ftp.ncbi.nlm.nih.gov'

manifest = {}
asms = []

def get_eutils_urls():

    api_key = '&api_key=7e33ac6a08a6955ec3b83d214d22b21a2808'

    eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
    esearch = eutils + 'esearch.fcgi?retmode=json' + api_key
    esummary = eutils + 'esummary.fcgi?retmode=json' + api_key
    elink = eutils + 'elink.fcgi?retmode=json' + api_key

    return {
        'elink': elink,
        'esummary': esummary,
        'esearch': esearch
    }

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


def fetch_ftp(ftp, file_name):

    bytesio_object = io.BytesIO()

    def handle_binary(data):
        bytesio_object.write(data)

    try:
        ftp.retrbinary('RETR ' + file_name, callback=handle_binary)
    except ftplib.error_temp as e:
        # E.g. "ftplib.error_temp: 425 EPSV: Address already in use"
        logger.warning(
            'Caught FTP error (ftplib.error_temp); ' +
            f'retrying in 1 second for {file_name}'
        )
        time.sleep(1)
        ftp.retrbinary('RETR ' + file_name, callback=handle_binary)
    except EOFError as e:
        logger.warning(
            f'Raising FTP error (EOFError); for {file_name}'
        )
        raise e

    return bytesio_object


# Downloads gzipped FTP data in binary format, returns plain text content
def fetch_gzipped_ftp(ftp, file_name):
    bytesio_object = fetch_ftp(ftp, file_name)
    bytesio_object.seek(0) # Go back to the start
    zip_data = gzip.GzipFile(fileobj=bytesio_object)
    content = zip_data.read().decode('utf-8')
    return content


def change_ftp_dir(ftp, wd):

    logger.info('Changing FTP working directory to: ' + wd)
    try:
        ftp.cwd(wd)
    except Exception as e:
        raise e




# GRCh38 defines centromeres and heterochromatin in regions files, not AGP gaps
def download_genome_regions(ftp, regions_ftp):

    centromeres = {}

    wd = '/'.join(regions_ftp.split('/')[:-1])

    change_ftp_dir(ftp, wd)

    logger.info('Downloading genome regions ' + regions_ftp)

    # Example:
    # ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/405/GCF_000001405.37_GRCh38.p11/GCF_000001405.37_GRCh38.p11_assembly_regions.txt
    content = fetch_ftp(ftp, regions_ftp).getvalue().decode('utf-8')

    for line in content.split('\n'):
        if len(line) == 0 or line[0] == '#':
            continue
        columns = line.split('\t')
        role = columns[4]
        if role == 'CEN':
            chr = columns[1]
            start = columns[2]
            stop = columns[3]
            centromeres[chr] = {
                'start': int(start),
                'length': int(stop) - int(start)
            }

    if len(centromeres) > 0:
        logger.info('Found centromeres in regions for FTP path ' + regions_ftp)

    return centromeres


def write_centromere_data(organism, asm_name, asm_acc, output_dir, chrs):
    global manifest

    logger.info(
        'Centromeres found for ' + organism + ' ' +
        'in genome assembly ' + asm_name + ' (' + asm_acc + ')'
    )
    leaf = ''
    if (
        (organism == 'homo-sapiens' and asm_name[:3] == 'GRC') or
        (organism == 'mus-musculus' and asm_name[:3] in ('GRC', 'MGS')) or
        (organism == 'rattus-norvegicus' and asm_name[:4] == 'Rnor')
    ):
        logger.info('Got no-bands assembly: ' + asm_name)
        leaf = '-no-bands'
    output_path = output_dir + organism + leaf + '.json'
    long_output_path = output_dir + organism + '-' + asm_acc + '.json'

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
    adapted_chromosomes = {'chrBands': adapted_chromosomes}
    js_chrs = json.dumps(adapted_chromosomes)

    with open(output_path, 'w') as f:
        f.write(js_chrs)

    with open(long_output_path, 'w') as f:
        f.write(js_chrs)


    logger.info(f"Wrote Ideogram bands for {organism} to output_path: {output_path}")
    logger.info(f"Wrote Ideogram bands for {organism} to long_output_path: {long_output_path}")
    manifest[organism] = [asm_acc, asm_name]


def download_genome_agp(ftp, asm):
    global orgs_with_centromere_data
    logger.info('Entering download_genome_agp')

    agp_ftp_wd = asm['agp_ftp_wd']
    asm_acc = asm['acc']
    organism = asm['organism']
    asm_output_dir = asm['asm_output_dir']
    asm_name = asm['name']
    asm_segment = asm['asm_segment']
    regions_ftp = asm['regions_ftp']

    chrs = []
    chrs_seen = {}

    has_centromere_data = False

    try:
        change_ftp_dir(ftp, agp_ftp_wd)
    except Exception as e:
        logger.warning(e)
        logger.warning('Returning from change_ftp_dir due to error')
        # time.sleep(3)
        return

    file_names = ftp.nlst()

    logger.info(f'List of files in FTP working directory for ({organism}, {asm_name})')
    logger.info(file_names)
    for file_name in file_names:
        # Download each chromomsome's compressed AGP file
        # We retrieve both agp.gz and comp.agp.gz files
        # Former is more common, latter used for some organisms (e.g. platypus)

        # Example full URL of file:
        # https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/515/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz
        logger.info(
            f'Retrieving from FTP ({organism}, {asm_name}, {asm_acc}): ' +
            file_name
        )

        try:
            agp = fetch_gzipped_ftp(ftp, file_name)
        except EOFError as e:
            logger.warning(
                f'Raising error (EOFError) for ({organism}, {asm_name}, {asm_acc}): {file_name}'
            )
            raise e


        chr = get_chromosome_object(agp)

        if (organism in ['homo-sapiens', 'mus-musculus']):
            logger.info('in download_genome_agp. organism, chr, agp:')
            logger.info(organism)
            logger.info(chr)
            logger.info(agp)

        chr_acc = chr['accession']
        if chr_acc not in chrs_seen:
            chr['name'] = file_name.split('.')[0].split('chr')[1]
            chrs.append(chr)
            chrs_seen[chr_acc] = 1

        if "centromere" in str(agp):
            has_centromere_data = True
            orgs_with_centromere_data[organism] = 1
            logger.info(
                'Found centromere data in AGP for ' + organism + ' ' +
                'in ' + file_name
            )
        else:
            chr_name = file_name.split(".")[0]
            logger.info(
                'No centromere data found in AGP for ' + organism + ' ' +
                'genome assembly ' + asm_name + ' chromosome ' + chr_name
            )
            continue

    if not has_centromere_data:
        logger.info(
            'No centromere data found in any AGP for ' + organism + ' ' +
            'in genome assembly ' + asm_name + ' (' + asm_acc + ')'
        )

        if regions_ftp != '':
            centromeres = download_genome_regions(ftp, regions_ftp)
            if len(centromeres) > 0:
                has_centromere_data = True
                orgs_with_centromere_data[organism] = 1
                for chr in centromeres:
                    for chr2 in chrs:
                        if chr == chr2['name']:
                            chr2['centromere'] = centromeres[chr]

    if has_centromere_data:
        logger.info(
            'Writing centromeres for ' + organism + ' ' +
            'genome assembly ' + asm_name
        )
        write_centromere_data(organism, asm_name, asm_acc, output_dir, chrs)


def find_genomes_with_centromeres(asm_summary_response):
    global asms

    ftp = ftplib.FTP(ftp_domain)
    ftp.login()

    data = asm_summary_response

    logger.info('In find_genomes_with_centromeres, number of keys in asm_summary_response:')
    logger.info(len(data['result'].keys()))

    organisms = []
    for uid in data['result']:
        if uid == 'uids':
            continue
        result = data['result'][uid]
        organism = result['speciesname'].lower().replace(' ', '-').strip()
        organisms.append(organism)
    logger.info('In find_genomes_with_centromeres, organisms:')
    logger.info(organisms)

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
        # FTP working directory of AGP files
        agp_ftp_wd = (
            '/genomes/all/' + split_acc +
            asm_segment + '/' + asm_segment + '_assembly_structure/' +
            'Primary_Assembly/assembled_chromosomes/AGP/'
        )

        regions_ftp = result['ftppath_regions_rpt']
        if regions_ftp != '':
            regions_ftp = regions_ftp.split('nih.gov')[1]

        asm_output_dir = output_dir + organism + '/' + asm_segment + '/'

        asm = {
            'acc': acc,
            'name': name,
            'taxid': taxid,
            'organism': organism,
            'agp_ftp_wd': agp_ftp_wd,
            'asm_output_dir': asm_output_dir,
            'asm_segment': asm_segment,
            'regions_ftp': regions_ftp
        }

        try:
            download_genome_agp(ftp, asm)
        except Exception as e:
            logger.warning(f'Caught Exception; sleep then reconnect FTP.  Exception')
            logger.warning(e)
            ftp = ftplib.FTP(ftp_domain)
            ftp.login()
            download_genome_agp(ftp, asm)

        asms.append(asm)

    ftp.quit()


def chunkify(lst, n):
    return [lst[i::n] for i in range(n)]


def pool_processing(uid_list):
    logger.info(f'In get_chromosomes.py pool_processing.  len(uid_list): {len(uid_list)}, raw uid_list:')
    logger.info(uid_list)

    # If uid_list is nested list, as with chunked use case in multi-thread mode
    if hasattr(uid_list[0], '__len__') and (not isinstance(uid_list[0], str)):
        uid_list = uid_list[0]

    logger.info(f'In get_chromosomes.py pool_processing.  processed len(uid_list): {len(uid_list)}, processed uid_list:')
    logger.info(uid_list)

    uid_list = ','.join(uid_list)
    num_uids = len(uid_list)

    asm_summary = get_eutils_urls()['esummary'] + '&db=assembly&id=' + uid_list

    logger.info(f'In get_chromosomes.py pool_processing.  Now fetching {num_uids} UIDs: {asm_summary}')
    # breakpoint()
    # Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=assembly&id=733711
    try:
        with request.urlopen(asm_summary) as response:
            logger.info('response.status')
            logger.info(response.status)
            esummary_data = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        # msg = (
        #     f"Encountered HTTP error status code {response.status} "
        #     f"in request for {asm_summary}"
        # )
        logger.error(e)
        raise ValueError(e)
    time.sleep(3) # Delay for 3 seconds

    # logger.info('In get_chromosomes.py, esummary_data:')
    # logger.info(esummary_data)
    try:
        find_genomes_with_centromeres(esummary_data)
    except Exception as e:
        logger.error('Error in pool_processing, find_genomes_with_centromeres.  e:')
        logger.error(e)

def main():
    global manifest

    term = quote(
        '("latest refseq"[filter]) AND '
        '("chromosome level"[filter] OR "complete genome"[filter]) AND ' +
        '(animals[filter] OR plants[filter] OR fungi[filter] OR protists[filter])'
    )

    asm_search = get_eutils_urls()['esearch'] + '&db=assembly&term=' + term + '&retmax=10000'

    # Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?retmode=json&db=assembly&term=("latest refseq"[filter] AND "chromosome level"[filter]) AND (animals[filter] OR plants[filter] OR fungi[filter] OR protists[filter])&retmax=10000
    with request.urlopen(asm_search) as response:
        data = json.loads(response.read().decode('utf-8'))

    # Returns ~1000 ids
    top_uid_list = data['esearchresult']['idlist']

    logger.info('Assembly UIDs returned in search results: ' + str(len(top_uid_list)))

    non_ncbi_manifest = fetch_cytobands_from_dbs.main()

    logger.info('in get_chromosomes.py, non_ncbi_manifest')
    logger.info(non_ncbi_manifest)

    # TODO: Make this configurable
    num_threads = 5

    uid_lists = chunkify(top_uid_list, num_threads)

    with ThreadPoolExecutor(max_workers=num_threads) as pool:
        pool.map(pool_processing, uid_lists)
        # future = pool.submit(pool_processing, uid_lists)
        # try:
        #     future.result()
        # except Exception as e:
        #     logger.error('In main, error:')
        #     logger.error(e)
        #     trace = "".join(traceback.TracebackException.from_exception(e).format())
        #     logger.error(trace)

    # logger.info('non_ncbi_manifest')
    # logger.info(non_ncbi_manifest)

    non_ncbi_manifest.update(manifest)

    manifest = non_ncbi_manifest

    logger.info('manifest')
    logger.info(manifest)

    # Write a manifest of organisms for which we have cytobands.
    # This enables Ideogram.js to more quickly load those organisms.
    pp = pprint.PrettyPrinter(indent=4)
    manifest = pp.pformat(manifest)
    manifest = "assemblyManifest = " + manifest

    manifest_path = '../../src/js/assembly-manifest.js'
    with open('../../src/js/assembly-manifest.js', 'w') as f:
        f.write(manifest)
    print(f'Wrote {manifest_path}')

    logger.info('Calling convert_band_data.py')
    convert_band_data.main()

    logger.info('Ending get_chromosomes.py')

if __name__ == '__main__':
    main()
