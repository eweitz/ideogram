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
  if (domainType.includes('conserved site')) {
    // https://www.google.com/search?q=pymol+conserved+site+color&tbm=isch
    return [magenta, magentaLines];
  } else if (
    // Enzymatic sites
    domainType.includes('active site') ||
    domainType.includes('hydroxylation site') ||
    domainType.includes('Lipid transport')
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
    domainType.includes('SMAD domain')
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
    domainType === 'MAD homology 1, Dwarfin-type'
  ) {
    return [blue, blueLines];
  } else if (
    domainType.includes('dehydrogenase, molybdopterin binding') ||
    domainType === 'Zinc finger CCHC HIVEP-type' ||
    domainType === 'Cyclin, N-terminal' ||
    domainType === 'MAD homology, MH1' ||
    domainType === 'Sodium ion transport-associated'
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
    domainType.includes('transactication domain') ||
    domainType.includes('EF-hand') ||
    domainType === 'Laminin G domain' ||
    domainType === 'Peptidase C14, caspase non-catalytic subunit p10' ||
    domainType === 'ADD domain' ||
    domainType === 'PDZ domain' ||
    domainType === 'Krueppel-associated box' ||
    domainType === 'Ets domain'
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
    domainType.includes('Interleukin') && domainType.includes('propeptide') ||
    domainType === 'Sirtuin family' ||
    domainType === 'Amino acid/polyamine transporter I' ||
    domainType === 'Peptidase M10, metallopeptidase' ||
    domainType === 'Zinc finger C2H2-type'
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
    domainType.includes('prodomain')
  ) {
    return [seafoam, seafoamLines];
  }

  else if (
    // Immunoglobulin domains are colored in the pink-purple spectrum
    domainType === 'Immunoglobulin-like domain' ||
    domainType === 'Major facilitator superfamily domain' ||
    domainType.includes('interface')
  ) {
    return [pink, pinkLine];
  } else if (
    domainType === 'Immunoglobulin' ||
    domainType === 'Calponin homology domain' ||
    domainType.includes('ATPase') ||
    domainType.includes('globular domain') ||
    domainType === 'Mitochondrial substrate/solute carrier' ||
    domainType === 'Major facilitator,  sugar transporter-like' ||
    domainType === 'Sodium:neurotransmitter symporter' ||
    domainType === 'Fibronectin type III'
  ) {
    return [veryLightPurple, veryLightPurpleLine];
  } else if (
    domainType === 'Immunoglobulin C1-set' ||
    domainType.includes('GTPase') ||
    domainType === 'Major facilitator superfamily' ||
    domainType === 'Fibronectin type II domain' ||
    domainType.includes('ectodomain') ||
    domainType.endsWith('receptor domain')
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    domainType === 'Immunoglobulin C2-set' ||
    domainType.includes('immunoglobulin C2-set') ||
    domainType.includes('protein interaction')
  ) {
    return [purple, purpleLine];
  } else if (domainType === 'Immunoglobulin V-set domain') {
    return [darkPurple, darkPurpleLine];
  } else if (domainType === 'Immunoglobulin I-set') {
    return [purple2, purple2Line];
  }

  else if (
    // Repeats
    domainType === 'Armadillo' ||
    domainType.includes('Apple domain') ||
    domainType === 'Protocadherin' // Cytoplasmic
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
    domainType === 'Actin family'
  ) {
    return [lightBrown, lightBrownLine];
  } else if (
    // Transmembrane
    domainType.includes('transmembrane domain') ||
    domainType.includes('Transmembrane protein') ||
    domainType.includes('Collectrin') ||
    domainType.includes('cytoplasmic domain')
  ) {
    return [brown, brownLine];
  }

  else if (
    // Death, ubiquitination
    domainType === 'CARD domain' ||
    domainType === 'Death effector domain' ||
    domainType === 'Death domain' ||
    domainType === 'Ubiquitin-associated domain' ||
    domainType.includes('UBA domain')
  ) {
    return [darkGrey, darkGreyLine];
  } else if (
    domainType.includes('repeat') ||
    domainType === 'Vitellinogen, open beta-sheet'
  ) {
    return [orange, orangeLines];
  } else if (
    domainType.includes('inhibit')
  ) {
    return [seafoam, seafoamLines];
  } else if (
    domainType.includes('Peptidase')
  ) {
    return [blue, blueLines];
  } else if (
    // C-terminal regions are typically colored red in e.g. PyMol rainbow
    domainType.includes('C-termin') ||
    domainType.includes('C termin')
  ) {
    return [faintRed, faintRedLines];
  } else if (
    // N-terminal regions are typically colored blue in e.g. PyMol rainbow
    domainType.includes('N-termin') ||
    domainType.includes('N termin')
  ) {
    return [lightBlue, lightBlueLine];
  }

  return [grey, greyLines];
}
