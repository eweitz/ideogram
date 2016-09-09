import json, re

# Example ftp://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh37/archive/2016/clinvar_20160802.vcf.gz
clinvar_vcf_file = open("data/annotations/clinvar_20160831.vcf").readlines()

rsids = {}

clinallele_re = re.compile("CLNALLE=(-?\d+)")
disease_re = re.compile("CLNDBN=([^;]*)")
clinsig_re = re.compile("CLNSIG=([^;]*)")
gene_re = re.compile("GENEINFO=(\w+)")

num_skipped_clinvars = 0

# Column headers:
# #CHROM  POS     ID      REF     ALT     QUAL    FILTER  INFO
#
# Example VCF data line from clinvar_vcf_file:
# 1       169519049       rs6025  T       C       .       .       RS=6025;RSPOS=169519049;RV;dbSNPBuildID=52;SSR=0;SAO=1;VP=0x050168000a0504053f130101;GENEINFO=F5:2153;WGT=1;VC=SNV;PM;PMC;SLO;NSM;REF;ASP;VLD;HD;GNO;KGPhase1;KGPhase3;LSD;MTP;OM;CLNALLE=0,1;CLNHGVS=NC_000001.10:g.169519049T\x3d,NC_000001.10:g.169519049T>C;CLNSRC=OMIM_Allelic_Variant,PharmGKB_Clinical_Annotation|PharmGKB;CLNORIGIN=1,1;CLNSRCID=612309.0001,1183689558|1183689558;CLNSIG=5|255|255|255|5,6;CLNDSDB=MedGen|.|.|MedGen:OMIM:SNOMED_CT|MedGen:OMIM:ORPHA:SNOMED_CT,MedGen;CLNDSDBID=C2674152|.|.|C0000809:614389:102878001|C0015499:227400:326:4320005,CN236515;CLNDBN=Thrombophilia_due_to_factor_V_Leiden|Ischemic_stroke\x2c_susceptibility_to|Budd-Chiari_syndrome\x2c_susceptibility_to|Recurrent_abortion|Factor_V_deficiency,hormonal_contraceptives_for_systemic_use_response_-_Toxicity/ADR;CLNREVSTAT=no_criteria|no_criteria|no_criteria|no_criteria|single,exp;CLNACC=RCV000000674.2|RCV000000675.3|RCV000000676.2|RCV000023935.2|RCV000205002.3,RCV000211384.1;CAF=0.00599,0.994;COMMON=1
#
# See top of clinvar_vcf_file for description of inner INFO columns
for line in clinvar_vcf_file:

    # Skip header lines
    if line[0] == "#":
        continue

    columns = line.strip().split("\t")

    rsid = columns[2]

    info = columns[7]
    clinallele_indexes = clinallele_re.search(info).group(1).split(",")
    diseases = disease_re.search(info).group(1).split(",")
    clinsigs = clinsig_re.search(info).group(1).split(",")

    if clinallele_indexes[0] == "-1":
        num_skipped_clinvars += 1

    ref = columns[3] # Reference allele, e.g. "A"
    alt = columns[4].split(",") # Alternate allele(s), e.g. ["T","C"]
    alleles = alt
    alleles.insert(0, ref) # Ref + alts, e.g. ["A", "T", "C"]

    gene_group = gene_re.search(info)
    if gene_group:
        gene = gene_group.group(1)
    else:
        gene = ""

    clinalleles = []
    if len(clinallele_indexes) > 1:
        for i in clinallele_indexes:
            clinalleles.append(int(alleles[i]))
    else:
        clinalleles.append(alleles[int(clinallele_indexes[0])])

    tmp = []
    # Mapping cardinalities:
    # 1 RS ID : 1+ clinical alleles (one-to-many)
    # 1 allele : 1+ diseases (one-to-many)
    # 1 disease : 1 clinical significance (one-to-one)
    # In other words, each RS ID can have multiple alleles, and each allele
    # can be associated multiple one of more diseases,
    # each of which has one clinical significance
    for i, clinsig in enumerate(clinsigs):
        for j, cs in enumerate(clinsig.split("|")):
            d = diseases[i].split("|")[j]
            tmp.append([int(cs), d])
    clinsigs = tmp

    rsids[rsid] = {
        "clinalleles": clinalleles,
        "clinsigs": clinsigs,
        "gene": gene
        #"clinrevstat": info[25]
    }

print("Number of ClinVar variants:")
print(len(rsids))

file_name = "data/annotations/AncestryDNA.txt"

ancestry_dna_sample =  open(file_name).readlines()

annots = []
clin_annots = []

allele_map = {
    "A": 0,
    "T": 1,
    "C": 2,
    "G": 3,
    "0": 4,
    "I": 4, # indel / insertion
    "D": 4 # indel / deletion
}

seen_chrs = {}
seen_chrs_clin_annots = {}

clinical_alleles = []

for line in ancestry_dna_sample:

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
    elif chr == "25" or chr == "26":
        continue # TODO: mitochondrial DNA

    homozygous = 0
    if (allele1 == allele2):
        homozygous = 1

    if name not in rsids:
        continue

    clinalleles  = rsids[name]["clinalleles"]

    for i, clinallele in enumerate(clinalleles):
        if name in rsids and clinallele in set((allele1, allele2)):
            #print("clinical: " + name)
            # TODO: Hom vs. het clinsig
            cs_d = rsids[name]["clinsigs"][i]
            clinsig = cs_d[0]
            disease = cs_d[1]
            if clinsig in set((4,5)):
                clinical_alleles.append(
                    name + " "
                    "chr" + chr + ":" + str(start) + " " +
                    rsids[name]["gene"]
                )
                if homozygous == 1 and clinsig == 5:
                    print(
                        "Homozygous pathogenic: " + name + ", " +
                        "disease: " + disease
                    )
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

print("Number of skipped clinical variants:")
print(num_skipped_clinvars)

#for rs in clinical_alleles:
#    print(rs)
print("Pathogenic or likely pathogenic alleles: " + str(len(clinical_alleles)))
