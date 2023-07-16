"""Convert Ensembl GFF files to minimal TSVs for Ideogram.js gene caches

Ideogram uses cached gene data to drastically simplify and speed up rendering.

"""

import argparse
import codecs
import csv
import gzip
import os
import re
import sys
import urllib.request

# Enable importing local modules when directly calling as script
if __name__ == "__main__":
    cur_dir = os.path.join(os.path.dirname(__file__))
    sys.path.append(cur_dir + "/..")

from lib import download_gzip

def fetch_gff(organism, output_dir="data/", reuse_gff=True):
    gcache = GeneCache(output_dir, reuse_gff)
    [gff_path, gff_url] = gcache.fetch_ensembl_gff(organism)
    return [gff_path, gff_url]

# Organisms configured for gene caching, and their genome assembly names
assemblies_by_org = {
    "Homo sapiens": "GRCh38",
    "Mus musculus": "GRCm39",
    "Danio rerio": "GRCz11",
    "Gallus gallus": "bGalGal1.mat.broiler.GRCg7b",
    "Rattus norvegicus": "mRatBN7.2",
    "Pan troglodytes": "Pan_tro_3.0",
    "Macaca fascicularis": "Macaca_fascicularis_6.0",
    "Macaca mulatta": "Mmul_10",
    "Canis lupus familiaris": "ROS_Cfam_1.0",
    "Felis catus": "Felis_catus_9.0",
    "Equus caballus": "EquCab3.0",
    "Bos taurus": "ARS-UCD1.2",
    "Sus scrofa": "Sscrofa11.1",
    # "Anopheles gambiae": "AgamP4.51",
    "Caenorhabditis elegans": "WBcel235",
    "Drosophila melanogaster": "BDGP6.32"
}

ranked_genes_by_organism = {
    "Homo sapiens": "gene-hints.tsv",
    "Mus musculus": "pubmed-citations.tsv",
    "Rattus norvegicus": "pubmed-citations.tsv",
    "Canis lupus familiaris": "pubmed-citations.tsv",
    "Felis catus": "pubmed-citations.tsv",
}

# metazoa = {
#     "Anopheles gambiae".AgamP4.51.gff3.gz  "
# }

def get_gff_url(organism):
    """Get URL to GFF file
    E.g. https://ftp.ensembl.org/pub/release-102/gff3/homo_sapiens/Homo_sapiens.GRCh38.102.gff3.gz
    """
    release = "109"
    base = f"https://ftp.ensembl.org/pub/release-{release}/gff3/"
    asm = assemblies_by_org[organism]
    org_us = organism.replace(" ", "_")
    org_lcus = org_us.lower()

    url = f"{base}{org_lcus}/{org_us}.{asm}.{release}.gff3.gz"
    return url

def parse_gff_info_field(info):
    """Parse a GFF "INFO" field into a dictionary
    Example INFO field:
    gene_id "ENSMUSG00000102628"; gene_version "2"; gene_name "Gm37671"; gene_source "havana"; gene_biotype "TEC";
    """
    fields = [f.strip() for f in info.split(';')]
    kvs = [f.split("=") for f in fields]
    info_dict = {}
    for kv in kvs:
        info_dict[kv[0]] = kv[1].strip('"')
    return info_dict

def detect_prefix(id):
    """Find the prefix of a feature ID

    Feature IDs in a given GFF file have a constant "prefix".
    E.g. ID ENSMUSG00000102628 has prefix ENSMUSG
    """
    prefix = re.match(r"[A-Za-z]+", id).group()
    return prefix

def trim_id(id, prefix):
    """Remove insignificant characters from the feature ID

    If we know the species in a downstream context, in an ID like
    "ENSMUSG00000102628", we can infer everything except the "102628".

    So we trim the ID to only those significant characters, which yields
    a smaller gene cache file that is faster to transfer.
    """
    insignificant = re.search(prefix + r"0+", id).group()
    slim_id = id.replace(insignificant, "")
    return slim_id

def parse_gene(gff_row):
    """Parse gene from CSV-reader-split row of GFF file"""

    if gff_row[0][0] == "#":
        # Skip header
        return None

    chr = gff_row[0]
    feat_type = gff_row[2]

    # feature types that are modeled as genes in Ensembl, i.e.
    # that have an Ensembl accession beginning ENSG in human
    loose_gene_types = [
        "gene", "miRNA", "ncRNA", "ncRNA_gene", "rRNA",
        "scRNA", "snRNA", "snoRNA", "tRNA"
    ]
    if feat_type not in loose_gene_types:
        return None

    start = gff_row[3]
    stop = gff_row[4]
    info = gff_row[8]
    # print("info", info)
    info_dict = parse_gff_info_field(info)

    # For GTF
    # id = info_dict["gene_id"]
    # symbol = info_dict.get("gene_name")

    # For GFF

    if "gene_id" not in info_dict:
        return None
    id = info_dict["gene_id"]
    symbol = info_dict.get("Name")

    # Change e.g.:
    # description=transmembrane protein 88B [Source:HGNC Symbol%3BAcc:HGNC:37099]
    # to
    # transmembrane protein 88B
    description = info_dict.get("description", "")
    description = description.split(" [")[0]

    if symbol is None:
        return None

    return [chr, start, stop, id, symbol, description]

def trim_gff(gff_path):
    """Parse GFF into a list of compact genes
    """
    print(f"Parsing GFF: {gff_path}")
    slim_genes = []
    prefix = None

    with open(gff_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            parsed_gene = parse_gene(row)

            if parsed_gene == None:
                continue

            [chr, start, stop, id, symbol, desc] = parsed_gene
            length = str(int(stop) - int(start))

            if prefix == None:
                prefix = detect_prefix(id)
            slim_id = trim_id(id, prefix)

            slim_genes.append([chr, start, length, slim_id, symbol, desc])

    return [slim_genes, prefix]

def fetch_interesting_genes(organism):
    """Request interest-ranked gene data from Gene Hints"""
    interesting_genes = []

    if organism not in ranked_genes_by_organism:
        return None
    base_url = \
        "https://raw.githubusercontent.com/" +\
        "broadinstitute/gene-hints/main/data/"
    org_lch = organism.replace(" ", "-").lower()
    interesting_file = ranked_genes_by_organism[organism]
    url = f"{base_url}{org_lch}-{interesting_file}"
    print('url', url)
    response = urllib.request.urlopen(url)

    # Stream process the response instead of loading it entirely in memory.
    # This is faster than that naive approach.
    # Adapted from https://stackoverflow.com/a/18897408/10564415
    reader = csv.reader(codecs.iterdecode(response, 'utf-8'), delimiter="\t")
    for row in reader:
        if row[0][0] == "#" or len(row) == 0:
            continue
        interesting_genes.append(row[0])

    return interesting_genes

def sort_by_interest(slim_genes, organism):
    """Sort gene data by general interest or scholarly interest

    This uses data from the Gene Hints pipeline:
    https://github.com/broadinstitute/gene-hints

    Human genes are ranked by Wikipedia page views, and non-human genes are
    ranked by PubMed citations.  Sorting genes by interest gives a decent way
    to determine which genes are most important to show, in cases where showing
    many genes would be overwhelming.
    """
    ranks = fetch_interesting_genes(organism)
    # print('ranks[:20]')
    # print(ranks[:20])
    # print('slim_genes[:20]')
    # print(slim_genes[:20])
    if ranks is None:
        return slim_genes

    # Sort genes by interest rank, and put unranked genes last
    sorted_genes = sorted(
        slim_genes,
        key=lambda x: ranks.index(x[4]) if x[4] in ranks else 1E10,
    )

    return sorted_genes


class GeneCache():
    """Convert Ensembl GFF files to minimal TSVs for Ideogram.js gene caches
    """

    def __init__(self, output_dir="data/", reuse_gff=False):
        self.output_dir = output_dir
        self.tmp_dir = "data/"
        self.reuse_gff = reuse_gff

        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        if not os.path.exists(self.tmp_dir):
            os.makedirs(self.tmp_dir)

    def fetch_ensembl_gff(self, organism):
        """Download and decompress an organism's GFF file from Ensembl
        """
        print(f"Fetching Ensembl GFF for {organism}")
        url = get_gff_url(organism)
        gff_dir = self.tmp_dir + "gff3/"
        if not os.path.exists(gff_dir):
            os.makedirs(gff_dir)
        gff_path = gff_dir + url.split("/")[-1]
        try:
            download_gzip(url, gff_path, cache=self.reuse_gff)
        except urllib.error.HTTPError:
            # E.g. for C. elegans
            url = url.replace("chr.", "")
            download_gzip(url, gff_path, cache=self.reuse_gff)
        return [gff_path, url]

    def write(self, genes, organism, prefix, gff_url):
        """Save fetched and transformed gene data to cache file
        """
        headers = (
            f"## Ideogram.js gene cache for {organism}\n" +
            f"## Derived from {gff_url}\n"
            f"## prefix: {prefix}\n"
            f"# chr\tstart\tlength\tslim_id\tsymbol\tdescription\n"
        )
        gene_lines = "\n".join(["\t".join(g) for g in genes])
        content = headers + gene_lines

        org_lch = organism.lower().replace(" ", "-")
        output_path = f"{self.output_dir}{org_lch}-genes.tsv.gz"
        with gzip.open(output_path, "wt") as f:
            f.write(content)
        print(f"Wrote gene cache: {output_path}")

    def populate_by_org(self, organism):
        """Fill gene caches for a configured organism
        """
        [gff_path, gff_url] = self.fetch_ensembl_gff(organism)
        [slim_genes, prefix] = trim_gff(gff_path)
        sorted_slim_genes = sort_by_interest(slim_genes, organism)
        self.write(sorted_slim_genes, organism, prefix, gff_url)

    def populate(self):
        """Fill gene caches for all configured organisms

        Consider parallelizing this.
        """
        for organism in assemblies_by_org:
        # for organism in ["Homo sapiens"]:
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
        "--reuse-gff",
        help=(
            "Whether to use previously-downloaded raw GFFs"
        ),
        action="store_true"
    )
    args = parser.parse_args()
    output_dir = args.output_dir
    reuse_gff = args.reuse_gff

    GeneCache(output_dir, reuse_gff).populate()
