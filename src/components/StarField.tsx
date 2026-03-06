"use client";
import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

import { useGraphData } from "@/hooks/useGraphData";
import { useForceLayout } from "@/hooks/useForceLayout";
import { BackgroundStars } from "./BackgroundStars";
import { StarCloud } from "./StarCloud";
import { Edges } from "./Edges";
import { ConstellationLabels } from "./ConstellationLabels";
import { HitTargets } from "./HitTargets";
import { HUD } from "./HUD";
import { Tooltip } from "./Tooltip";
import type { ArticleNode } from "@/lib/types";

function Scene({
  activeChannel,
  onHover,
  onClick,
}: {
  activeChannel: string;
  onHover: (node: ArticleNode | null) => void;
  onClick: (node: ArticleNode) => void;
}) {
  const { data, loading } = useGraphData();
  const positions = useForceLayout(data?.nodes || [], data?.edges || []);

  if (loading || !data) return null;

  return (
    <>
      <BackgroundStars count={3000} />
      <StarCloud
        nodes={data.nodes}
        positions={positions}
        activeChannel={activeChannel}
      />
      <Edges edges={data.edges} positions={positions} />
      <ConstellationLabels
        topics={data.topics}
        nodes={data.nodes}
        positions={positions}
      />
      <HitTargets
        nodes={data.nodes}
        positions={positions}
        onHover={onHover}
        onClick={onClick}
      />
    </>
  );
}

export function StarField() {
  const [activeChannel, setActiveChannel] = useState("all");
  const [hoveredNode, setHoveredNode] = useState<ArticleNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<ArticleNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { data } = useGraphData();

  return (
    <div className="w-screen h-screen relative">
      <Canvas
        camera={{ position: [0, 80, 200], fov: 60 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: "#050510" }}
        onPointerMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      >
        <fog attach="fog" args={["#050510", 300, 800]} />
        <Suspense fallback={null}>
          <Scene
            activeChannel={activeChannel}
            onHover={setHoveredNode}
            onClick={setSelectedNode}
          />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={30}
          maxDistance={600}
          autoRotate
          autoRotateSpeed={0.2}
        />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer>
      </Canvas>

      <HUD
        stats={data?.stats || null}
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
      />
      <Tooltip node={hoveredNode} mousePos={mousePos} />

      {selectedNode && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="absolute right-0 top-0 h-full w-96 bg-[#0a0f1e]/95 border-l border-white/10 backdrop-blur-xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/40 hover:text-white text-lg"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </button>
            <div className="text-[10px] tracking-[2px] uppercase text-cyan-400 mb-2">
              {selectedNode.channel === "overseas"
                ? "OVERSEAS"
                : "WECHAT AI"}
            </div>
            <h2 className="text-white text-lg font-light mb-3 leading-snug">
              {selectedNode.title}
            </h2>
            <div className="text-white/40 text-xs mb-4">
              {selectedNode.source} · {selectedNode.pub_date}
            </div>
            <div className="text-cyan-400 text-2xl font-light mb-4">
              {selectedNode.score}{" "}
              <span className="text-sm text-white/30">/ 100</span>
            </div>
            {selectedNode.summary && (
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                {selectedNode.summary}
              </p>
            )}
            {selectedNode.core_point && (
              <div className="mb-4">
                <div className="text-[10px] tracking-[1px] uppercase text-white/30 mb-1">
                  Core Point
                </div>
                <p className="text-white/50 text-xs leading-relaxed">
                  {selectedNode.core_point}
                </p>
              </div>
            )}
            {selectedNode.highlights && selectedNode.highlights.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] tracking-[1px] uppercase text-white/30 mb-1">
                  Highlights
                </div>
                <ul className="space-y-1">
                  {selectedNode.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="text-white/50 text-xs leading-relaxed"
                    >
                      · {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mb-4">
              {selectedNode.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 text-[10px] rounded-full border border-white/10 text-white/40"
                >
                  {kw}
                </span>
              ))}
            </div>
            {/* Dimension bars */}
            <div className="space-y-2 mb-4">
              {Object.entries(selectedNode.dimensions).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 w-24 uppercase tracking-wider">
                    {key}
                  </span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400/60 rounded-full"
                      style={{ width: `${(val / 3) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/20">{val}/3</span>
                </div>
              ))}
            </div>
            {selectedNode.link && (
              <a
                href={selectedNode.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 border border-cyan-400/30 text-cyan-400 text-xs rounded hover:bg-cyan-400/10 transition-colors"
              >
                Read Original →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
