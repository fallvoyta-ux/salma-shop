import fs from 'fs';

async function printSnippet() {
  const res = await fetch('https://www.kahpoo.com/main.b41d15ddb7bcd512dc99.js');
  const js = await res.text();
  const wwIndex = 5670503;
  console.log(js.substring(wwIndex + 2000, wwIndex + 6000));
}

printSnippet();
