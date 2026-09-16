import fs from 'fs';

async function printPageContent() {
  const res = await fetch('https://www.kahpoo.com/main.b41d15ddb7bcd512dc99.js');
  const js = await res.text();
  const wwIndex = 5670503;
  
  // Find where page-content is instantiated in the template function
  const snippet = js.substring(wwIndex + 5000, wwIndex + 16000);
  console.log(snippet);
}

printPageContent();
