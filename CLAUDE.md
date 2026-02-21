# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hackathon project (greenfield). No framework, build system, or dependencies have been chosen yet. Check the current state of the repo before making assumptions about the stack.

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
      Tooltip.tsx            # Hover tooltip for connections
      Legend.tsx             # Connection type color legend
    Transition/
      CanvasToGraph.tsx      # 2D→3D transition animation
    UI/
      TitleBar.tsx           # Branding + navigation
      LoadingState.tsx       # Analysis loading animation
  types/
    index.ts                 # Fragment, Connection, Ghost, GraphData types
  data/
    demo-fragments.ts        # Sandwich-themed seed content
  api/
    claude.ts                # Client-side: POST /api/analyze
  main.tsx
  index.css
server/
  index.ts                   # Express server entry
  routes/
    analyze.ts               # POST /api/analyze handler
  prompts/
    semantic-analysis.ts     # Claude prompt template
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

### Claude Prompt Strategy

The system prompt frames Claude as a "semantic cartographer" — not summarizing or evaluating
the fragments, but mapping the invisible topology between them.

**Epistemology:**
- Treat every fragment as equally weighted — no fragment is "more important"
- Connections are discovered, not imposed — find what's already latent
- Ghost nodes are first-class: the absence is as meaningful as the presence
- Strength is confidence in the connection, not importance

**Constraints:**
- Return ONLY the JSON schema below — no preamble, no explanation outside the schema
- Every connection must have a non-trivial description (>10 words)
- Ghost nodes must connect to at least 2 existing fragments
- Strength values are 0.0–1.0 (0.3 = tenuous, 0.7 = strong, 1.0 = undeniable)
- Maximum connections: 3× the number of input fragments
- Maximum ghost nodes: floor(fragment_count / 2)

### Claude JSON Output Schema

```json
{
  "connections": [
    {
      "type": "resonance | tension | genealogy | metaphor | bridge | ghost",
      "source": "fragment_id",
      "target": "fragment_id",
      "strength": 0.0,
      "description": "Why these fragments connect"
    }
  ],
  "ghosts": [
    {
      "id": "ghost_1",
      "label": "Short name for the implied concept",
      "description": "Why this ghost exists in the semantic space",
      "connected_to": ["fragment_id_1", "fragment_id_2"]
    }
  ]
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

### API Contract

**POST /api/analyze**
```
Request:  { fragments: Array<{ id: string, text: string }> }
Response: { connections: Connection[], ghosts: Ghost[] }
```

### State Shape
```typescript
interface AppState {
  fragments: Fragment[]
  selectedIds: Set<string>
  mode: 'canvas' | 'loading' | 'graph'
  graphData: GraphData | null
}
```
