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
- CLI argument handling
- Converting UCSC data
- Multiple taxa
'''

import json

output = []

input_file = "ncbi/ideogram_9606_GCF_000001305.14_550_V1"
output_file = "native/ideogram_9606_GCF_000001405.26_550.js"

rows = open(input_file, "r").readlines()[1:]
for row in rows:
	columns = row.replace("\n", "").replace("\t", " ")
	output.append(columns)

output = json.dumps(output)
output = "chrBands = " + output + ";"

open(output_file, "w").write(output)