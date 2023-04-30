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
const greyLines = '#666';

const darkGrey = '#888';
const darkGreyLine = '#AAA';

const red = '#F00';
const redLines = '#D00';
const magenta = '#922D5E';
const magentaLines = '#D26D9E';
const faintRed = '#CAA';
const faintRedLines = '#866';
const pink = '#FFC0CB';
const pinkLine = '#CF909B';

const blue = '#99D';
const blueLines = '#22C';
const lightBlue = '#CCF';
const lightBlueLine = '#33D';
const deepBlue = '#55A';
const deepBlueLines = '#AAF';

const green = '#7D7';
const greenLines = '#5B5';
const seafoam = '#93E9BE';
const seafoamLines = '#53AC7E';

// Purples
const darkPurple = '#51087E';
const darkPurpleLine = '#8138AE';
const purple = '#880ED4';
const purpleLine = '#5800A4';
const purple2 = '#A020F0';
const purple2Line = '#7000C0';
const lightPurple = '#B24BF3';
const lightPurpleLine = '#921BC3';
const veryLightPurple = '#D7A1F9';
const veryLightPurpleLine = '#A771C9';

const brown = '#964B00';
const brownLine = '#C67B30';
const lightBrown = '#DACDBA';
const lightBrownLine = '#BAAB9A';
const orange = '#FFA500';
const orangeLines = '#DD8000';

export function getColors(domainType) {
  if (
    domainType.includes('conserved site') || // https://www.google.com/search?q=pymol+conserved+site+color&tbm=isch
    domainType.includes('conserved domain') ||
    domainType === 'WGR domain' ||
    domainType === 'R3H domain'
  ) {
    return [magenta, magentaLines];
  } else if (
    // Enzymatic sites
    domainType.includes('active site') ||
    domainType.includes('hydroxylation site') ||
    domainType.includes('Lipid transport') ||
    domainType === 'BRCA1, serine-rich domain' ||
    domainType === 'Tower domain' || // Important in BRCA2
    domainType.endsWith('attachment site') ||
    domainType.endsWith('amyloid-beta peptide')
  ) {
    return [red, redLines];
  } else if (
    // Enzymatic domains, C-terminal regions, and misnellaneou
    domainType.includes('catalytic domain') ||
    domainType.includes('kinase domain') ||
    domainType === 'PIK-related kinase, FAT' ||
    domainType.includes('trypsin domain') ||
    domainType === 'Transforming growth factor-beta, C-terminal' ||
    domainType === 'Cyclin, C-terminal domain' ||
    domainType.includes('OB C-terminal domain') ||
    domainType === 'Cationic amino acid transporter, C-terminal' ||
    domainType === 'High mobility group box domain' ||
    domainType.includes('Peptidase M2') ||
    domainType.includes('CUB domain') ||
    domainType === 'C-5 cytosine methyltransferase' ||
    domainType.includes('(G-protein), alpha subunit') ||
    domainType === 'SCAN domain' ||
    domainType === 'Apolipoprotein A/E' ||
    domainType.includes('SMAD domain') ||
    domainType === 'PLAC' ||
    domainType.endsWith('tripeptidyl peptidase II') ||
    domainType === 'Prohormone convertase enzyme' ||
    domainType.includes('rod domain')
  ) {
    return [faintRed, faintRedLines];
  } else if (
    // Binding sites, and smaller binding regions
    domainType.includes('binding site') ||
    domainType === 'EF-hand domain' ||
    domainType === 'Zinc finger, nuclear hormone receptor-type' ||
    domainType.includes('Serpin domain') ||
    domainType === 'Peptidase C14,  p20 domain' ||
    domainType === 'PWWP domain' ||
    domainType === 'GPCR, rhodopsin-like, 7TM' ||
    domainType === 'Peptidoglycan binding-like' ||
    domainType === 'MAD homology 1, Dwarfin-type' ||
    domainType === 'F-actin binding' ||
    domainType.includes('Glycoside hydrolase') && domainType.endsWith('domain') ||
    domainType === 'p53 tumour suppressor family' ||
    domainType === 'Pointed domain'
  ) {
    return [blue, blueLines];
  } else if (
    domainType.includes('dehydrogenase, molybdopterin binding') ||
    domainType === 'Zinc finger CCHC HIVEP-type' ||
    domainType === 'Cyclin, N-terminal' ||
    domainType === 'MAD homology, MH1' ||
    domainType === 'Sodium ion transport-associated' ||
    domainType.endsWith('head') ||
    domainType.endsWith('C2 domain') ||
    domainType === 'Pleckstrin homology domain' ||
    domainType === 'Post-SET domain' ||
    domainType.includes('Glycoside hydrolase') ||
    domainType === 'Pyridoxal phosphate-dependent decarboxylase' ||
    domainType.includes('OB1') ||
    domainType.includes('OB3') ||
    domainType.includes('OB domain') ||
    domainType === 'Fork head domain'
  ) {
    return [lightBlue, lightBlueLine];
  } else if (
    // Larger binding regions and miscellaneous
    domainType.includes('binding domain') ||
    domainType.includes('zinc-binding') ||
    domainType.includes('DNA-binding') ||
    domainType === 'G protein-coupled receptor, rhodopsin-like' ||
    domainType.includes('Homeobox domain') ||
    domainType.includes('Ion transport domain') ||
    domainType.includes('BRCT domain') ||
    domainType.includes('EF-hand') ||
    domainType === 'Laminin G domain' ||
    domainType === 'Peptidase C14, caspase non-catalytic subunit p10' ||
    domainType === 'ADD domain' ||
    domainType === 'PDZ domain' ||
    domainType === 'Krueppel-associated box' ||
    domainType === 'Ets domain' ||
    domainType === 'P domain' ||
    domainType.includes('bHLH')
  ) {
    return [deepBlue, deepBlueLines];
  } else if (
    domainType === 'SH2 domain' ||
    domainType.includes('Furin-like') ||
    domainType.includes('heparin-binding') ||
    domainType === 'SRCR domain' ||
    domainType === 'EGF-like domain' ||
    domainType.includes('EGF domain') ||
    domainType === 'Basic leucine zipper domain, Maf-type' ||
    domainType.startsWith('Leucine zipper') ||
    domainType.includes('Interleukin') && domainType.includes('propeptide') ||
    domainType === 'Sirtuin family' ||
    domainType === 'Amino acid/polyamine transporter I' ||
    domainType === 'Peptidase M10, metallopeptidase' ||
    domainType === 'Zinc finger C2H2-type' ||
    domainType === 'Zinc finger, PARP-type' ||
    domainType.endsWith('tail domain') ||
    domainType === 'SET domain' ||
    domainType.includes('transactivation domain 2') ||
    domainType === 'Phosphopantetheine binding ACP domain'
  ) {
    return [green, greenLines];
  } else if (
    domainType === 'SH3 domain' ||
    domainType.includes('copper-binding') ||
    domainType === 'Sushi/SCR/CCP domain' ||
    domainType.includes('Receptor L-domain') ||
    domainType.includes('Coagulation factor 5/8') ||
    domainType === 'Basic-leucine zipper domain' ||
    domainType.includes('Interleukin') && domainType.includes('family') ||
    domainType === 'Sirtuin family, catalytic core domain' ||
    domainType === 'Amine oxidase' ||
    domainType.includes('lid domain') ||
    domainType.includes('prodomain') ||
    domainType === 'Pre-SET domain' ||
    domainType.includes('transactivation domain') ||
    domainType === 'Thioesterase' ||
    domainType.includes('esterase') ||
    domainType.endsWith('Claudin superfamily') ||
    domainType === 'Retinoblastoma-associated protein, A-box'
  ) {
    return [seafoam, seafoamLines];
  }

  else if (
    // Immunoglobulin domains are colored in the pink-purple spectrum
    domainType === 'Immunoglobulin-like domain' ||
    domainType === 'Major facilitator superfamily domain' ||
    domainType.includes('interface') ||
    domainType.endsWith('phosphatase domain') ||
    domainType === 'Class I myosin tail homology domain' ||
    domainType === 'Myosin tail' ||
    domainType === 'Acyl transferase'
  ) {
    return [pink, pinkLine];
  } else if (
    domainType === 'Immunoglobulin' ||
    domainType === 'CD20-like family' ||
    domainType === 'Calponin homology domain' ||
    domainType.includes('ATPase') ||
    domainType.includes('globular domain') ||
    domainType === 'Mitochondrial substrate/solute carrier' ||
    domainType === 'Major facilitator,  sugar transporter-like' ||
    domainType === 'Sodium:neurotransmitter symporter' ||
    domainType === 'Fibronectin type III' ||
    domainType === 'Myosin head, motor domain' ||
    domainType.startsWith('Methyltransferase') ||
    domainType.startsWith('Thyroglobulin') ||
    domainType === 'Retinoblastoma-associated protein, B-box'
  ) {
    return [veryLightPurple, veryLightPurpleLine];
  } else if (
    domainType === 'Immunoglobulin C1-set' ||
    domainType.includes('GTPase') ||
    domainType === 'Major facilitator superfamily' ||
    domainType === 'Fibronectin type II domain' ||
    domainType.includes('ectodomain') ||
    domainType.endsWith('receptor domain') ||
    domainType.endsWith('receptor domain 4') ||
    domainType.endsWith('extracellular') ||
    domainType === 'WW domain' ||
    domainType.includes('MHC class II') && !domainType.includes('C-terminal') ||
    domainType === 'TNFR/NGFR cysteine-rich region'
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    domainType === 'Immunoglobulin C2-set' ||
    domainType.includes('immunoglobulin C2-set') ||
    domainType.includes('protein interaction') ||
    domainType.includes('interacting')
  ) {
    return [purple, purpleLine];
  } else if (
    domainType === 'Immunoglobulin V-set domain' ||
    domainType.includes('MHC class I') && !domainType.includes('C-terminal')
  ) {
    return [darkPurple, darkPurpleLine];
  } else if (domainType === 'Immunoglobulin I-set') {
    return [purple2, purple2Line];
  }

  else if (
    // Repeats, iron
    domainType === 'Armadillo' ||
    domainType.includes('Apple domain') ||
    domainType === 'Protocadherin' || // Cytoplasmic
    domainType === 'VWFC domain' || // von Willebrand
    domainType.startsWith('von Willebrand factor') ||
    domainType.endsWith('merisation domain') || // e.g. di- / tetramerisation
    domainType.endsWith('merisation motif') || // e.g. di- / tetramerisation
    domainType === 'Ferritin-like diiron domain' ||
    domainType === 'PAS domain' ||
    domainType === 'PAS fold' ||
    domainType === 'Polyketide synthase, dehydratase domain' ||
    domainType === 'G-patch domain'
  ) {
    return [orange, orangeLines];
  } else if (
    domainType.includes('Kringle') ||
    domainType.includes('Peptidase M12A') ||
    domainType === 'TGF-beta, propeptide' ||
    domainType === 'PIK-related kinase' ||
    domainType.includes('(PIK) domain') ||
    domainType === 'LDLR class B repeat' ||
    domainType === 'Cadherin-like' ||
    domainType === 'Actin family' ||
    domainType === 'Ferritin/DPS protein domain' ||
    domainType === 'PAS fold-3' ||
    domainType === 'Polyketide synthase, ketoreductase domain' ||
    domainType.startsWith('Heat shock protein') && domainType.endsWith('family') ||
    domainType === 'MCM domain' ||
    domainType.endsWith('reductase-like') ||
    domainType === 'Lipase' ||
    domainType === 'Phospholipase A2 domain'
  ) {
    return [lightBrown, lightBrownLine];
  } else if (
    // Transmembrane, etc.
    domainType.includes('transmembrane domain') ||
    domainType.includes('Transmembrane protein') ||
    domainType.includes('Collectrin') ||
    domainType.includes('cytoplasmic domain') ||
    domainType.includes('membrane glycoprotein') ||
    domainType === 'CD36 family' ||
    domainType == 'Hypoxia-inducible factor, alpha subunit' ||
    domainType === 'PKD domain' ||
    domainType.includes('regulatory domain') ||
    domainType.endsWith('E2 domain') ||
    domainType === 'PLAT/LH2 domain'
  ) {
    return [brown, brownLine];
  } else if (
    // Death, ubiquitination
    domainType === 'CARD domain' ||
    domainType === 'Death effector domain' ||
    domainType === 'Death domain' ||
    domainType === 'Ubiquitin-associated domain' ||
    domainType.includes('UBA domain') ||
    domainType.includes('unknown function') ||
    domainType.startsWith('Uncharacterised') ||
    domainType.toLowerCase().includes('ubiquitin-like domain') ||
    domainType.includes('necrosis')
  ) {
    return [darkGrey, darkGreyLine];
  } else if (
    domainType.includes('repeat') ||
    domainType === 'Vitellinogen, open beta-sheet'
  ) {
    return [orange, orangeLines];
  } else if (
    domainType.includes('inhibit') ||
    domainType.includes('central') ||
    domainType === '[2Fe-2S]-binding' ||
    domainType.startsWith('Interleukin') && domainType.endsWith('family') ||
    /Interleukin-\d+$/.test(domainType) ||
    domainType.endsWith('tail') ||
    domainType.endsWith('helical domain') ||
    domainType.endsWith('coiled-coil domain')
  ) {
    return [seafoam, seafoamLines];
  } else if (
    domainType.includes('Peptidase') ||
    domainType.includes('Ras-binding')
  ) {
    return [blue, blueLines];
  } else if (
    domainType.toLowerCase().includes('zinc finger') ||
    domainType.toLowerCase().includes('transcription factor') ||
    domainType.includes('FAD-binding')
  ) {
    return [green, greenLines];
  } else if (
    domainType.endsWith('receptor')
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    // C-terminal regions are typically colored red in e.g. PyMol rainbow
    domainType.includes('C-termin') ||
    domainType.includes('C termin') ||
    domainType.includes('kinase-type') ||
    domainType.includes('phosphatases domain')
  ) {
    return [faintRed, faintRedLines];
  } else if (
    // N-terminal regions are typically colored blue in e.g. PyMol rainbow
    domainType.includes('N-termin') ||
    domainType.includes('N-teminal') || // Typo in "CTNNB1 binding, N-teminal"
    domainType.includes('N termin')
  ) {
    return [lightBlue, lightBlueLine];
  }

  return [grey, greyLines];
}
