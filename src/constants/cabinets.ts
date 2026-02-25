import type { Cabinet, AspectRatioPreset } from '../types';

export const CABINETS: Cabinet[] = [
  { id: '16:9', label: '16:9 Cabinet (600 × 337.5 mm)', widthMm: 600, heightMm: 337.5 },
  { id: '1:1',  label: '1:1 Cabinet  (500 × 500 mm)',   widthMm: 500, heightMm: 500 },
];

export const ASPECT_RATIO_PRESETS: { label: AspectRatioPreset; value: number }[] = [
  { label: '16:9',   value: 16 / 9 },
  { label: '32:9',   value: 32 / 9 },
  { label: '4:3',    value: 4 / 3 },
  { label: '24:9',   value: 24 / 9 },
  { label: '9:16',   value: 9 / 16 },
  { label: '16:10',  value: 16 / 10 },
  { label: '2.40:1', value: 2.40 },
  { label: '16:18',  value: 16 / 18 },
  { label: '48:9',   value: 48 / 9 },
];

/** Maximum physical video wall dimensions (mm) */
export const MAX_HEIGHT_MM = 2500; // 2.5 m
export const MAX_WIDTH_MM  = 6000; // 6 m
