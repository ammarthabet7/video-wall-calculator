export type UnitType = 'mm' | 'm' | 'ft' | 'in';
export type CabinetType = '16:9' | '1:1';
export type ParameterId = 'ar' | 'height' | 'width' | 'diagonal';
export type AspectRatioPreset =
  | '16:9'
  | '32:9'
  | '4:3'
  | '24:9'
  | '9:16'
  | '16:10'
  | '2.40:1'
  | '16:18'
  | '48:9';

export interface Cabinet {
  id: CabinetType;
  label: string;
  widthMm: number;
  heightMm: number;
}

export interface GridConfig {
  cols: number;
  rows: number;
  totalCabinets: number;
  widthMm: number;
  heightMm: number;
  diagMm: number;
  aspectRatio: number;
}

export interface CalcResult {
  lower: GridConfig | null;
  upper: GridConfig | null;
  /** Blocking issues – show as errors, no results */
  errors: string[];
  /** Non-blocking notices – clamping info, AR approximations, etc. */
  notices: string[];
}

export interface SelectedParams {
  ar: boolean;
  height: boolean;
  width: boolean;
  diagonal: boolean;
}
