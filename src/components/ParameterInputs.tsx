import type { SelectedParams, UnitType, AspectRatioPreset } from '../types';
import { ASPECT_RATIO_PRESETS } from '../constants/cabinets';

interface Props {
  selected: SelectedParams;
  onToggle: (id: keyof SelectedParams) => void;
  values: { height: string; width: string; diagonal: string };
  onValueChange: (id: 'height' | 'width' | 'diagonal', val: string) => void;
  selectedAR: AspectRatioPreset;
  onARChange: (ar: AspectRatioPreset) => void;
  unit: UnitType;
}

const selectedCount = (s: SelectedParams) =>
  Object.values(s).filter(Boolean).length;

interface RowProps {
  id: keyof SelectedParams;
  label: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ParamRow({ label, selected, disabled, onToggle, children }: RowProps) {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-xl border-2 transition-all
        ${selected
          ? 'border-blue-500 bg-blue-50'
          : disabled
          ? 'border-slate-100 bg-slate-50 opacity-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
        }
      `}
    >
      {/* Checkbox toggle */}
      <button
        onClick={onToggle}
        disabled={disabled && !selected}
        aria-label={`Toggle ${label}`}
        className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${selected
            ? 'bg-blue-600 border-blue-600'
            : 'border-slate-300 bg-white hover:border-blue-400'
          }
          ${disabled && !selected ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Label */}
      <span className={`text-sm font-semibold w-20 flex-shrink-0 ${selected ? 'text-blue-700' : 'text-slate-600'}`}>
        {label}
      </span>

      {/* Input */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export default function ParameterInputs({
  selected,
  onToggle,
  values,
  onValueChange,
  selectedAR,
  onARChange,
  unit,
}: Props) {
  const count = selectedCount(selected);
  const canSelect = count < 2;

  const isDisabled = (id: keyof SelectedParams) => !selected[id] && !canSelect;

  const numericInput = (
    id: 'height' | 'width' | 'diagonal',
    placeholder: string,
  ) => {
    const active = selected[id];
    return (
      <input
        type="number"
        min="0"
        step="any"
        value={values[id]}
        onChange={(e) => onValueChange(id, e.target.value)}
        disabled={!active}
        placeholder={active ? placeholder : '—'}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none
          ${active
            ? 'border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
          }
        `}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Select exactly 2 parameters
        </label>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count === 2 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {count}/2 selected
        </span>
      </div>

      {/* Aspect Ratio */}
      <ParamRow
        id="ar"
        label="Aspect Ratio"
        selected={selected.ar}
        disabled={isDisabled('ar')}
        onToggle={() => onToggle('ar')}
      >
        <select
          value={selectedAR}
          onChange={(e) => onARChange(e.target.value as AspectRatioPreset)}
          disabled={!selected.ar}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none
            ${selected.ar
              ? 'border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          {ASPECT_RATIO_PRESETS.map((p) => (
            <option key={p.label} value={p.label}>{p.label}</option>
          ))}
        </select>
      </ParamRow>

      {/* Height */}
      <ParamRow
        id="height"
        label={`Height (${unit})`}
        selected={selected.height}
        disabled={isDisabled('height')}
        onToggle={() => onToggle('height')}
      >
        {numericInput('height', `e.g. 100`)}
      </ParamRow>

      {/* Width */}
      <ParamRow
        id="width"
        label={`Width (${unit})`}
        selected={selected.width}
        disabled={isDisabled('width')}
        onToggle={() => onToggle('width')}
      >
        {numericInput('width', `e.g. 200`)}
      </ParamRow>

      {/* Diagonal */}
      <ParamRow
        id="diagonal"
        label={`Diagonal (${unit})`}
        selected={selected.diagonal}
        disabled={isDisabled('diagonal')}
        onToggle={() => onToggle('diagonal')}
      >
        {numericInput('diagonal', `e.g. 250`)}
      </ParamRow>

      {count < 2 && (
        <p className="text-xs text-amber-600 text-center mt-1">
          Select {2 - count} more parameter{count === 1 ? '' : 's'} to calculate.
        </p>
      )}
    </div>
  );
}
