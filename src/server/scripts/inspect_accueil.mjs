import fs from 'fs';

async function inspectKahpooHome() {
  const res = await fetch('https://www.kahpoo.com/main.b41d15ddb7bcd512dc99.js');
  const js = await res.text();
  console.log('JS length:', js.length);

  // Search for accueil component definition or template
  const accueilMatches = [];
  const regex = /path:\s*["']accueil["'][\s\S]{0,500}/g;
  let m;
  while ((m = regex.exec(js)) !== null) {
    accueilMatches.push(m[0]);
  }
  console.log('Accueil route matches:', accueilMatches);

  // Search for the template associated with Accueil
  // In Angular Ivy, templates are in ɵɵelementStart, ɵɵtext, ɵɵproperty, or inline HTML strings
  // Let's search for template fragments containing key Kahpoo home sections
  const sections = js.match(/["'](?:accueil|banner|category|slider|search|product|boutique|service)[^"']{20,150}["']/gi) || [];
  console.log('Sample home template strings:', sections.slice(0, 25));
}

inspectKahpooHome();
