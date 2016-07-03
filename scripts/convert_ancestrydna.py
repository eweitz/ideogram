import json, re

file = open("data/annotations/clinvar_20160531.vcf").readlines()

rsids = {}

clinsig_re = re.compile("CLNSIG=(\d+)")
gene_re = re.compile("GENEINFO=(\w+)")

for line in file:
    if line[0] == "#":
        continue

    columns = line.strip().split("\t")
    info = columns[7]

    #print(len(info))

    rsid = columns[2]
    clinsig = int(clinsig_re.search(info).group(1))

    gene_group = gene_re.search(info)
    if gene_group:
        gene = gene_group.group(1)
    else:
        gene = ""

    rsids[rsid] = {
        "ref": columns[3],
        "alt": columns[4],
        "clinsig": clinsig,
        "gene": gene
        #"clinrevstat": info[25]
    }

print(len(rsids))
#print(rsids)

file_name = "data/annotations/AncestryDNA.txt"

file =  open(file_name).readlines()

annots = []
clin_annots = []

allele_map = {
    "A": 0,
    "T": 1,
    "C": 2,
    "G": 3,
    "0": 4
}

seen_chrs = {}
seen_chrs_clin_annots = {}

clinical_alleles = []

for line in file:

    if line[0] == "#" or line[:4] == "rsid":
        continue

    columns = line.strip().split("\t")

    name = columns[0] # rsid
    chr_index = int(columns[1])
    chr = str(chr_index) # chromosome
    start = int(columns[2]) # position
    length = 1 # they're all single nucleotide variants
    allele1 = columns[3]
    allele2 = columns[4]

    if chr == "23":
    	chr = "X"
    elif chr == "24":
    	chr = "Y"
    elif chr == "25":
        continue # TODO: mitochondrial DNA!

    homozygous = 0
    if (allele1 == allele2):
        homozygous = 1

    if name in rsids and rsids[name]["alt"] in set((allele1, allele2)):
        #print("clinical: " + name)
        # TODO: Hom vs. het clinsig
        clinsig = rsids[name]["clinsig"]
        if clinsig in set((4,5)):
            clinical_alleles.append(
                name + " "
                "chr" + chr + ":" + str(start) + " " +
                rsids[name]["gene"]
            )
            if homozygous == 1 and clinsig == 5:
                print("Homozygous pathogenic: " + name)
        if clinsig in set((1,2,3,4,5)):
            #clinsig -= 1
            clin_annot = [name, start, length, clinsig]
            if chr in seen_chrs_clin_annots:
                clin_annots[chr_index - 1]["annots"].append(clin_annot)
            else:
                clin_annots.append({"chr": chr, "annots": [clin_annot]})
                seen_chrs_clin_annots[chr] = 1
    else:
        clinsig = -1 # Not in ClinVar

    allele1 = allele_map[allele1]
    allele2 = allele_map[allele2]

    annot = [
        name,
        start,
        length,
        homozygous,
        allele1,
        allele2,
        clinsig
    ]

    if chr in seen_chrs:
        annots[chr_index - 1]["annots"].append(annot)
    else:
        annots.append({"chr": chr, "annots": [annot]})
        seen_chrs[chr] = 1

top_annots = {}
top_annots["keys"] = [
    "name", "start", "length", "homozygous", "allele1", "allele2", "clinsig"
]
top_annots["annots"] = annots
annots = json.dumps(top_annots)
open("data/annotations/ancestrydna.json", "w").write(annots)

top_annots = {}
top_annots["keys"] = [
    "name", "start", "length", "trackIndex"
]
top_annots["annots"] = clin_annots
annots = json.dumps(top_annots)
open("data/annotations/ancestrydna_tracks.json", "w").write(annots)

for rs in clinical_alleles:
    print(rs)
print("Pathogenic or likely pathogenic alleles: " + str(len(clinical_alleles)))
