
import {Ideogram} from './core'

// https://github.com/overset/javascript-natural-sort
function naturalSort(a,b){var q,r,c=/(^([+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|^0x[\da-fA-F]+$|\d+)/g,d=/^\s+|\s+$/g,e=/\s+/g,f=/(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,g=/^0x[0-9a-f]+$/i,h=/^0/,i=function(a){return(naturalSort.insensitive&&(""+a).toLowerCase()||""+a).replace(d,"")},j=i(a),k=i(b),l=j.replace(c,"\0$1\0").replace(/\0$/,"").replace(/^\0/,"").split("\0"),m=k.replace(c,"\0$1\0").replace(/\0$/,"").replace(/^\0/,"").split("\0"),n=parseInt(j.match(g),16)||1!==l.length&&Date.parse(j),o=parseInt(k.match(g),16)||n&&k.match(f)&&Date.parse(k)||null,p=function(a,b){return(!a.match(h)||1==b)&&parseFloat(a)||a.replace(e," ").replace(d,"")||0};if(o){if(n<o)return-1;if(n>o)return 1}for(var s=0,t=l.length,u=m.length,v=Math.max(t,u);s<v;s++){if(q=p(l[s]||"",t),r=p(m[s]||"",u),isNaN(q)!==isNaN(r))return isNaN(q)?1:-1;if(/[^\x00-\x80]/.test(q+r)&&q.localeCompare){var w=q.localeCompare(r);return w/Math.abs(w)}if(q<r)return-1;if(q>r)return 1}}

// e.g. "Homo sapiens" -> "homo-sapiens"
function slugify(value){return value.toLowerCase().replace(' ', '-')};

window.naturalSort = naturalSort;
window.slugify = slugify;

window.Ideogram = Ideogram;
