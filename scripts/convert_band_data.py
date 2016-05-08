''' Converts cytogenetic band data from TSV to JSONP

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

    rows = open(in_dir + input_file, "r").readlines()[1:]
    for row in rows:
    	columns = row.replace("\n", "").replace("\t", " ")
    	output.append(columns)

    output = json.dumps(output)
    output = "chrBands = " + output + ";"

    open(output_file, "w").write(output)
