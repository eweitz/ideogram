def fetch_maize_centromeres(output_dir):
    """Reads local copy of centromeres from B73 v2 genome assembly for Zea mays

    Old documentation:
    Requests maize centromere data from Genomaize
    This is a special case for maize, a request for which began this module.

    To debug:
    curl 'http://genomaize.org/cgi-bin/hgTables' --data 'jsh_pageVertPos=0&clade=monocots&org=Zea+mays&db=zeaMay_b73_v2&hgta_group=map&hgta_track=cytoBandIdeo&hgta_table=cytoBandIdeo&hgta_regionType=genome&position=chr1%3A1-301354135&hgta_outputType=primaryTable&boolshad.sendToGalaxy=0&boolshad.sendToGreat=0&hgta_outFileName=&hgta_compressType=none&hgta_doTopSubmit=get+output'
    """
    centromeres_by_chr = {}

    '''
    post_body = (
        'jsh_pageVertPos=0' +
        '&clade=monocots' +
        '&org=Zea+mays' +
        '&db=zeaMay_b73_v2' +
        '&hgta_group=map' +
        '&hgta_track=cytoBandIdeo' +
        '&hgta_table=cytoBandIdeo' +
        '&hgta_regionType=genome' +
        '&position=chr1%3A1-301354135' +
        '&hgta_outputType=primaryTable' +
        '&boolshad.sendToGalaxy=0' +
        '&boolshad.sendToGreat=0' +
        '&hgta_outFileName=' +
        '&hgta_compressType=none' +
        '&hgta_doTopSubmit=get+output'
    )
    post_body = post_body.encode()
    url = 'http://genomaize.org/cgi-bin/hgTables'
    data = request(url, request_body=post_body)
    rows = data.split('\n')[1:-1]
    for row in rows:
        # Headers: chrom, chromStart, chromEnd, name, score
        chr, start, stop = row.split('\t')[:3]
        chr = chr.replace('chr', '')
        centromeres_by_chr[chr] = [start, stop]
    '''

    rows = open(output_dir + 'zea-mays-b73-v2-centromeres.tsv').readlines()
    for row in rows[1:]:
        chr, start, stop = row.split('\t')[:3]
        chr = chr.replace('chr', '')
        centromeres_by_chr[chr] = [start, stop]

    return centromeres_by_chr