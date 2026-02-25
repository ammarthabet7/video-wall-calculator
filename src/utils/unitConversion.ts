import type { UnitType } from '../types';

/** How many mm are in one of the given unit */
export const MM_PER_UNIT: Record<UnitType, number> = {
  mm: 1,
  m:  1000,
  ft: 304.8,
  in: 25.4,
};

/** Convert a value from its unit to mm */
export function toMm(value: number, unit: UnitType): number {
  return value * MM_PER_UNIT[unit];
}

/** Convert a value from mm to the target unit */
export function fromMm(valueMm: number, unit: UnitType): number {
  return valueMm / MM_PER_UNIT[unit];
}

/** Convert a value from one unit to another */
export function convertUnit(value: number, from: UnitType, to: UnitType): number {
  return fromMm(toMm(value, from), to);
}

export function unitLabel(unit: UnitType): string {
  return unit;
}

/** Round to N decimal places */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
