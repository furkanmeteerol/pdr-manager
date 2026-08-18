import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetFiles = [
  path.join(rootDir, 'node_modules', '@aiden0z', 'pptx-renderer', 'dist', 'aiden0z-pptx-renderer.es.js'),
  path.join(rootDir, 'node_modules', '@aiden0z', 'pptx-renderer', 'dist', 'aiden0z-pptx-renderer.umd.js')
];

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix paragraph first-line margin in Ec:
  // In PowerPoint, spcBef is suppressed on the very first visible paragraph of a text box (m === h)
  content = content.replace(
    'const E = (s == null ? void 0 : s.trimOuterParagraphSpacing) && m === h, P = (s == null ? void 0 : s.trimOuterParagraphSpacing) && m === u;',
    'const E = m === h || ((s == null ? void 0 : s.trimOuterParagraphSpacing) && m === h), P = (s == null ? void 0 : s.trimOuterParagraphSpacing) && m === u;'
  );

  // 2. Enable normAutofit trimOuterParagraphSpacing and compact defaults
  content = content.replace(
    'const St = ct || vt || nt && !bt ? {',
    'const St = ct || vt || nt || bt ? {'
  );
  content = content.replace(
    '...nt && !bt ? (() => {',
    '...bt || (nt && !bt) ? (() => {'
  );

  // 3. Fix normAutofit calculation in Qt:
  // Calculate scale = min(1, Gt / ae) when content overflows vertically, and relax overflow on normAutofit
  const oldAutofitCode = 'Pe = Gt > 0 && (ae <= Gt || !ee && qe && ae <= Gt * Do), Xn = Jt > 0 && Gt > 0 && qe && Pe, ti = nt && !bt && !ee && qe && Pe && ae > Gt && Gt > 0, Yn = ce && qe && ae > Gt && Gt > 0, ei = !vt && !yt && !Xn && (!qe || !Pe || At || ce || rt);';
  const newAutofitCode = 'Pe = !bt && Gt > 0 && (ae <= Gt || !ee && qe && ae <= Gt * Do), Xn = Jt > 0 && Gt > 0 && qe && Pe, ti = nt && !bt && !ee && qe && Pe && ae > Gt && Gt > 0, Yn = ce && qe && ae > Gt && Gt > 0, ei = !vt && !yt && !Xn && (!qe || !Pe || At || ce || rt);';
  if (content.includes(oldAutofitCode)) {
    content = content.replace(oldAutofitCode, newAutofitCode);
  }

  const oldScaleCode = 'let ye = 1;\n            const Fn = rt || ce';
  const newScaleCode = 'let ye = 1;\n            if (bt && Gt > 0 && ae > Gt) { ye = Math.min(1, Gt / ae); }\n            if (!bt) {\n            const Fn = rt || ce';
  if (content.includes(oldScaleCode)) {
    content = content.replace(oldScaleCode, newScaleCode);
    content = content.replace(
      'ye < 1 ? (N.style.transform || (N.style.transformOrigin = "top left"), rs(N, `scale(${ye})`), N.style.width = $r(Ct, ye), N.style.height = $r(Lt, ye)) : (ti || Yn) && (N.style.overflowY = "visible");',
      'ye < 1 ? (N.style.transform || (N.style.transformOrigin = "top left"), rs(N, `scale(${ye})`), N.style.width = $r(Ct, ye), N.style.height = $r(Lt, ye), N.style.overflowY = "visible", N.style.overflowX = "visible") : (ti || Yn || bt) && (N.style.overflowY = "visible", N.style.overflowX = "visible");'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[patch-pptx-renderer] Successfully patched ${path.basename(filePath)}`);
}
