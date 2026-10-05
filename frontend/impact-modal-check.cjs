const http = require('http');
const get = (u) => new Promise((r) => { http.get(u, (x) => { let c = []; x.on('data', (d) => c.push(d)); x.on('end', () => r(Buffer.concat(c).toString('utf8'))); }); });

(async () => {
  const s = await get('http://localhost:5173');
  const links = [...s.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
  let css = '';
  for (const h of links) css += await get('http://localhost:5173' + h);

  const out = [];
  const ok = (label, cond) => out.push((cond ? 'PASS  ' : 'FAIL  ') + label);

  /* --- Impact band hierarchy ------------------------------------------- */
  ok('stat numerals oversized', /clamp\(42px,\s*4\.6vw,\s*66px\)/.test(css));
  ok('number span inherits (13px bug fixed)', /\.homy-stat strong span\s*\{[^}]*font-size:\s*inherit/.test(css));
  ok('labels uppercase micro', /\.homy-stat > span\s*\{[^}]*text-transform:\s*uppercase/.test(css));
  ok('hairline dividers, no card chrome', /\.homy-stat\s*\{[^}]*border-top:\s*1px solid var\(--band-line\)/.test(css) && /\.homy-stat\s*\{[^}]*border-radius:\s*0/.test(css));
  ok('hover chrome removed', (() => {
    const occ = [...css.matchAll(/\.homy-stat:hover\s*\{/g)].map((m) => m.index);
    if (occ.length === 0) return false;
    const last = occ[occ.length - 1];
    const rule = css.slice(last, last + 220);
    console.log('  (last .homy-stat:hover rule -> ' + rule.replace(/\s+/g, ' ').slice(0, 140) + ')');
    return /background:\s*(transparent|none)/.test(rule) && /transform:\s*none/.test(rule) && !/box-shadow/.test(rule);
  })());
  ok('tabular numerals', /\.homy-stat strong\s*\{[^}]*tabular-nums/.test(css));
  ok('headline breathing room', /margin-bottom:\s*clamp\(36px,\s*4\.5vw,\s*60px\)/.test(css));

  /* --- Detail modal hierarchy (current markup) ----------------------------- */
  ok('modal widened for detail', /:has\(\s*\.property-detail-modal\s*\)\s*\{[^}]*max-width:\s*min\(980px/.test(css));
  ok('price block panel', /\.detail-price-block\s*\{[^}]*var\(--paper-2\)/.test(css));
  ok('price is ink (not lost in green)', /\.detail-price\s*\{[^}]*color:\s*var\(--ink\)/.test(css));
  ok('price tabular numerals', /\.detail-price\s*\{[^}]*tabular-nums/.test(css));
  ok('location badge present', /\.detail-location-badge/.test(css));
  ok('disclaimer demoted to fine print', /\.detail-disclaimer\s*\{[^}]*var\(--fs-micro\)/.test(css));
  ok('actions separated by rule', /\.detail-actions\s*\{[^}]*border-top:\s*1px solid var\(--line\)/.test(css));
  ok('quick facts grid', /\.detail-quick-facts\s*\{[^}]*grid-template-columns/.test(css));
  ok('header rule added', /\.modal-header\s*\{[^}]*border-bottom:\s*1px solid var\(--line\)/.test(css));
  ok('modal title promoted', /clamp\(18px,\s*2vw,\s*22px\)/.test(css));

  /* --- Markup order in the component source (modal is client-rendered) -- */
  const src = require('fs').readFileSync('components/PropertyDetailModal.tsx', 'utf8');
  const locIdx = src.indexOf('detail-location-badge');
  const priceIdx = src.indexOf('detail-price-block');
  const discIdx = src.indexOf('detail-disclaimer');
  const actIdx = src.indexOf('detail-actions');
  ok('reading order: location before price', locIdx > -1 && priceIdx > locIdx);
  ok('reading order: disclaimer before actions', discIdx > -1 && actIdx > discIdx);
  ok('disclaimer out of the price area', discIdx > priceIdx + 400);

  /* --- Regressions: no mojibake, featured rail + grid share one card ------ */
  let moji = 0;
  for (let i = 0; i < s.length; i++) { const cp = s.codePointAt(i); if (cp >= 0xC0 && cp <= 0xFF) moji++; }
  ok('zero mojibake', moji === 0);
  const cards = (s.match(/class="property-card/g) || []).length;
  ok('18 listing cards + 3 featured cards share one anatomy', cards === 21);
  ok('no div role=button card wrappers', !/role="button"/.test(s));
  ok('every card exposes an Explore action', (s.match(/class="property-explore"/g) || []).length === cards);

  console.log(out.join('\n'));
  const fails = out.filter((l) => l.startsWith('FAIL')).length;
  console.log('\n' + (fails === 0 ? 'ALL ' + out.length + ' CHECKS PASS' : fails + ' FAILURES'));
})();
