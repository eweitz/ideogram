import urllib.request as request
from urllib.parse import quote
import urllib.error
import os
import json
import io
import gzip

eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
esearch = eutils + 'esearch.fcgi?retmode=json';
esummary = eutils + 'esummary.fcgi?retmode=json';
elink = eutils + 'elink.fcgi?retmode=json';

asms = []

term = quote(
    '("latest refseq"[filter] AND "chromosome level"[filter]) AND ' +
    '(animals[filter] OR plants[filter] OR fungi[filter] OR protists[filter])'
)

asm_search = esearch + '&db=assembly&term=' + term + '&retmax=10000'

with request.urlopen(asm_search) as response:
    data = json.loads(response.read().decode('utf-8'))

# Returns ~1000 ids
uid_list = data['esearchresult']['idlist']

asm_uid_lists = []
for i in range(0, len(uid_list) % 100):
    asm_uid_list = []
    for j in range(0, 100):
        #print(100*i + j)
        if 100*i + j < len(uid_list):
            asm_uid = uid_list[100*i + j]
            asm_uid_list.append(asm_uid)
    asm_uid_lists.append(asm_uid_list)

uids = ','.join(asm_uid_lists[0])
asm_summary = esummary + '&db=assembly&id=' + uids

# Example: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=assembly&id=733711
with request.urlopen(asm_summary) as response:
    data = json.loads(response.read().decode('utf-8'))


for uid in data['result']:

    # Omit list of UIDs
    if uid == 'uids':
        continue

    result = data['result'][uid]
    acc = result['assemblyaccession'] # RefSeq accession
    name = result['assemblyname']
    rs_uid = result['rsuid']
    taxid = result['taxid']
    organism = result['speciesname']

    output_dir = 'data/chromosomes/' + organism.lower().replace(' ', '-') + '/'
    os.mkdir(output_dir)

    asm_segment = acc + '_' + name.replace(' ', '_')

    # Example: ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz
    agp_base_url = (
        'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/' +
        asm_segment + '/' + asm_segment + '_assembly_structure/' +
        'Primary_Assembly/assembled_chromosomes/AGP/'
    )

    try:
        request.urlopen(agp_base_url)
    except urllib.error.URLError as e:
        print(e)
        continue

    nuccore_link = elink + "&db=nuccore&linkname=gencoll_nuccore_chr&from_uid=" + result['rsuid'];

    with request.urlopen(nuccore_link) as response:
        nuccore_data = json.loads(response.read().decode('utf-8'))

    links = nuccore_data['linksets'][0]['linksetdbs'][0]['links']

    links = ','.join(str(x) for x in links)

    nt_summary = esummary + "&db=nucleotide&id=" + links;
    with request.urlopen(nt_summary) as response:
        nt_response = json.loads(response.read().decode('utf-8'))

    results = nt_response['result']
    for uid in results:
        if uid == "uids":
            continue

        result = results[uid];

        split_subtype = result['subtype'].split("|")
        if 'chromosome' not in split_subtype:
            continue

        cn_index = result['subtype'].split("|").index("chromosome")

        chr_name = 'chr' + result['subname'].split("|")[cn_index];
        #if (typeof chrName !== "undefined" && chrName.substr(0, 3) === "chr") {
        #// Convert "chr12" to "12", e.g. for banana (GCF_000313855.2)
        #chrName = chrName.substr(3);
        #}

        # Example: 'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF_000001515.7_Pan_tro_3.0/GCF_000001515.7_Pan_tro_3.0_assembly_structure/Primary_Assembly/assembled_chromosomes/AGP/chr1.agp.gz'
        agp_url = agp_base_url + chr_name + ".agp.gz"

        try:
            print('Fetching ' + agp_url)
            with request.urlopen(agp_url) as response:
                compressed_file = io.BytesIO(response.read())

        except urllib.error.URLError as e:
            print(e)
            continue

        decompressed_file = gzip.GzipFile(fileobj=compressed_file)

        output_name = output_dir + asm_segment + '_' + chr_name + '.agp'
        with open(output_name, 'wb') as outfile:
            outfile.write(decompressed_file.read())

    asm = {
        'acc': acc,
        'name': name,
        'agp_url': agp_url,
        'rs_uid': rs_uid,
        'taxid': taxid,
        'organism': organism
    }
    asms.append(asm)
