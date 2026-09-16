import fs from 'fs';

async function extractAppSearchAndListe() {
  const res = await fetch('https://www.kahpoo.com/main.b41d15ddb7bcd512dc99.js');
  const js = await res.text();

  // Find app-search definition
  const searchIdx = js.indexOf('selectors:[["app-search"]]');
  console.log('app-search idx:', searchIdx);
  if (searchIdx !== -1) {
    const snippet = js.substring(searchIdx, searchIdx + 4000);
    const consts = snippet.match(/consts:\[([\s\S]*?)\]/);
    console.log('app-search snippet consts:', consts ? consts[0].slice(0, 500) : 'none');
  }

  // Find app-liste definition
  const listeIdx = js.indexOf('selectors:[["app-liste"]]');
  console.log('app-liste idx:', listeIdx);
  if (listeIdx !== -1) {
    const snippet = js.substring(listeIdx, listeIdx + 4000);
    const consts = snippet.match(/consts:\[([\s\S]*?)\]/);
    console.log('app-liste snippet consts:', consts ? consts[0].slice(0, 500) : 'none');
  }
}

extractAppSearchAndListe();
