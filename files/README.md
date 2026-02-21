# How to Apply These Updates

**These are drop-in replacements.** Copy each file over its counterpart in your repo.

## Files to Replace (7 files)

```
rhizome-updates/server/prompts/semantic-analysis.ts  →  server/prompts/semantic-analysis.ts
rhizome-updates/server/routes/analyze.ts             →  server/routes/analyze.ts
rhizome-updates/src/types/index.ts                   →  src/types/index.ts
rhizome-updates/src/components/App.tsx                →  src/components/App.tsx
rhizome-updates/src/components/Canvas/Canvas.tsx      →  src/components/Canvas/Canvas.tsx
rhizome-updates/src/components/Canvas/FragmentCard.tsx→  src/components/Canvas/FragmentCard.tsx
rhizome-updates/src/components/Graph/Graph3D.tsx      →  src/components/Graph/Graph3D.tsx
rhizome-updates/seed/quotes.txt                      →  seed/quotes.txt
```

## What Changed

### 🔴 semantic-analysis.ts (THE BIG ONE)
- Rich epistemological scaffolding for each connection type
- "Ask yourself" self-prompting for Claude
- Concrete examples of surprising connections
- New output fields: `field_reading` and `emergent_theme`
- Explicit reward for surprise and cross-domain connections
- Rule: "the second connection you find is almost always better than the first"

### 🔴 Graph3D.tsx
- **Field reading overlay** — top-left panel showing Claude's poetic interpretation + emergent theme
- **Ghost nodes are now octahedrons** (wireframe) instead of spheres — visually distinct at a glance
- **Glow spheres** on all nodes for atmosphere
- **Second point light** for depth
- Italic Georgia font on ghost node labels

### 🔴 Canvas.tsx
- **Fast-add input bar** — always visible, type + Enter = new fragment. Critical for live demo.
- Delete fragment support via new `onDeleteFragment` prop
- Keyboard shortcut hints in footer (⌘A, ⌘↵, ESC)
- Auto-focus on the quick input on mount

### 🔴 FragmentCard.tsx
- **Delete button** appears on hover (X in top-right corner)
- Hover turns red to confirm destructive action
- Uses controlled hover state instead of inline event handlers

### 🟡 App.tsx
- **Keyboard shortcuts**: ⌘A (select all), ⌘Enter (analyze), Escape (back)
- **Re-analyze flow**: graphData is NOT cleared when returning to canvas
- Removed opacity transition on graph mode (let Three.js dolly-in be the transition)
- Passes `onDeleteFragment` to Canvas

### 🟡 types/index.ts
- Added `field_reading?: string` and `emergent_theme?: string` to GraphData

### 🟡 analyze.ts (server route)
- Passes through `field_reading` and `emergent_theme` from Claude response

### 🟢 seed/quotes.txt
- Curated from 44 → 8 maximally diverse fragments (2 sandwich, 2 philosophical, 2 emotional, 2 observational)
- These are the STARTING fragments; audience adds more live

## Files NOT Changed (keep as-is)
- AnalyzeButton.tsx ✓
- CreateFragmentModal.tsx ✓ 
- LoadingState.tsx ✓
- TitleBar.tsx ✓
- Legend.tsx ✓
- Tooltip.tsx ✓
- claude.ts (API client) ✓
- demo-fragments.ts ✓ (reads from quotes.txt)
- main.tsx ✓
- index.css ✓
- vite.config.ts ✓
- package.json ✓
- server/index.ts ✓
