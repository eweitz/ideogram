// The E-Utilies In Depth: Parameters, Syntax and More:
// https://www.ncbi.nlm.nih.gov/books/NBK25499/
var eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
var esearch = eutils + 'esearch.fcgi?retmode=json';
var esummary = eutils + 'esummary.fcgi?retmode=json';
var elink = eutils + 'elink.fcgi?retmode=json';

export {esearch, esummary, elink}