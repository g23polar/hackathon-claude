import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { TYPE_COLORS } from "../lib/constants";
import { computeForceLayout } from "../lib/forceLayout";

export default function ThreeGraph({
  nodes,
  connections,
  bridgeNodes,
  clusters,
  onBack,
  axisLabels,
  fieldReading,
  emergentTheme,
}) {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());
  const nodeMeshesRef = useRef([]);
  const timeRef = useRef(0);
  const positionsRef = useRef({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.012);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x222233, 0.5));
    const pl1 = new THREE.PointLight(0x4ecdc4, 1, 100);
    pl1.position.set(10, 10, 20);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0xc4b5fd, 0.6, 80);
    pl2.position.set(-15, -5, 15);
    scene.add(pl2);

    // Combine all nodes
    const allNodes = [
      ...nodes,
      ...bridgeNodes.map((b) => ({ ...b, isBridge: true })),
    ];

    // Compute force layout
    const positions = computeForceLayout(
      allNodes,
      connections,
      bridgeNodes,
      150
    );
    positionsRef.current = positions;

    // Cluster colors
    const clusterColors = ["#4ECDC4", "#C4B5FD", "#FBBF24"];

    // Create node meshes
    const nodeMeshes = [];
    allNodes.forEach((node) => {
      const isBridge = node.isBridge;
      const radius = isBridge ? 0.6 : 1.0;

      // Determine color
      let color = "#ffffff";
      if (isBridge) {
        color = TYPE_COLORS.bridge;
      } else {
        const ci = clusters.findIndex((c) => c.node_ids.includes(node.id));
        if (ci >= 0) color = clusterColors[ci % 3];
      }

      // Glow sphere
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 2.5, 16, 16),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.08,
        })
      );
      glow.position.copy(positions[node.id]);
      scene.add(glow);

      // Main mesh
      const geom = isBridge
        ? new THREE.OctahedronGeometry(radius, 0)
        : new THREE.SphereGeometry(radius, 24, 24);
      const mesh = new THREE.Mesh(
        geom,
        new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.3,
          shininess: 80,
          transparent: true,
          opacity: 0.9,
        })
      );
      mesh.position.copy(positions[node.id]);
      mesh.userData = { node, isBridge, glowMesh: glow, originalColor: color };
      scene.add(mesh);
      nodeMeshes.push(mesh);
    });
    nodeMeshesRef.current = nodeMeshes;

    // Connection lines
    connections.forEach((conn) => {
      const s = positions[conn.source_id];
      const e = positions[conn.target_id];
      if (!s || !e) return;
      const color = TYPE_COLORS[conn.type] || "#ffffff";
      const geom = new THREE.BufferGeometry().setFromPoints([s, e]);

      if (conn.type === "ghost") {
        const mat = new THREE.LineDashedMaterial({
          color,
          transparent: true,
          opacity: 0.2,
          dashSize: 0.5,
          gapSize: 0.3,
        });
        const line = new THREE.Line(geom, mat);
        line.computeLineDistances();
        scene.add(line);
      } else {
        scene.add(
          new THREE.Line(
            geom,
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity: 0.2 + conn.weight * 0.4,
            })
          )
        );
      }
    });

    // Bridge node connection lines
    bridgeNodes.forEach((bn) =>
      bn.connected_to.forEach((tid) => {
        const s = positions[bn.id];
        const e = positions[tid];
        if (!s || !e) return;
        scene.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([s, e]),
            new THREE.LineBasicMaterial({
              color: TYPE_COLORS.bridge,
              transparent: true,
              opacity: 0.25,
            })
          )
        );
      })
    );

    // Ambient particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(200 * 3);
    for (let i = 0; i < 600; i++) pPos[i] = (Math.random() - 0.5) * 80;
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    scene.add(
      new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0x334455,
          size: 0.15,
          transparent: true,
          opacity: 0.4,
        })
      )
    );

    // Camera controls
    let cameraAngle = 0;
    let targetAngle = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let cameraDist = 50;

    const onDown = (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
    };
    const onUp = () => (isDragging = false);
    const onMove = (e) => {
      const r = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - r.left) / width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - r.top) / height) * 2 + 1;
      if (isDragging) {
        targetAngle += (e.clientX - lastMouseX) * 0.005;
        lastMouseX = e.clientX;
      }
    };
    const onWheel = (e) => {
      cameraDist = Math.max(20, Math.min(80, cameraDist + e.deltaY * 0.05));
    };
    const onClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(nodeMeshes);
      setSelectedDetail(hits.length > 0 ? hits[0].object.userData.node : null);
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("wheel", onWheel);
    renderer.domElement.addEventListener("click", onClick);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.005;

      // Camera orbit
      cameraAngle += (targetAngle - cameraAngle) * 0.05;
      if (!isDragging) targetAngle += 0.001;
      camera.position.x = Math.sin(cameraAngle) * cameraDist;
      camera.position.z = Math.cos(cameraAngle) * cameraDist;
      camera.position.y = 5 + Math.sin(timeRef.current * 0.5) * 2;
      camera.lookAt(0, 0, 0);

      // Node float animation
      nodeMeshes.forEach((mesh, i) => {
        const t = timeRef.current + i * 0.5;
        mesh.position.y =
          positionsRef.current[mesh.userData.node.id].y + Math.sin(t) * 0.3;
        mesh.userData.glowMesh.position.copy(mesh.position);
        if (mesh.userData.isBridge) {
          mesh.rotation.x = t * 0.5;
          mesh.rotation.y = t * 0.3;
        }
      });

      // Hover detection
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(nodeMeshes);
      nodeMeshes.forEach((m) => {
        const isHit = hits.length > 0 && hits[0].object === m;
        m.material.emissiveIntensity = isHit ? 0.8 : 0.3;
        m.userData.glowMesh.material.opacity = isHit ? 0.2 : 0.08;
        m.scale.setScalar(isHit ? 1.3 : 1.0);
      });
      setHoveredNode(
        hits.length > 0 ? hits[0].object.userData.node : null
      );
      container.style.cursor = hits.length > 0 ? "pointer" : "grab";

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("mousedown", onDown);
      renderer.domElement.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [nodes, connections, bridgeNodes, clusters]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Top: analysis reading */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background:
            "linear-gradient(to bottom, rgba(10,10,15,0.95) 0%, transparent 100%)",
          padding: "16px 20px 36px",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#4ECDC4",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {emergentTheme}
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            color: "#888",
            lineHeight: 1.6,
            maxWidth: 550,
            fontStyle: "italic",
          }}
        >
          {fieldReading}
        </div>
      </div>

      {/* Axis labels */}
      {axisLabels && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "monospace",
              fontSize: 10,
              color: "#4ECDC4",
              opacity: 0.5,
              letterSpacing: "0.15em",
            }}
          >
            {axisLabels.x}
          </div>
          <div
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%) rotate(-90deg)",
              fontFamily: "monospace",
              fontSize: 10,
              color: "#C4B5FD",
              opacity: 0.5,
              letterSpacing: "0.15em",
            }}
          >
            {axisLabels.y}
          </div>
        </>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 6,
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: 12,
          backdropFilter: "blur(10px)",
          zIndex: 3,
        }}
        onMouseEnter={(e) =>
          (e.target.style.background = "rgba(255,255,255,0.12)")
        }
        onMouseLeave={(e) =>
          (e.target.style.background = "rgba(255,255,255,0.06)")
        }
      >
        ← BACK TO CANVAS
      </button>

      {/* Hover tooltip */}
      {hoveredNode && !selectedDetail && (
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 20,
            maxWidth: 260,
            background: "rgba(10,10,15,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: 14,
            backdropFilter: "blur(20px)",
            zIndex: 3,
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            {hoveredNode.label}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              color: "#666",
              marginBottom: 6,
            }}
          >
            {hoveredNode.source || hoveredNode.type?.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>
            {hoveredNode.content || hoveredNode.description}
          </div>
        </div>
      )}

      {/* Selected detail panel */}
      {selectedDetail && (
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 20,
            maxWidth: 300,
            background: "rgba(10,10,15,0.95)",
            border: "1px solid rgba(78,205,196,0.3)",
            borderRadius: 10,
            padding: 18,
            backdropFilter: "blur(20px)",
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              {selectedDetail.label}
            </div>
            <button
              onClick={() => setSelectedDetail(null)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              x
            </button>
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              color: "#4ECDC4",
              marginBottom: 10,
              letterSpacing: "0.1em",
            }}
          >
            {selectedDetail.source ||
              `BRIDGE — ${selectedDetail.type}`}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#ccc",
              lineHeight: 1.6,
            }}
          >
            {selectedDetail.content || selectedDetail.description}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          background: "rgba(10,10,15,0.8)",
          borderRadius: 8,
          padding: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          zIndex: 3,
        }}
      >
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div
            key={type}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                width: 12,
                height: 2,
                background: color,
                opacity: type === "ghost" ? 0.4 : 0.8,
              }}
            />
            <span
              style={{ fontFamily: "monospace", fontSize: 9, color: "#666" }}
            >
              {type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
