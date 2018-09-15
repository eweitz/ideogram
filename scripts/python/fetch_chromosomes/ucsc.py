from concurrent.futures import ThreadPoolExecutor

from .utils import *


def query_ucsc_cytobandideo_db(db_tuples_list, logger):
    """Queries UCSC DBs, called via a thread pool in fetch_ucsc_data
    """

    connection = db_connect(
        host='genome-mysql.soe.ucsc.edu',
        user='genome'
    )
    logger.info('Connected to UCSC database')
    cursor = connection.cursor()

    for db_tuple in db_tuples_list:
        db, name_slug = db_tuple
        cursor.execute('USE ' + db)
        cursor.execute('SHOW TABLES; # for ' + db)
        rows2 = cursor.fetchall()
        found_needed_table = False
        for row2 in rows2:
            if row2[0] == 'cytoBandIdeo':
                found_needed_table = True
                break
        if found_needed_table is False:
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
        if has_bands is False:
            continue

        genbank_accession = get_genbank_accession_from_ucsc_name(db)

        # name_slug = db_map[db]

        asm_data = [db, genbank_accession, bands_by_chr]

        logger.info('Got UCSC data: ' + str(asm_data))

        return asm_data

def fetch_from_ucsc(logger):
    """Queries MySQL instances hosted by UCSC Genome Browser

    To connect via Terminal (e.g. to debug), run:
    mysql --user=genome --host=genome-mysql.soe.ucsc.edu -A
    """
    global time_ucsc
    t0 = time_ms()
    logger.info('Entering fetch_from_ucsc')
    connection = db_connect(
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
    rows = cursor.fetchall()

    for row in rows:
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
        for result in pool.map(query_ucsc_cytobandideo_db, db_tuples_lists, logger):
            if result is None:
                continue
            asm_data = result
            if name_slug in org_map:
                org_map[name_slug].append(asm_data)
            else:
                org_map[name_slug] = [asm_data]

    time_ucsc += time_ms() - t0
    return org_map