import { useState, useCallback } from 'react';
import type { Cabinet, UnitType, SelectedParams, AspectRatioPreset, CalcResult, GridConfig } from './types';
import { CABINETS, ASPECT_RATIO_PRESETS } from './constants/cabinets';
import { convertUnit } from './utils/unitConversion';
import { calculate } from './utils/calculations';
import CabinetSelector from './components/CabinetSelector';
import UnitToggle from './components/UnitToggle';
import ParameterInputs from './components/ParameterInputs';
import ResultCard from './components/ResultCard';
import ConfirmedResult from './components/ConfirmedResult';
import NoticeLog from './components/NoticeLog';
import InputSummary from './components/InputSummary';

type SelectedConfig = { config: GridConfig; label: 'Lower' | 'Upper' } | null;

function App() {
  const [cabinet, setCabinet] = useState<Cabinet>(CABINETS[0]);
  const [unit, setUnit] = useState<UnitType>('in');
  const [selected, setSelected] = useState<SelectedParams>({ ar: false, height: false, width: false, diagonal: false });
  const [selectedAR, setSelectedAR] = useState<AspectRatioPreset>('16:9');
  const [values, setValues] = useState({ height: '', width: '', diagonal: '' });
  const [result, setResult] = useState<CalcResult | null>(null);
  const [confirmed, setConfirmed] = useState<SelectedConfig>(null);

  // ── Unit change: convert existing numeric values ──────────────────────────
  const handleUnitChange = useCallback((newUnit: UnitType) => {
    setUnit(newUnit);
    setValues((prev) => ({
      height:   prev.height   ? String(convertUnit(parseFloat(prev.height),   unit, newUnit)) : '',
      width:    prev.width    ? String(convertUnit(parseFloat(prev.width),    unit, newUnit)) : '',
      diagonal: prev.diagonal ? String(convertUnit(parseFloat(prev.diagonal), unit, newUnit)) : '',
    }));
    // Re-run calculation in the new unit if results exist
    setResult(null);
    setConfirmed(null);
  }, [unit]);

  // ── Toggle parameter selection (2-of-4) ──────────────────────────────────
  const handleToggle = useCallback((id: keyof SelectedParams) => {
    setSelected((prev) => {
      const count = Object.values(prev).filter(Boolean).length;
      if (prev[id]) {
        // Deselect always allowed
        return { ...prev, [id]: false };
      }
      // Select only if < 2 already chosen
      if (count < 2) {
        return { ...prev, [id]: true };
      }
      return prev;
    });
    setResult(null);
    setConfirmed(null);
  }, []);

  const handleValueChange = (id: 'height' | 'width' | 'diagonal', val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
    setResult(null);
    setConfirmed(null);
  };

  // ── Calculate ─────────────────────────────────────────────────────────────
  const handleCalculate = () => {
    const activeParams = (Object.keys(selected) as (keyof SelectedParams)[])
      .filter((k) => selected[k]);

    if (activeParams.length !== 2) return;

    const arPreset = ASPECT_RATIO_PRESETS.find((p) => p.label === selectedAR);

    const res = calculate({
      activeParams: activeParams as [string, string],
      values: { ...values },
      arValue: arPreset?.value,
      cab: cabinet,
      unit,
    });

    setResult(res);
    setConfirmed(null);
  };

  const activeCount = Object.values(selected).filter(Boolean).length;
  const canCalculate = activeCount === 2;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Video Wall Calculator
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Find the closest cabinet configuration for your target display size.
          </p>
        </div>

        {/* ── Controls card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-5">

          {/* Cabinet + Unit row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CabinetSelector value={cabinet} onChange={(c) => { setCabinet(c); setResult(null); setConfirmed(null); }} />
            <UnitToggle value={unit} onChange={handleUnitChange} />
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Parameters */}
          <ParameterInputs
            selected={selected}
            onToggle={handleToggle}
            values={values}
            onValueChange={handleValueChange}
            selectedAR={selectedAR}
            onARChange={(ar) => { setSelectedAR(ar); setResult(null); setConfirmed(null); }}
            unit={unit}
          />

          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            disabled={!canCalculate}
            className={`
              w-full py-3 rounded-xl font-bold text-base transition-all
              ${canCalculate
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {canCalculate ? 'Calculate' : `Select ${2 - activeCount} more parameter${2 - activeCount === 1 ? '' : 's'}`}
          </button>
        </div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        {result && (
          <div className="flex flex-col gap-4">

            {/* Input summary */}
            <InputSummary
              selected={selected}
              values={values}
              selectedAR={selectedAR}
              unit={unit}
            />

            {/* Errors & notices */}
            <NoticeLog errors={result.errors} notices={result.notices} />

            {/* No results but no hard error (edge case) */}
            {result.errors.length === 0 && !result.lower && !result.upper && (
              <div className="text-center text-slate-500 py-6 bg-white rounded-2xl border border-slate-200">
                No valid cabinet configurations found for these inputs.
              </div>
            )}

            {/* Confirmed selection */}
            {confirmed ? (
              <ConfirmedResult
                config={confirmed.config}
                cab={cabinet}
                unit={unit}
                label={confirmed.label}
                onClear={() => setConfirmed(null)}
              />
            ) : (
              /* Result cards */
              result.errors.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.lower ? (
                    <ResultCard
                      label="Lower"
                      config={result.lower}
                      cab={cabinet}
                      unit={unit}
                      selected={confirmed?.label === 'Lower'}
                      onSelect={() => setConfirmed({ config: result.lower!, label: 'Lower' })}
                    />
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-8 text-slate-400 text-sm text-center">
                      No lower configuration available<br/>(size is smaller than one cabinet)
                    </div>
                  )}

                  {result.upper ? (
                    <ResultCard
                      label="Upper"
                      config={result.upper}
                      cab={cabinet}
                      unit={unit}
                      selected={confirmed?.label === 'Upper'}
                      onSelect={() => setConfirmed({ config: result.upper!, label: 'Upper' })}
                    />
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-8 text-slate-400 text-sm text-center">
                      No upper configuration available<br/>(size is at the maximum limit)
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-slate-400 pb-4">
          Max supported: 6 m wide × 2.5 m tall — 16:9 cabinet: 600×337.5 mm — 1:1 cabinet: 500×500 mm
        </div>

      </div>
    </div>
  );
}

export default App;

