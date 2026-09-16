import fs from 'fs';

async function extractComponentWW() {
  const res = await fetch('https://www.kahpoo.com/main.b41d15ddb7bcd512dc99.js');
  const js = await res.text();

  // Find class WW or WW=
  // Let's search for "class WW" or "WW.ɵcmp" or "WW=class" or function WW
  const idx = js.indexOf('path:"accueil",component:WW');
  console.log('Path index:', idx);

  // Search definition of WW
  const wwMatch = js.match(/(?:class WW\b|var WW\b|let WW\b|const WW\b|function WW\b)[^;]{0,500}/);
  console.log('WW match:', wwMatch ? wwMatch[0] : 'not found');

  // Search for WW.ɵcmp
  const cmpIdx = js.indexOf('WW.ɵcmp=');
  if (cmpIdx !== -1) {
    console.log('Found WW.ɵcmp! Extracting template snippet...');
    const snippet = js.substring(cmpIdx, cmpIdx + 5000);
    // Find HTML strings in snippet
    const texts = snippet.match(/ɵɵtext\(\d+,\s*["']([^"']+)["']\)/g) || [];
    console.log('Template texts:', texts.slice(0, 30));
    
    const elements = snippet.match(/ɵɵelementStart\(\d+,\s*["']([^"']+)["'](?:,\s*\[([^\]]*)\])?\)/g) || [];
    console.log('Template elements:', elements.slice(0, 30));
  } else {
    // Try finding component definition
    const regexCmp = /[a-zA-Z0-9_$]+\.ɵcmp\s*=\s*i0\.ɵɵdefineComponent\(\{[^}]+accueil[^}]+\}\)/;
    console.log('Cmp match:', js.match(regexCmp));
  }
}

extractComponentWW();
