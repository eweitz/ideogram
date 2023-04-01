"""Convert Ensembl BioMart files to TSVs for Ideogram.js gene synonym caches
"""

import argparse
import codecs
import csv
import gzip
import os
import re
import sys
import urllib.request
from urllib.parse import quote

# Enable importing local modules when directly calling as script
if __name__ == "__main__":
    cur_dir = os.path.join(os.path.dirname(__file__))
    sys.path.append(cur_dir + "/..")

from lib import download

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

# metazoa = {
#     "Anopheles gambiae".AgamP4.51.gff3.gz  "
# }

def get_bmtsv_url(organism):
    """Get URL to BioMart TSV (BMTSV) file
    """
    # E.g. "Homo sapiens" -> "hsapiens"
    split_org = organism.split()
    brief_org = (split_org[0][0] + split_org[1]).lower()

    query = quote((
       '<Query formatter="TSV" header="0" uniqueRows="0" count="" datasetConfigVersion="0.6">' +
            '<Dataset name="' + brief_org + '_gene_ensembl" interface="default">' +
                '<Attribute name="external_gene_name" />' +
                '<Attribute name="external_synonym" />' +
            '</Dataset>' +
        '</Query>'
    ).encode("utf-8"))
    url = f"https://www.ensembl.org/biomart/martservice?query={query}"
    return url

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
        key=lambda x: ranks.index(x[0]) if x[0] in ranks else 1E10,
    )

    return sorted_genes


class SynonymCache():
    """Convert BioMart TSV files to minimal TSVs
    """

    def __init__(self, output_dir="data/", reuse_bmtsv=False):
        self.output_dir = output_dir
        self.tmp_dir = "data/"
        self.reuse_bmtsv = reuse_bmtsv

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
        org_lch = organism.lower().replace(" ", "-") # LowerCase & Hyphen
        bmtsv_path = bmtsv_dir + org_lch + "-synonyms.tsv"
        try:
            download(url, bmtsv_path, cache=self.reuse_bmtsv)
        except urllib.error.HTTPError:
            # E.g. for C. elegans
            url = url.replace("chr.", "")
            download(url, bmtsv_path, cache=self.reuse_bmtsv)
        return [bmtsv_path, url]

    def parse_synonyms(self, bmtsv_path):
        synonyms_by_gene = {}
        with open(bmtsv_path) as file:
            reader = csv.reader(file, delimiter="\t")
            i = 0
            for row in reader:
                i = i + 1
                if i == 1:
                    continue
                [gene, synonym] = row
                if synonym == '':
                    continue
                # print(gene, synonym)
                if gene in synonyms_by_gene:
                    synonyms_by_gene[gene].append(synonym)
                else:
                    synonyms_by_gene[gene] = [synonym]
        # print('synonyms_by_gene')
        # print(synonyms_by_gene)

        unique_synonyms_by_gene = {}
        for gene in synonyms_by_gene:
            unique_synonyms = list(set(synonyms_by_gene[gene]))
            if len(unique_synonyms) > 0:
                unique_synonyms_by_gene[gene] = unique_synonyms
        synonyms_by_gene = unique_synonyms_by_gene

        synonyms = [[gene] + syns for (gene, syns) in synonyms_by_gene.items()]
        return synonyms

    def fetch_synonyms(self, organism):
        [bmtsv_path, bmtsv_url] = self.fetch_ensembl_biomart_tsv(organism)
        synonyms = self.parse_synonyms(bmtsv_path)
        return [synonyms, bmtsv_url]

    def write(self, synonyms, organism):
        """Save fetched and transformed gene data to cache file
        """

        headers = (
            f"## Ideogram.js gene synonym cache for {organism}\n" +
            f"# symbol\tsynonyms\n"
        )
        lines = "\n".join(["\t".join(s) for s in synonyms])
        content = headers + lines

        org_lch = organism.lower().replace(" ", "-")
        output_path = f"{self.output_dir}{org_lch}-synonyms.tsv.gz"
        with gzip.open(output_path, "wt") as f:
            f.write(content)
        print(f"Wrote gene synonyms cache: {output_path}")

    def populate_by_org(self, organism):
        """Fill gene caches for a configured organism
        """
        [synonyms, bmtsv_url] = self.fetch_synonyms(organism)
        sorted_slim_genes = sort_by_interest(synonyms, organism)
        self.write(sorted_slim_genes, organism)

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
        "--reuse-bmtsv",
        help=(
            "Whether to use previously-downloaded raw GFFs"
        ),
        action="store_true"
    )
    args = parser.parse_args()
    output_dir = args.output_dir
    reuse_bmtsv = args.reuse_bmtsv

    SynonymCache(output_dir, reuse_bmtsv).populate()
