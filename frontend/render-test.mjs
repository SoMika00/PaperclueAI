import { JSDOM } from 'jsdom';
const html = await (await fetch('http://localhost:3555/')).text();
const errors = [];
const dom = new JSDOM(html, {
  url: 'http://localhost:3555/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  beforeParse(w) {
    w.addEventListener('error', e => errors.push('window.error: ' + (e.error?.stack || e.message)));
    const ce = w.console.error;
    w.console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ').slice(0,300)); ce(...a); };
  }
});
await new Promise(r => setTimeout(r, 9000));
const txt = dom.window.document.body.textContent || '';
console.log('  body text length:', txt.length);
console.log('  shows crash banner:', /Application error|client-side exception/i.test(txt) ? 'YES ✗' : 'no ✓');
console.log('  rendered nav?     :', /About|Pricing|Blog/.test(txt) ? 'YES ✓' : 'no');
console.log('  --- captured errors (first 6) ---');
[...new Set(errors)].slice(0,6).forEach(e => console.log('   ', e.slice(0,260)));
