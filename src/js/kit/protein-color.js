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
const grey = '#BBB';
const greyLine = '#666';

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
const pink = '#FFC0CB';
const pinkLine = '#CF909B';

const blue = '#99D';
const blueLines = '#22C';
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

const darkBrown = '#964B00';
const darkBrownLine = '#660B00';
const brown = '#C87D32';
const brownLine = '#722810';
const lightBrown = '#DACDBA';
const lightBrownLine = '#BAAB9A';
const orange = '#FFA500';
const orangeLines = '#DD8000';
const darkOrange = '#DD8300';
const darkOrangeLines = '#CC6000';

const yellow = '#FF3';
const yellowLine = '#AA0';
const lightYellow = '#FFFBCC';
const lightYellowLine = '#CCC89A';

const lightOrange = '#FFEA66';
const lightOrangeLine = '#FFB466';

const lightGreen = '#BCB';
const lightGreenLine = '#9A9';
const veryLightGreen = '#EFE';
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
    domainType === 'Mitochondrial matrix'
  ) {
    return [veryLightGreen, veryLightGreenLine];
  } else if (
    domainType === 'Mitochondrial intermembrane'
  ) {
    return [lightGreen, lightGreenLine];
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
    domainType.includes('Glycosyl transferase')
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
    domainType === 'Alpha-2-macroglobulin'
  ) {
    return [red, redLine];
  } else if (
    // Enzymatic domains, C-terminal regions, and miscellaneous
    domainType.includes('trypsin domain') ||
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
    domainType.includes('Hint domain') ||
    domainType === 'Laminin IV' ||
    domainType === 'NACHT-associated domain'
  ) {
    return [faintRed, faintRedLine];
  } else if (
    domainType === 'EGF-like calcium-binding domain'
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
    domainType === 'Pointed domain' ||
    domainType.includes('DNA binding') ||
    domainType === 'Helix-hairpin-helix domain' ||
    domainType === 'MIR motif' ||
    domainType === 'Rad52 family' ||
    domainType === 'Oxidoreductase FAD/NAD(P)-binding' ||
    domainType.endsWith('NAD-binding') ||
    domainType.includes('Bromo adjacent') ||
    domainType === 'HARP domain' ||
    domainType === 'FATC domain' ||
    domainType.startsWith('XRN2-binding') ||
    domainType === 'SRCR-like domain' ||
    domainType === 'Gamma-carboxyglutamic acid-rich (GLA) domain' ||
    domainType === 'Pterin-binding domain' ||
    domainType === 'Receptor, ligand binding region' ||
    domainType.includes('DHEX domain')
  ) {
    return [blue, blueLines];
  } else if (
    domainType.includes('dehydrogenase, molybdopterin binding') ||
    domainType === 'Zinc finger CCHC HIVEP-type' ||
    domainType === 'Cyclin, N-terminal' ||
    domainType === 'MAD homology, MH1' ||
    domainType === 'Sodium ion transport-associated' ||
    domainType === 'Sodium ion transport-associated domain' ||
    domainType.endsWith('head') ||
    domainType.endsWith('C2 domain') ||
    domainType === 'Pleckstrin homology domain' ||
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
    domainType === 'Homocysteine-binding domain'
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
    domainType.includes('factor-binding protein') // as in IGFBP3'
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
    domainType.includes('transactivation domain 2') ||
    domainType === 'Phosphopantetheine binding ACP domain' ||
    domainType === 'Multicopper oxidase, second cupredoxin domain' ||
    domainType === 'Helicase, C-terminal'
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
    domainType.toLowerCase().includes('nuclear/hormone receptor')
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
    domainType === 'EGF domain' ||
    domainType === 'Axin beta-catenin binding' ||
    domainType === 'Peptidase M2, peptidyl-dipeptidase A' ||
    domainType.endsWith('phosphatase domain')
  ) {
    return [seafoam, seafoamLine];
  } else if (
    // Immunoglobulin domains are colored in the pink-purple spectrum
    domainType === 'Immunoglobulin-like domain' ||
    domainType.endsWith('Ig domain') ||
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
    domainType.endsWith('merisation domain') || // e.g. di- / tetramerisation
    domainType.endsWith('merisation motif') || // e.g. di- / tetramerisation
    domainType.endsWith('BTB/POZ domain') || // homodimerization domain
    domainType === 'DZF domain' || // domain associated with zinc fingers; dimerisation domain
    domainType.includes('kinase domain') ||
    domainType === 'PIK-related kinase, FAT' ||
    domainType.startsWith('von Willebrand factor, type A') ||
    domainType === 'Reeler domain' ||
    domainType === 'BMP/retinoic acid-inducible neural-specific protein' ||
    domainType === 'Low-density lipoprotein (LDL) receptor class A repeat' ||
    domainType === 'TILa domain' ||
    domainType.includes('chromosome condensation')
  ) {
    return [pink, pinkLine];
  } else if (
    domainType === 'Immunoglobulin' ||
    domainType === 'Immunoglobulin domain' ||
    domainType === 'CD20-like family' ||
    domainType === 'Calponin homology domain' ||
    domainType.includes('ATPase') ||
    domainType.includes('ATP coupling domain') ||
    domainType.includes('globular domain') ||
    domainType === 'Mitochondrial substrate/solute carrier' ||
    domainType === 'Major facilitator,  sugar transporter-like' ||
    domainType === 'Major facilitator, sugar transporter-like' ||
    domainType === 'Sodium:neurotransmitter symporter' ||
    domainType === 'Myosin head, motor domain' ||
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
    domainType === 'Fibronectin, type I' ||
    domainType === 'Cadherin-like' ||
    domainType === 'G-protein gamma-like domain' ||
    domainType === 'GoLoco motif' ||
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
    domainType === 'WW domain' ||
    domainType.includes('MHC class II') && !domainType.includes('C-terminal') ||
    domainType === 'TNFR/NGFR cysteine-rich region' ||
    domainType === 'Frizzled domain' ||
    domainType === 'Netrin module, non-TIMP type' ||
    domainType === 'CFTR regulator domain' ||
    domainType.endsWith('domain 2') ||
    domainType === 'GNAT domain' ||
    domainType === 'NIDO domain' ||
    domainType === 'von Willebrand domain, type D domain'
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    domainType === 'Fibronectin type III' ||
    domainType === 'Tissue factor' ||
    domainType === 'Immunoglobulin C2-set' ||
    domainType.includes('immunoglobulin C2-set') ||
    domainType.includes('protein interaction') ||
    domainType.includes('interacting') ||
    domainType.includes('(DSL) protein') ||
    domainType === 'Dishevelled protein domain' ||
    domainType.endsWith('domain 3') ||
    domainType === 'DnaJ domain'
  ) {
    return [purple, purpleLine];
  } else if (
    domainType === 'Immunoglobulin V-set domain' ||
    domainType.includes('V-set domain') ||
    domainType.includes('MHC class I') && !domainType.includes('C-terminal') ||
    domainType === 'Frizzled/Smoothened, 7TM' ||
    domainType.endsWith('domain 4') ||
    domainType === 'Integrin alpha-2' ||
    domainType === 'Calcium-activated potassium channel BK, alpha subunit' ||
    domainType.includes('Dbl homology (DH) domain')
  ) {
    return [darkPurple, darkPurpleLine];
  } else if (
    domainType === 'Immunoglobulin I-set'
  ) {
    return [purple2, purple2Line];
  }

  else if (
    domainType === 'Desmoplakin, spectrin-like domain' ||
    domainType === 'Spectrin repeat' ||
    domainType.endsWith('TED domain') ||
    domainType === 'Polyadenylate-binding protein/Hyperplastic disc protein' ||
    domainType.includes(' cap domain') ||
    domainType.toLowerCase().includes('agenet')
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
    domainType === 'PAS domain' ||
    domainType === 'PAS fold' ||
    domainType === 'Polyketide synthase, dehydratase domain' ||
    domainType === 'Flavodoxin/nitric oxide synthase' ||
    domainType === 'Flavodoxin-like fold' ||
    domainType === 'G-patch domain' ||
    domainType === 'GPCR, rhodopsin-like, 7TM' ||
    domainType === 'GPCR, family 2, secretin-like' ||
    domainType === 'GPCR, family 3, nine cysteines domain' ||
    domainType === 'G-protein coupled receptor' ||
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
    domainType === 'KI67R' // KI67 / Chmadrin repeat
  ) {
    return [orange, orangeLines];
  } else if (
    domainType.includes('Kringle') ||
    domainType.includes('Peptidase M12A') ||
    domainType === 'TGF-beta, propeptide' ||
    domainType === 'PIK-related kinase' ||
    domainType.includes('(PIK) domain') ||
    domainType === 'LDLR class B repeat' ||
    domainType === 'Actin family' ||
    domainType === 'Ferritin/DPS protein domain' ||
    domainType === 'PAS fold-3' ||
    domainType === 'Polyketide synthase, ketoreductase domain' ||
    domainType.startsWith('Heat shock protein') && domainType.endsWith('family') ||
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
    domainType.includes('Hydroxymethylglutaryl-CoA reductase')
  ) {
    return [lightBrown, lightBrownLine];
  } else if (
    domainType === 'Notch, NOD domain' ||
    domainType === 'Cadherin, Y-type LIR-motif' ||
    domainType === 'Protein patched/dispatched' ||
    domainType.includes('membrane-proximal') ||
    domainType === 'LicD family'
  ) {
    return [brown, brownLine];
  } else if (
    // Transmembrane, etc.
    domainType.includes('transmembrane domain') ||
    domainType.includes('trans-membrane domain') ||
    domainType.includes('Transmembrane protein') ||
    domainType.includes('Collectrin') ||
    domainType.includes('cytoplasmic domain') ||
    domainType.includes('membrane glycoprotein') ||
    domainType === 'SEA domain' ||
    domainType === 'CD36 family' ||
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
    domainType === 'CARD domain' ||
    domainType === 'DAPIN domain' ||
    domainType === 'Death effector domain' ||
    domainType === 'Death domain' ||
    domainType.includes('UBA domain') ||
    domainType.includes('HECT domain') ||
    domainType.toLowerCase().includes('ubiquitin-like domain') ||
    domainType.toLowerCase().includes('ubiquitin-associated domain') ||
    domainType.includes('necrosis') ||
    domainType.includes('Bcl-2') ||
    domainType.includes('death protein') ||
    domainType === 'Disintegrin domain'
  ) {
    return [darkGrey, darkGreyLine];
  } else if (
    domainType.includes('unknown function') ||
    domainType.toLowerCase().includes('unstructured') ||
    domainType.startsWith('Uncharacterised')
  ) {
    return [lightGrey, lightGreyLine];
  } else if (
    domainType.toLowerCase().includes('leucine rich repeat') ||
    domainType.includes('HIN')
  ) {
    return [darkOrange, darkOrangeLines];
  } else if (
    domainType.includes('repeat') ||
    domainType === 'Vitellinogen, open beta-sheet' ||
    domainType.includes('Interleukin') && domainType.includes('family') ||
    /Interleukin-\d+$/.test(domainType) ||
    domainType === 'Chemokine interleukin-8-like domain' ||
    domainType.includes('beta-ribbon')
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
    domainType.includes('zinc ribbon fold') ||
    domainType.includes('zinc-ribbon') ||
    domainType === 'Macroglobulin domain' ||
    domainType.includes('KH0') ||
    domainType.includes('EGF')
  ) {
    return [seafoam, seafoamLine];
  } else if (
    domainType.includes('Peptidase') ||
    domainType.includes('Ras-binding')
  ) {
    return [blue, blueLines];
  } else if (
    domainType.toLowerCase().includes('zinc finger') ||
    domainType.toLowerCase().includes('zinc-finger') ||
    domainType.includes('RING finger') ||
    domainType.toLowerCase().includes('transcription factor') ||
    domainType === 'Paired domain' || // found in eukaryotic transcription regulatory proteins involved in embryogenesis
    domainType === 'BRK domain' ||
    domainType.includes('FAD-binding') ||
    domainType.includes('MG3') ||
    domainType.toLowerCase().includes('polycomb') ||
    domainType.toLowerCase().includes('metallopeptidase') ||
    domainType.toLowerCase().includes('metallo-peptidase') ||
    domainType === 'K Homology domain, type 1' ||
    domainType.includes('winged helix')
  ) {
    return [green, greenLine];
  } else if (
    domainType.startsWith('Tyrosine-protein kinase receptor') ||
    domainType.endsWith('receptor') ||
    domainType.includes('cysteine rich') ||
    domainType.includes('cysteine-rich')
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    domainType.startsWith('von Willebrand factor') ||
    domainType.endsWith('receptor-binding')
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
    domainType.includes('SAM') ||
    domainType.includes('Sterile alpha motif')
  ) {
    return [magenta, magentaLines];
  } else if (
    domainType.includes('binding domain') ||
    domainType.includes('binding protein')
  ) {
    return [darkBlue, darkBlueLine];
  } else if (
    domainType.includes('Ribosomal protein')
  ) {
    return [darkGreen, darkGreenLine];
  } else if (
    domainType.includes('transferase')
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
    domainType.toLowerCase().includes('decarboxylase')
  ) {
    return [lightBlue, lightBlueLine];
  }

  return [grey, greyLine];
}
