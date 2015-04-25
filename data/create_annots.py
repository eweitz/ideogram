''' Creates simulated genome annotation data

Data is currently simulated single-nucleotide variations (SNVs).

Output files:
	1000_virtual_snvs.json
	10000_virtual_snvs.json

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

i = 0
while i < 10000:
	j = str(i + 1)
	k = str((i % 24) + 1)
	if k == "23":
		k = "X"
	elif k == "24":
		k = "Y"
	annot = [
		"rs" + j,
		k,
		1000 * i + 1,
		1000 * i + 1
	]
	annots.append(annot)
	i += 1

annots2 = list(annots)[:1000]

annots = json.dumps(annots)
annots = '{"annots":' + annots + '}'

open("10000_virtual_snvs.json", "w").write(annots)

annots2 = json.dumps(annots2)
annots2 = '{"annots":' + annots2 + '}'

open("1000_virtual_snvs.json", "w").write(annots2)