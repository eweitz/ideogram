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

chr_bands = {}

input_file = "ncbi/ideogram_9606_GCF_000001305.14_850_V1"
output_file = "native/ideogram_9606_GCF_000001405.26_850.jsonp"
taxid = "9606"

rows = open(input_file, "r").readlines()[1:]
for row in rows:
	columns = row.replace("\n", "").split("\t")

	chr = columns[0]

	if chr not in chr_bands:
		chr_bands[chr] = []

	stain = columns[7]
	if columns[8]:
		# For e.g. acen and gvar, columns[8] (density) is undefined
		stain += columns[8]
    '''
	band = {
		"chr": columns[0],
		"bp": {
			"start": int(columns[5]),
			"stop": int(columns[6])
		},
		"iscn": {
			"start": int(columns[3]),
			"stop": int(columns[4])
		},
		"name": columns[1] + columns[2],
		"stain": stain,
		"taxid": taxid
	}
	'''

	band = [
		columns[0],
	]

	chr_bands[chr].append(band)

chr_bands = json.dumps(chr_bands)
chr_bands = "chrBands = " + chr_bands + ";"

open(output_file, "w").write(chr_bands)