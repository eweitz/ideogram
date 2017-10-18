"""Fetch cytogenetic band data from third-party MySQL databases"""

# TODO:
# - Write data for first-class organisms to JavaScript file in ../src/js/
# - Incorporate Ensembl proper, GenoMaize
# - Parallelize requests, one to each third-party (bonus: one to each mirror)
# - Bonus: Convert this data into AGP 2.0, send data missing from NCBI to them

import pymysql

def fetch_from_ucsc():
    """Queries MySQL instances hosted by UCSC Genome Browser"""
    print('fetch_from_ucsc')
    connection = pymysql.connect(
        host="genome-mysql.soe.ucsc.edu",
        user="genome"
    )
    cursor = connection.cursor()

    db_map = {}
    org_map = {}

    cursor.execute('use hgcentral')
    cursor.execute("""
      SELECT name, scientificName FROM dbDb
        WHERE active = 1
    """)
    for row in cursor.fetchall():
        db = row[0]
        # e.g. Homo sapiens -> homo-sapiens
        name_slug = row[1].lower().replace(' ', '-')
        db_map[db] = name_slug

    chrs_by_organism = {}

    for db in db_map:
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
        query = ("""
            SELECT * FROM cytoBandIdeo
            WHERE chrom NOT LIKE 'chrUn'
              AND chrom LIKE 'chr%'
              AND chrom NOT LIKE 'chr%\_%'
        """)
        r = cursor.execute(query)
        if r <= 1:
            # Skip if result contains only e.g. chrMT
            continue
        bands_by_chr = {}
        has_bands = False
        rows3 = cursor.fetchall()
        for row3 in rows3:
            chr = row3[0]
            start = row3[1]
            stop = row3[2]
            length = stop - start
            band_name = row3[3]
            gie_stain = row3[4]
            if band_name != '':
                has_bands = True
            band = [band_name, start, length, gie_stain]
            if chr in bands_by_chr:
                bands_by_chr[chr].append(band)
            else:
                bands_by_chr[chr] = [band]
        if has_bands == False:
            continue
        name_slug = db_map[db]
        chrs_by_organism[name_slug] = bands_by_chr

        if name_slug in db_map:
            org_map[name_slug].append(db)
        else:
            org_map[name_slug] = [db]

    print('Number of organisms with centromeres:')
    print(len(chrs_by_organism))
    for org in chrs_by_organism:
        print(org)

    return org_map

def fetch_from_ensembl_genomes():
    """Queries MySQL servers hosted by Ensembl Genomes
    """
    print('fetch_from_ensembl_genomes')
    connection = pymysql.connect(
        host='mysql-eg-publicsql.ebi.ac.uk',
        user='anonymous',
        port=4157
    )
    cursor = connection.cursor()
    cursor.execute('show databases like "%core_%"');

    db_map = {}
    org_map = {}

    for row in cursor.fetchall():
        db = row[0]
        if "collection" in db:
            continue
        name_slug = db.split('_core')[0].replace('_', '-')
        db_map[db] = name_slug

    for db in db_map:
        cursor.execute('USE ' + db)

        # Schema: https://www.ensembl.org/info/docs/api/core/core_schema.html#karyotype
        # | karyotype_id | seq_region_id | seq_region_start | seq_region_end | band | stain |
        # TODO: Learn what is available via seq_region_id, in seq_region table
        cursor.execute('SELECT * FROM karyotype')
        rows = cursor.fetchall()
        if len(rows) == 0:
            # print(db)
            continue

        if name_slug in db_map:
            org_map[name_slug].append(db)
        else:
            org_map[name_slug] = [db]

        print(db + ' ****************')

    return org_map


party_map = {}
org_map_ensembl_genomes = fetch_from_ensembl_genomes()
org_map_ucsc = fetch_from_ucsc()
party_map['ensembl_genomes'] = org_map_ensembl_genomes
party_map['ucsc'] = org_map_ucsc

# Non-redundant (NR) organism map
nr_org_map = {}

seen_orgs = {}
for party in party_map:
    org_map = party_map[party]
    print('Iterating organisms from ' + party)
    for org in org_map:
        if org in seen_orgs:
            print('Already saw ' + org)
            continue
        print('\t' + org)
        nr_org_map[org] = org_map[org]






