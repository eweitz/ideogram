"""Convert Ensembl BMTSV files to minimal TSVs for Ideogram.js protein caches

Ideogram uses cached gene data to drastically simplify and speed up rendering.

Example call (including supplementary commands):
time python3 cache/protein_cache.py --output-dir ../../dist/data/cache/proteins/ --reuse-bmtsv; gzip -dkf ../../dist/data/cache/proteins/homo-sapiens-proteins.tsv.gz; tput bel
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
import json
import xml.etree.ElementTree as ET

# Some Pfam IDs in BioMart aren't in the UniProt export.
# The IDs are in UniProt website, and almost all have notes like " Imported from IPR001841",
# so seem valid nonetheless.  These IDs were manually mapped by going to e.g.
# https://www.ebi.ac.uk/interpro/entry/pfam/PF02210/
# and copying the feature's name to here.
manual_pfam_map = {
  "PF02210": "Laminin G domain", "PF12796": "Ankyrin repeats (3 copies)", "PF13181": "Tetratricopeptide repeat",
  "PF12937": "F-box-like", "PF13606": "Ankyrin repeat", 'PF07647': "SAM domain (Sterile alpha motif)",
  'PF13857': "Ankyrin repeats (many copies)", 'PF13833': "EF-hand domain pair", 'PF13499': 'EF-hand domain pair',
  'PF14634': 'zinc-RING finger domain', 'PF13855': 'Leucine rich repeat', 'PF13716': 'Divergent CRAL/TRIO domain',
  'PF17121': 'Zinc finger, C3HC4 type (RING finger)', 'PF13426': 'PAS domain', 'PF13516': 'Leucine Rich repeat',
  'PF16457': 'Pleckstrin homology domain', 'PF14604': 'Variant SH3 domain', 'PF07653': 'Variant SH3 domain',
  'PF16652': 'Pleckstrin homology domain', 'PF07648': 'Kazal-type serine protease inhibitor domain', 'PF19193': 'Tectonin domain',
  'PF12698': 'ABC-2 family transporter protein', 'PF13304': 'AAA domain, putative AbiEii toxin, Type IV TA system', 'PF13202': 'EF hand',
  'PF16746': 'BAR domain of APPL family', 'PF13405': 'EF-hand domain',
  'PF09011': 'HMG-box domain', 'PF13517': 'FG-GAP-like repeat', 'PF07716': 'Basic region leucine zipper',
  'PF16497': 'MHC-I family domain', 'PF13417': 'Glutathione S-transferase, N-terminal domain', 'PF13409': 'Glutathione S-transferase, N-terminal domain',
  'PF16367': 'RNA recognition motif', 'PF16866': 'PHD-finger', 'PF17123': 'RING-like zinc finger',
  'PF14719': 'Phosphotyrosine interaction domain (PTB/PID)', 'PF14497': 'Glutathione S-transferase, C-terminal domain', 'PF13885': 'Keratin, high sulfur B2 protein',
  'PF16363': 'GDP-mannose 4,6 dehydratase', 'PF13185': 'GAF domain', 'PF13176': 'Tetratricopeptide repeat',
  'PF13679': 'Methyltransferase domain', 'PF13638': 'PIN domain', 'PF13768': 'von Willebrand factor type A domain',
  'PF14523': 'Syntaxin-like protein', 'PF13847': 'Methyltransferase domain', 'PF13903': 'PMP-22/EMP/MP20/Claudin tight junction',
  'PF13537': 'Glutamine amidotransferase domain', 'PF06472': 'ABC transporter transmembrane region 2', 'PF01108': 'Tissue factor',
  'PF11789': 'Zinc-finger of the MIZ type in Nse subunit', 'PF13676': 'TIR domain', 'PF12706': 'Beta-lactamase superfamily domain',
  'PF16589': 'BRCT domain, a BRCA1 C-terminus domain', 'PF13905': 'Thioredoxin-like', 'PF15910': 'ICOS V-set domain',
  'PF13519': 'von Willebrand factor type A domain', 'PF05225': 'helix-turn-helix, Psq domain', 'PF13023': 'HD domain',
  'PF16661': 'Metallo-beta-lactamase superfamily domain', 'PF16045': 'LisH', 'PF13180': 'PDZ domain',
  'PF13392': 'HNH endonuclease', 'PF13673': 'Acetyltransferase (GNAT) domain', 'PF17172': 'Glutathione S-transferase N-terminal domain',
  'PF13897': 'Golgi-dynamics membrane-trafficking', 'PF12697': 'Alpha/beta hydrolase family', 'PF15966': 'F-box',
  'PF15965': 'TRAF-like zinc-finger', 'PF15985': 'KH domain', 'PF17135': 'Ribosomal protein 60S L18 and 50S L18e',
  'PF12738': 'twin BRCT domain', 'PF13041': 'PPR repeat family', 'PF13812': 'Pentatricopeptide repeat domain',
  'PF05826': 'Phospholipase A2', 'PF14622': 'Ribonuclease-III-like', 'PF07724': 'AAA domain (Cdc48 subfamily)',
  'PF13570': 'PQQ-like domain', 'PF13360': 'PQQ-like domain', 'PF16770': 'Regulator of Ty1 transposition protein 107 BRCT domain',
  'PF14560': 'Ubiquitin-like domain', 'PF08007': 'JmjC domain', 'PF13599': 'Pentapeptide repeats (9 copies)',
  'PF16794': 'Fibronectin-III type domain', 'PF07228': 'Stage II sporulation protein E (SpoIIE)', 'PF12718': 'Tropomyosin like',
  'PF13757': 'Vault protein inter-alpha-trypsin domain', 'PF12838': '4Fe-4S dicluster domain', 'PF04909': 'Amidohydrolase',
  'PF13718': 'GNAT acetyltransferase 2', 'PF08212': 'Lipocalin-like domain', 'PF13302': 'Acetyltransferase (GNAT) domain',
  'PF15899': 'BNR-Asp box repeat', 'PF13564': 'DoxX-like family'
}

# Enable importing local modules when directly calling as script
if __name__ == "__main__":
    cur_dir = os.path.join(os.path.dirname(__file__))
    sys.path.append(cur_dir + "/..")

from lib import download, download_gzip
from gene_cache import trim_id, detect_prefix, fetch_gff, parse_gff_info_field, fetch_interesting_genes
from gene_structure_cache import fetch_canonical_transcript_ids
from compress_transcripts import noncanonical_names

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
    "Drosophila melanogaster": "BDGP6.46"
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

def merge_signalp(
    signalp_path, features_by_transcript, transcript_names_by_id, feature_names_by_id
):
    print(f"Merging SignalP features from {signalp_path}")
    num_txs_with_signal_peptides = 0
    transcript_ids_not_found = []
    transcript_names_not_found = []
    with open(signalp_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for signalp_row in reader:
            if signalp_row[0][0] == "#":
                # Skip header
                continue
            print('signalp_row', signalp_row)
            transcript_id, protein_id, tm_or_notm, start, stop = signalp_row
            if tm_or_notm == '':
                continue
            if transcript_id not in transcript_names_by_id:
                transcript_ids_not_found.append(transcript_id)
                continue
            transcript_name = transcript_names_by_id[transcript_id]
            if transcript_name not in features_by_transcript:
                transcript_names_not_found.append(transcript_id)
                continue
            name = 'S'
            parsed_feat, feature_names_by_id = parse_feature(
                name, start, stop, name, feature_names_by_id
            )

            features_by_transcript[transcript_name].append(parsed_feat)
            num_txs_with_signal_peptides += 1


    print('Transcripts with signal peptides:', num_txs_with_signal_peptides)
    print('Transcripts with SignalP but unfound transcript_id:', len(transcript_ids_not_found))
    print('Transcripts with SignalP but unfound transcript_name:', len(transcript_names_not_found))
    return features_by_transcript, feature_names_by_id

def merge_uniprot(organism, features_by_transcript, transcript_names_by_id, feature_names_by_id):
    """
    To reproduce "homo-sapiens-topology-uniprot.tsv":

    1.  Go to https://sparql.uniprot.org
    2.  Enter following SPARQL query:

        SELECT ?protein ?transcript ?description ?begin ?end
        WHERE
        {
            # Find all proteins in Homo sapiens (taxonomy ID 9606)
            ?protein a up:Protein .
            ?protein up:organism taxon:9606 .

            # Among those, collect elements with an "rdfs:seeAlso" from Ensembl that are transcripts
            ?protein rdfs:seeAlso ?transcript .
            ?transcript up:database <http://purl.uniprot.org/database/Ensembl> .
            ?transcript a up:Transcript_Resource .

            # Among human proteins, get annotations that are for transmembrane or topology features
            ?protein up:annotation ?annotation . # Among human proteins
            VALUES ?tmOrTd { up:Transmembrane_Annotation up:Topological_Domain_Annotation }
            ?annotation a ?tmOrTd .
            ?annotation rdfs:comment ?description .

            # And for those annotations, get their start and stop coordinates
            ?annotation up:range ?range .
            ?range faldo:begin/faldo:position ?begin .
            ?range faldo:end/faldo:position ?end
        }

    3.  Click "Submit Query"
    4.  Click "CSV"
    5.  Remove various repetitive URLs and data types from CSV
    6.  Upload CSV to Google Sheets
    7.  Download as TSV
    8.  Rename to "homo-sapiens-topology-uniprot.tsv", put in ideogram/scripts/python/data/proteins/
    """
    print(f"Merging UniProt features for {organism}")
    uniprot_not_in_biomart = []
    uniprot_not_in_digest = []

    org_lch = organism.lower().replace(" ", "-")
    with open(f'data/proteins/{org_lch}-topology-uniprot.tsv') as f:
       lines = f.readlines()
    i = 0
    for line in lines[1:]:
        i += 1
        columns = line.strip().split('\t')
        uniprot_id, transcript_id, name, start, stop = columns[0:5] # TODO: See if uniprot_id is omittable
        transcript_id = transcript_id.split('.')[0] # E.g. ENST00000678548.1 -> ENST00000678548
        # if i < 10:
        #     print('transcript_id ' + transcript_id)
        if transcript_id not in transcript_names_by_id:
            uniprot_not_in_biomart.append(transcript_id)
            continue
        transcript_name = transcript_names_by_id[transcript_id]
        if transcript_name not in features_by_transcript:
            uniprot_not_in_digest.append(transcript_name)
            continue

        name = name.replace(';', ' ---')
        if name == 'Helical':
            name = 'H'
        elif name == 'Extracellular':
            name = 'E'
        elif name == 'Cytoplasmic':
            name = 'C'
        name = "_" + name
        parsed_feat, feature_names_by_id = parse_feature(
            name, start, stop, name, feature_names_by_id
        )

        features_by_transcript[transcript_name].append(parsed_feat)

    print(f"# transcript IDs in UniProt results but not BioMart: {len(uniprot_not_in_biomart)}")
    print(f"# transcript names in UniProt results but not digest: {len(uniprot_not_in_digest)}")
    return features_by_transcript, feature_names_by_id


def merge_pfam_unintegrated(interpro_map):
    """Recover data on Pfam entries lacking InterPro IDs

    E.g. "PF14670" is "Coagulation Factor Xa inhibitory site", a domain in the
    canonical transcript of human LDLR (ENSG00000130164 / ENST00000558518 / ENSP00000454071)

    These Pfam entries lack names in the default `interpro.xml` export, and BioMart,
    and thus require this separate data source.

    To re-generate the manually-downloaded file, if needed:
    * Go to https://www.ebi.ac.uk/interpro/result/download/#/entry/unintegrated/pfam/|tsv
    * Click "Generate", wait ~30 seconds
    * Click "Download"
    * Move `~/Downloads/export.tsv` to `pfam_unintegrated.tsv` in this directory
    """

    with open('cache/pfam_unintegrated.tsv') as f:
       lines = f.readlines()
    for line in lines[1:]:
        columns = line.strip().split('\t')
        pfam_id, name, db, type = columns[0:4]
        interpro_map[pfam_id] = [name, type, '']
    return interpro_map

def fetch_interpro_map(proteins_dir, reuse=True):
    """Download dump of all InterPro entries, extract relevant data

    @return {dict} List of name, type, and Interpro ID by Pfam ID
    """
    interpro_map = {}

    # Read cache and skip processing, if applicable and available
    cache_path = f"{proteins_dir}interpro_map.json"
    if reuse and os.path.exists(cache_path):
        with open(cache_path) as f:
            interpro_map = json.load(f)
        interpro_map = merge_pfam_unintegrated(interpro_map)
        return interpro_map

    # Download and transform to dict
    url = 'https://ftp.ebi.ac.uk/pub/databases/interpro/current_release/interpro.xml.gz'
    interpro_path = proteins_dir + 'interpro.xml'
    download_gzip(url, interpro_path, cache=reuse)
    print(f"Parsing {interpro_path}")
    tree = ET.parse(interpro_path)
    root = tree.getroot()
    entries = root.findall('interpro')
    for entry in entries:
        interpro_id = entry.attrib['id']
        type = entry.attrib['type']
        name = entry.find('name').text
        pfam = entry.find('member_list').find('db_xref[@db="PFAM"]')
        if pfam is None:
            continue
        pfam_id = pfam.attrib['dbkey']
        interpro_map[pfam_id] = [name, type, interpro_id]

    # Write cache
    content = json.dumps(interpro_map)
    with open(cache_path, "w") as f:
        f.write(content)

    interpro_map = merge_pfam_unintegrated(interpro_map)
    return interpro_map

def sort_proteins(proteins, organism, canonical_ids):
    ranks = fetch_interesting_genes(organism)
    print('ranks[0:10]')
    print(ranks[0:10])
    print('proteins[0:10]')
    print(proteins[0:10])
    sorted_proteins = []
    print('canonical_ids[0:3]')
    print(list(canonical_ids)[0:3])

    # Sort proteins by position, not lowest InterPro ID
    proteins_inner_sorted = []
    for protein_container in proteins:
        unsorted_protein_list = protein_container[2:]
        sorted_protein_list = sorted(
            unsorted_protein_list,
            key=lambda d: int(d.split(';')[1])
        )
        proteins_inner_sorted.append(
            protein_container[:2] + sorted_protein_list
        )
    proteins = proteins_inner_sorted

    proteins_with_genes = []
    for protein in proteins:
        # E.g. FOO-BAR-404 -> FOO-BAR
        gene = "".join(protein[1].split('-')[:-1])
        proteins_with_genes.append([gene] + protein)


    doms = proteins_with_genes
    doms = sorted(
        doms,
        key=lambda d: d[1] in canonical_ids, reverse=True
    )
    proteins_with_genes = doms


    # Sort genes by interest rank, and put unranked genes last
    trimmed_proteins = sorted(
        proteins_with_genes,
        key=lambda d: ranks.index(d[0]) if d[0] in ranks else 1E10,
    )

    # structs =
    # for id in structures_by_id:
    #     structs = structures_by_id[id]
    #     structs = sorted(structs, key=lambda s: s[0] in canonical_ids)
    #     structs = sorted(structs, key=lambda s: s[0] in canonical_ids)

    sorted_proteins = []
    for protein in trimmed_proteins:
        sorted_proteins.append(protein[2:])

    print('sorted_proteins[0:10]')
    print(sorted_proteins[0:10])

    return sorted_proteins

def get_signalp_url(organism):
    """Get URL to SignalP TSV file, from Ensembl BioMart
    E.g. https://www.ensembl.org/biomart/martservice?query=%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3C%21DOCTYPE%20Query%3E%3CQuery%20virtualSchemaName%20%3D%20%22default%22%20formatter%20%3D%20%22TSV%22%20header%20%3D%20%220%22%20uniqueRows%20%3D%20%220%22%20count%20%3D%20%22%22%20datasetConfigVersion%20%3D%20%220.6%22%20%3E%3CDataset%20name%20%3D%20%22hsapiens_gene_ensembl%22%20interface%20%3D%20%22default%22%20%3E%3CFilter%20name%20%3D%20%22with_interpro%22%20excluded%20%3D%20%220%22/%3E%3CAttribute%20name%20%3D%20%22ensembl_transcript_id%22%20/%3E%3CAttribute%20name%20%3D%20%22ensembl_peptide_id%22%20/%3E%3CAttribute%20name%20%3D%20%22signalp%22%20/%3E%3CAttribute%20name%20%3D%20%22signalp_start%22%20/%3E%3CAttribute%20name%20%3D%20%22signalp_end%22%20/%3E%3C/Dataset%3E%3C/Query%3E
    """

    # E.g. "Homo sapiens" -> "hsapiens"
    split_org = organism.split()
    brief_org = (split_org[0][0] + split_org[1]).lower()

    query = quote((
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<!DOCTYPE Query>'
        '<Query virtualSchemaName = "default" formatter = "TSV" header = "0" uniqueRows = "0" count = "" datasetConfigVersion = "0.6" >' +
          '<Dataset name = "' + brief_org + '_gene_ensembl" interface = "default" >' +
            '<Filter name = "with_interpro" excluded = "0"/>' +
            '<Attribute name = "ensembl_transcript_id" />' +
            '<Attribute name = "ensembl_peptide_id" />' +
            '<Attribute name = "signalp" />' +
            '<Attribute name = "signalp_start" />' +
            '<Attribute name = "signalp_end" />' +
        '</Dataset>' +
        '</Query>'
    ).encode("utf-8"))
    url = f"https://www.ensembl.org/biomart/martservice?query={query}"
    print('url', url)
    return url

def get_proteins_url(organism):
    """Get URL to proteins TSV file, from Ensembl BioMart
    E.g. https://www.ensembl.org/biomart/martservice?query=%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3C%21DOCTYPE%20Query%3E%3CQuery%20virtualSchemaName%20%3D%20%22default%22%20formatter%20%3D%20%22TSV%22%20header%20%3D%20%220%22%20uniqueRows%20%3D%20%220%22%20count%20%3D%20%22%22%20datasetConfigVersion%20%3D%20%220.6%22%20%3E%3CDataset%20name%20%3D%20%22hsapiens_gene_ensembl%22%20interface%20%3D%20%22default%22%20%3E%3CFilter%20name%20%3D%20%22with_interpro%22%20excluded%20%3D%20%220%22/%3E%3CAttribute%20name%20%3D%20%22ensembl_transcript_id%22%20/%3E%3CAttribute%20name%20%3D%20%22pfam%22%20/%3E%3CAttribute%20name%20%3D%20%22pfam_start%22%20/%3E%3CAttribute%20name%20%3D%20%22pfam_end%22%20/%3E%3C/Dataset%3E%3C/Query%3E
    """

    # E.g. "Homo sapiens" -> "hsapiens"
    split_org = organism.split()
    brief_org = (split_org[0][0] + split_org[1]).lower()

    query = quote((
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<!DOCTYPE Query>'
        '<Query virtualSchemaName = "default" formatter = "TSV" header = "0" uniqueRows = "0" count = "" datasetConfigVersion = "0.6" >' +
          '<Dataset name = "' + brief_org + '_gene_ensembl" interface = "default" >' +
            '<Filter name = "with_interpro" excluded = "0"/>' +
            '<Attribute name = "ensembl_transcript_id" />' +
            '<Attribute name = "ensembl_peptide_id" />' +
            '<Attribute name = "pfam" />' +
            '<Attribute name = "pfam_start" />' +
            '<Attribute name = "pfam_end" />' +
        '</Dataset>' +
        '</Query>'
    ).encode("utf-8"))
    url = f"https://www.ensembl.org/biomart/martservice?query={query}"
    print('url', url)
    return url

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

def parse_feature(id, start, stop, name, names_by_id):
    length = str(int(stop) - int(start))
    if id not in names_by_id:
        names_by_id[id] = name

    parsed_feat = ';'.join([id, start, length])

    return parsed_feat, names_by_id

def parse_proteins(proteins_path, gff_path, interpro_map, signalp_path, organism):
    """Parse proteins proteins from InterPro data in TSV file
    """

    pfams_not_in_interpro = {}
    transcript_names_by_id = {}
    with open(gff_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for gff_row in reader:
            if gff_row[0][0] == "#":
                # Skip header
                continue

            feat_type = gff_row[2]
            if feat_type != "mRNA": continue
            info = gff_row[8]
            info = parse_gff_info_field(info)
            transcript_id = info["ID"].split('transcript:')[1]
            if "Name" not in info:
                continue
            transcript_name = info["Name"]
            transcript_names_by_id[transcript_id] = transcript_name

    missing_transcripts = []
    feature_names_by_id = {}
    features_by_transcript = {}
    tx_by_protein_id = {}
    i = 0
    with open(proteins_path) as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            i += 1

            if row[0][0] == "#":
                # Skip header
                continue

            feature = row

            if feature == None or len(feature) == 1 or feature[1] == '':
                continue

            # print('protein', protein)

            if (i % 50000 == 0):
                print(f"On entry {i}")
                print(feature)

            # if i > 100000:
            #     # return proteins_by_transcript
            #     break

            transcript_id = feature[0]

            if transcript_id not in transcript_names_by_id:
                missing_transcripts.append(transcript_id)
                continue
            transcript_name = transcript_names_by_id[transcript_id]
            protein_id = feature[1]
            tx_by_protein_id[transcript_id] = protein_id
            pfam_id = feature[2]
            if pfam_id not in interpro_map and pfam_id not in manual_pfam_map:
                pfams_not_in_interpro[pfam_id] = 1
                continue
            if pfam_id in interpro_map:
                feat_name, feat_type, interpro_id = interpro_map[pfam_id]
            else:
                interpro_id = ''
                feat_name = manual_pfam_map[pfam_id]
            if interpro_id != '':
                feat_id = trim_id(interpro_id, "IPR")
            else:
                # Handles unintegrated Pfam entries, like
                # LDLR-201's "PF14670" (Coagulation Factor Xa inhibitory site)
                feat_id = pfam_id

            [start, stop] = feature[3:5]

            parsed_feat, feature_names_by_id = parse_feature(
                feat_id, start, stop, feat_name, feature_names_by_id
            )

            if transcript_name in features_by_transcript:
                features_by_transcript[transcript_name].append(parsed_feat)
            else:
                features_by_transcript[transcript_name] = [parsed_feat]

            # [chr, start, stop, transcript, symbol, desc] = parsed_gene
            # length = str(int(stop) - int(start))

            # if prefix == None:
            #     prefix = detect_prefix(transcript)
            # slim_transcript = trim_transcript(transcript, prefix)

            # slim_genes.append([chr, start, length, slim_transcript, symbol, desc])
    pfams_not_in_interpro = list(pfams_not_in_interpro)
    print('Pfam IDs with no mapped InterPro entry:', pfams_not_in_interpro)

    num_missing = str(len(missing_transcripts))
    print('Number of transcript IDs lacking names:' + num_missing)

    if "Homo_sapiens" in gff_path or "Mus_musculus" in gff_path:
        features_by_transcript, feature_names_by_id = merge_uniprot(
            organism, features_by_transcript, transcript_names_by_id, feature_names_by_id
        )

    features_by_transcript, feature_names_by_id = merge_signalp(
        signalp_path, features_by_transcript, transcript_names_by_id, feature_names_by_id
    )

    tx_ids_by_name = {v: k for k, v in transcript_names_by_id.items()}

    proteins = []
    for transcript in features_by_transcript:
        tx_proteins = features_by_transcript[transcript]
        transcript_id = tx_ids_by_name[transcript]
        tx_proteins.insert(0, transcript)
        tx_proteins.insert(0, transcript_id)
        proteins.append(tx_proteins)

    print('proteins[0:10]')
    print(proteins[0:10])

    return [proteins, feature_names_by_id]


class ProteinCache():
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

        proteins_dir = self.tmp_dir + "proteins/"
        if not os.path.exists(proteins_dir):
            os.makedirs(proteins_dir)
        self.proteins_dir = proteins_dir

        self.interpro_map = fetch_interpro_map(proteins_dir, reuse_bmtsv)

    def fetch_proteins_tsv(self, organism):
        """Download an organism's proteins TSV file from Ensembl BioMart
        """
        print(f"Fetching via Ensembl BioMart TSV for {organism}")
        url = get_proteins_url(organism)
        proteins_dir = self.proteins_dir
        org_lch = organism.lower().replace(" ", "-")
        proteins_path = proteins_dir + org_lch + "-proteins.tsv"
        try:
            download(url, proteins_path, cache=self.reuse_bmtsv)
        except urllib.error.HTTPError:
            # E.g. for C. elegans
            url = url.replace("chr.", "")
            download(url, proteins_path, cache=self.reuse_bmtsv)
        return [proteins_path, url]

    def fetch_signalp_tsv(self, organism):
        """Download an organism's SignalP TSV file from Ensembl BioMart
        """
        print(f"Fetching SignalP (signal peptides) via BioMart for {organism}")
        url = get_signalp_url(organism)
        proteins_dir = self.proteins_dir
        org_lch = organism.lower().replace(" ", "-")
        signalp_path = proteins_dir + org_lch + "-signalp.tsv"
        try:
            download(url, signalp_path, cache=self.reuse_bmtsv)
        except urllib.error.HTTPError:
            # E.g. for C. elegans
            url = url.replace("chr.", "")
            download(url, signalp_path, cache=self.reuse_bmtsv)
        return [signalp_path, url]

    def write(self, proteins, organism, names_by_id):
        """Save fetched and transformed gene data to cache file
        """
        # biotypes_list = list(biotypes.keys())
        # biotype_keys = ", ".join([
        #     f"{str(i)} = {key}" for i, key in enumerate(biotypes_list)
        # ])

        headers = "\n".join([
            f"## Ideogram.js protein cache for {organism}"
        ]) + "\n"

        protein_keys = []
        for id in names_by_id:
            protein_keys.append(f"{id} = {names_by_id[id]}")
        headers += "## domain keys: " + "; ".join(protein_keys) + "\n"
        # print('proteins')
        # print(proteins)
        protein_lines = "\n".join(["\t".join(s) for s in proteins])
        content = headers + protein_lines

        org_lch = organism.lower().replace(" ", "-")
        output_path = f"{self.output_dir}{org_lch}-proteins.tsv.gz"
        with gzip.open(output_path, "wt") as f:
            f.write(content)
        print(f"Wrote gene protein cache: {output_path}")

    def populate_by_org(self, organism):
        """Fill gene caches for a configured organism
        """
        [canonical_ids, bmtsv_url] = fetch_canonical_transcript_ids(organism)
        [gff_path, gff_url] = fetch_gff(organism, self.output_dir, True)
        [proteins_path, proteins_url] = self.fetch_proteins_tsv(organism)
        [signalp_path, signalp_url] = self.fetch_signalp_tsv(organism)

        interpro_map = self.interpro_map
        [proteins, names_by_id] = parse_proteins(
            proteins_path, gff_path, interpro_map, signalp_path, organism
        )
        sorted_proteins = sort_proteins(proteins, organism, canonical_ids)
        sorted_proteins = noncanonical_names(sorted_proteins)

        # print('proteins')
        # print(proteins)

        self.write(sorted_proteins, organism, names_by_id)

    def populate(self):
        """Fill gene caches for all configured organisms

        Consider parallelizing this.
        """
        # for organism in assemblies_by_org:
        for organism in ["Homo sapiens", "Mus musculus"]:
        # for organism in ["Homo sapiens"]:
        # for organism in ["Mus musculus"]:
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

    ProteinCache(output_dir, reuse_bmtsv).populate()
