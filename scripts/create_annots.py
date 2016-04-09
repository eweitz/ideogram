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

import json, random

annots = []

chrs = [
	"1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
	"11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
	"21", "22", "X", "Y"
]

lengths_GRCh38 = {
	"1": 248956422, "2": 242193529, "3": 198295559,
	"4": 190214555, "5": 181538259, "6": 170805979,
	"7": 159345973, "8": 145138636, "9": 138394717,
	"10": 133797422, "11": 135086622, "12": 133275309,
	"13": 114364328, "14": 107043718, "15": 101991189,
	"16": 90338345,	"17": 83257441, "18": 80373285,
	"19": 58617616, "20": 64444167, "21": 46709983,
	"22": 50818468, "X": 156040895, "Y": 57227415
}

lengths_GRCh37 = {
	"1": 249250621, "2": 243199373, "3": 198022430,
	"4": 191154276, "5": 180915260, "6": 171115067,
	"7": 159138663, "8": 146364022, "9": 141213431,
	"10": 135534747, "11": 135006516, "12": 133851895,
	"13": 115169878, "14": 107349540, "15": 102531392,
	"16": 90354753, "17": 81195210, "18": 78077248,
	"19": 59128983, "20": 63025520, "21": 48129895,
	"22": 51304566, "X": 155270560, "Y": 59373566
}

for chr in chrs:
	annots.append({"chr": chr, "annots": []});

n = 100

i = 0
while i < n:
	j = str(i + 1)
	chr = i % 24

	start = int((i * lengths_GRCh38[chrs[chr]])/1000 + 1)
	length = 0

	annot = [
		"rs" + j,
		start,
		length,
		random.randrange(0, 5)
	]

	annots[chr]["annots"].append(annot)

	i += 1

top_annots = {}
top_annots["keys"] = ["name", "start", "length", "trackIndex"]
top_annots["annots"] = annots
annots = json.dumps(top_annots)

open("data/annotations/" + str(n) + "_virtual_snvs.json", "w").write(annots)
