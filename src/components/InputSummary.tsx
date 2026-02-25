import type { UnitType, AspectRatioPreset } from '../types';
import type { SelectedParams } from '../types';

interface Props {
  selected: SelectedParams;
  values: { height: string; width: string; diagonal: string };
  selectedAR: AspectRatioPreset;
  unit: UnitType;
}

export default function InputSummary({ selected, values, selectedAR, unit }: Props) {
  const items: { label: string; value: string }[] = [];

  if (selected.ar)       items.push({ label: 'Aspect Ratio', value: selectedAR });
  if (selected.height)   items.push({ label: `Height`,       value: `${values.height} ${unit}` });
  if (selected.width)    items.push({ label: `Width`,        value: `${values.width} ${unit}` });
  if (selected.diagonal) items.push({ label: `Diagonal`,     value: `${values.diagonal} ${unit}` });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm">
      <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider mr-1">Your inputs:</span>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span className="text-slate-500">{item.label}:</span>
          <span className="font-bold text-slate-800">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
