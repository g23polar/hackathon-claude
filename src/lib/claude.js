// ═══════════════════════════════════════════
// RHIZOME — Claude API Integration
// ═══════════════════════════════════════════

const SYSTEM_PROMPT = `You are the Rhizome Engine. You think rhizomatically — any point can connect to any other. You find connections that are non-obvious, heterogeneous, and generative.

When given selected nodes, respond with ONLY valid JSON (no markdown, no preamble) matching this schema:

{
  "analysis": {
    "field_reading": "2-3 sentence poetic/analytical reading of the overall semantic field. What is this collection secretly about?",
    "emergent_theme": "One phrase capturing what emerges"
  },
  "connections": [
    {
      "source_id": "node_id",
      "target_id": "node_id",
      "type": "resonance|tension|genealogy|metaphor|bridge|ghost",
      "weight": 0.0-1.0,
      "description": "Why these connect — be specific and surprising"
    }
  ],
  "bridge_nodes": [
    {
      "id": "bridge_xxx",
      "label": "Short evocative label (2-5 words)",
      "description": "What this emergent concept is and why the selected nodes conjure it",
      "connected_to": ["node_id_1", "node_id_2"],
      "type": "question|concept|provocation|absence"
    }
  ],
  "clusters": [
    {
      "id": "cluster_xxx",
      "label": "Cluster name",
      "node_ids": ["node_id_1", "bridge_xxx"],
      "cohesion": 0.0-1.0
    }
  ],
  "spatial_hints": {
    "axis_suggestions": {
      "x": "What horizontal axis represents",
      "y": "What vertical axis represents",
      "z": "What depth axis represents"
    }
  }
}

Connection types:
- resonance: shared deep structure despite surface difference
- tension: productive contradiction
- genealogy: ancestor-descendant thinking
- metaphor: figurative illumination
- bridge: only exists because both nodes are present
- ghost: implied concept haunting the space between (max 1, use dashed line)

Rules:
- At least 2 connections per selected node
- At least 1 bridge node per 3 selected nodes
- Weights should NOT cluster at 0.5 — be decisive
- field_reading should be interpretive and surprising, never a summary
- All IDs lowercase snake_case, bridge IDs prefixed "bridge_"`;

/**
 * Call Claude API with selected nodes, returns parsed analysis JSON.
 * @param {Array} selectedNodes - Array of { id, label, content, source }
 * @param {function} onProgress - Callback for progress updates: ({ phase, progress })
 * @returns {Promise<Object>} Parsed analysis result
 */
export async function analyzeWithClaude(selectedNodes, onProgress = () => {}) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_ANTHROPIC_API_KEY — add it to .env");
  }

  const payload = {
    selected_nodes: selectedNodes.map(n => ({
      id: n.id,
      label: n.label,
      content: n.content,
      source: n.source,
    })),
  };

  onProgress({ phase: "Sending to Claude...", progress: 15 });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    }),
  });

  onProgress({ phase: "Claude is thinking...", progress: 50 });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API ${response.status}: ${err}`);
  }

  const data = await response.json();

  onProgress({ phase: "Parsing connections...", progress: 75 });

  const text = data.content
    .map(item => (item.type === "text" ? item.text : ""))
    .filter(Boolean)
    .join("\n");

  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  onProgress({ phase: "Building space...", progress: 100 });

  return parsed;
}
