''' Creates simulated genome annotation data

Data is currently simulated single-nucleotide variations (SNVs).

TODO: 
- Add handling for non-human organisms
- Enhance with more data than simply position, e.g.:
	- Variant type (use Sequence Ontology ID)
	- Molecular consequence (use SO ID)
	- Clinical significance
	- Transcript accession
	- HGVS expression
'''

import json

annots = []

chrs = [
	"1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
	"11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
	"21", "22", "X", "Y"
]

for chr in chrs:
	annots.append({"chr": chr, "annots": []});

i = 0
while i < 10000:
	j = str(i + 1)
	chr = (i % 24)
	
	annot = [
		"rs" + j,
		1000 * i + 1,
		1000 * i + 1
	]

	annots[chr]["annots"].append(annot)
	
	i += 1

annots = json.dumps(annots)
annots = '{"annots":' + annots + '}'

open("10000_virtual_snvs.json", "w").write(annots)
