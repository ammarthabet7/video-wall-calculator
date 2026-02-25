# Video Wall Size Calculator

A tool for calculating the closest LED cabinet grid configurations for a target video wall size.

---

## Live Demo

> https://video-wall-calculator-beta.vercel.app/

---

## Features

- **Two-parameter input** — select exactly 2 of 4 parameters: Aspect Ratio, Height, Width, Diagonal
- **6 valid combinations:** AR+H, AR+W, AR+D, H+W, H+D, W+D
- **Two cabinet types:** 16:9 (600 x 337.5 mm) and 1:1 (500 x 500 mm)
- **Closest Lower and Upper results** — always returns the largest config at or below your target, and the smallest at or above it
- **Real-time unit conversion** — mm, m, ft, in, values auto-convert on unit switch
- **9 Aspect Ratio presets:** 16:9, 32:9, 4:3, 24:9, 9:16, 16:10, 2.40:1, 16:18, 48:9
- **Visual grid diagram** — shows cabinet layout for each result
- **Selection and confirmation** — pick a configuration and confirm it
- **Notices and warnings** — non-blocking notices for clamping, AR approximation, size exceeded

---

## Physical Constraints

| Limit | Value |
|---|---|
| Maximum height | 2,500 mm (2.5 m) |
| Maximum width | 6,000 mm (6 m) |
| Minimum grid | 1x1 (one cabinet) |

---

## Calculation Logic

### Step 1 — Convert inputs to mm

All numeric inputs are converted to millimeters before calculation.

| Unit | Multiplier |
|---|---|
| mm | x 1 |
| m  | x 1000 |
| ft | x 304.8 |
| in | x 25.4 |

### Step 2 — Derive target width and height

| Combo | Width (mm) | Height (mm) |
|---|---|---|
| AR + Height | H x AR | H |
| AR + Width | W | W / AR |
| AR + Diagonal | D x AR / sqrt(AR^2 + 1) | D / sqrt(AR^2 + 1) |
| Height + Width | W | H |
| Height + Diagonal | sqrt(D^2 - H^2) | H |
| Width + Diagonal | W | sqrt(D^2 - W^2) |

### Step 3 — Clamp to physical limits

- Heights above 2500 mm are clamped with a user-visible notice
- Widths above 6000 mm are clamped with a user-visible notice

### Step 4 — Find closest configurations

**AR + Height (row-primary strategy):**
- naturalRows = targetH / cabHeight
- rowsBelow = floor(naturalRows), rowsAbove = ceil(naturalRows)
- For each row count, find the column count whose resulting AR is closest to the target AR
- Lower = best-AR grid at rowsBelow
- Upper = best-AR grid at rowsAbove

**AR + Width (col-primary strategy):**
- Same logic pivoting on column count instead of row count

**All other combos (diagonal strategy):**
- targetDiag = sqrt(targetW^2 + targetH^2)
- Enumerate the 4 candidate grids from floor/ceil of cols and rows
- Lower = largest grid whose diagonal is at or below targetDiag
- Upper = smallest grid whose diagonal is at or above targetDiag

**Exact match rule:** If a grid exactly matches the target diagonal, it becomes the Lower and the next distinct larger grid becomes the Upper.

---

## Validation and Edge Cases

| Situation | Behavior |
|---|---|
| Diagonal <= Height | Hard error: "Diagonal must be greater than height." |
| Diagonal <= Width | Hard error: "Diagonal must be greater than width." |
| Target smaller than one cabinet | lower = null, upper = 1x1 grid, notice shown |
| Target exceeds max W or H | Clamped + notice shown, results calculated on clamped value |
| AR not achievable exactly | Notice shown, closest achievable AR displayed in result |
| Exact match | That grid = Lower, next larger = Upper |

---

## Project Structure

```
src/
├── constants/
│   └── cabinets.ts          # Cabinet specs, AR presets, physical limits
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   ├── calculations.ts      # Core calculation engine (all strategies)
│   └── unitConversion.ts    # mm <-> m/ft/in helpers
├── components/
│   ├── CabinetSelector.tsx  # 16:9 / 1:1 toggle
│   ├── UnitToggle.tsx       # mm / m / ft / in switcher
│   ├── ParameterInputs.tsx  # 4 inputs with 2-of-4 selection logic
│   ├── NoticeLog.tsx        # Error and notice logs
│   ├── ResultCard.tsx       # Lower / Upper result cards
│   ├── GridDiagram.tsx      # Visual cabinet grid rendering
│   ├── ConfirmedResult.tsx  # Confirmed configuration summary
│   └── InputSummary.tsx     # Shows user's active inputs above results
└── App.tsx                  # Main app, state management
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Building for Production

```bash
npm run build
```

Output goes to `dist/`.

## Deploying to Vercel

Connect the GitHub repository to Vercel. It will auto-detect Vite and deploy on every push.

Or via CLI:

```bash
npm i -g vercel
vercel --prod
```

