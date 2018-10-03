def update_bands(centromere, bands, new_bands, chr, i, j):
    cen_start, cen_stop = centromere

    # Extend nearest p-arm band's stop coordinate to the
    # p_cen's start coordinate (minus 1)
    cen_start_pre = str(int(cen_start) - 1)
    new_bands[chr][i - j - 1][3] = cen_start_pre
    new_bands[chr][i - j - 1][5] = cen_start_pre

    # Extend nearest q-arm band's start coordinate to the
    # q_cen's stop coordinate (plus 1)
    cen_stop_post = str(int(cen_stop) + 1)
    bands[i + j][1] = cen_stop_post
    bands[i + j][3] = cen_stop_post

    return [bands, new_bands]


def get_pcen_and_qcen(centromere, chr):
    cen_start, cen_stop = centromere

    # Coordinates of the centromere itself
    cen_mid = int(cen_start) + round((int(cen_stop)-int(cen_start))/2)

    pcen = [
        'p', 'pcen', cen_start, str(cen_mid - 1),
        cen_start, str(cen_mid - 1), 'acen'
    ]
    qcen = [
        'q', 'qcen', str(cen_mid), cen_stop,
        str(cen_mid), cen_stop, 'acen'
    ]
    return [pcen, qcen]


def get_centromere_parts(centromere, chr, new_bands, bands, band, i, j, pcen_index):
    band_start, band_stop = band[1:3]
    cen_start, cen_stop = centromere

    if int(band_stop) < int(cen_start):
        arm = 'p'
    else:
        arm = 'q'

        if int(band_start) < int(cen_stop):
            # Omit any q-arm bands that start before q-arm pericentromeric band
            if chr == '1':
                logger.info('Omit band:')
                logger.info(band)
            j += 1
            return None

        if pcen_index is None:
            pcen_index = i - j
            bands, new_bands = update_bands(centromere, bands,
                new_bands, chr, i, j)
            pcen, qcen = get_pcen_and_qcen(centromere, chr)

    return [arm, pcen, qcen, pcen_index, new_bands, bands, band, j, pcen_index]


def merge_centromeres(bands_by_chr, centromeres, logger_obj):
    """Adds p and q arms to cytobands; thus adds centromere to each chromosome.

    This is a special case for Zea mays (maize, i.e. corn).
    Ensembl Genomes provides band data with no cytogenetic arm assignment.
    Genomaize provides centromere positions for each chromosome.
    This function merges those two datasets to provide input directly
    useable to Ideogram.js.
    """
    global logger
    logger = logger_obj

    logger.info('Entering merge_centromeres')
    new_bands = {}

    for chr in bands_by_chr:
        bands = bands_by_chr[chr]
        new_bands[chr] = []
        centromere = centromeres[chr]
        pcen_index = None

        j = 0
        for i, band in enumerate(bands):
            new_band = band
            # This is gross.  Can this function be small *and* readable?
            [arm, pcen, qcen, pcen_index, new_bands, bands, band, j,
                pcen_index] = get_centromere_parts(centromere, chr, 
                    new_bands, bands, band, i, j, pcen_index)
            new_band.insert(0, arm)
            new_bands[chr].append(new_band)
        if pcen_index is not None:
            new_bands[chr].insert(pcen_index, qcen)
            new_bands[chr].insert(pcen_index, pcen)
    return new_bands

def parse_centromeres(bands_by_chr, logger_obj):
    """Adds p and q arms to cytobands, by parsing embedded centromere bands.

    This is a special case for assigning cytogenetic arms to certain organisms
    from Ensembl Genomes, including: Aspergillus fumigatus, Aspergillus
    nidulans, Aspergillus niger, Aspergillus oryzae (various fungi);
    Oryza sativa (rice); and Hordeum vulgare (barley).

    Bands are assigned an arm based on their position relative to the embedded
    centromere.
    """
    global logger
    logger = logger_obj
    logger.info('Entering parse_centromeres')

    # If centromeres aren't embedded in the input banding data,
    # then simply return the input without modification.
    has_centromere = False
    for chr in bands_by_chr:
        bands = bands_by_chr[chr]
        for band in bands:
            stain = band[-1]
            if stain == 'acen':
                has_centromere = True
    if has_centromere is False:
        return bands_by_chr

    new_bands = {}

    for chr in bands_by_chr:
        bands = bands_by_chr[chr]
        new_bands[chr] = []

        # On each side of the centromere -- the p-arm side and the q-arm
        # side -- there is a band with a "stain" value of "acen".  Here,
        # we find the index of the acen band on the p-arm side.  That
        # band and all bands to the left of it are on the p arm.  All
        # bands to the right of it are on the q arm.
        pcen_index = None
        for i, band in enumerate(bands):
            stain = band[-1]
            if stain == 'acen':
                pcen_index = i
        for i, band in enumerate(bands):
            arm = ''
            if pcen_index is not None:
                if i < pcen_index:
                    arm = 'p'
                else:
                    arm = 'q'
            band.insert(0, arm)
            new_bands[chr].append(band)

    return new_bands