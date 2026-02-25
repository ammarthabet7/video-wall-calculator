import type { GridConfig, UnitType, Cabinet } from '../types';
import { fromMm, round } from '../utils/unitConversion';

interface Props {
  config: GridConfig;
  cab: Cabinet;
  unit: UnitType;
  label: 'Lower' | 'Upper';
  onClear: () => void;
}

export default function ConfirmedResult({ config, cab, unit, label, onClear }: Props) {
  const fmt = (mm: number) => `${round(fromMm(mm, unit), 2)} ${unit}`;

  return (
    <div className="rounded-2xl border-2 border-green-400 bg-green-50 overflow-hidden shadow-sm">
      <div className="bg-green-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <span className="text-white font-bold">Confirmed Configuration ({label})</span>
        </div>
        <button
          onClick={onClear}
          className="text-white/70 hover:text-white text-sm font-medium"
        >
          Change
        </button>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-green-600 font-semibold uppercase tracking-wider">Grid</span>
          <span className="text-2xl font-black text-green-800">{config.cols}×{config.rows}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-green-600 font-semibold uppercase tracking-wider">Cabinets</span>
          <span className="text-2xl font-black text-green-800">{config.totalCabinets}</span>
        </div>
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-2">
          <span className="text-xs text-green-600 font-semibold uppercase tracking-wider">Dimensions</span>
          <div className="text-sm font-bold text-green-800 space-y-0.5">
            <div>W: {fmt(config.widthMm)}</div>
            <div>H: {fmt(config.heightMm)}</div>
            <div>D: {fmt(config.diagMm)}</div>
            <div>AR: {round(config.aspectRatio, 3).toFixed(3)}</div>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-4 text-xs text-green-600 border-t border-green-200 pt-3 mt-1">
          Cabinet: {cab.id} — {cab.widthMm} × {cab.heightMm} mm each
        </div>
      </div>
    </div>
  );
}
