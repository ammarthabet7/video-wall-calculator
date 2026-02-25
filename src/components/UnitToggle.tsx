import type { UnitType } from '../types';

const UNITS: { id: UnitType; label: string }[] = [
  { id: 'mm', label: 'mm' },
  { id: 'm',  label: 'm'  },
  { id: 'ft', label: 'ft' },
  { id: 'in', label: 'in' },
];

interface Props {
  value: UnitType;
  onChange: (unit: UnitType) => void;
}

export default function UnitToggle({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Unit
      </label>
      <div className="flex rounded-lg border-2 border-slate-200 overflow-hidden bg-white">
        {UNITS.map((u) => (
          <button
            key={u.id}
            onClick={() => onChange(u.id)}
            className={`
              flex-1 px-3 py-2.5 text-sm font-semibold transition-all
              ${value === u.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
              }
            `}
          >
            {u.label}
          </button>
        ))}
      </div>
    </div>
  );
}
