"""Fetch cytogenetic band data from third-party MySQL databases"""

import pymysql

connection = pymysql.connect(host="genome-mysql.soe.ucsc.edu", user="genome")
cursor = connection.cursor()

db_map = {}

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
    organism = db_map[db]
    chrs_by_organism[organism] = bands_by_chr

print('Number of organisms with centromeres:')
print(len(chrs_by_organism))
for org in chrs_by_organism:
    print(org)