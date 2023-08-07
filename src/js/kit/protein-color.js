/**
 * @fileoverview Colors for protein features, e.g. domains, families, and sites
 *
 * The color design is intended to visually distinguish protein features, so
 * that patterns can be recognized among interacting and paralogous genes.
 * Colors for each domain were manually assigned, in an iterative process of
 * browsing gene leads ideogram and setting colors per that intent.  Color
 * sometimes overlaps with function, and sometimes not function but moreso
 * visually distinction from other protein features in a given gene leads view.
 */

// Default
const grey = '#AAA';
const greyLine = '#555';

const lightGrey = '#D8D8D8';
const lightGreyLine = '#888';

const darkGrey = '#888';
const darkGreyLine = '#333';

// const red = '#F00';
// const redLines = '#800';
const red = '#F55';
const redLine = '#A00';
const magenta = '#922D5E';
const magentaLines = '#D26D9E';
const faintRed = '#CAA';
const faintRedLine = '#866';
const redderFaintRed = '#E88';
const redderFaintRedLine = '#A55';
const pink = '#FFC0CB';
const pinkLine = '#CF909B';

const blue = '#99D';
const blueLine = '#22C';
const lightBlue = '#CCF';
const lightBlueLine = '#33D';
const veryLightBlue = '#EEF';
const veryLightBlueLine = '#AAF';
const darkBlue = '#66B';
const darkBlueLine = '#116';

const green = '#7D7';
const greenLine = '#393';
const darkGreen = '#3A3';
const darkGreenLine = '#060';
const seafoam = '#93E9BE';
const seafoamLine = '#53AC7E';

// Purples
const darkPurple = '#51087E';
const darkPurpleLine = '#8138AE';
const purple = '#880ED4';
const purpleLine = '#5800A4';
const purple2 = '#A020F0';
const purple2Line = '#7000C0';
const lightPurple = '#B24BF3';
const lightPurpleLine = '#520B83';
const veryLightPurple = '#D7A1F9';
const veryLightPurpleLine = '#A771C9';
const ultraLightPurple = '#EEDDFF';
const ultraLightPurpleLine = '#A771C9';

const darkBrown = '#964B00';
const darkBrownLine = '#660B00';
const brown = '#C87D32';
const brownLine = '#722810';
const lightBrown = '#DACDBA';
const lightBrownLine = '#A99A89';

const orange = '#FFA500';
const orangeLines = '#DD8000';
const darkOrange = '#DD8300';
const darkOrangeLines = '#883000';

const lightOrange = '#FFEA66';
const lightOrangeLine = '#FFB466';

const orangeBrown = '#EEBB00';
const orangeBrownLine = '#A99A89';

const yellow = '#FF3';
const yellowLine = '#AA0';
const lightYellow = '#FFFBCC';
const lightYellowLine = '#CCC89A';


const lightGreen = '#BCB';
const lightGreenLine = '#9A9';
const veryLightGreen = '#DFD';
const veryLightGreenLine = '#CDC';

export function getColors(domainType) {

  // Signal peptides
  if (domainType === 'S') {
    // return ['#F90', '#5D5'];
    // return ['#F90', '#090'];
    // return ['#FF2', '#F99'];
    return ['#FF2', '#F99'];
  }

  // Topological features
  else if (domainType === 'Extracellular') {
    return [veryLightBlue, veryLightBlueLine];
  } else if (domainType === 'Cytoplasmic') {
    return [lightYellow, lightYellowLine];
  } else if (
    domainType === 'Helical' ||
    domainType.startsWith('Helical ---')
  ) {
    return [lightBrown, lightBrownLine];
  } else if (
    domainType === 'Lumenal'
  ) {
    return [lightOrange, lightOrangeLine];
  } else if (
    domainType === 'Lumenal, melanosome' // e.g. in TYR
  ) {
    return [orangeBrown, orangeBrownLine];
  } else if (
    domainType === 'Mitochondrial matrix' // e.g. SDHC in ACMG
  ) {
    return [veryLightGreen, veryLightGreenLine];
  } else if (
    domainType === 'Mitochondrial intermembrane'
  ) {
    return [lightGreen, lightGreenLine];
  } else if (domainType === 'Perinuclear space') {
    // E.g. TMEM43
    return [ultraLightPurple, ultraLightPurpleLine];
  } else if (domainType === 'Nuclear') {
    return [veryLightPurple, veryLightPurpleLine];
  } else if (domainType === 'Beta stranded') {
    return [blue, blueLine];
  }

  // Sites, domains, features, and other entries
  else if (
    domainType.includes('conserved site') || // https://www.google.com/search?q=pymol+conserved+site+color&tbm=isch
    domainType.includes('conserved domain') ||
    domainType === 'WGR domain' ||
    domainType === 'R3H domain' ||
    domainType.includes('QLQ') ||
    domainType === 'Sema domain' ||
    domainType === 'Proteasome component (PCI) domain' ||
    domainType === 'Sterol-sensing domain' ||
    domainType === 'Erythropoietin/thrombopoietin' ||
    domainType === 'SPRY domain' ||
    domainType === 'Anaphylatoxin/fibulin' ||
    domainType === 'Tetratricopeptide repeat' ||
    domainType === 'Doublecortin domain' ||
    domainType.includes('Glycosyl transferase') ||
    (
      domainType.toLowerCase().includes('lethal') &&
      domainType.toLowerCase().includes('c-terminal')
    ) ||
    domainType.includes('PUB') ||
    domainType.includes('Myogenic determination') ||
    domainType === 'Globin' ||
    domainType === 'GPS motif' ||
    domainType.includes('D-like')
  ) {
    return [magenta, magentaLines];
  } else if (
    // Enzymatic sites
    domainType.includes('active site') ||
    domainType.includes('hydroxylation site') ||
    domainType.includes('catalytic domain') ||
    domainType.includes('Lipid transport') ||
    domainType === 'BRCA1, serine-rich domain' ||
    domainType === 'Tower domain' || // Important in BRCA2
    domainType.endsWith('attachment site') ||
    domainType.endsWith('amyloid-beta peptide') ||
    domainType === 'Reverse transcriptase domain' ||
    domainType ===
      'Membrane attack complex component/perforin (MACPF) domain' ||
    domainType === 'Alpha-2-macroglobulin' ||
    domainType === 'Kinesin motor domain' ||
    domainType === 'Adenomatous polyposis coli tumour suppressor protein'
  ) {
    return [red, redLine];
  } else if (
    // Enzymatic domains, C-terminal regions, and miscellaneous
    domainType === 'Cyclin, C-terminal domain' ||
    domainType.includes('OB C-terminal domain') ||
    domainType === 'Cationic amino acid transporter, C-terminal' ||
    domainType === 'High mobility group box domain' ||
    domainType === 'HMG-box domain' ||
    domainType.includes('CUB domain') ||
    domainType === 'C-5 cytosine methyltransferase' ||
    domainType.includes('(G-protein), alpha subunit') ||
    domainType === 'SCAN domain' ||
    domainType === 'Apolipoprotein A/E' ||
    domainType.includes('SMAD domain') ||
    domainType === 'PLAC' ||
    domainType.endsWith('tripeptidyl peptidase II') ||
    domainType === 'Prohormone convertase enzyme' ||
    domainType.includes('rod domain') ||
    domainType === 'Osteopontin' ||
    domainType === 'SPRY-associated' ||
    domainType === 'C1q domain' ||
    domainType === 'OAR domain' ||
    domainType.includes('FTO, C-terminal') ||
    domainType.includes('ATPase, C-terminal') ||
    domainType.includes('Hint domain') ||
    domainType === 'Laminin IV' ||
    domainType === 'NACHT-associated domain' ||
    domainType.includes('FANCD2') ||
    domainType.startsWith('Acyl-CoA') && domainType.endsWith('C-terminal') ||
    domainType === 'Kinesin-like' ||
    domainType === 'GUCT' ||
    domainType.includes('(APC) repeat') || // e.g. as in APC gene
    domainType.includes('IP3R') // e.g. RYR1
  ) {
    return [faintRed, faintRedLine];
  } else if (
    domainType.includes('trypsin domain') ||
    domainType.includes('scaffold dimerization') ||
    domainType.includes('eIF-4 gamma, MA3') || // e.g. PDCD4
    domainType === 'Troponin' || // e.g. TNNT1
    domainType === 'SKI/SNO/DAC domain' // SKIL gene
  ) {
    return [redderFaintRed, redderFaintRedLine];
  } else if (
    domainType === 'EGF-like calcium-binding domain' ||
    domainType.includes('PTX/LNS') ||
    domainType === 'HSR domain' ||
    domainType.includes('MutS, clamp') ||
    domainType.includes('S5 domain 2-like') || // e.g. MLH1 in ACMG
    domainType.endsWith('CC1/2') // e.g. PRKDC
  ) {
    return [darkGreen, darkGreenLine];
  } else if (
    // Binding sites, and smaller binding regions
    domainType.includes('binding site') ||
    domainType === 'EF-hand domain' ||
    domainType.includes('EF hand-like') ||
    domainType === 'Zinc finger, nuclear hormone receptor-type' ||
    domainType.includes('Serpin domain') ||
    domainType === 'Peptidase C14,  p20 domain' ||
    domainType === 'PWWP domain' ||
    domainType === 'Peptidoglycan binding-like' ||
    domainType === 'MAD homology 1, Dwarfin-type' ||
    domainType === 'F-actin binding' ||
    (
      domainType.includes('Glycoside hydrolase') &&
      domainType.endsWith('domain')
    ) ||
    domainType === 'p53 tumour suppressor family' ||
    domainType === 'Menin' || // tumor suppressor, e.g. MEN1 in ACMG
    domainType.includes('von Hippel') && domainType.includes('beta') || // VHLL
    domainType === 'Pointed domain' ||
    domainType.includes('DNA binding') ||
    domainType === 'Helix-hairpin-helix domain' ||
    domainType === 'Helix-hairpin-helix motif' ||
    domainType === 'MIR motif' ||
    domainType === 'Rad52 family' ||
    domainType === 'Oxidoreductase FAD/NAD(P)-binding' ||
    domainType.endsWith('NAD-binding') ||
    domainType.endsWith('NAD binding') ||
    domainType.includes('Bromo adjacent') ||
    domainType === 'HARP domain' ||
    domainType === 'FATC domain' ||
    domainType.startsWith('XRN2-binding') ||
    domainType === 'SRCR-like domain' ||
    domainType.includes('SRCR') ||
    domainType === 'Gamma-carboxyglutamic acid-rich (GLA) domain' ||
    domainType === 'Pterin-binding domain' ||
    domainType === 'Receptor, ligand binding region' ||
    domainType.includes('DHEX domain') ||
    domainType === 'SANT/Myb domain' ||
    domainType.includes('Forkhead-associated') ||
    domainType === 'Rap/Ran-GAP domain' ||
    domainType.endsWith('C2 domain') ||
    domainType.includes('tri-helix bundle domain') // e.g. MYBPC3
  ) {
    return [blue, blueLine];
  } else if (
    domainType.includes('dehydrogenase, molybdopterin binding') ||
    domainType === 'Zinc finger CCHC HIVEP-type' ||
    domainType === 'Cyclin, N-terminal' ||
    domainType === 'MAD homology, MH1' ||
    domainType === 'Sodium ion transport-associated' ||
    domainType === 'Sodium ion transport-associated domain' ||
    domainType.endsWith('head') ||
    domainType === 'Pleckstrin homology domain' ||
    domainType === 'PH domain' ||
    domainType.endsWith('pleckstrin homology-like domain') ||
    domainType === 'DEP domain' ||
    domainType === 'Post-SET domain' ||
    domainType.includes('Glycoside hydrolase') ||
    domainType === 'Pyridoxal phosphate-dependent decarboxylase' ||
    domainType.includes('OB1') ||
    domainType.includes('OB3') ||
    domainType.includes('OB domain') ||
    domainType === 'Fork head domain' ||
    domainType === 'Histone deacetylase domain' ||
    domainType.includes('MG1') ||
    domainType === 'Homocysteine-binding domain' ||
    domainType.startsWith('Acyl-CoA') && domainType.endsWith('N-terminal')
  ) {
    return [lightBlue, lightBlueLine];
  } else if (
    // Larger binding regions and miscellaneous
    domainType.includes('zinc-binding') ||
    domainType.includes('DNA-binding') ||
    domainType === 'G protein-coupled receptor, rhodopsin-like' ||
    domainType.includes('CXC domain') ||
    domainType.includes('Homeobox domain') ||
    domainType.includes('BRCT domain') ||
    domainType.includes('EF-hand') ||
    domainType === 'Laminin G domain' ||
    domainType === 'Peptidase C14, caspase non-catalytic subunit p10' ||
    domainType === 'ADD domain' ||
    domainType === 'PDZ domain' ||
    domainType === 'Krueppel-associated box' ||
    domainType === 'Ets domain' ||
    domainType === 'P domain' ||
    domainType.includes('bHLH') ||
    domainType === 'Ras-associating (RA) domain' ||
    domainType === 'Ras-associating domain' ||
    domainType ===
      'Calcium/calmodulin-dependent protein kinase II, association-domain' ||
    domainType === 'Bromodomain' ||
    domainType === 'Bromodomain associated domain' ||
    domainType === 'SLIDE domain' ||
    domainType === 'Peptidase M24' ||
    domainType === 'Pentraxin-related' ||
    domainType.includes('Notch ligand') ||
    domainType === 'Anti-proliferative protein' ||
    domainType.includes('transpeptidase') ||
    domainType === 'Tuberin-type domain' ||
    domainType === 'Ras-like guanine nucleotide exchange factor, N-terminal' ||
    domainType.includes('factor-binding protein') || // as in IGFBP3
    domainType.includes('GPD') // e.g. MUTYH in ACMG
  ) {
    return [darkBlue, darkBlueLine];
  } else if (
    domainType === 'SH2 domain' ||
    domainType.includes('SH2-like domain') ||
    domainType.includes('Furin-like') ||
    domainType.includes('heparin-binding') ||
    domainType === 'SRCR domain' ||
    domainType === 'EGF-like domain' ||
    domainType === 'Basic leucine zipper domain, Maf-type' ||
    domainType.startsWith('Leucine zipper') ||
    domainType.includes('Interleukin') && domainType.includes('propeptide') ||
    domainType === 'Sirtuin family' ||
    domainType === 'Amino acid/polyamine transporter I' ||
    domainType === 'Peptidase M10, metallopeptidase' ||
    domainType === 'Metallothionein' ||
    domainType === 'DDHD domain' ||
    domainType === 'Zinc finger C2H2-type' ||
    domainType === 'Zinc finger, PARP-type' ||
    domainType.endsWith('tail domain') ||
    domainType === 'SET domain' ||
    domainType === 'Hamartin' || // e.g. TSC2 in ACMG; interacts with tuberin
    domainType.includes('von Hippel') && domainType.includes('alpha') || // VHLL
    domainType.includes('transactivation domain 2') ||
    domainType === 'Phosphopantetheine binding ACP domain' ||
    domainType === 'Multicopper oxidase, second cupredoxin domain' ||
    domainType === 'Helicase, C-terminal' ||
    domainType.endsWith('CC3') // e.g. PRKDC
  ) {
    return [green, greenLine];
  } else if (
    domainType === 'Insulin-like' ||
    domainType === 'Fibroblast growth factor family' ||
    domainType === 'Nerve growth factor-related' ||
    domainType === 'Transforming growth factor-beta, C-terminal' ||
    domainType === 'Telomere-length maintenance and DNA damage repair' ||
    domainType === 'PDGF/VEGF domain' ||
    domainType.includes('SH3-RhoGEF') ||
    domainType.includes('MG4') ||
    domainType.includes('RING domain') ||
    domainType.includes('RING-type') ||
    domainType.startsWith('DEAD/DEAH') ||
    domainType === 'Laminin alpha, domain I' ||
    domainType.toLowerCase().includes('nuclear/hormone receptor') ||
    domainType === 'P-type trefoil domain' // e.g. GAA in ACMG
  ) {
    return [darkGreen, darkGreenLine];
  } else if (
    domainType === 'SH3 domain' ||
    domainType === 'Variant SH3 domain' ||
    domainType.endsWith('SH3 domain') ||
    domainType.includes('copper-binding') ||
    domainType === 'Sushi/SCR/CCP domain' ||
    domainType.includes('Coagulation factor 5/8') ||
    domainType === 'Basic-leucine zipper domain' ||
    domainType === 'Basic region leucine zipper' ||
    domainType === 'Sirtuin family, catalytic core domain' ||
    domainType === 'Amine oxidase' ||
    domainType.includes('peroxidase') ||
    domainType.includes('lid domain') ||
    domainType.includes('prodomain') ||
    domainType === 'Pre-SET domain' ||
    domainType.includes('transactivation domain') ||
    domainType.includes(' activation domain') ||
    domainType === 'Thioesterase' ||
    domainType.includes('esterase') ||
    domainType.endsWith('Claudin superfamily') ||
    domainType === 'Retinoblastoma-associated protein, A-box' ||
    domainType.includes('Between PH and SH2') ||
    domainType.includes('inter-SH2') ||
    domainType === 'Chromogranin A/B/C' ||
    domainType.toLowerCase().includes('helicase') ||
    domainType.endsWith('pro-domain') ||
    domainType === 'Brix domain' ||
    domainType === 'Coagulation Factor Xa inhibitory site' ||
    domainType === 'Trypsin Inhibitor-like, cysteine rich domain' ||
    domainType.toLowerCase().includes('cystatin') ||
    domainType === 'EGF domain' ||
    domainType === 'Axin beta-catenin binding' ||
    domainType === 'Peptidase M2, peptidyl-dipeptidase A' ||
    domainType.endsWith('phosphatase domain') ||
    domainType === 'PIGA, GPI anchor biosynthesis' ||
    domainType.startsWith('Acyl-CoA') && domainType.endsWith('middle domain') ||
    domainType.includes('(COR)') ||
    domainType === 'K Homology domain, type 2' ||
    domainType.includes('Phox') ||
    domainType.includes('PB1') ||
    domainType.includes('multifunctional domain') ||
    domainType.includes('MutS, core') ||
    domainType.endsWith('CC5') // e.g. PRKDC
  ) {
    return [seafoam, seafoamLine];
  } else if (
    // Immunoglobulin domains are colored in the pink-purple spectrum
    domainType === 'Immunoglobulin-like domain' ||
    domainType.toLowerCase().endsWith('immunoglobulin-like domain') ||
    domainType.endsWith('Ig domain') ||
    domainType.endsWith('Ig-like domain') ||
    domainType === 'Major facilitator superfamily domain' ||
    domainType.includes('interface') ||
    domainType === 'Class I myosin tail homology domain' ||
    domainType === 'Myosin tail' ||
    domainType === 'Acyl transferase' ||
    domainType.endsWith('transferase') ||
    domainType.startsWith('Acyl-CoA') ||
    domainType === 'JAK, FERM F2 lobe domain' ||
    domainType === 'Sodium/solute symporter' ||
    domainType.includes('foci domain') ||
    domainType.includes('Receptor L-domain') ||
    domainType === 'Wnt' ||
    domainType === 'R-spondin, Fu-CRD domain' ||
    domainType.endsWith('merisation domain') || // e.g. di- / tetramerisation
    domainType.endsWith('merization domain') ||
    domainType.endsWith('merisation motif') || // e.g. di- / tetramerisation
    domainType.endsWith('merization motif') ||
    domainType.endsWith('BTB/POZ domain') || // homodimerization domain
    domainType.includes('CBS domain') || // these domains homo-dimerize
    domainType === 'DZF domain' || // domain associated with zinc fingers; dimerisation domain
    domainType === 'GS domain' || // in kinase superfamily
    domainType.includes('kinase domain') ||
    domainType.includes('FAT') ||
    domainType.startsWith('von Willebrand factor, type A') ||
    domainType.includes('VWA') ||
    domainType === 'Reeler domain' ||
    domainType === 'BMP/retinoic acid-inducible neural-specific protein' ||
    domainType === 'Low-density lipoprotein (LDL) receptor class A repeat' ||
    domainType === 'TILa domain' ||
    domainType.includes('chromosome condensation') ||
    domainType === 'Immunoglobulin I-set' || // e.g. MYBPC3
    domainType === 'Kinesin-associated' ||
    domainType === 'SMCs flexible hinge' // e.g. SMC1A
  ) {
    return [pink, pinkLine];
  } else if (
    domainType === 'Immunoglobulin' ||
    domainType === 'Immunoglobulin domain' ||
    domainType === 'CD20-like family' ||
    domainType === 'Calponin homology domain' ||
    domainType.endsWith('Calponin-homology domain') ||
    domainType.includes('ATPase') ||
    domainType.includes('ATP coupling domain') ||
    domainType.includes('globular domain') ||
    domainType === 'Mitochondrial substrate/solute carrier' ||
    domainType === 'Major facilitator,  sugar transporter-like' ||
    domainType === 'Major facilitator, sugar transporter-like' ||
    domainType === 'Sodium:neurotransmitter symporter' ||
    domainType.toLowerCase().includes('methyltransferase') ||
    domainType === 'Rhodanese-like domain' ||
    domainType.startsWith('Thyroglobulin') ||
    domainType === 'Retinoblastoma-associated protein, B-box' ||
    domainType === 'C-type lectin-like' ||
    domainType === 'Galectin, carbohydrate recognition domain' ||
    domainType === 'VWFC domain' || // von Willebrand
    domainType.includes('CFC domain') ||
    domainType === 'POLO box domain' ||
    domainType.endsWith('domain 1') ||
    domainType.endsWith('domain II') || // e.g. EEF2
    domainType === 'Fibronectin, type I' ||
    domainType === 'Cadherin-like' ||
    domainType === 'G-protein gamma-like domain' ||
    domainType === 'GoLoco motif' ||
    domainType === 'MyTH4 domain' ||
    domainType.endsWith('isomerase') ||
    domainType === ('BTB/Kelch-associated') // associated with BTB/POZ
  ) {
    return [veryLightPurple, veryLightPurpleLine];
  } else if (
    domainType === 'Immunoglobulin C1-set' ||
    domainType.includes('GTPase') ||
    domainType === 'RGS domain' ||
    domainType === 'Major facilitator superfamily' ||
    domainType === 'Fibronectin type II domain' ||
    domainType.includes('ectodomain') ||
    domainType.endsWith('receptor domain') ||
    domainType.endsWith('receptor domain 4') ||
    domainType === 'MAM domain' ||
    domainType === 'IPT domain' ||
    domainType.endsWith('extracellular') ||
    domainType === 'Link domain' ||
    domainType.includes('connector domain') ||
    domainType === 'WW domain' ||
    domainType === 'WHIM1 domain' ||
    domainType.includes('MHC class II') && !domainType.includes('C-terminal') ||
    domainType === 'TNFR/NGFR cysteine-rich region' ||
    domainType === 'Frizzled domain' ||
    domainType === 'Netrin module, non-TIMP type' ||
    domainType === 'CFTR regulator domain' ||
    domainType.endsWith('domain 2') ||
    domainType === 'GNAT domain' ||
    domainType === 'NIDO domain' ||
    domainType === 'Myosin head, motor domain' ||
    domainType === 'von Willebrand domain, type D domain' ||
    domainType === 'Kinesin-like KIF1-type' ||
    domainType.includes('Paxillin') // e.g. PXN, an ACMG gene
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    domainType === 'Fibronectin type III' ||
    domainType === 'Tissue factor' ||
    domainType === 'Immunoglobulin C2-set' ||
    domainType.includes('immunoglobulin C2-set') ||
    domainType.includes('protein interaction') ||
    domainType.includes('interacting') ||
    domainType === 'SWIRM domain' ||
    domainType.includes('(DSL) protein') ||
    domainType === 'Dishevelled protein domain' ||
    domainType.endsWith('domain 3') ||
    domainType === 'DnaJ domain' ||
    domainType.toLowerCase().includes('nuclear receptor')
  ) {
    return [purple, purpleLine];
  } else if (
    domainType === 'Immunoglobulin V-set domain' ||
    domainType.includes('V-set domain') ||
    domainType.includes('V-like') ||
    domainType.includes('MHC class I') && !domainType.includes('C-terminal') ||
    domainType === 'Frizzled/Smoothened, 7TM' ||
    domainType.endsWith('domain 4') ||
    domainType === 'Integrin alpha-2' ||
    domainType === 'Calcium-activated potassium channel BK, alpha subunit' ||
    domainType.includes('Dbl homology (DH) domain') ||
    domainType.includes('Glycine rich') ||
    domainType.toLowerCase().includes('exonuclease') ||
    domainType === 'WHIM2 domain' ||
    domainType.includes('Coactivator CBP') // e.g. EP300
  ) {
    return [darkPurple, darkPurpleLine];
  }
  // Not great in MYBPC3, an AGMC gene
  // else if (
  //   domainType === 'Immunoglobulin I-set'
  // ) {
  //   return [purple2, purple2Line];
  // }

  else if (
    domainType === 'Desmoplakin, spectrin-like domain' ||
    domainType === 'Spectrin repeat' ||
    domainType.endsWith('TED domain') ||
    domainType === 'Polyadenylate-binding protein/Hyperplastic disc protein' ||
    domainType.includes(' cap domain') ||
    domainType.toLowerCase().includes('agenet') ||
    domainType.includes('TATA') ||
    domainType.includes('Citron') ||
    domainType === 'RIH domain'
  ) {
    return [yellow, yellowLine];
  }

  else if (
    // Repeats, iron, some transmembrane
    domainType === 'Armadillo' ||
    domainType.includes('Apple domain') ||
    domainType === 'Protocadherin' || // Cytoplasmic
    domainType === 'DIX domain' ||
    domainType === 'Ferritin-like diiron domain' ||
    domainType === '4Fe-4S dicluster domain' ||
    domainType === 'PAS domain' ||
    domainType === 'PAS fold' ||
    domainType === 'Polyketide synthase, dehydratase domain' ||
    domainType === 'Flavodoxin/nitric oxide synthase' ||
    domainType === 'Flavodoxin-like fold' ||
    domainType === 'G-patch domain' ||
    domainType === 'Chromo domain' ||
    domainType.toLowerCase().includes('tudor') ||
    domainType === 'Cytochrome P450' ||
    domainType === 'Potassium channel domain' ||
    domainType === 'G2 nidogen/fibulin G2F' ||
    domainType.includes('bait region') ||
    domainType === 'WWE domain' ||
    domainType.endsWith('deiodinase') ||
    domainType === 'Cobalamin (vitamin B12)-binding domain' ||
    domainType === 'Laminin domain II' ||
    domainType === 'Troponin I residues 1-32' || // e.g. TNNI3 in ACMG
    domainType === 'KI67R' // KI67 / Chmadrin repeat
  ) {
    return [orange, orangeLines];
  } else if (
    domainType.includes('Kringle') ||
    domainType.includes('Peptidase M12A') ||
    domainType === 'TGF-beta, propeptide' ||
    domainType.includes('autopeptidase') ||
    domainType.includes('GAIN') ||
    domainType === 'PIK-related kinase' ||
    domainType.includes('(PIK) domain') ||
    domainType === 'LDLR class B repeat' ||
    domainType === 'Actin family' ||
    domainType === 'Ferritin/DPS protein domain' ||
    domainType === 'PAS fold-3' ||
    domainType === 'Polyketide synthase, ketoreductase domain' ||
    domainType.startsWith('Heat shock protein') && domainType.endsWith('family') ||
    domainType === 'BAG domain' || // e.g. BAG3 in AGMC, a chaperone
    domainType === 'MCM domain' ||
    domainType.endsWith('reductase-like') ||
    domainType === 'Lipase' ||
    domainType === 'Phospholipase A2 domain' ||
    domainType === 'Notch domain' ||
    domainType.includes('LCCL domain') ||
    domainType.includes('SANT-like') ||
    domainType ===
      'VWF/SSPO/Zonadhesin-like, cysteine-rich domain' || // As in VWF
    domainType === 'Kappa casein' ||
    domainType === 'Natriuretic peptide' ||
    domainType === 'EMI domain' ||
    domainType === 'Neurohypophysial hormone' ||
    domainType === 'Synuclein' ||
    domainType.includes('Hydroxymethylglutaryl-CoA reductase') ||
    domainType.includes('Perilipin') ||
    domainType.includes('lipase') ||
    domainType.includes('SAND') ||
    domainType.toLowerCase().includes('HSP')
  ) {
    return [lightBrown, lightBrownLine];
  } else if (
    domainType === 'Notch, NOD domain' ||
    domainType === 'Cadherin, Y-type LIR-motif' ||
    domainType === 'Protein patched/dispatched' ||
    domainType.includes('membrane-proximal') ||
    domainType === 'LicD family' ||
    domainType.includes('MoaB/Mog')
  ) {
    return [brown, brownLine];
  } else if (
    // Transmembrane, etc.
    domainType.includes('transmembrane domain') ||
    domainType.includes('trans-membrane domain') ||
    domainType.includes('Transmembrane protein') ||
    domainType.includes('Triadin') ||
    domainType.includes('Collectrin') ||
    domainType.includes('membrane glycoprotein') ||
    domainType === 'SEA domain' ||
    domainType === 'CD36 family' ||
    domainType.includes('CD34') ||
    domainType === 'Hypoxia-inducible factor, alpha subunit' ||
    domainType === 'Hypoxia-inducible factor, alpha subunit-like' ||
    domainType === 'PKD domain' ||
    domainType.includes('regulatory domain') ||
    domainType.endsWith('E2 domain') ||
    domainType === 'PLAT/LH2 domain' ||
    domainType === 'Notch, NODP domain' ||
    domainType === 'Syndecan/Neurexin domain' ||
    domainType === 'Zona pellucida domain' ||
    domainType.includes('Ion transport domain') ||
    domainType.endsWith('Membrane transport protein MMPL domain') ||
    domainType.includes('Caveolin') ||
    domainType === 'Band 7 domain' ||
    domainType.includes('Shisa') ||
    domainType === 'ABC-2 family transporter protein' ||
    domainType === 'Anoctamin'
  ) {
    return [darkBrown, darkBrownLine];
  } else if (
    // Death, ubiquitination, apoptosis, etc.
    domainType === 'DAPIN domain' ||
    domainType === 'Death effector domain' ||
    domainType === 'Death domain' ||
    domainType.includes('death protein') ||
    domainType.toLowerCase().includes('lethal') ||
    domainType.includes('UBA domain') ||
    domainType.includes('HECT domain') ||
    domainType.toLowerCase().includes('ubiquitin') ||
    domainType.includes('necrosis') ||
    domainType.includes('Bcl-2') ||
    domainType.includes('CIDE-N') ||
    domainType === 'Disintegrin domain' ||
    domainType.includes('TRAF') ||
    domainType.includes('TIR') ||
    domainType.toLowerCase().includes('caspase')
  ) {
    return [darkGrey, darkGreyLine];
  } else if (
    domainType.includes('unknown function') ||
    domainType.toLowerCase().includes('unstructured') ||
    domainType.startsWith('Uncharacterised')
  ) {
    return [grey, greyLine];
  } else if (
    domainType.toLowerCase().includes('leucine rich repeat') ||
    domainType.includes('HIN') ||
    domainType.includes('calcium') ||
    domainType.toLowerCase().includes('calreticulin') ||
    domainType.includes('cytokine receptor') ||
    domainType.includes('pore forming') ||
    domainType.includes('RHIM') ||
    domainType.includes('SWIB') ||
    domainType === 'Ryanodine receptor Ryr' ||

    // Associated with repeats
    domainType.includes('Armadillo') || // e.g. APC
    domainType === 'UME domain' || // overlaps Armadillo-type fold, e.g. ATR
    domainType.includes('WD40 domain') ||

    domainType === 'WSTF/Acf1/Cbp146' || // ATP-utilising chromatin assembly and remodeling factor
    domainType.endsWith('repeat ring region') || // e.g. TRRAP

    // GPCRs
    domainType === 'GPCR, rhodopsin-like, 7TM' ||
    domainType === 'GPCR, family 2, secretin-like' ||
    domainType === 'GPCR, family 3, nine cysteines domain' ||
    domainType === 'G-protein coupled receptor'
  ) {
    return [darkOrange, darkOrangeLines];
  } else if (
    domainType.includes('repeat') ||
    domainType === 'Vitellinogen, open beta-sheet' ||
    domainType.includes('Interleukin') && domainType.includes('family') ||
    /Interleukin-\d+$/.test(domainType) ||
    domainType === 'Chemokine interleukin-8-like domain' ||
    domainType.includes('beta-ribbon') ||
    domainType.includes('cytoplasmic domain') ||
    domainType.toLowerCase().includes('interleukin') ||
    domainType === 'Citrate transporter-like domain' ||
    domainType.toLowerCase().includes('calsequestrin')
  ) {
    return [orange, orangeLines];
  } else if (
    domainType.includes('inhibit') ||
    domainType.includes('central') ||
    domainType === '[2Fe-2S]-binding' ||
    domainType.endsWith('tail') ||
    domainType.endsWith('helical domain') ||
    domainType.endsWith('helical domain HD2') ||
    domainType.endsWith('coiled-coil domain') ||
    domainType.endsWith('coiled-coil region') ||
    domainType.includes('zinc ribbon fold') ||
    domainType.includes('zinc-ribbon') ||
    domainType === 'Macroglobulin domain' ||
    domainType.includes('KH0') ||
    domainType.includes('EGF') ||
    domainType.toLowerCase().includes('olfact')
  ) {
    return [seafoam, seafoamLine];
  } else if (
    domainType.includes('Peptidase') ||
    domainType.includes('Ras-binding') ||
    domainType.includes('CRIB domain')
  ) {
    return [blue, blueLine];
  } else if (
    domainType.toLowerCase().includes('zinc finger') ||
    domainType.toLowerCase().includes('zinc-finger') ||
    domainType.includes('RING finger') ||
    domainType.toLowerCase().includes('transcription factor') ||
    domainType === 'Paired domain' || // found in eukaryotic transcription regulatory proteins involved in embryogenesis
    domainType === 'JmjC domain' ||
    domainType === 'BRK domain' ||
    domainType.includes('FAD-binding') ||
    domainType.includes('MG3') ||
    domainType.toLowerCase().includes('polycomb') ||
    domainType.toLowerCase().includes('metallopeptidase') ||
    domainType.toLowerCase().includes('metallo-peptidase') ||
    domainType.toLowerCase().includes('metalloenzyme') ||
    domainType === 'K Homology domain, type 1' ||
    domainType.includes('winged helix') ||
    domainType.toLowerCase().includes('dehydrogenase') ||
    domainType.includes('BAR') ||
    domainType.includes('metal')
  ) {
    return [green, greenLine];
  } else if (
    domainType.startsWith('Tyrosine-protein kinase receptor') ||
    domainType === 'PTB/PI domain' ||
    domainType.endsWith('receptor') ||
    domainType.includes('cysteine rich') ||
    domainType.includes('cysteine-rich') ||
    domainType.toLowerCase().includes('somatomedin b')
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    domainType.startsWith('von Willebrand factor') ||
    domainType.endsWith('receptor-binding') ||
    domainType.toLowerCase().includes('link') ||
    domainType.includes('basic domain') ||

    domainType.includes('domain IV') // e.g. EEF2
  ) {
    return [purple, purpleLine];
  } else if (
    domainType.toLowerCase().includes('golgi') ||
    domainType === 'GOLD domain' ||
    domainType.includes('deaminase') ||
    domainType.includes('C-terminal core') ||
    domainType.includes('nucleoside triphosphatase') ||
    domainType.includes('IspD/TarI') ||
    domainType === 'Telethonin' ||
    domainType.includes('Sarcoglycan') ||
    domainType.includes('toxin') ||
    domainType.includes('ShKT') ||
    domainType.includes('SAM') ||
    domainType.includes('Sterile alpha motif') ||
    domainType.includes('Unconventional myosin-X') ||
    domainType === 'CARD domain' ||
    domainType.includes('endonuclease') ||
    domainType.toLowerCase().includes('splicing factor') ||
    domainType.toLowerCase().includes('interferon') ||
    domainType === 'Tropomyosin' // e.g. TPM1
  ) {
    return [magenta, magentaLines];
  } else if (
    domainType.includes(' TM ') // transmembrane, as in e.g. RYR1
  ) {
    return [darkBrown, darkBrownLine];
  } else if (
    domainType.includes('binding domain') ||
    domainType.includes('binding protein')
  ) {
    return [darkBlue, darkBlueLine];
  } else if (
    domainType.includes('Ribosomal protein') ||
    domainType.toLowerCase().includes('ribosomal subunit') ||
    domainType.toLowerCase().includes('ribonuclease')
  ) {
    return [darkGreen, darkGreenLine];
  } else if (
    domainType.includes('lectin') ||
    domainType.includes('recognition') ||
    domainType.toLowerCase().includes('solute carrier') ||
    domainType.includes('isomerase')
  ) {
    return [veryLightPurple, veryLightPurpleLine];
  } else if (
    domainType.includes('transferase') ||
    domainType.includes('merisation')
  ) {
    return [pink, pinkLine];
  } else if (
    domainType.includes('oxygenase')
  ) {
    return [red, redLine];
  } else if (
    domainType.includes('phosphatase')
  ) {
    return [seafoam, seafoamLine];
  } else if (
    domainType.includes('bind') ||
    domainType.includes('EF')
  ) {
    return [blue, blueLine];
  } else if (
    // C-terminal regions are typically colored red in e.g. PyMol rainbow
    domainType.includes('C-termin') ||
    domainType.includes('C termin') ||
    domainType.includes('kinase')
  ) {
    return [faintRed, faintRedLine];
  } else if (
    // N-terminal regions are typically colored blue in e.g. PyMol rainbow
    domainType.includes('N-termin') ||
    domainType.includes('N-teminal') || // Typo in "CTNNB1 binding, N-teminal"
    domainType.includes('N termin') ||
    domainType.toLowerCase().includes('decarboxylase') ||
    domainType.toLowerCase().includes('hydrolase') ||
    domainType.includes('PH domain')
  ) {
    return [lightBlue, lightBlueLine];
  }

  return [lightGrey, lightGreyLine];
}
