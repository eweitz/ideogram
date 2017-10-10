import pymysql

connection = pymysql.connect(host="genome-mysql.soe.ucsc.edu", user="genome")
cursor = connection.cursor()

r = cursor.execute("""show databases""")

rows = cursor.fetchall()

chrs_by_db = {}

for row in rows:
    db = row[0]
    cursor.execute('USE ' + db)
    cursor.execute('SHOW TABLES')
    rows2 = cursor.fetchall()
    # print('rows2 tables')
    # print(rows2)
    found_needed_table = False
    for row2 in rows2:
        if row2[0] == 'cytoBandIdeo':
            found_needed_table = True
            break
    if found_needed_table == False:
        continue
    query = (""" 
        SELECT * FROM cytoBandIdeo 
        WHERE chrom NOT LIKE 'chrUn' 
          AND chrom LIKE 'chr%' 
          AND chrom NOT LIKE 'chr%\_%'
    """)
    r = cursor.execute(query)
    if r <= 1:
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
    print(db)
    chrs_by_db[db] = bands_by_chr

#print(chrs_by_db)

#db.query("""SELECT spam, eggs, sausage FROM breakfast WHERE price < 5""")