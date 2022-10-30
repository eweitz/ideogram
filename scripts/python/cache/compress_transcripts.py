"""Compress transcripts, for more space-efficient data on gene structures
"""

def relative_start(structures):
    print("Compress subpart start coordinates to be relative to previous subpart's")
    compressed_structures = []
    tmp_structs = []
    for (i, structure) in enumerate(structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        for (j, subpart) in enumerate(subparts):
            if j == 0:
                compressed_structure.append(subpart)
                continue
            subpart = subpart.split(";")
            prev_subpart = subparts[j - 1].split(";")
            utr = len(subpart) == 3
            start = int(subpart[0] if not utr else subpart[1])
            length = int(subpart[1] if not utr else subpart[2])
            prev_utr = len(prev_subpart) == 3
            prev_start = int(prev_subpart[0] if not prev_utr else prev_subpart[1])
            # prev_len = int(prev_subpart[1] if prev_utr else prev_subpart[2])
            relative_start = start - prev_start
            utr_prefix = "" if not utr else f"{subpart[0]};"
            compressed_subpart = f"{utr_prefix}{relative_start};{length}"
            compressed_structure.append(compressed_subpart)
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def utr_direction(compressed_structures):
    print(
        "Compress UTR direction, e.g. 2;0;283 -> U0;283 and 0;186;48 -> U186;48",
        "5' or 3' can be deduced via strand and presence of intervening CDS's"
    )
    tmp_structs = []
    for (i, structure) in enumerate(compressed_structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        for (j, subpart) in enumerate(subparts):
            split_subpart = subpart.split(";")
            if len(split_subpart) == 3:
                compressed_subpart = f"U{';'.join(split_subpart[1:])}"
            else:
                compressed_subpart = subpart
            compressed_structure.append(compressed_subpart)
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def pointers(compressed_structures):
    print(
        "Compress subparts to pointers, when subpart has been seen in current gene.  ",
        "Among pointers, omit any that merely increment the previous"
    )
    seen_parts = {}
    prev_gene = ''
    tmp_structs = []
    i = 0
    for structure in compressed_structures:
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        gene = structure[0].split('-')[0]
        if gene == prev_gene:
            prev_compressed_subpart = None
            sp_offset = 0
            # Processing same gene
            for (j, subpart) in enumerate(subparts):
                if subpart in seen_parts:
                    compressed_subpart = seen_parts[subpart]
                    scs = compressed_subpart.split("_") # "*s*plit *c*ompressed *s*ubpart
                    tx_i = int(scs[0]) # Transcript pointer
                    sp_j = int(scs[1]) # Subpart pointer
                    omit = False
                    if prev_compressed_subpart:
                        # p_tx_i: Previous transcript pointer
                        # p_sp_j: Previous subpart pointer
                        p_tx_i = int(prev_compressed_subpart[0])
                        if sp_offset == 0:
                            p_sp_j = int(prev_compressed_subpart[1])
                        else:
                            p_sp_j = sp_offset
                        # if gene == "ACE2":
                        #     print(
                        #         "compressed_structure, prev_compressed_subpart, tx_i, p_tx_i, sp_j, p_sp_j, sp_offset",
                        #         compressed_structure, prev_compressed_subpart, tx_i, p_tx_i, sp_j, p_sp_j, sp_offset
                        #     )
                        if tx_i - p_tx_i == 0 and sp_j - p_sp_j == 1:
                            # Same transcipt and this subpart index is 1 more than prev subpart index
                            sp_offset = sp_j
                            compressed_subpart = ""
                            omit = True
                    if not omit:
                        sp_offset = 0
                        prev_compressed_subpart = scs

                else:
                    prev_compressed_subpart = None
                    sp_offset = 0
                    compressed_subpart = subpart
                    seen_parts[subpart] = str(i) + '_' + str(j)
                compressed_structure.append(compressed_subpart)
        else:
            # Processing new gene
            i = 0
            prev_gene = gene
            seen_parts = {}
            for (j, subpart) in enumerate(subparts):
                seen_parts[subpart] = str(i) + '_' + str(j)
            compressed_structure = structure
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def coterminal_exons_utrs(compressed_structures):
    print("Compress coterminal exons and UTRs, e.g. 0;283  U0;283 -> E0;283")
    tmp_structs = []
    for (i, structure) in enumerate(compressed_structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        for (j, subpart) in enumerate(subparts):
            if j == 0 or len(subpart) > 0 and subpart[0] != "U":
                compressed_structure.append(subpart)
                continue
            prev_subpart = subparts[j - 1]
            if prev_subpart == "":
                compressed_structure.append(subpart)
                continue
            utr_range = subpart[1:] # e.g. U0:283 -> 0:283
            split_subpart = subpart.split(";")
            # gene = structure[0].split('-')[0]
            # if gene == "ACE2": print("split_subpart, prev_subpart, utr_range", split_subpart, prev_subpart, utr_range)
            if prev_subpart == utr_range:
                compressed_structure[-1] = ""
                compressed_subpart = f"E{subpart[1:]}"
            else:
                compressed_subpart = subpart
            compressed_structure.append(compressed_subpart)
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def same_index_lengths(compressed_structures, structures):
    print(
        "Compress lengths at same-index subparts, e.g.",
        "U273  _  69458;194",
        "U738  790  45835;194", # 194 is length of 3rd subpart in both
        "->"
        "U273  _  69458;194",
        "U738  790  45835^", # ";194" -> "^": 75% smaller here, always >= 50%
    )
    tmp_structs = []
    for (i, structure) in enumerate(compressed_structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        for (j, subpart) in enumerate(subparts):
            if i == 0 or j == 0 or len(subpart) == 0:
                compressed_structure.append(subpart)
                continue
            prev_subparts = structures[i - 1][3:]
            if j > len(prev_subparts) - 1:
                compressed_structure.append(subpart)
                continue
            prev_split_subpart = prev_subparts[j].split(";")
            split_subpart = subpart.split(";")
            not_pointers = len(prev_split_subpart) == 2 and len(split_subpart) == 2
            if (
                not_pointers and
                 # main test
                int(prev_split_subpart[1]) - int(split_subpart[1]) == 0
            ):
                compressed_subpart = f"{split_subpart[0]}^"
            else:
                compressed_subpart = subpart
            compressed_structure.append(compressed_subpart)
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def zero_start(compressed_structures):
    print(
        "Compress 0-start coordinates, e.g. 0:283 -> 283",
    )
    tmp_structs = []
    for (i, structure) in enumerate(compressed_structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        for (j, subpart) in enumerate(subparts):
            split_subpart = subpart.split(";")
            if len(split_subpart) == 2 and split_subpart[0][-1] == "0":
                compressed_subpart = split_subpart[0][:-1] + split_subpart[1]
            else:
                compressed_subpart = subpart
            compressed_structure.append(compressed_subpart)
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def zero_start_pointers(compressed_structures):
    print(
        "Compress 0-start pointers, e.g. 0_3 -> _3 and 0_0 -> _",
    )
    tmp_structs = []
    for (i, structure) in enumerate(compressed_structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        for (j, subpart) in enumerate(subparts):
            split_subpart = subpart.split("_")
            if len(split_subpart) == 2 and split_subpart[0] == "0":
                if split_subpart[1] == "0":
                    compressed_subpart = "_"
                else:
                    compressed_subpart = f"_{split_subpart[1]}"
            else:
                compressed_subpart = subpart
            compressed_structure.append(compressed_subpart)
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def noncanonical_names(compressed_structures):
    print("Trim non-canonical transcript names, e.g. ACE2-208 -> 8")
    gene_keys = {}
    tmp_structs = []
    for structure in compressed_structures:
        split_tx_name = structure[0].split('-')
        gene = "".join(split_tx_name[:-1])
        tx_num = int(split_tx_name[-1]) # e.g. 208 in ACE2-208
        if gene in gene_keys:
            ref_tx_base_num = gene_keys[gene]
            trimmed_tx_num = tx_num - ref_tx_base_num # e.g. 208 - 200
            structure[0] = str(trimmed_tx_num) # e.g. 8
        else:
            str_tx_num = str(tx_num)
            highest_digit = int(str_tx_num[0])
            num_digits = len(str(tx_num))
            ref_tx_base_num = highest_digit * (10 ** (num_digits - 1))
            gene_keys[gene] = ref_tx_base_num # e.g. 200
        tmp_structs.append(structure)
    compressed_structures = tmp_structs
    return compressed_structures

def coterminal_postexon_utrs(compressed_structures):
    print("Compress coterminal post-exon UTR lengths, e.g. 10782;113  U113 -> 10782;113  U")
    tmp_structs = []
    for (i, structure) in enumerate(compressed_structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]

        if len(subparts) < 2:
            # print(f"Odd transcript at index {str(i)}, < 2 subparts", structure)
            tmp_structs.append(compressed_structure)
            continue

        prev_subpart = subparts[-2]
        subpart = subparts[-1]

        if len(prev_subpart) > 0 and len(subpart) > 0 and subpart[0] == "U":
            if ";" not in subpart:
                utr_length = subpart[1:]
            else:
                utr_length = subpart.split(";")[1]
            if ";" not in prev_subpart:
                exon_length = prev_subpart[1:]
            else:
                exon_length = prev_subpart.split(";")[1]
            if (
                utr_length.isdigit() and exon_length.isdigit() and
                int(utr_length) - int(exon_length) == 0
            ):
                subpart = "U"
        structure[-1] = subpart
        tmp_structs.append(structure)
    compressed_structures = tmp_structs
    return compressed_structures

def tab_runs(compressed_structures):
    print("Compress runs of tabs, e.g. 3_         -> 3_t4")
    tmp_structs = []
    for (i, structure) in enumerate(compressed_structures):
        compressed_structure = structure[0:3]
        subparts = structure[3:]
        compressed_subparts = []
        run_length = 0
        for (j, subpart) in enumerate(subparts):
            if j == 0:
                compressed_subparts.append(subpart)
                continue
            is_tab = subpart == ""
            prev_is_tab = subparts[j - 1] == ""
            is_last_subpart = j == len(subparts) - 1
            if is_tab:
                run_length += 1
                if not is_last_subpart:
                    continue
            if ((not is_tab) or is_last_subpart) and prev_is_tab and run_length > 1:
                compressed_run = "t" + str(run_length)
                compressed_subparts += [compressed_run, subpart]
                run_length = 0
            else:
                compressed_subparts.append(subpart)
        compressed_structure += compressed_subparts
        # print('original structure', structure, ' o')
        # print('compressed_structure', compressed_structure)
        tmp_structs.append(compressed_structure)
    compressed_structures = tmp_structs
    return compressed_structures

def strand(compressed_structures):
    print('Compress "+" to "" in strand column')
    tmp_structs = []
    for structure in compressed_structures:
        strand = structure[2]
        if strand == '+': # Human protein coding genes: 9.9k +, 9.7k -
            structure[2] = ''
        tmp_structs.append(structure)
    compressed_structures = tmp_structs
    return compressed_structures

def canonical_names(compressed_structures):
    print(
        "Trim canonical transcript names, e.g. ACE2-201 -> 201"
    )
    tmp_structs = []
    for structure in compressed_structures:
        split_tx_name = structure[0].split('-')
        if len(split_tx_name) > 1:
            structure[0] = f"!{split_tx_name[1]}"
        tmp_structs.append(structure)
    compressed_structures = tmp_structs
    return compressed_structures


def compress_structures(structures):
    """Compress a list of gene structures, i.e. transcripts
    """

    # Helpful for quick development / debugging
    # structures = structures[0:20]

    compressed_structures = relative_start(structures)
    compressed_structures = utr_direction(compressed_structures)
    compressed_structures = pointers(compressed_structures)
    compressed_structures = coterminal_exons_utrs(compressed_structures)
    compressed_structures = same_index_lengths(compressed_structures, structures)
    compressed_structures = zero_start(compressed_structures)
    compressed_structures = zero_start_pointers(compressed_structures)
    compressed_structures = noncanonical_names(compressed_structures)
    compressed_structures = coterminal_postexon_utrs(compressed_structures)
    compressed_structures = tab_runs(compressed_structures)
    compressed_structures = strand(compressed_structures)

    # Keep this last, and make index immediately before this compression
    compressed_structures = canonical_names(compressed_structures)

    return compressed_structures
