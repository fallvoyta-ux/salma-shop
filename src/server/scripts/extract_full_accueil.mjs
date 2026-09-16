import fs from 'fs';

async function extractFullAccueilSections() {
  const res = await fetch('https://www.kahpoo.com/main.b41d15ddb7bcd512dc99.js');
  const js = await res.text();

  const wwIndex = 5670503;
  const snippet = js.substring(wwIndex, wwIndex + 60000);

  // Look for section titles, placeholders, headings in snippet
  const headings = snippet.match(/ɵɵtext\(\d+,\s*"([^"\\]+)"\)/g) || [];
  const cleanHeadings = headings.map(h => h.replace(/ɵɵtext\(\d+,\s*"/, '').replace(/"\)/, '')).filter(t => t.trim().length > 2);
  console.log('Accueil visible text labels:');
  console.log([...new Set(cleanHeadings)].slice(0, 80));
}

extractFullAccueilSections();
