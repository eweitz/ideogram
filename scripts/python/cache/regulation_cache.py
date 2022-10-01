"""Convert Ensembl BMTSV files to minimal TSVs for Ideogram.js caches

Ideogram uses cached genomic data to make render faster and more robust.
"""

import argparse
import csv
import gzip
import os
import sys
import urllib.request
import re
from urllib.parse import quote

# Enable importing local modules when directly calling as script
if __name__ == "__main__":
    cur_dir = os.path.join(os.path.dirname(__file__))
    sys.path.append(cur_dir + "/..")

from lib import download
from gene_cache import trim_id, detect_prefix, fetch_gff, parse_gff_info_field, fetch_interesting_genes

def natural_sort(l):
    """From https://stackoverflow.com/a/4836734
    """
    convert = lambda text: int(text) if text.isdigit() else text.lower()
    alphanum_key = lambda key: [convert(c) for c in re.split('([0-9]+)', key)]
    return sorted(l, key=alphanum_key)

# Organisms configured for gene caching, and their genome assembly names
assemblies_by_org = {
    "Homo sapiens": "GRCh38",
    "Mus musculus": "GRCm38",
    "Danio rerio": "GRCz11",
    "Gallus gallus": "GRCg6a",
    "Rattus norvegicus": "Rnor_6.0",
    "Pan troglodytes": "Pan_tro_3.0",
    "Macaca fascicularis": "Macaca_fascicularis_5.0",
    "Macaca mulatta": "Mmul_10",
    "Canis lupus familiaris": "CanFam3.1",
    "Felis catus": "Felis_catus_9.0",
    "Equus caballus": "EquCab3.0",
    "Bos taurus": "ARS-UCD1.2",
    "Sus scrofa": "Sscrofa11.1",
    # "Anopheles gambiae": "AgamP4.51",
    "Caenorhabditis elegans": "WBcel235",
    "Drosophila melanogaster": "BDGP6.28"
}

ranked_genes_by_organism = {
    "Homo sapiens": "gene-hints.tsv",
    "Mus musculus": "pubmed-citations.tsv",
    "Rattus norvegicus": "pubmed-citations.tsv",
    "Canis lupus familiaris": "pubmed-citations.tsv",
    "Felis catus": "pubmed-citations.tsv",
}

biotypes = {}

# metazoa = {
#     "Anopheles gambiae".AgamP4.51.bmtsv.gz  "
# }


def parse_feature(row):
    """Return parsed regulatory feature"""
    feat_type = row[3]

    feature_types = [
        "Enhancer", "TF binding", "CTCF Binding Site",
        "Open chromatin", "Promoter"
    ]
    if feat_type not in feature_types:
        print(feat_type)
        return None

    chr = row[0]

    if (chr[0:2] in ['KI', 'GL']):
        return None

    start = row[1]
    stop = row[2]
    length = str(int(stop) - int(start))

    feat_index = str(feature_types.index(feat_type))

    feature = [feat_index, chr, start, length]

    return feature

def parse_bmtsv(bmtsv_path):
    """Parse BMTSV into a set of Ensembl canonical transcript IDs
    """
    print(f"Parsing BMTSV: {bmtsv_path}")
    transcript_ids = []

    with open(bmtsv_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            id = row[0]
            transcript_ids.append(id)

    return set(transcript_ids)

def get_length(start, stop):
    length = str(int(stop) - int(start))
    return length

def compress_biotype(biotype, biotype_map):
    if biotype:
        return biotype_map[biotype]
    else:
        last = sort(list(biotype_map.values()))[-1]
        new_last = last + 1


subpart_map = {
    'five_prime_UTR': '0',
    'exon': '1',
    'three_prime_UTR': '2',
}
def parse_transcript_subpart(raw_subpart, mrna_start):
    # transcript_id, feat_type, chr, start, stop, exon_id, constitutive, ensembl_phase, rank
    # ENST00000641515 exon    1       65419   65433   ENSE00003812156 0       -1      1

    subpart_type_compressed = ""
    subpart_type = raw_subpart[1]
    if subpart_type in subpart_map:
        subpart_type_compressed = subpart_map[subpart_type]
    else:
        print('subpart_type: ', subpart_type)

    # Use mRNA-relative start coordinate
    start = get_length(mrna_start, raw_subpart[3])

    # Length of this exon
    length = get_length(raw_subpart[3], raw_subpart[4])

    return [subpart_type_compressed, start, length]

def parse_mrna(raw_mrna, biotypes_list):
    # transcript_id, feat_type, chr, start, stop, strand, name, gene_id, biotype, transcript_support_level
    # ENST00000616016 mRNA    1       925741  944581  SAMD11-210      ENSG00000187634 protein_coding  5
    transcript_id = raw_mrna[0]

    chr = raw_mrna[2]
    start = raw_mrna[3]
    stop = raw_mrna[4]
    length = get_length(start, stop)

    strand = raw_mrna[5]

    name = raw_mrna[6]
    # gene_id = raw_mrna[7]
    biotype_compressed = str(biotypes_list.index(raw_mrna[8]))

    # return [transcript_id, chr, start, length, name, gene_id, biotype]
    return [[name, biotype_compressed, strand], start]

def parse_features(bmtsv_path):
    """Parse regulatory features
    """

    features = []
    i = 0
    with open(bmtsv_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            i += 1

            if row[0][0] == "#":
                # Skip header
                continue

            feature = parse_feature(row)

            if (i % 10000 == 0):
                print(f"On entry {i}")
                print(feature)

            if feature != None:
                features.append(feature)

    sorted_feats = sorted(
        features,
        key=lambda f: (natural_sort(f[1]), int(f[2]))
    )
    # chrs = natural_sort(list(bands_by_chr.keys()))

    return sorted_feats

def sort_structures(structures, organism):
    ranks = fetch_interesting_genes(organism)
    print('ranks[0:10]')
    print(ranks[0:10])
    print('structures[0:10]')
    print(structures[0:10])
    sorted_structures = []

    structures_with_genes = []
    for structure in structures:
        # E.g. FOO-BAR-404 -> FOO-BAR
        gene = "".join(structure[0].split('-')[:-1])
        structures_with_genes.append([gene] + structure)

    # Sort genes by interest rank, and put unranked genes last
    sorted_structures_with_genes = sorted(
        structures_with_genes,
        key=lambda x: ranks.index(x[0]) if x[0] in ranks else 1E10,
    )

    sorted_structures = []
    for structure in sorted_structures_with_genes:
        sorted_structures.append(structure[1:])

    print('sorted_structures[0:10]')
    print(sorted_structures[0:10])

    return sorted_structures



class RegulationCache():
    """Convert Ensembl BioMart TSVs to compact TSVs for Ideogram.js caches
    """

    def __init__(self, output_dir="data/", reuse_bmtsv=False):
        self.output_dir = output_dir
        self.tmp_dir = "data/"
        self.reuse_bmtsv = reuse_bmtsv

        self.biotype_map = []

        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        if not os.path.exists(self.tmp_dir):
            os.makedirs(self.tmp_dir)

    def fetch_ensembl_biomart_tsv(self, organism):
        """Download an organism's TSV file from Ensembl BioMart
        """
        print(f"Fetching Ensembl BioMart TSV for {organism}")
        url = get_bmtsv_url(organism)
        bmtsv_dir = self.tmp_dir + "bmtsv/"
        if not os.path.exists(bmtsv_dir):
            os.makedirs(bmtsv_dir)
        org_lch = organism.lower().replace(" ", "-")
        bmtsv_path = bmtsv_dir + org_lch + "-transcripts.tsv"
        try:
            download(url, bmtsv_path, cache=self.reuse_bmtsv)
        except urllib.error.HTTPError:
            # E.g. for C. elegans
            url = url.replace("chr.", "")
            download(url, bmtsv_path, cache=self.reuse_bmtsv)
        return [bmtsv_path, url]

    def write(self, features, organism):
        """Save fetched and transformed gene data to cache file
        """
        # biotypes_list = list(biotypes.keys())
        # biotype_keys = ", ".join([
        #     f"{str(i)} = {key}" for i, key in enumerate(biotypes_list)
        # ])

        headers = "\n".join([
            f"## Ideogram.js regulation cache for {organism}",
            # f"## Derived from: {gff_url}",
            # f"## Filtered to only canonical transcripts using Ensembl BioMart: {bmtsv_url}",
            # f"## features: <subpart_compressed>;<start (transcript-relative)>;<end (transcript-relative)>",
            # f"## biotype keys: {biotype_keys}",
            # f"## subpart keys: 0 = 5'-UTR, 1 = exon, 2 = 3'-UTR",
            # f"# transcript_name\tbiotype_compressed\t\tstrand\tfeatures"
        ]) + "\n"

        print('features[0:3]')
        print(features[0:3] )
        features_lines = "\n".join(["\t".join(s) for s in features])
        content = headers + features_lines

        org_lch = organism.lower().replace(" ", "-")
        output_path = f"{self.output_dir}{org_lch}-regulation.tsv.gz"
        with gzip.open(output_path, "wt") as f:
            f.write(content)
        print(f"Wrote regulation cache: {output_path}")

    def populate_by_org(self, organism):
        """Fill gene caches for a configured organism
        """
        # [slim_transcripts, prefix] = self.fetch_slim_transcripts(organism)
        # [canonical_ids, bmtsv_url] = self.fetch_transcript_ids(organism)
        bmtsv_path = '/Users/eric/Downloads/ensembl_regulatory_build_GRCh38p13_107_biomart.tsv'
        features = parse_features(bmtsv_path)

        # sorted_structures = sort_structures(structures, organism)

        # sorted_slim_genes = sort_by_interest(slim_genes, organism)
        self.write(features, organism)

    def populate(self):
        """Fill gene caches for all configured organisms

        Consider parallelizing this.
        """
        # for organism in assemblies_by_org:
        for organism in ["Homo sapiens"]:
            self.populate_by_org(organism)

# Command-line handler
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--output-dir",
        help=(
            "Directory to put outcome data.  (default: %(default))"
        ),
        default="data/"
    )
    parser.add_argument(
        "--reuse-bmtsv",
        help=(
            "Whether to use previously-downloaded raw BMTSVs"
        ),
        action="store_true"
    )
    args = parser.parse_args()
    output_dir = args.output_dir
    reuse_bmtsv = args.reuse_bmtsv

    RegulationCache(output_dir, reuse_bmtsv).populate()
