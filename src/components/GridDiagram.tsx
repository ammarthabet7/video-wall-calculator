interface Props {
  cols: number;
  rows: number;
  cabinetAR: number; // widthMm / heightMm of the physical cabinet
}

export default function GridDiagram({ cols, rows, cabinetAR }: Props) {
  // Each cell represents one cabinet, scaled so the cell itself has the cabinet's AR
  // Cap the rendered cell size so the grid fits neatly
  const maxGridW = 320;  // px
  const maxGridH = 160;  // px
  const rawCellW = maxGridW / cols;
  const rawCellH = maxGridH / rows;
  // Respect cabinet AR: cellH = cellW / cabinetAR
  let cellW = Math.min(rawCellW, rawCellH * cabinetAR);
  let cellH = cellW / cabinetAR;
  // Never smaller than 4px
  if (cellW < 4) { cellW = 4; cellH = 4 / cabinetAR; }

  const gridW = cellW * cols;
  const gridH = cellH * rows;

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <div className="text-xs text-slate-500 font-medium">
        {cols} col{cols !== 1 ? 's' : ''} × {rows} row{rows !== 1 ? 's' : ''}
      </div>
      <div
        className="relative border-2 border-blue-400 rounded overflow-hidden bg-blue-50"
        style={{ width: gridW, height: gridH }}
      >
        {/* Column lines */}
        {Array.from({ length: cols - 1 }, (_, i) => (
          <div
            key={`col-${i}`}
            className="absolute top-0 bottom-0 border-l border-blue-300"
            style={{ left: (i + 1) * cellW }}
          />
        ))}
        {/* Row lines */}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <div
            key={`row-${i}`}
            className="absolute left-0 right-0 border-t border-blue-300"
            style={{ top: (i + 1) * cellH }}
          />
        ))}
      </div>
      <div className="text-xs text-slate-400">
        {cols * rows} cabinet{cols * rows !== 1 ? 's' : ''} total
      </div>
    </div>
  );
}
