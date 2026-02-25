/**
 * Test runner for Video Wall Size Calculator
 * Run with: npx tsx src/tests/run-tests.ts
 */

// Inline the constants/utils (no module bundler needed for tsx)
const CABINET_169 = { id: '16:9' as const, label: '16:9', widthMm: 600, heightMm: 337.5 };
const CABINET_11  = { id: '1:1'  as const, label: '1:1',  widthMm: 500, heightMm: 500   };
const MAX_HEIGHT_MM = 2500;
const MAX_WIDTH_MM  = 6000;
const EPS = 1e-6;

const MM_PER_UNIT: Record<string, number> = { mm: 1, m: 1000, ft: 304.8, in: 25.4 };
function toMm(v: number, u: string) { return v * MM_PER_UNIT[u]; }
function fromMm(v: number, u: string) { return v / MM_PER_UNIT[u]; }

type Cabinet = { id: string; widthMm: number; heightMm: number };
type GridConfig = { cols: number; rows: number; totalCabinets: number; widthMm: number; heightMm: number; diagMm: number; aspectRatio: number };

function buildGrid(cols: number, rows: number, cab: Cabinet): GridConfig {
  const w = cols * cab.widthMm, h = rows * cab.heightMm;
  return { cols, rows, totalCabinets: cols * rows, widthMm: w, heightMm: h,
    diagMm: Math.sqrt(w * w + h * h), aspectRatio: w / h };
}
function mcols(cab: Cabinet) { return Math.floor(MAX_WIDTH_MM / cab.widthMm); }
function mrows(cab: Cabinet) { return Math.floor(MAX_HEIGHT_MM / cab.heightMm); }

function bestColsForAR(rows: number, ar: number, cab: Cabinet) {
  const idealC = (rows * cab.heightMm * ar) / cab.widthMm;
  return [Math.max(1, Math.floor(idealC)), Math.min(mcols(cab), Math.ceil(idealC))]
    .filter((c, i, a) => a.indexOf(c) === i).map(c => buildGrid(c, rows, cab));
}
function bestRowsForAR(cols: number, ar: number, cab: Cabinet) {
  const idealR = (cols * cab.widthMm) / (ar * cab.heightMm);
  return [Math.max(1, Math.floor(idealR)), Math.min(mrows(cab), Math.ceil(idealR))]
    .filter((r, i, a) => a.indexOf(r) === i).map(r => buildGrid(cols, r, cab));
}
function closestAR(grids: GridConfig[], ar: number) {
  if (!grids.length) return null;
  return grids.reduce((b, g) => Math.abs(g.aspectRatio - ar) < Math.abs(b.aspectRatio - ar) ? g : b);
}

function findByAR_Height(targetH: number, ar: number, cab: Cabinet, notices: string[]) {
  const mr = mrows(cab), nat = targetH / cab.heightMm;
  if (nat < 1 - EPS) { notices.push('SMALL'); return { lower: null, upper: buildGrid(1,1,cab) }; }
  const rb = Math.max(1, Math.floor(nat)), ra = Math.ceil(nat);
  if (ra > mr) notices.push('EXCEED');
  const rac = Math.min(mr, ra);
  const lower = closestAR(bestColsForAR(rb, ar, cab), ar);
  let upper = null;
  if (rac === rb) {
    const nr = rb + 1;
    if (nr <= mr) upper = closestAR(bestColsForAR(nr, ar, cab), ar);
    else { const ca = Math.min(mcols(cab), (lower?.cols ?? 1) + 1); const cand = buildGrid(ca, rb, cab); upper = cand.diagMm > (lower?.diagMm ?? 0) + EPS ? cand : null; }
  } else { upper = closestAR(bestColsForAR(rac, ar, cab), ar); }
  return { lower, upper };
}

function findByAR_Width(targetW: number, ar: number, cab: Cabinet, notices: string[]) {
  const mc = mcols(cab), nat = targetW / cab.widthMm;
  if (nat < 1 - EPS) { notices.push('SMALL'); return { lower: null, upper: buildGrid(1,1,cab) }; }
  const cb2 = Math.max(1, Math.floor(nat)), ca2 = Math.ceil(nat);
  if (ca2 > mc) notices.push('EXCEED');
  const cac = Math.min(mc, ca2);
  const lower = closestAR(bestRowsForAR(cb2, ar, cab), ar);
  let upper = null;
  if (cac === cb2) {
    const nc = cb2 + 1;
    if (nc <= mc) upper = closestAR(bestRowsForAR(nc, ar, cab), ar);
    else { const ra2 = Math.min(mrows(cab), (lower?.rows ?? 1) + 1); const cand = buildGrid(cb2, ra2, cab); upper = cand.diagMm > (lower?.diagMm ?? 0) + EPS ? cand : null; }
  } else { upper = closestAR(bestRowsForAR(cac, ar, cab), ar); }
  return { lower, upper };
}

function findByDiagonal(targetW: number, targetH: number, cab: Cabinet, notices: string[]) {
  const mc = mcols(cab), mr = mrows(cab);
  if (targetW < cab.widthMm - EPS || targetH < cab.heightMm - EPS) { notices.push('SMALL'); return { lower: null, upper: buildGrid(1,1,cab) }; }
  const td = Math.sqrt(targetW ** 2 + targetH ** 2);
  const cMin = Math.max(1, Math.floor(targetW / cab.widthMm) - 1);
  const cMax = Math.min(mc, Math.ceil(targetW / cab.widthMm) + 1);
  const rMin = Math.max(1, Math.floor(targetH / cab.heightMm) - 1);
  const rMax = Math.min(mr, Math.ceil(targetH / cab.heightMm) + 1);
  if (Math.ceil(targetW / cab.widthMm) > mc || Math.ceil(targetH / cab.heightMm) > mr) notices.push('EXCEED');
  let lower: GridConfig | null = null, upper: GridConfig | null = null;
  let ld = Infinity, ud = Infinity;
  for (let r = rMin; r <= rMax; r++) for (let c = cMin; c <= cMax; c++) {
    const g = buildGrid(c, r, cab), delta = g.diagMm - td;
    if (delta <= EPS && Math.abs(delta) < ld) { ld = Math.abs(delta); lower = g; }
    if (delta > -EPS && delta < ud) { ud = delta; upper = g; }
  }
  if (lower && upper && lower.cols === upper.cols && lower.rows === upper.rows) {
    let nu: GridConfig | null = null, nd = Infinity;
    for (let r = rMin; r <= rMax; r++) for (let c = cMin; c <= cMax; c++) {
      const g = buildGrid(c,r,cab), delta = g.diagMm - td;
      if (delta > EPS && delta < nd) { nd = delta; nu = g; }
    }
    upper = nu;
  }
  return { lower, upper };
}

function calculate(activeParams: [string,string], values: Record<string,string>, arValue: number|undefined, cab: Cabinet, unit: string) {
  const errors: string[] = [], notices: string[] = [];
  const has = (id: string) => activeParams[0] === id || activeParams[1] === id;
  const getVal = (id: string): number | null => {
    if (id === 'ar') return arValue ?? null;
    const v = parseFloat(values[id] ?? '');
    return isFinite(v) && v > 0 ? toMm(v, unit) : null;
  };
  const vals: Record<string,number|null> = {};
  for (const id of activeParams) {
    vals[id] = getVal(id);
    if (vals[id] == null) errors.push(`invalid: ${id}`);
  }
  if (errors.length) return { lower: null, upper: null, errors, notices };
  if (has('height') && has('diagonal')) { const H = vals['height']!, D = vals['diagonal']!; if (D <= H + EPS) { errors.push('Diagonal must be greater than height.'); return { lower: null, upper: null, errors, notices }; } }
  if (has('width') && has('diagonal'))  { const W = vals['width']!,  D = vals['diagonal']!; if (D <= W + EPS) { errors.push('Diagonal must be greater than width.');  return { lower: null, upper: null, errors, notices }; } }
  let tW = 0, tH = 0;
  if      (has('ar') && has('height'))   { const ar = arValue!, H = vals['height']!; tH = H; tW = H * ar; }
  else if (has('ar') && has('width'))    { const ar = arValue!, W = vals['width']!;  tW = W; tH = W / ar; }
  else if (has('ar') && has('diagonal')) { const ar = arValue!, D = vals['diagonal']!; tH = D / Math.sqrt(ar*ar+1); tW = tH * ar; }
  else if (has('height') && has('width'))    { tH = vals['height']!; tW = vals['width']!; }
  else if (has('height') && has('diagonal')) { const H = vals['height']!, D = vals['diagonal']!; tH = H; tW = Math.sqrt(D*D - H*H); }
  else if (has('width')  && has('diagonal')) { const W = vals['width']!,  D = vals['diagonal']!; tW = W; tH = Math.sqrt(D*D - W*W); }
  if (tH > MAX_HEIGHT_MM + EPS) { notices.push(`CLAMPED_H: ${tH.toFixed(1)}->${MAX_HEIGHT_MM}`); tH = MAX_HEIGHT_MM; }
  if (tW > MAX_WIDTH_MM  + EPS) { notices.push(`CLAMPED_W: ${tW.toFixed(1)}->${MAX_WIDTH_MM}`);  tW = MAX_WIDTH_MM; }
  let lower: GridConfig|null, upper: GridConfig|null;
  if      (has('ar') && has('height')) ({ lower, upper } = findByAR_Height(tH, arValue!, cab, notices));
  else if (has('ar') && has('width'))  ({ lower, upper } = findByAR_Width(tW, arValue!, cab, notices));
  else                                  ({ lower, upper } = findByDiagonal(tW, tH, cab, notices));
  return { lower, upper, errors, notices };
}

// ─── TEST FRAMEWORK ──────────────────────────────────────────────────────────

let passed = 0, failed = 0;
const results: { id: string; status: 'PASS'|'FAIL'; detail: string }[] = [];

function test(id: string, description: string, fn: () => { ok: boolean; detail: string }) {
  try {
    const { ok, detail } = fn();
    if (ok) { passed++; results.push({ id, status: 'PASS', detail: description }); }
    else     { failed++; results.push({ id, status: 'FAIL', detail: `${description} | ${detail}` }); }
  } catch(e: any) {
    failed++; results.push({ id, status: 'FAIL', detail: `${description} | THREW: ${e.message}` });
  }
}

// ─── NORMAL TEST CASES ───────────────────────────────────────────────────────

const AR_169 = 16/9;
const AR_43  = 4/3;
const AR_11  = 1;

// N1: 16:9 cab, AR=16:9, H=100in
// Task spec example: lower=7x7 (H=93.01in), upper=8x7 (H=93.01in, wider)
// 8 rows would be 2700mm > 2500mm max, so upper goes wider (more cols), not taller
test('N1', '16:9 cab | AR=16:9 | H=100in → lower=7x7, upper=8x7 (per task spec)', () => {
  const r = calculate(['ar','height'], { height:'100' }, AR_169, CABINET_169, 'in');
  const lOk = r.lower?.rows === 7 && r.lower?.cols === 7;
  const uOk = r.upper?.rows === 7 && r.upper?.cols === 8;
  const ok = lOk && uOk;
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows}, upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// N2: 16:9 cab, AR=16:9, W=3000mm → floor(3000/600)=5 cols lower, 6 cols upper
test('N2', '16:9 cab | AR=16:9 | W=3000mm → lower 5 cols, upper 6 cols', () => {
  const r = calculate(['ar','width'], { width:'3000' }, AR_169, CABINET_169, 'mm');
  const lC = r.lower?.cols, uC = r.upper?.cols;
  const ok = lC === 5 && uC === 6;
  return { ok, detail: `lower cols=${lC}, upper cols=${uC}` };
});

// N3: 1:1 cab, AR=16:9, H=100in → AR won't be exact 1.78, but should return results
test('N3', '1:1 cab | AR=16:9 | H=100in → returns results (AR approx)', () => {
  const r = calculate(['ar','height'], { height:'100' }, AR_169, CABINET_11, 'in');
  const ok = !r.errors.length && (r.lower !== null || r.upper !== null);
  return { ok, detail: `errors=${r.errors.join(',')}, lower=${r.lower?.cols}x${r.lower?.rows}, upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// N4: 16:9 cab, H+W, H=2000mm W=4000mm → diagonal strategy
test('N4', '16:9 cab | H=2000mm W=4000mm → lower/upper bracket 2000x4000', () => {
  const r = calculate(['height','width'], { height:'2000', width:'4000' }, undefined, CABINET_169, 'mm');
  const ok = !r.errors.length && r.lower !== null && r.upper !== null
    && r.lower.heightMm <= 2000 + EPS && r.upper.widthMm >= 4000 - EPS;
  return { ok, detail: `lower=${r.lower?.widthMm}x${r.lower?.heightMm} upper=${r.upper?.widthMm}x${r.upper?.heightMm}` };
});

// N5: 16:9 cab, AR=16:9, D=3000mm → H = 3000/sqrt(AR^2+1)
test('N5', '16:9 cab | AR=16:9 | D=3000mm → returns valid results', () => {
  const r = calculate(['ar','diagonal'], { diagonal:'3000' }, AR_169, CABINET_169, 'mm');
  const ok = !r.errors.length && (r.lower !== null || r.upper !== null);
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows} upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// N6: 1:1 cab, H=1500 W=2000 → 4c×3r is an exact match (4*500=2000, 3*500=1500)
test('N6', '1:1 cab | H=1500mm W=2000mm → exact match: lower=4x3, upper≠4x3', () => {
  const r = calculate(['height','width'], { height:'1500', width:'2000' }, undefined, CABINET_11, 'mm');
  const lOk = r.lower?.cols === 4 && r.lower?.rows === 3;
  const uOk = !(r.upper?.cols === 4 && r.upper?.rows === 3); // different from lower
  const ok = lOk && uOk;
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows}, upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// N7: 16:9 cab, H+Diagonal, H=100in D=200in → W=sqrt(D²-H²)
test('N7', '16:9 cab | H=100in D=200in → W=sqrt(D²-H²)≈4399mm, valid results', () => {
  const r = calculate(['height','diagonal'], { height:'100', diagonal:'200' }, undefined, CABINET_169, 'in');
  const ok = !r.errors.length && (r.lower !== null || r.upper !== null);
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows} upper=${r.upper?.cols}x${r.upper?.rows} notices=${r.notices.join('; ')}` };
});

// N8: W+Diagonal combo
test('N8', '16:9 cab | W=100in D=200in → valid H+AR derived, returns results', () => {
  const r = calculate(['width','diagonal'], { width:'100', diagonal:'200' }, undefined, CABINET_169, 'in');
  const ok = !r.errors.length && (r.lower !== null || r.upper !== null);
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows} upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// ─── UNIT CONVERSION TESTS ───────────────────────────────────────────────────

test('U1', 'Unit: 100in to mm = 2540', () => {
  const v = toMm(100, 'in');
  return { ok: Math.abs(v - 2540) < 0.01, detail: `got ${v}` };
});
test('U2', 'Unit: 2m to ft ≈ 6.5617', () => {
  const v = fromMm(toMm(2, 'm'), 'ft');
  return { ok: Math.abs(v - 6.5617) < 0.001, detail: `got ${v}` };
});
test('U3', 'Unit: 2540mm to inches = 100', () => {
  const v = fromMm(2540, 'in');
  return { ok: Math.abs(v - 100) < 0.001, detail: `got ${v}` };
});
test('U4', 'Unit: 8.2ft to meters ≈ 2.499', () => {
  const v = fromMm(toMm(8.2, 'ft'), 'm');
  return { ok: Math.abs(v - 2.49936) < 0.0001, detail: `got ${v}` };
});

// ─── EDGE CASE TESTS ─────────────────────────────────────────────────────────

// E1: H > 2500mm → clamped
test('E1', 'CLAMP: H=3000mm (>2500) → notice shown, results still returned', () => {
  const r = calculate(['ar','height'], { height:'3000' }, AR_169, CABINET_169, 'mm');
  const ok = r.notices.some(n => n.includes('CLAMPED_H')) && !r.errors.length && r.lower !== null;
  return { ok, detail: `notices=${r.notices.join('|')} lower=${r.lower?.cols}x${r.lower?.rows}` };
});

// E2: W > 6000mm → clamped
test('E2', 'CLAMP: W=7000mm (>6000) → notice shown, results still returned', () => {
  const r = calculate(['ar','width'], { width:'7000' }, AR_169, CABINET_169, 'mm');
  const ok = r.notices.some(n => n.includes('CLAMPED_W')) && !r.errors.length;
  return { ok, detail: `notices=${r.notices.join('|')}` };
});

// E3: H < 1 cabinet height → small size: lower=null, upper=1x1
test('E3', 'SMALL: H=100mm < 337.5mm (1 cab) → lower=null, upper=1x1', () => {
  const r = calculate(['ar','height'], { height:'100' }, AR_169, CABINET_169, 'mm');
  const ok = r.lower === null && r.upper?.cols === 1 && r.upper?.rows === 1;
  return { ok, detail: `lower=${r.lower}, upper=${r.upper?.cols}x${r.upper?.rows} notices=${r.notices.join('|')}` };
});

// E4: W < 1 cabinet width → small size
test('E4', 'SMALL: W=200mm < 500mm (1x1 cab) → lower=null, upper=1x1', () => {
  const r = calculate(['ar','width'], { width:'200' }, AR_169, CABINET_11, 'mm');
  const ok = r.lower === null && r.upper?.cols === 1 && r.upper?.rows === 1;
  return { ok, detail: `lower=${r.lower}, upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// E5: Diagonal ≤ Height → error
test('E5', 'GEO ERROR: D=50in H=60in → error diagonal must be > height', () => {
  const r = calculate(['height','diagonal'], { height:'60', diagonal:'50' }, undefined, CABINET_169, 'in');
  const ok = r.errors.some(e => e.toLowerCase().includes('diagonal'));
  return { ok, detail: `errors=${r.errors.join('|')}` };
});

// E6: Diagonal ≤ Width → error
test('E6', 'GEO ERROR: D=1000mm W=1500mm → error diagonal must be > width', () => {
  const r = calculate(['width','diagonal'], { width:'1500', diagonal:'1000' }, undefined, CABINET_11, 'mm');
  const ok = r.errors.some(e => e.toLowerCase().includes('diagonal'));
  return { ok, detail: `errors=${r.errors.join('|')}` };
});

// E7: Zero input → error
test('E7', 'INVALID: H=0 → validation error', () => {
  const r = calculate(['ar','height'], { height:'0' }, AR_169, CABINET_169, 'mm');
  const ok = r.errors.length > 0;
  return { ok, detail: `errors=${r.errors.join('|')}` };
});

// E8: Negative input → error
test('E8', 'INVALID: H=-5 → validation error', () => {
  const r = calculate(['ar','height'], { height:'-5' }, AR_169, CABINET_169, 'mm');
  const ok = r.errors.length > 0;
  return { ok, detail: `errors=${r.errors.join('|')}` };
});

// E9: Exact match → lower=that grid, upper=different grid
test('E9', '16:9 cab | H=337.5mm (exact 1 row) → lower=1 row, upper=2 rows', () => {
  const r = calculate(['ar','height'], { height:'337.5' }, AR_169, CABINET_169, 'mm');
  const ok = r.lower?.rows === 1 && r.upper !== null && r.upper.rows !== r.lower?.rows;
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows} upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// E10: 1:1 cab max dims → 12c×5r is exact max
test('E10', '1:1 cab | H=2500mm W=6000mm → exactly 12x5 → lower=12x5', () => {
  const r = calculate(['height','width'], { height:'2500', width:'6000' }, undefined, CABINET_11, 'mm');
  const ok = r.lower?.cols === 12 && r.lower?.rows === 5;
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows} upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// E11: 16:9 cab, max width 6000mm
test('E11', '16:9 cab | AR=16:9 | W=6000mm → max cols=10, results within bounds', () => {
  const r = calculate(['ar','width'], { width:'6000' }, AR_169, CABINET_169, 'mm');
  const lOk = (r.lower?.cols ?? 0) <= 10;
  const uOk = (r.upper?.cols ?? 0) <= 10;
  const ok = !r.errors.length && lOk && uOk;
  return { ok, detail: `lower=${r.lower?.cols}x${r.lower?.rows} upper=${r.upper?.cols}x${r.upper?.rows}` };
});

// E12: Diagonal = Height exactly  → error
test('E12', 'GEO ERROR: D=H=100in → error (equal, not strictly greater)', () => {
  const r = calculate(['height','diagonal'], { height:'100', diagonal:'100' }, undefined, CABINET_169, 'in');
  const ok = r.errors.some(e => e.toLowerCase().includes('diagonal'));
  return { ok, detail: `errors=${r.errors.join('|')}` };
});

// ─── REPORT ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  VIDEO WALL CALCULATOR — TEST REPORT                          ║`);
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  Total:  ${String(total).padEnd(5)} │ PASSED: ${String(passed).padEnd(5)} │ FAILED: ${String(failed).padEnd(20)}║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon}  [${r.id}] ${r.detail}`);
}

console.log(`\n─────────────────────────────────────────────────`);
console.log(`Result: ${passed}/${total} passed  (${failed} failed)`);
