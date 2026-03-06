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
            onClick={(node) => {
              if (node.link) {
                window.open(node.link, "_blank", "noopener,noreferrer");
              }
            }}
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
    </div>
  );
}
