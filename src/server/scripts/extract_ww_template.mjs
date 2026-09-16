import fs from 'fs';

async function extractWwTemplate() {
  const res = await fetch('https://www.kahpoo.com/main.b41d15ddb7bcd512dc99.js');
  const js = await res.text();

  const wwIndex = js.indexOf('let WW=(()=>{class n{constructor');
  console.log('WW index:', wwIndex);

  const snippet = js.substring(wwIndex, wwIndex + 30000);
  console.log('Snippet length:', snippet.length);

  // Extract all literal strings in template
  const textStrings = snippet.match(/"([^"\\]{3,80})"/g) || [];
  console.log('Unique strings in WW (Accueil):', [...new Set(textStrings)].slice(0, 50));

  // Extract HTML tags and class names
  const classes = snippet.match(/class",\s*"([^"]+)"/g) || [];
  console.log('Classes in WW:', [...new Set(classes)].slice(0, 30));
}

extractWwTemplate();
