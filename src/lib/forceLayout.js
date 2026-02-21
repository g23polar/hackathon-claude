// ═══════════════════════════════════════════
// RHIZOME — Force-Directed Layout Engine
// ═══════════════════════════════════════════

import * as THREE from "three";

/**
 * Calculate force-directed positions for nodes in 3D space.
 *
 * @param {Array} allNodes - All nodes (regular + bridge), each with .id
 * @param {Array} connections - Array of { source_id, target_id, weight }
 * @param {Array} bridgeNodes - Bridge nodes with .connected_to arrays
 * @param {number} iterations - Number of simulation steps (default 150)
 * @returns {Object} Map of node id -> THREE.Vector3 position
 */
export function computeForceLayout(allNodes, connections, bridgeNodes, iterations = 150) {
  const positions = {};

  // Initialize positions in a circle with some randomness
  allNodes.forEach((node, i) => {
    const angle = (i / allNodes.length) * Math.PI * 2;
    const r = 15 + Math.random() * 10;
    positions[node.id] = new THREE.Vector3(
      Math.cos(angle) * r,
      (Math.random() - 0.5) * 20,
      Math.sin(angle) * r
    );
  });

  // Run force simulation
  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const a = positions[allNodes[i].id];
        const b = positions[allNodes[j].id];
        const diff = a.clone().sub(b);
        const dist = Math.max(diff.length(), 0.5);
        const force = diff.normalize().multiplyScalar(80 / (dist * dist));
        a.add(force.clone().multiplyScalar(0.05));
        b.sub(force.clone().multiplyScalar(0.05));
      }
    }

    // Attraction along connections (weighted)
    connections.forEach(c => {
      const a = positions[c.source_id];
      const b = positions[c.target_id];
      if (!a || !b) return;
      const diff = b.clone().sub(a);
      const idealDist = 8 + (1 - c.weight) * 15;
      const force = diff.normalize().multiplyScalar((diff.length() - idealDist) * 0.02);
      a.add(force.clone().multiplyScalar(0.5));
      b.sub(force.clone().multiplyScalar(0.5));
    });

    // Bridge node attraction to connected nodes
    bridgeNodes.forEach(bn => {
      bn.connected_to.forEach(tid => {
        const a = positions[bn.id];
        const b = positions[tid];
        if (!a || !b) return;
        const diff = b.clone().sub(a);
        const force = diff.normalize().multiplyScalar((diff.length() - 6) * 0.03);
        a.add(force.clone().multiplyScalar(0.5));
      });
    });

    // Damping — pull slightly toward center
    allNodes.forEach(n => {
      positions[n.id].multiplyScalar(0.99);
    });
  }

  return positions;
}
