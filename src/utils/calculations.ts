import type { Cabinet, CalcResult, GridConfig } from '../types';
import { MAX_HEIGHT_MM, MAX_WIDTH_MM } from '../constants/cabinets';
import { toMm, fromMm } from './unitConversion';
import type { UnitType } from '../types';

const EPS = 1e-6;

// ─── Grid builder ─────────────────────────────────────────────────────────────

function buildGrid(cols: number, rows: number, cab: Cabinet): GridConfig {
  const w = cols * cab.widthMm;
  const h = rows * cab.heightMm;
  return {
    cols,
    rows,
    totalCabinets: cols * rows,
    widthMm: w,
    heightMm: h,
    diagMm: Math.sqrt(w * w + h * h),
    aspectRatio: w / h,
  };
}

// ─── Cab limits ───────────────────────────────────────────────────────────────

function maxCols(cab: Cabinet): number {
  return Math.floor(MAX_WIDTH_MM / cab.widthMm);
}
function maxRows(cab: Cabinet): number {
  return Math.floor(MAX_HEIGHT_MM / cab.heightMm);
}

// ─── AR-aware helpers ─────────────────────────────────────────────────────────

/** For a fixed row count, return the 1-2 grids that are closest in AR to targetAR */
function bestColsForAR(rows: number, targetAR: number, cab: Cabinet): GridConfig[] {
  const actualH = rows * cab.heightMm;
  const idealCols = (actualH * targetAR) / cab.widthMm;
  const mc = maxCols(cab);
  const candidates = [
    Math.max(1, Math.floor(idealCols)),
    Math.min(mc, Math.ceil(idealCols)),
  ].filter((c, i, a) => a.indexOf(c) === i);
  return candidates.map((c) => buildGrid(c, rows, cab));
}

/** For a fixed col count, return the 1-2 grids that are closest in AR to targetAR */
function bestRowsForAR(cols: number, targetAR: number, cab: Cabinet): GridConfig[] {
  const actualW = cols * cab.widthMm;
  const idealRows = actualW / (targetAR * cab.heightMm);
  const mr = maxRows(cab);
  const candidates = [
    Math.max(1, Math.floor(idealRows)),
    Math.min(mr, Math.ceil(idealRows)),
  ].filter((c, i, a) => a.indexOf(c) === i);
  return candidates.map((r) => buildGrid(cols, r, cab));
}

/** Pick the grid with AR closest to targetAR */
function closestAR(grids: GridConfig[], targetAR: number): GridConfig | null {
  if (grids.length === 0) return null;
  return grids.reduce((best, g) =>
    Math.abs(g.aspectRatio - targetAR) < Math.abs(best.aspectRatio - targetAR) ? g : best,
  );
}

// ─── Strategy A: AR + Height (primary = rows) ─────────────────────────────────

function findByAR_Height(
  targetHmm: number,
  targetARvalue: number,
  cab: Cabinet,
  notices: string[],
): { lower: GridConfig | null; upper: GridConfig | null } {
  const mr = maxRows(cab);
  const naturalRows = targetHmm / cab.heightMm;

  if (naturalRows < 1 - EPS) {
    notices.push(
      'Requested height is smaller than a single cabinet. ' +
      'No lower configuration exists — showing the minimum 1×1 grid as upper.',
    );
    return { lower: null, upper: buildGrid(1, 1, cab) };
  }

  const rowsBelow = Math.max(1, Math.floor(naturalRows));
  const rowsAbove = Math.ceil(naturalRows);

  if (rowsAbove > mr) {
    notices.push(
      `Requested size exceeds maximum supported dimensions. ` +
      `Results are capped at ${mr} rows (max height ${MAX_HEIGHT_MM} mm).`,
    );
  }

  const rowsAboveClamped = Math.min(mr, rowsAbove);
  const lower = closestAR(bestColsForAR(rowsBelow, targetARvalue, cab), targetARvalue);

  let upper: GridConfig | null = null;
  if (rowsAboveClamped === rowsBelow) {
    // Exact match on rows (naturalRows is integer) — upper = try next rows up
    const nextRows = rowsBelow + 1;
    if (nextRows <= mr) {
      upper = closestAR(bestColsForAR(nextRows, targetARvalue, cab), targetARvalue);
    } else {
      // At max rows, bump cols by 1 for upper
      const lowerCols = lower?.cols ?? 1;
      const colsAbove = Math.min(maxCols(cab), lowerCols + 1);
      const candidate = buildGrid(colsAbove, rowsBelow, cab);
      upper = candidate.diagMm > (lower?.diagMm ?? 0) + EPS ? candidate : null;
    }
  } else {
    upper = closestAR(bestColsForAR(rowsAboveClamped, targetARvalue, cab), targetARvalue);
  }

  return { lower, upper };
}

// ─── Strategy B: AR + Width (primary = cols) ─────────────────────────────────

function findByAR_Width(
  targetWmm: number,
  targetARvalue: number,
  cab: Cabinet,
  notices: string[],
): { lower: GridConfig | null; upper: GridConfig | null } {
  const mc = maxCols(cab);
  const naturalCols = targetWmm / cab.widthMm;

  if (naturalCols < 1 - EPS) {
    notices.push(
      'Requested width is smaller than a single cabinet. ' +
      'No lower configuration exists — showing the minimum 1×1 grid as upper.',
    );
    return { lower: null, upper: buildGrid(1, 1, cab) };
  }

  const colsBelow = Math.max(1, Math.floor(naturalCols));
  const colsAbove = Math.ceil(naturalCols);

  if (colsAbove > mc) {
    notices.push(
      `Requested size exceeds maximum supported dimensions. ` +
      `Results are capped at ${mc} columns (max width ${MAX_WIDTH_MM} mm).`,
    );
  }

  const colsAboveClamped = Math.min(mc, colsAbove);
  const lower = closestAR(bestRowsForAR(colsBelow, targetARvalue, cab), targetARvalue);

  let upper: GridConfig | null = null;
  if (colsAboveClamped === colsBelow) {
    const nextCols = colsBelow + 1;
    if (nextCols <= mc) {
      upper = closestAR(bestRowsForAR(nextCols, targetARvalue, cab), targetARvalue);
    } else {
      const lowerRows = lower?.rows ?? 1;
      const rowsAbove = Math.min(maxRows(cab), lowerRows + 1);
      const candidate = buildGrid(colsBelow, rowsAbove, cab);
      upper = candidate.diagMm > (lower?.diagMm ?? 0) + EPS ? candidate : null;
    }
  } else {
    upper = closestAR(bestRowsForAR(colsAboveClamped, targetARvalue, cab), targetARvalue);
  }

  return { lower, upper };
}

// ─── Strategy C: Diagonal comparison (AR+D, H+W, H+D, W+D) ──────────────────

function findByDiagonal(
  targetWmm: number,
  targetHmm: number,
  cab: Cabinet,
  notices: string[],
): { lower: GridConfig | null; upper: GridConfig | null } {
  const mc = maxCols(cab);
  const mr = maxRows(cab);

  const tooSmallW = targetWmm < cab.widthMm - EPS;
  const tooSmallH = targetHmm < cab.heightMm - EPS;

  if (tooSmallW || tooSmallH) {
    notices.push(
      'Requested size is smaller than a single cabinet. ' +
      'No lower configuration exists — showing the minimum 1×1 grid as upper.',
    );
    return { lower: null, upper: buildGrid(1, 1, cab) };
  }

  const targetDiag = Math.sqrt(targetWmm ** 2 + targetHmm ** 2);

  const colMin = Math.max(1, Math.floor(targetWmm / cab.widthMm) - 1);
  const colMax = Math.min(mc, Math.ceil(targetWmm / cab.widthMm) + 1);
  const rowMin = Math.max(1, Math.floor(targetHmm / cab.heightMm) - 1);
  const rowMax = Math.min(mr, Math.ceil(targetHmm / cab.heightMm) + 1);

  const naturalColCeil = Math.ceil(targetWmm / cab.widthMm);
  const naturalRowCeil = Math.ceil(targetHmm / cab.heightMm);
  if (naturalColCeil > mc || naturalRowCeil > mr) {
    notices.push(
      `Requested size exceeds maximum supported dimensions. ` +
      `Results are capped at ${mc} columns x ${mr} rows ` +
      `(max ${MAX_WIDTH_MM} mm wide x ${MAX_HEIGHT_MM} mm tall).`,
    );
  }

  let lower: GridConfig | null = null;
  let upper: GridConfig | null = null;
  let lowerDelta = Infinity;
  let upperDelta = Infinity;

  for (let r = rowMin; r <= rowMax; r++) {
    for (let c = colMin; c <= colMax; c++) {
      const g = buildGrid(c, r, cab);
      const delta = g.diagMm - targetDiag;
      if (delta <= EPS) {
        const absDelta = Math.abs(delta);
        if (absDelta < lowerDelta) { lowerDelta = absDelta; lower = g; }
      }
      if (delta > -EPS) {
        if (delta < upperDelta) { upperDelta = delta; upper = g; }
      }
    }
  }

  // Exact match: same grid for both → promote upper to next larger
  if (lower && upper && lower.cols === upper.cols && lower.rows === upper.rows) {
    let nextUpper: GridConfig | null = null;
    let nextDelta = Infinity;
    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        const g = buildGrid(c, r, cab);
        const delta = g.diagMm - targetDiag;
        if (delta > EPS && delta < nextDelta) { nextDelta = delta; nextUpper = g; }
      }
    }
    upper = nextUpper;
  }

  return { lower, upper };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function parsePositive(raw: string): number | null {
  const v = parseFloat(raw);
  return isFinite(v) && v > 0 ? v : null;
}

// ─── Clamping ─────────────────────────────────────────────────────────────────

function clampDimensions(
  wMm: number,
  hMm: number,
  unit: UnitType,
  notices: string[],
): { wMm: number; hMm: number } {
  let cw = wMm;
  let ch = hMm;

  if (hMm > MAX_HEIGHT_MM + EPS) {
    notices.push(
      `Your height input (${fromMm(hMm, unit).toFixed(2)} ${unit}) exceeds the maximum of ` +
      `${fromMm(MAX_HEIGHT_MM, unit).toFixed(2)} ${unit} (${MAX_HEIGHT_MM} mm). ` +
      `It has been clamped to ${fromMm(MAX_HEIGHT_MM, unit).toFixed(2)} ${unit}.`,
    );
    ch = MAX_HEIGHT_MM;
  }

  if (wMm > MAX_WIDTH_MM + EPS) {
    notices.push(
      `Your width input (${fromMm(wMm, unit).toFixed(2)} ${unit}) exceeds the maximum of ` +
      `${fromMm(MAX_WIDTH_MM, unit).toFixed(2)} ${unit} (${MAX_WIDTH_MM} mm). ` +
      `It has been clamped to ${fromMm(MAX_WIDTH_MM, unit).toFixed(2)} ${unit}.`,
    );
    cw = MAX_WIDTH_MM;
  }

  return { wMm: cw, hMm: ch };
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface CalcInputs {
  activeParams: [string, string];
  values: Record<string, string>;
  arValue?: number;
  cab: Cabinet;
  unit: UnitType;
}

export function calculate(inputs: CalcInputs): CalcResult {
  const errors: string[] = [];
  const notices: string[] = [];

  const { activeParams, values, arValue, cab, unit } = inputs;
  const [p1, p2] = activeParams;

  const getVal = (id: string): number | null => {
    if (id === 'ar') return arValue ?? null;
    const raw = values[id] ?? '';
    const v = parsePositive(raw);
    if (v == null) return null;
    return toMm(v, unit);
  };

  // Validate inputs
  const vals: Record<string, number | null> = {};
  for (const id of activeParams) {
    vals[id] = getVal(id);
    if (vals[id] == null) {
      const label = id === 'ar' ? 'aspect ratio' : id;
      errors.push(`Please enter a valid positive value for ${label}.`);
    }
  }
  if (errors.length > 0) return { lower: null, upper: null, errors, notices };

  const has = (id: string) => p1 === id || p2 === id;

  // ── Geometry validation ──────────────────────────────────────────────────
  if (has('height') && has('diagonal')) {
    const H = vals['height'] as number;
    const D = vals['diagonal'] as number;
    if (D <= H + EPS) {
      errors.push('Diagonal must be greater than height.');
      return { lower: null, upper: null, errors, notices };
    }
  }

  if (has('width') && has('diagonal')) {
    const W = vals['width'] as number;
    const D = vals['diagonal'] as number;
    if (D <= W + EPS) {
      errors.push('Diagonal must be greater than width.');
      return { lower: null, upper: null, errors, notices };
    }
  }

  // ── Derive targetW and targetH (mm) ──────────────────────────────────────
  let targetWmm = 0;
  let targetHmm = 0;

  if (has('ar') && has('height')) {
    const ARreal = arValue as number;
    const H = vals['height'] as number;
    targetHmm = H;
    targetWmm = H * ARreal;
  } else if (has('ar') && has('width')) {
    const ARreal = arValue as number;
    const W = vals['width'] as number;
    targetWmm = W;
    targetHmm = W / ARreal;
  } else if (has('ar') && has('diagonal')) {
    const ARreal = arValue as number;
    const D = vals['diagonal'] as number;
    targetHmm = D / Math.sqrt(ARreal * ARreal + 1);
    targetWmm = targetHmm * ARreal;
  } else if (has('height') && has('width')) {
    targetHmm = vals['height'] as number;
    targetWmm = vals['width'] as number;
  } else if (has('height') && has('diagonal')) {
    const H = vals['height'] as number;
    const D = vals['diagonal'] as number;
    targetHmm = H;
    targetWmm = Math.sqrt(D * D - H * H);
  } else if (has('width') && has('diagonal')) {
    const W = vals['width'] as number;
    const D = vals['diagonal'] as number;
    targetWmm = W;
    targetHmm = Math.sqrt(D * D - W * W);
  } else {
    errors.push('Unsupported parameter combination.');
    return { lower: null, upper: null, errors, notices };
  }

  // ── Clamp derived dimensions to physical limits ───────────────────────────
  const clamped = clampDimensions(targetWmm, targetHmm, unit, notices);
  targetWmm = clamped.wMm;
  targetHmm = clamped.hMm;

  // ── AR achievability notice ───────────────────────────────────────────────
  if (has('ar')) {
    const ARreal = arValue as number;
    const nativeAR = cab.widthMm / cab.heightMm;
    if (Math.abs(nativeAR - ARreal) > 0.02) {
      notices.push(
        `The ${cab.id} cabinet (native AR approx. ${nativeAR.toFixed(3)}) may not perfectly achieve ` +
        `a ${formatAR(ARreal)} aspect ratio. The closest achievable ratio is shown in each result.`,
      );
    }
  }

  // ── Find configurations using context-aware strategy ─────────────────────
  let lower: GridConfig | null = null;
  let upper: GridConfig | null = null;

  if (has('ar') && has('height')) {
    ({ lower, upper } = findByAR_Height(targetHmm, arValue as number, cab, notices));
  } else if (has('ar') && has('width')) {
    ({ lower, upper } = findByAR_Width(targetWmm, arValue as number, cab, notices));
  } else {
    // AR+D, H+W, H+D, W+D — use diagonal as comparison metric
    ({ lower, upper } = findByDiagonal(targetWmm, targetHmm, cab, notices));
  }

  return { lower, upper, errors, notices };
}

function formatAR(ar: number): string {
  return ar.toFixed(4).replace(/\.?0+$/, '');
}
