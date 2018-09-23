"""Fetch cytogenetic band data from third-party MySQL databases
"""

# TODO:
# - Bonus: Convert this data into AGP 2.0, send data missing from NCBI to them

import os
import json
from concurrent.futures import ThreadPoolExecutor
import argparse

from . import settings


parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('--output_dir',
    help='Directory to send output data to',
    default='../../data/bands/native/')
# parser.add_argument('--fresh_run',
#     help='Do you want to use cached data, or fresh data fetched over ' +
#          'the Internet?',
#     default='True')
# parser.add_argument('--fill_cache',
#     help='Do you want to populate the cache?  Only applicable for fresh runs.',
#     default='False')
args = parser.parse_args()


def t_or_f(arg):
    ua = str(arg).upper()
    if 'TRUE'.startswith(ua):
        return True
    elif 'FALSE'.startswith(ua):
        return False
    else:
        pass  #error condition maybe?


# eweitz, 2017-12-01:
# The arguments '--fresh_run=False and --fresh_run=False' do not yet work.
# The code related to these arguments is a work in progress.
# They are intended to speed up development by enabling runs to
# bypass remote querying and download.
fresh_run = True # t_or_f(args.fresh_run)
fill_cache = False #t_or_f(args.fill_cache)
output_dir = args.output_dir
cache_dir = output_dir + 'cache/'
log_name = 'fetch_cytobands_from_dbs'

from . import settings
logger = settings.init(fresh_run, fill_cache, output_dir, cache_dir, log_name)

from .utils import *
from .ucsc import *
from .ensembl import *
from .genomaize import *
from .centromeres import *

if os.path.exists(output_dir) is False:
    os.mkdir(output_dir)

# Caching scenarios
#
# | fresh_run  | True | True  | False | False |
# | fill_cache | True | False | True  | False |
# | Scenario   | A    | B     | C     | D     |
#
# Scenario A: Repopulate cache.  Slow run, prepare later cache.
# Scenario B: For production.  Slow run, don't write to cache.
# Scenario C: No-op.  Illogical state, throw error.
# Scenario D: For development, or debugging.  Fast run, usable offline.
#
# Scenario D can be useful when working without Internet access, e.g. on a
# train or in rural areas.  It also enables much faster iteration even when
# connectivity is good.  Be sure to run Scenario A first, though!
if fresh_run is False and fill_cache:
    raise ValueError(
        'Error: Attempting to use cache, but no cache exists.  ' +
        'Use other arguments, e.g. "--fill_cache=True --fill_cache=True".'
    )

if os.path.exists(cache_dir) is False:
    if fill_cache:
        os.mkdir(cache_dir)
    if fresh_run is False:
        raise ValueError(
            'No cache available.  ' +
            'Run with "--fresh_run=True --fill_cache=True" then try again.'
        )

time_ncbi = 0
time_ucsc = 0
time_ensembl = 0

times = {'ncbi': 0, 'ucsc': 0, 'ensembl': 0}


def patch_telomeres(bands_by_chr):
    """Account for special case with Drosophila melanogaster
    """
    for chr in bands_by_chr:
        first_band = bands_by_chr[chr][0]
        start = first_band[1]
        if start != '1':
            stop = str(int(start) - 1)
            pter_band = ['pter', '1', stop, '1', stop, 'gpos']
            bands_by_chr[chr].insert(0, pter_band)

    new_bands = {}
    for chr in bands_by_chr:
        new_bands[chr] = []
        for band in bands_by_chr[chr]:
            band.insert(0, 'q')
            new_bands[chr].append(band)
    bands_by_chr = new_bands

    return bands_by_chr


def pool_processing(party):
    """Called once per "party" (i.e. UCSC, Ensembl, or GenoMaize)
    to fetch cytoband data from each.
    """
    global times
    global unfound_dbs
    print('in fetch_cytobands_from_dbs, pool_processing')
    logger.info('Entering pool processing, party: ' + party)
    if party == 'ensembl':
        org_map = fetch_from_ensembl_genomes(times, logger)
    elif party == 'ucsc':
        org_map, times, unfound_dbs_subset =\
            fetch_from_ucsc(logger, times, unfound_dbs)
        unfound_dbs += unfound_dbs_subset
    elif party == 'genomaize':
        org_map = fetch_maize_centromeres(output_dir)

    logger.info('exiting pool processing')
    return [party, org_map, times]


party_list = []
unfound_dbs = []
zea_mays_centromeres = {}

def log_end_times():
    logger.info('')

    # How long did each part take?
    logger.info('time_ucsc:')
    logger.info(time_ucsc)
    logger.info('time_ncbi:')
    logger.info(time_ncbi)
    logger.info('time_ensembl:')
    logger.info(time_ensembl)

def main():
    global unfound_dbs
    
    # Request data from all parties simultaneously
    num_threads = 3
    with ThreadPoolExecutor(max_workers=num_threads) as pool:
        print ('in fetch_cytobands_from_dbs, main')
        parties = ['ensembl', 'ucsc', 'genomaize']
        for result in pool.map(pool_processing, parties):
            party = result[0]
            if party == 'genomaize':
                zea_mays_centromeres = result[1]
            else:
                party_list.append(result)

    print ('in fetch_cytobands_from_dbs, main after TPE')
    logger.info('')
    logger.info('UCSC databases not mapped to GenBank assembly IDs:')
    logger.info(', '.join(unfound_dbs))
    logger.info('')

    # Third parties (e.g. UCSC, Ensembl) can have data for the same organism.
    # Convert any such duplicate data into a non-redundant (NR) organism map.
    nr_org_map = {}
    seen_orgs = {}
    for party, org_map, times in party_list:
        logger.info('Iterating organisms from ' + party)
        for org in org_map:
            logger.info('\t' + org)
            if org in seen_orgs:
                logger.info('Already saw ' + org)
                continue
            nr_org_map[org] = org_map[org]

    manifest = {}

    for org in nr_org_map:

        asm_data = sorted(nr_org_map[org], reverse=True)[0]
        genbank_accession, db, bands_by_chr = asm_data

        manifest[org] = [genbank_accession, db]

        if org == 'drosophila-melanogaster':
            bands_by_chr = patch_telomeres(bands_by_chr)

        # Assign cytogenetic arms for each band
        if org == 'zea-mays':
            bands_by_chr = merge_centromeres(bands_by_chr, zea_mays_centromeres)
        else:
            bands_by_chr = parse_centromeres(bands_by_chr)

        # Collapse chromosome-to-band dict, making it a list of strings
        band_list = []
        chrs = natural_sort(list(bands_by_chr.keys()))
        for chr in chrs:
            bands = bands_by_chr[chr]
            for band in bands:
                band_list.append(chr + ' ' + ' '.join(band))

        # Write actual cytoband data to file,
        # e.g. ../data/bands/native/anopheles-gambiae.js
        with open(output_dir + org + '.js', 'w') as f:
            f.write('window.chrBands = ' + str(band_list))

    print('exiting main, fetch_cytobands_from_dbs')
    return manifest


if __name__ == '__main__':
    main()
