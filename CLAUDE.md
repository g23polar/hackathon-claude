# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hackathon project — Rhizome, a semantic fragment graph tool. Stack is established: React 18 + TypeScript + Vite frontend, Express backend, Anthropic SDK for Claude calls. See Tech Stack section below for details.

## Ralph Loop

This project has the Ralph Loop plugin enabled for iterative development.

### Commands
- `/ralph-loop "<prompt>" [--max-iterations <n>] [--completion-promise "<text>"]` — Start an iterative loop
- `/cancel-ralph` — Cancel an active loop

### Usage Pattern
1. Define a clear task with measurable success criteria
2. Include a `--completion-promise` so the loop knows when to stop
3. Use `--max-iterations` as a safety bound

### Example
```
/ralph-loop "Implement the API endpoints defined in PROMPT.md. Run tests after each change. Output <promise>DONE</promise> when all tests pass." --completion-promise "DONE" --max-iterations 15
```

## Spec-Driven Development

This project uses a spec-driven workflow powered by the `spec-orchestrator` agent.

### Workflow
1. Write your feature spec in `SPEC.md` at the project root
2. The `spec-orchestrator` agent reads SPEC.md, breaks phases into tasks, delegates to specialized sub-agents in parallel
3. Progress is tracked in `PROGRESS.md` (auto-generated, do not edit manually)

### SPEC.md Format
```markdown
# Project Spec

## Phase 1: Title
- [ ] Task description
- [ ] Another task

## Phase 2: Title
- [ ] Task description
```

- Phases use `## Phase N: Title` headings
- Tasks use `- [ ] description` checkboxes
- Phases are executed sequentially (Phase N+1 starts only after Phase N completes)
- Tasks within a phase are executed in parallel

### Sub-Agent Routing

The orchestrator routes tasks to specialized agents based on keywords in the task description:

| Keywords | Agent |
|----------|-------|
| database, schema, migration, model, ORM, SQL, Prisma | backend-developer |
| API, endpoint, route, REST, server, middleware, auth | backend-developer |
| component, page, layout, CSS, styling, UI, form, modal | frontend-developer |
| React, Vue, Next.js, Tailwind, responsive | frontend-developer |
| WebSocket, real-time, socket | websocket-engineer |
| GraphQL, resolver, mutation | graphql-architect |
| microservice, Docker, Kubernetes | microservices-architect |
| mobile, iOS, Android, React Native | mobile-developer |
| Electron, desktop | electron-pro |
| design system, wireframe, mockup | ui-designer |
| API design, OpenAPI, swagger | api-designer |
| *(default)* | fullstack-developer |

### Running the Orchestrator

Use with Ralph Loop for iterative execution:
```
/ralph-loop "Use the spec-orchestrator agent to implement all phases in SPEC.md" --completion-promise "ALL PHASES COMPLETE" --max-iterations 20
```

### Key Files
- `SPEC.md` — Source of truth for what to build (user-edited)
- `PROGRESS.md` — Auto-generated progress tracker (do not edit)
- `.claude/agents/spec-orchestrator.md` — The orchestrator agent

## Rhizome — Project Context

Rhizome is a semantic fragment graph tool. Users curate text fragments on a 2D canvas,
select them, and Claude analyzes the semantic connections between them. The results
visualize as a navigable 3D force-directed graph.

Pitch: "The selection is the constraint. The canvas is the context. The graph is the loop made legible."

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **3D:** Three.js via @react-three/fiber + react-force-graph-3d
- **Backend:** Express server (API proxy for Claude)
- **AI:** @anthropic-ai/sdk (direct Anthropic SDK)
- **State:** React useState/useReducer (no external state library)
- **No database** — in-memory state for hackathon demo

### Directory Structure
```
src/
  components/
    App.tsx                  # Root: mode switching (canvas|loading|graph)
    Canvas/
      Canvas.tsx             # 2D fragment canvas with pan/zoom
      FragmentCard.tsx        # Individual fragment display + selection
      AnalyzeButton.tsx       # Triggers Claude analysis
      CreateFragmentModal.tsx # Add new fragments
    Graph/
      Graph3D.tsx            # 3D force-directed graph scene
      SidePanel.tsx          # Professor Alan's reading (left panel)
      Tooltip.tsx            # Hover tooltip for connections
      Legend.tsx             # Connection type color legend
    Transition/
      CanvasToGraph.tsx      # 2D→3D transition animation
    UI/
      TitleBar.tsx           # Branding + navigation
      LoadingState.tsx       # Analysis loading animation
  types/
    index.ts                 # Fragment, Connection, Ghost, GraphData, SecondaryAnalysis types
  data/
    demo-fragments.ts        # Sandwich-themed seed content
  api/
    claude.ts                # Client-side: POST /api/analyze + /api/analyze/secondary
  main.tsx
  index.css
server/
  index.ts                   # Express server entry
  routes/
    analyze.ts               # POST /api/analyze handler (primary — semantic cartographer)
    analyze-secondary.ts     # POST /api/analyze/secondary handler (Professor Alan)
  prompts/
    semantic-analysis.ts     # Primary Claude prompt template
    professor-alan.ts        # Secondary Claude prompt — Professor Alan persona
```

### Connection Taxonomy

Claude analyzes fragments through 6 connection types:

| Type | Color | Meaning |
|------|-------|---------|
| **Resonance** | Blue (#3B82F6) | Fragments that echo or reinforce each other |
| **Tension** | Red (#EF4444) | Productive contradiction between fragments |
| **Genealogy** | Green (#22C55E) | One idea descends from or builds on another |
| **Metaphor** | Purple (#A855F7) | Structural similarity across different domains |
| **Bridge** | Gold (#EAB308) | Fragments connecting otherwise disconnected clusters |
| **Ghost** | Gray (#6B7280) | Implied concepts that fragments gesture toward but never state |

### Two-Agent Architecture

**Agent 1 — Semantic Cartographer** (primary, `POST /api/analyze`)
- Frames Claude as a "semantic cartographer" mapping invisible topology between fragments
- Produces: connections, ghosts, summaries, themes
- Runs on all canvas-selected fragments at analyze time

**Agent 2 — Professor Alan** (secondary, `POST /api/analyze/secondary`)
- Warm Oxford humanities scholar persona; post-processes Agent 1's output
- Produces: thematic clusters, narrative threads, synthesis
- Runs on-demand when user clicks a node in the 3D graph (single-selection)
- Re-fires on every node selection change; non-fatal on failure
- Cluster palette: `#C8A2C8` (lilac), `#87CEEB` (sky), `#F0C05A` (goldenrod), `#98D8C8` (seafoam)

### Graph View Interaction

- **Node click:** single-selection — opens one fragment card (right panel), triggers Professor Alan for that fragment (left panel)
- **Deselect (click same node):** both panels clear
- **Left panel (SidePanel):** only visible when a fragment card is open on right
- **Loading state:** quill animation + skeleton while Professor Alan is working
- **Recenter button:** bottom-left above legend, uses `zoomToFit()` to frame all nodes

### Primary Agent Constraints
- Every connection description >10 words
- Ghost nodes connect to 2+ fragments
- Strength 0.0–1.0; max connections 3× fragment count; max ghosts floor(n/2)

### Primary Agent JSON Schema

```json
{
  "connections": [{ "type": "resonance|tension|genealogy|metaphor|bridge|ghost", "source": "id", "target": "id", "strength": 0.0, "description": "..." }],
  "ghosts": [{ "id": "ghost_1", "label": "...", "description": "...", "connected_to": ["id1", "id2"] }],
  "summaries": [{ "id": "fragment_id", "summary": "10-15 word evocative summary" }],
  "themes": [{ "name": "2-4 words", "color": "#hex", "fragment_ids": ["id1"] }]
}
```

### Secondary Agent JSON Schema

```json
{
  "clusters": [{ "id": "cluster_1", "name": "...", "description": "...", "fragment_ids": ["id1"], "color": "#C8A2C8" }],
  "threads": [{ "id": "thread_1", "name": "...", "description": "...", "sequence": ["id1", "id2"] }],
  "synthesis": "2-3 sentence overall insight"
}
```

### Demo Content — Sandwich Fragments

Seed fragments for demo (in src/data/demo-fragments.ts):

1. "Bread is architecture. The crust is load-bearing; the crumb is insulation."
2. "The PB&J is America's most democratic sandwich — classless, ageless, requires no skill."
3. "A bodega chopped cheese is a neighborhood's autobiography written in meat and oil."
4. "The French have 350 cheeses and one sandwich. Americans have one cheese and 350 sandwiches."
5. "Every sandwich is a negotiation between structure and overflow."
6. "The tortilla wrap is a sandwich in denial — same logic, different topology."
7. "Fermentation is the oldest conversation between humans and microbes."
8. "A hot dog is a sandwich only if you believe identity is determined by structure rather than intent."

### API Contracts

**POST /api/analyze** — Primary analysis (semantic cartographer)
```
Request:  { fragments: Array<{ id: string, text: string }> }   // min 2
Response: { connections[], ghosts[], summaries[], themes[] }
```

**POST /api/analyze/secondary** — Secondary analysis (Professor Alan)
```
Request:  { fragments: Array<{ id: string, text: string }>, analysis: { connections[], ghosts[] } }   // min 1
Response: { clusters[], threads[], synthesis: string }
```

### Key State (App.tsx)
- `fragments`, `selectedIds`, `mode`, `graphData` — primary flow
- `secondaryAnalysis`, `secondaryLoading` — Professor Alan (reset on back-to-canvas and node deselect)
- `handleNodeSelectionChange` — fired by Graph3D on node click, triggers secondary analysis
