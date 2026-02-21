# Rhizome — Semantic Fragment Graph

## Phase 1: Project Bootstrap

- [ ] Bootstrap the complete Vite + React + TypeScript project: create package.json, tsconfig.json, vite.config.ts, index.html, src/main.tsx; install all dependencies (react, react-dom, three, @react-three/fiber, @react-three/drei, react-force-graph-3d, express, cors, @anthropic-ai/sdk, dotenv); create directory structure (src/components/Canvas/, src/components/Graph/, src/components/UI/, src/types/, src/data/, src/api/, server/routes/, server/prompts/); create TypeScript types in src/types/index.ts (Fragment, Connection, Ghost, GraphData, ConnectionType); create App.tsx shell component with mode state (canvas|loading|graph); create Express server entry in server/index.ts with CORS and /api route prefix; add Vite proxy config for /api to Express dev server; add dev scripts to package.json for concurrent frontend+backend

## Phase 2: 2D Canvas and Demo Data

- [ ] Build the complete React 2D canvas system in src/components/Canvas/: Canvas.tsx container with dark background and grid layout, FragmentCard.tsx with text display and selection toggle and visual highlight on select, CreateFragmentModal.tsx for adding new fragments, AnalyzeButton.tsx disabled when fewer than 2 fragments selected, multi-select state management, and wire the canvas into App.tsx for the canvas mode
- [ ] Create sandwich-themed demo fragments as seed data in src/data/demo-fragments.ts with 8 fragments about bread architecture, PB&J, bodega chopped cheese, French vs American cheese, sandwich structure, tortilla topology, fermentation, and the hot dog debate — each with a unique id and text field

## Phase 3: Semantic Analysis Engine

- [ ] Build the complete Express server route and Claude prompt: create server/prompts/semantic-analysis.ts with the system prompt (semantic cartographer framing, connection taxonomy definitions for resonance/tension/genealogy/metaphor/bridge/ghost, JSON output schema, constraints on max connections and ghost nodes); create server/routes/analyze.ts with POST /api/analyze endpoint that validates the request, calls @anthropic-ai/sdk with the prompt template, parses the JSON response, and returns typed data
- [ ] Build the client-side API integration and loading UI: create src/api/claude.ts module that calls POST /api/analyze with selected fragments and returns typed GraphData; create src/components/UI/LoadingState.tsx React component with animated text shown during Claude analysis; wire the AnalyzeButton to call the API and transition App mode from canvas to loading to graph

## Phase 4: 3D Force-Directed Graph

- [ ] Build the React 3D graph visualization in src/components/Graph/: Graph3D.tsx using react-force-graph-3d with force-directed layout, fragment nodes rendered as labeled spheres sized by connection count, connection edges colored by type (resonance=#3B82F6, tension=#EF4444, genealogy=#22C55E, metaphor=#A855F7, bridge=#EAB308, ghost=#6B7280 dashed), ghost nodes as translucent smaller spheres, orbit controls for navigation, and wire into App.tsx for graph mode
- [ ] Build the React graph interaction components: Tooltip.tsx showing connection type and description on edge/node hover, click-to-focus behavior that centers camera on clicked node and highlights its connections, Legend.tsx component showing all 6 connection types with color swatches

## Phase 5: Transition and Demo Polish

- [ ] Build the 2D-to-3D transition: CSS fade-out on canvas container, Three.js camera dolly-in animation on graph first render, smooth mode switching in App.tsx with animated opacity transitions between canvas/loading/graph states
- [ ] Polish the demo experience: dark theme global CSS styling, ambient lighting and bloom post-processing on the 3D scene, TitleBar.tsx React component with Rhizome branding and back-to-canvas button, pre-load demo fragments as selected on app start for one-click demo flow
