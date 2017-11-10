"""Fetch cytogenetic band data from third-party MySQL databases"""

# TODO:
# - Write data for first-class organisms to JavaScript file in ../src/js/
# - Incorporate Ensembl proper, GenoMaize
# - Bonus: Convert this data into AGP 2.0, send data missing from NCBI to them

import pymysql
import urllib.request as request
import os
import json
from concurrent.futures import ThreadPoolExecutor
import logging
import time
import pprint
import re

output_dir = '../data/bands/native/'

if os.path.exists(output_dir) == False:
    os.mkdir(output_dir)

# create logger with 'get_cytobands_from_remote_dbs'
logger = logging.getLogger('get_cytobands_from_remote_dbs')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler(output_dir + 'get_cytobands_from_remote_dbs.log')
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

time_ncbi = 0
time_ucsc = 0
time_ensembl = 0


def natural_sort(l):
    """From https://stackoverflow.com/a/4836734
    """
    convert = lambda text: int(text) if text.isdigit() else text.lower()
    alphanum_key = lambda key: [ convert(c) for c in re.split('([0-9]+)', key) ]
    return sorted(l, key=alphanum_key)


def time_ms():
    return int(round(time.time() * 1000))


def chunkify(lst, n):
    return [lst[i::n] for i in range(n)]


def update_bands_by_chr(bands_by_chr, chr, band_name, start, stop, stain):
    chr = chr.replace('chr', '') # e.g. chr1 -> 1
    # band_name and stain can be omitted,
    # see e.g. Aspergillus oryzae, Anopheles gambiae
    if band_name is None:
        band_name = ''
    if stain is None:
        stain = ''
    stain = stain.lower()
    band = [band_name, str(start), str(stop), str(start), str(stop), stain]
    if chr in bands_by_chr:
        bands_by_chr[chr].append(band)
    else:
        bands_by_chr[chr] = [band]
    return bands_by_chr


def get_genbank_accession_from_ucsc_name(db):
    """Queries NCBI EUtils for the GenBank accession of a UCSC asseembly name
    """
    global time_ncbi
    t0 = time_ms()
    logger.info('Fetching GenBank accession from NCBI EUtils for: ' + db)

    eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
    esearch = eutils + 'esearch.fcgi?retmode=json'
    esummary = eutils + 'esummary.fcgi?retmode=json'

    asm_search = esearch + '&db=assembly&term=' + db

    # Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=assembly&retmode=json&term=panTro4
    with request.urlopen(asm_search) as response:
        data = json.loads(response.read().decode('utf-8'))
    id_list = data['esearchresult']['idlist']
    if len(id_list) > 0:
        assembly_uid = id_list[0]
    else:
        unfound_dbs.append(db)
        return ''
    asm_summary = esummary + '&db=assembly&id=' + assembly_uid

    # Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=assembly&id=255628
    with request.urlopen(asm_summary) as response:
        data = json.loads(response.read().decode('utf-8'))

    result = data['result'][assembly_uid]
    acc = result['assemblyaccession'] # Accession.version

    # Return GenBank accession if it's default, else find and return it
    if "GCA_" not in acc:
        acc = result['synonym']['genbank']

    time_ncbi += time_ms() - t0
    return acc


def query_ucsc_cytobandideo_db(db_tuples_list):
    """Queries UCSC DBs, called via a thread pool in fetch_ucsc_data
    """

    connection = pymysql.connect(
        host='genome-mysql.soe.ucsc.edu',
        user='genome'
    )
    logger.info('Connected to UCSC database')
    cursor = connection.cursor()

    for db_tuple in db_tuples_list:
        db, name_slug = db_tuple
        cursor.execute('USE ' + db)
        cursor.execute('SHOW TABLES')
        rows2 = cursor.fetchall()
        found_needed_table = False
        for row2 in rows2:
            if row2[0] == 'cytoBandIdeo':
                found_needed_table = True
                break
        if found_needed_table == False:
            continue

        # Excludes unplaced and unlocalized chromosomes
        query = ('''
            SELECT * FROM cytoBandIdeo
            WHERE chrom NOT LIKE "chrUn"
              AND chrom LIKE "chr%"
              AND chrom NOT LIKE "chr%\_%"
        ''')
        r = cursor.execute(query)
        if r <= 1:
            # Skip if result contains only e.g. chrMT
            continue

        bands_by_chr = {}
        has_bands = False
        rows3 = cursor.fetchall()
        for row3 in rows3:
            chr, start, stop, band_name, stain = row3
            bands_by_chr = update_bands_by_chr(
                bands_by_chr, chr, band_name, start, stop, stain
            )
            if band_name != '':
                has_bands = True
        if has_bands == False:
            continue

        genbank_accession = get_genbank_accession_from_ucsc_name(db)

        # name_slug = db_map[db]

        asm_data = [db, genbank_accession, bands_by_chr]

        logger.info('Got UCSC data: ' + str(asm_data))

        return asm_data


def fetch_from_ucsc():
    """Queries MySQL instances hosted by UCSC Genome Browser

    To connect via Terminal (e.g. to debug), run:
    mysql --user=genome --host=genome-mysql.soe.ucsc.edu -A
    """
    global time_ucsc
    t0 = time_ms()
    logger.info('Entering fetch_from_ucsc')
    connection = pymysql.connect(
        host='genome-mysql.soe.ucsc.edu',
        user='genome'
    )
    logger.info('Connected to UCSC database')
    cursor = connection.cursor()

    db_map = {}
    org_map = {}

    cursor.execute('use hgcentral')
    cursor.execute('''
      SELECT name, scientificName FROM dbDb
        WHERE active = 1
    ''')
    for row in cursor.fetchall():
        db = row[0]
        # e.g. Homo sapiens -> homo-sapiens
        name_slug = row[1].lower().replace(' ', '-')
        db_map[db] = name_slug

    db_tuples = [item for item in db_map.items()]

    # Take the list of DBs we want to query for cytoBandIdeo data,
    # split it into 30 smaller lists,
    # then launch a new thread for each of those small new DB lists
    # to divide up the work of querying remote DBs.
    num_threads = 30
    db_tuples_lists = chunkify(db_tuples, num_threads)
    with ThreadPoolExecutor(max_workers=num_threads) as pool:
        for result in pool.map(query_ucsc_cytobandideo_db, db_tuples_lists):
            if result is None:
                continue
            asm_data = result
            if name_slug in org_map:
                org_map[name_slug].append(asm_data)
            else:
                org_map[name_slug] = [asm_data]

    time_ucsc += time_ms() - t0
    return org_map


def get_ensembl_chr_ids(cursor):
    """Get a map of Ensembl seq_region_ids to familiar chromosome names.
    Helper function for query_ensembl_karyotype_db.

    :param cursor: Cursor connected to Ensembl Genomes DB of interest
    :return: chr_id: Dictionary mapping seq_region_id to chromosome names
    """
    cursor.execute('''
      SELECT coord_system_id FROM coord_system
      WHERE name="chromosome" AND attrib="default_version"
    ''')
    coord_system_id = str(cursor.fetchone()[0])
    chr_ids = {}
    cursor.execute(
        'SELECT name, seq_region_id FROM seq_region ' +
        'WHERE coord_system_id = ' + coord_system_id
    )
    rows = cursor.fetchall()
    for row in rows:
        chr, seq_region_id = row
        chr_ids[seq_region_id] = chr

    return chr_ids


def query_ensembl_karyotype_db(db_tuples_list):
    """Query for karyotype data in Ensembl Genomes.
    This function is launched many times simultaneously in a thread pool.

    :param db_tuples_list: List of (db, name_slug) tuples
    :return: List of [name_slug, asm_data] lists
    """

    connection = pymysql.connect(
        host='mysql-eg-publicsql.ebi.ac.uk',
        user='anonymous',
        port=4157
    )
    cursor = connection.cursor()
    logger.info('Connected to Ensembl Genomes database via pool')

    pq_result = []

    for db_tuple in db_tuples_list:
        db, name_slug = db_tuple

        # Example for debugging: "USE zea_mays_core_35_88_7;"
        cursor.execute('USE ' + db)

        # Schema: https://www.ensembl.org/info/docs/api/core/core_schema.html#karyotype
        # | karyotype_id | seq_region_id | seq_region_start | seq_region_end | band | stain |
        # TODO: Learn what is available via seq_region_id, in seq_region table
        cursor.execute('SELECT * FROM karyotype')
        rows = cursor.fetchall()
        # Omit assmblies that don't have cytoband data
        if len(rows) == 0:
            continue

        chr_ids = get_ensembl_chr_ids(cursor)

        bands_by_chr = {}

        for row in rows:
            pid, seq_region_id, start, stop, band_name, stain = row
            chr = chr_ids[seq_region_id]
            bands_by_chr = update_bands_by_chr(
                bands_by_chr, chr, band_name, start, stop, stain
            )

        cursor.execute('''
          SELECT meta_value FROM meta
          where meta_key = "assembly.accession"
        ''')
        genbank_accession = cursor.fetchone()[0]

        asm_data = [genbank_accession, db, bands_by_chr]
        pq_result.append([name_slug, asm_data])
        logger.info('Got Ensembl Genomes data: ' + str(asm_data))

    return pq_result


def fetch_from_ensembl_genomes():
    """Queries MySQL servers hosted by Ensembl Genomes

    To connect via Terminal (e.g. to debug), run:
    mysql --user=anonymous --host=mysql-eg-publicsql.ebi.ac.uk --port=4157 -A
    """
    global time_ensembl
    t0 = time_ms()
    logger.info('Entering fetch_from_ensembl_genomes')
    connection = pymysql.connect(
        host='mysql-eg-publicsql.ebi.ac.uk',
        user='anonymous',
        port=4157
    )
    logger.info('Connected to Ensembl Genomes database')

    cursor = connection.cursor()

    db_map = {}
    org_map = {}

    # Get a list of databases we want to query for karyotype data
    cursor.execute('show databases like "%core_%"');
    for row in cursor.fetchall():
        db = row[0]
        if 'collection' in db:
            continue
        name_slug = db.split('_core')[0].replace('_', '-')
        db_map[db] = name_slug
    db_tuples = [item for item in db_map.items()]

    cursor.close()

    # Take the list of DBs we want to query for karyotype data,
    # split it into 100 smaller lists,
    # then launch a new thread for each of those small new DB lists
    # to divide up the work of querying remote DBs.
    num_threads = 100
    db_tuples_lists = chunkify(db_tuples, num_threads)
    with ThreadPoolExecutor(max_workers=num_threads) as pool:
        for result in pool.map(query_ensembl_karyotype_db, db_tuples_lists):
            for db_tuple in result:
                name_slug, asm_data = db_tuple
                if name_slug in org_map:
                    org_map[name_slug].append(asm_data)
                else:
                    org_map[name_slug] = [asm_data]

    logger.info('before exiting with clause')

    time_ensembl += time_ms() - t0
    return org_map


def pool_processing(party):
    logger.info('Entering pool processing, party: ' + party)
    if party == 'ensembl':
        org_map = fetch_from_ensembl_genomes()
    else:
        org_map = fetch_from_ucsc()
    logger.info('exiting pool processing')
    return [party, org_map]


party_list = []
unfound_dbs = []

num_threads = 2

with ThreadPoolExecutor(max_workers=num_threads) as pool:
    for result in pool.map(pool_processing, ['ensembl', 'ucsc']):
        party_list.append(result)

logger.info('')
logger.info('UCSC databases not mapped to GenBank assembly IDs:')
logger.info(', '.join(unfound_dbs))
logger.info('')

# Non-redundant (NR) organism map
nr_org_map = {}

seen_orgs = {}
for party, org_map in party_list:
    logger.info('Iterating organisms from ' + party)
    for org in org_map:
        logger.info('\t' + org)
        if org in seen_orgs:
            logger.info('Already saw ' + org)
            continue
        nr_org_map[org] = org_map[org]

logger.info('')
logger.info('organisms in nr_org_map')

manifest= {}

pp = pprint.PrettyPrinter(indent=4)

for org in nr_org_map:
    asm_data = sorted(nr_org_map[org], reverse=True)[0]
    genbank_accession, db, bands_by_chr = asm_data
    band_list = []
    chrs = natural_sort(list(bands_by_chr.keys()))
    for chr in chrs:
        bands = bands_by_chr[chr]
        for band in bands:
            band_list.append(chr + ' ' + ' '.join(band))
    manifest[org] = [genbank_accession, db]
    with open(output_dir + org + '.js', 'w') as f:
        f.write('window.chrBands = ' + str(band_list))

manifest = pp.pformat(manifest)

with open(output_dir + 'manifest.tsv', 'w') as f:
    f.write(manifest)

logger.info('')

logger.info('time_ucsc:')
logger.info(time_ucsc)
logger.info('time_ncbi:')
logger.info(time_ncbi)
logger.info('time_ensembl:')
logger.info(time_ensembl)