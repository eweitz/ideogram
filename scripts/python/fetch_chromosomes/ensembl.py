from concurrent.futures import ThreadPoolExecutor
from functools import partial

from .utils import *

def get_ensembl_cursor():
    connection = db_connect(
        host='mysql-eg-publicsql.ebi.ac.uk',
        user='anonymous',
        port=4157
    )
    logger.info('Connected to Ensembl Genomes database')
    cursor = connection.cursor()
    return cursor

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
    coord_system_id = str(cursor.fetchall()[0][0])
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
    cursor = get_ensembl_cursor()

    pq_result = []

    for db_tuple in db_tuples_list:
        db, name_slug = db_tuple

        # Example for debugging: "USE zea_mays_core_35_88_7;"
        cursor.execute('USE ' + db)

        # Schema: https://www.ensembl.org/info/docs/api/core/core_schema.html#karyotype
        # | karyotype_id | seq_region_id | seq_region_start | seq_region_end | band | stain |
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

def query_db_tuples(cursor):
    db_map = {}

    # Get a list of databases we want to query for karyotype data
    cursor.execute('show databases like "%core_%"')
    for row in cursor.fetchall():
        db = row[0]
        if 'collection' in db:
            continue
        name_slug = db.split('_core')[0].replace('_', '-')
        db_map[db] = name_slug
    db_tuples = [item for item in db_map.items()]

    return db_tuples

def pool_fetch_org_map(db_tuples):
    org_map = {}

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

    return org_map

def fetch_from_ensembl_genomes(times_obj, logger_obj):
    """Queries MySQL servers hosted by Ensembl Genomes

    To connect via Terminal (e.g. to debug), run:
    mysql --user=anonymous --host=mysql-eg-publicsql.ebi.ac.uk --port=4157 -A
    """
    global logger, times
    logger = logger_obj
    times = times_obj
    t0 = time_ms()
    logger.info('Entering fetch_from_ensembl_genomes')

    cursor = get_ensembl_cursor()

    db_tuples = query_db_tuples(cursor)

    cursor.close()

    org_map = pool_fetch_org_map(db_tuples)

    logger.info('before exiting with clause')

    times['ensembl'] += time_ms() - t0
    return [org_map, times]