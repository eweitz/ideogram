"""Convert Ensembl GTF files to minimal TSVs for Ideogram.js gene caches

Ideogram uses cached gene data to drastically simplify and speed up rendering.

"""

import argparse
import csv
import os
import re
import sys
import urllib.request

# Enable importing local modules when directly calling as script
if __name__ == "__main__":
    cur_dir = os.path.join(os.path.dirname(__file__))
    sys.path.append(cur_dir + "/..")

from lib import download_gzip

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
    "Caenorhabditis elegans": "WBcel235"
}

# metazoa = {
#     "Anopheles gambiae".AgamP4.51.chr.gtf.gz  "
# }

def get_gtf_url(organism):
    """Get URL to GTF file
    E.g. https://ftp.ensembl.org/pub/release-102/gtf/homo_sapiens/Homo_sapiens.GRCh38.102.chr.gtf.gz
    """
    release = "102"
    base = f"https://ftp.ensembl.org/pub/release-{release}/gtf/"
    asm = assemblies_by_org[organism]
    org_us = organism.replace(" ", "_")
    org_lcus = org_us.lower()

    url = f"{base}{org_lcus}/{org_us}.{asm}.{release}.chr.gtf.gz"
    return url

def parse_gtf_info_field(info):
    """Parse a GTF "INFO" field into a dictionary
    Example INFO field:
    gene_id "ENSMUSG00000102628"; gene_version "2"; gene_name "Gm37671"; gene_source "havana"; gene_biotype "TEC";
    """
    fields = [f.strip() for f in info.split(';')][:-1]
    kvs = [f.split(" ") for f in fields]
    info_dict = {}
    for kv in kvs:
        info_dict[kv[0]] = kv[1].strip('"')
    return info_dict

def detect_prefix(id):
    """Find the prefix of a feature ID

    Feature IDs in a given GTF file have a constant "prefix".
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

def parse_gene(gtf_row):
    """Parse gene from CSV-reader-split row of GTF file"""

    if gtf_row[0][0] == "#":
        # Skip header
        return None

    chr = gtf_row[0]
    feat_type = gtf_row[2]
    if feat_type != "gene":
        return None

    start = gtf_row[3]
    stop = gtf_row[4]
    info = gtf_row[8]
    # print("info", info)
    info_dict = parse_gtf_info_field(info)
    id = info_dict["gene_id"]
    symbol = info_dict.get("gene_name")
    if symbol is None:
        return None

    return [chr, start, stop, id, symbol]

def trim_gtf(gtf_path):
    """Parse GTF into a list of compact genes
    """
    print(f"Parsing GTF: {gtf_path}")
    slim_genes = []
    prefix = None

    with open(gtf_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            parsed_gene = parse_gene(row)

            if parsed_gene == None:
                continue

            [chr, start, stop, id, symbol] = parsed_gene
            length = str(int(stop) - int(start))

            if prefix == None:
                prefix = detect_prefix(id)
            slim_id = trim_id(id, prefix)

            slim_genes.append([chr, start, length, slim_id, symbol])

    return [slim_genes, prefix]


class GeneCache():
    """Convert Ensembl GTF files to minimal TSVs for Ideogram.js gene caches
    """

    def __init__(self, output_dir="data/", reuse_gtf=False):
        self.output_dir = output_dir
        self.tmp_dir = "data/"
        self.reuse_gtf = reuse_gtf

        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        if not os.path.exists(self.tmp_dir):
            os.makedirs(self.tmp_dir)

    def fetch_ensembl_gtf(self, organism):
        """Download and decompress an organism's GTF file from Ensembl
        """
        print(f"Fetching Ensembl GTF for {organism}")
        url = get_gtf_url(organism)
        gtf_dir = self.tmp_dir + "gtf/"
        if not os.path.exists(gtf_dir):
            os.makedirs(gtf_dir)
        gtf_path = gtf_dir + url.split("/")[-1]
        try:
            download_gzip(url, gtf_path, cache=self.reuse_gtf)
        except urllib.error.HTTPError:
            # E.g. for C. elegans
            url = url.replace("chr.", "")
            download_gzip(url, gtf_path, cache=self.reuse_gtf)
        return [gtf_path, url]

    def write(self, genes, organism, prefix, gtf_url):
        """Save fetched and transformed gene data to cache file
        """
        headers = (
            f"## Ideogram.js gene cache for {organism}\n" +
            f"## Derived from {gtf_url}\n"
            f"## prefix: {prefix}\n"
            f"# chr\tstart\tlength\tslim_id\tsymbol\n"
        )
        gene_lines = "\n".join(["\t".join(g) for g in genes])
        content = headers + gene_lines

        org_lch = organism.lower().replace(" ", "-")
        output_path = f"{self.output_dir}{org_lch}-genes.tsv"
        with open(output_path, "w") as f:
            f.write(content)
        print(f"Wrote gene cache: {output_path}")

    def populate_by_org(self, organism):
        """Fill gene caches for a configured organism
        """
        [gtf_path, gtf_url] = self.fetch_ensembl_gtf(organism)
        [slim_genes, prefix] = trim_gtf(gtf_path)
        self.write(slim_genes, organism, prefix, gtf_url)

    def populate(self):
        """Fill gene caches for all configured organisms

        Consider parallelizing this.
        """
        for organism in assemblies_by_org:
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
        "--reuse-gtf",
        help=(
            "Whether to use previously-downloaded raw GTFs"
        ),
        action="store_true"
    )
    args = parser.parse_args()
    output_dir = args.output_dir
    reuse_gtf = args.reuse_gtf

    GeneCache(output_dir, reuse_gtf).populate()
