import type { Cabinet } from '../types';
import { CABINETS } from '../constants/cabinets';

interface Props {
  value: Cabinet;
  onChange: (cab: Cabinet) => void;
}

export default function CabinetSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Cabinet Type
      </label>
      <div className="flex gap-2">
        {CABINETS.map((cab) => (
          <button
            key={cab.id}
            onClick={() => onChange(cab)}
            className={`
              flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all
              ${value.id === cab.id
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
              }
            `}
          >
            <div className="font-bold">{cab.id}</div>
            <div className="text-xs font-normal opacity-80">
              {cab.widthMm} × {cab.heightMm} mm
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
