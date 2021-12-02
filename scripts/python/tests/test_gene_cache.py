"""Tests for Wikipedia view counts and derived metrics

To run:
    $ pwd
    python
    $ cd tests
    $ pytest -s
"""

import sys

# Ensures `cache` package (and any subpackages) can be imported
# TODO: Find way to avoid this kludge
sys.path += ['..', '../cache']

from cache.gene_cache import GeneCache

def test_write(tmpdir):

    # About tmpdir:
    # https://docs.pytest.org/en/6.2.x/tmpdir.html#the-tmpdir-fixture
    cache = GeneCache(output_dir=tmpdir)

    # Simulate expected input data
    genes = [
        ["1", "11869", "2540", "223972", "DDX11L1"],
        ["1", "14404", "15166", "227232", "WASH7P"]
    ]
    organism = "Homo sapiens"
    prefix = "ENSG"
    gtf_url = "https://ftp.ensembl.org/pub/release-102/gtf/homo_sapiens/Homo_sapiens.GRCh38.102.chr.gtf.gz"

    # Write cached genes and associated metadata to file
    cache.write(genes, organism, prefix, gtf_url)

    # Parse output
    output_path = tmpdir + "homo-sapiens-genes.tsv"
    with open(output_path) as f:
        lines = [line.split("\t") for line in f.readlines()]

    # Verify things output as expected
    assert len(lines) == 6
    assert len(lines[4]) == 5 # Expect five columns
    expected_lines = [
        ["## Ideogram.js gene cache for Homo sapiens\n"],
        ["## Derived from https://ftp.ensembl.org/pub/release-102/gtf/homo_sapiens/Homo_sapiens.GRCh38.102.chr.gtf.gz\n"],
        ["## prefix: ENSG\n"],
        ["# chr", "start", "length", "slim_id", "symbol\n"],
        ["1", "11869", "2540", "223972", "DDX11L1\n"],
        ["1", "14404", "15166", "227232", "WASH7P"]
    ]
    assert lines == expected_lines

