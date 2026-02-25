import type { GridConfig, UnitType } from '../types';
import type { Cabinet } from '../types';
import { fromMm, round } from '../utils/unitConversion';
import GridDiagram from './GridDiagram';

interface Props {
  label: 'Lower' | 'Upper';
  config: GridConfig;
  cab: Cabinet;
  unit: UnitType;
  selected: boolean;
  onSelect: () => void;
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

export default function ResultCard({ label, config, cab, unit, selected, onSelect }: Props) {
  const isLower = label === 'Lower';
  const accentColor = isLower ? 'blue' : 'violet';

  const fmt = (mm: number) => round(fromMm(mm, unit), 2).toString();

  const colorMap = {
    blue: {
      border: selected ? 'border-blue-500' : 'border-blue-200',
      header: 'bg-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      button: selected
        ? 'bg-blue-600 text-white'
        : 'bg-white text-blue-600 border border-blue-400 hover:bg-blue-50',
      ring: 'ring-blue-300',
    },
    violet: {
      border: selected ? 'border-violet-500' : 'border-violet-200',
      header: 'bg-violet-600',
      badge: 'bg-violet-100 text-violet-700',
      button: selected
        ? 'bg-violet-600 text-white'
        : 'bg-white text-violet-600 border border-violet-400 hover:bg-violet-50',
      ring: 'ring-violet-300',
    },
  };

  const c = colorMap[accentColor];

  return (
    <div
      className={`
        rounded-2xl border-2 overflow-hidden transition-all shadow-sm
        ${c.border}
        ${selected ? `ring-2 ${c.ring}` : ''}
      `}
    >
      {/* Header */}
      <div className={`${c.header} px-4 py-3 flex items-center justify-between`}>
        <div>
          <span className="text-white font-bold text-base">Option {isLower ? '1' : '2'}</span>
          <span className="ml-2 text-white/70 text-sm">({label})</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
          {config.cols} × {config.rows}
        </span>
      </div>

      {/* Stats grid */}
      <div className="bg-white p-4 grid grid-cols-2 gap-3">
        <Stat label="Columns" value={`${config.cols}`} />
        <Stat label="Rows" value={`${config.rows}`} />
        <Stat label="Total Cabinets" value={`${config.totalCabinets}`} />
        <Stat label="Aspect Ratio" value={round(config.aspectRatio, 3).toFixed(3)} />
        <Stat label={`Width (${unit})`} value={fmt(config.widthMm)} />
        <Stat label={`Height (${unit})`} value={fmt(config.heightMm)} />
        <Stat label={`Diagonal (${unit})`} value={fmt(config.diagMm)} />
        <Stat label="Width (mm)" value={round(config.widthMm, 1).toString()} />
      </div>

      {/* Grid diagram */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 pb-3 pt-2">
        <GridDiagram
          cols={config.cols}
          rows={config.rows}
          cabinetAR={cab.widthMm / cab.heightMm}
        />
      </div>

      {/* Select button */}
      <div className="bg-white px-4 pb-4">
        <button
          onClick={onSelect}
          className={`
            w-full py-2 rounded-xl text-sm font-semibold transition-all
            ${c.button}
          `}
        >
          {selected ? '✓ Selected' : 'Select this configuration'}
        </button>
      </div>
    </div>
  );
}
