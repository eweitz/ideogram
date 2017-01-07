''' Converts cytogenetic band data from TSV to JSONP

Example:
cd ideogram
python3 scripts/convert_band_data.py

NCBI and UCSC provide cytogenetic band data as a TSV file.
This script parses those TSVs into JSON, and assigns that to
a global variable in any HTML document that includes the output
file.

NCBI: #chromosome  arm band  iscn_start  iscn_stop bp_start  bp_stop stain density
ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1

UCSC: #chrom chromStart  chromEnd  name  gieStain
http://genome.ucsc.edu/cgi-bin/hgTables
  - group: Mapping and Sequencing
  - track: Chromosome Band (Ideogram)

TODO:
- Converting UCSC data
'''

import json
from os import walk

in_dir = "data/bands/ncbi/"
out_dir = "data/bands/native/"

f = []
for (dirpath, dirnames, filenames) in walk(in_dir):
    print(filenames)
    f.extend(filenames)
    break

for input_file in f:
    output = []

    output_file = out_dir + input_file.replace("tsv", "js")

    rows = open(in_dir + input_file, "r").readlines()

    if len(rows[0].split("\t")) == 4:
        # e.g. ../data/bands/ncbi/ideogram_banana_v0.1.tsv
        #chromosome	arm	bp_start	bp_stop
        max_chr_length = 0
        for row in rows[1:]:
            columns = row.split("\t")
            bp_stop = int(columns[3])
            if bp_stop > max_chr_length:
                max_chr_length = bp_stop
        for row in rows[1:]:
            columns = row.split("\t")

            chr = columns[0]
            arm = columns[1]
            band = '1'
            bp_start = int(columns[2])
            bp_stop = int(columns[3])
            iscn_start = '0'
            iscn_stop = str(round(bp_stop - bp_start) / max_chr_length * 10000)

            columns = [
                chr, arm, band,
                iscn_start, iscn_stop,
                str(bp_start), str(bp_stop)
            ]
            output.append(" ".join(columns))

    else:
        # e.g. ../data/bands/ncbi/ideogram_9606_GCF_000001305.13_550_V1
        # #chromosome	arm	band	iscn_start	iscn_stop	bp_start	bp_stop	stain	density
        for row in rows[1:]:
            columns = row.replace("\n", "").replace("\t", " ")
            output.append(columns)

    output = json.dumps(output)
    output = "chrBands = " + output + ";"

    open(output_file, "w").write(output)
