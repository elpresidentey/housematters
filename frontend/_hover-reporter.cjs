'use strict';
const fs = require('fs');

// ---- configuration -------------------------------------------------------
const TARGET = 'impact-modal-check.cjs';            // authoritative served check
const OUT = '_hover-report.txt';                     // UTF-8 report (node-written)
// ---------------------------------------------------------------------------

const src = fs.readFileSync(TARGET, 'utf8');
const out = [];

out.push('===HOVER-REPORT===');
out.push('readFile:' + TARGET);

const impactHover = src.match(/\.homy-stat:hover\s*\{[\s\S]*?\n\}/);
out.push('impact-hover-block:' + JSON.stringify(impactHover ? impactHover[0] : '(none)'));

out.push('impact-hover-present:' + /\.homy-stat:hover\s*\{/.test(src));

const hoverConst = src.match(/const hover\s*=\s*(['"])([\s\S]*?)\1\s*;/);
out.push('hover-const-json:' + JSON.stringify(hoverConst ? hoverConst[2] : '(none)'));

out.push('impact-has-transparent-no-important:' + /transparent\s*:\s*transparent\s*!important/.test(src));
out.push('impact-rule-transform:' + /transform:\s*none\s*!important/.test(src));

// modal's own authoritative hover rule served to PropertyDetailModal.tsx
const modalPath = 'impact-modal-check.cjs';
let modalRule = '(modal check unreadable)';
try {
  const msrc = fs.readFileSync(modalPath, 'utf8');
  const m = msrc.match(/const hover\s*=\s*(['"])([\s\S]*?)\1\s*;/);
  modalRule = m ? m[2] : '(no hover const in modal check)';
} catch (e) {
  modalRule = 'ERR:' + e.message;
}
out.push('modal-check-hover-json:' + JSON.stringify(modalRule));

out.push('===HOVER-REPORT-END===');

fs.writeFileSync(OUT, out.join('\n'), 'utf8');
console.log('WROTE ' + OUT + ' (' + out.length + ' lines)');
