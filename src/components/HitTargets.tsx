"use client";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import type { ArticleNode } from "@/lib/types";
import { scoreToSize } from "@/lib/constants";

interface HitTargetsProps {
  nodes: ArticleNode[];
  positions: Map<string, [number, number, number]>;
  onHover: (node: ArticleNode | null) => void;
  onClick: (node: ArticleNode) => void;
}

export function HitTargets({ nodes, positions, onHover, onClick }: HitTargetsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      const pos = positions.get(node.id) || [0, 0, 0];
      const size = scoreToSize(node.score) * 1.5;
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.scale.set(size, size, size);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [nodes, positions, dummy]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
          onHover(nodes[e.instanceId]);
        }
      }}
      onPointerLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
          onClick(nodes[e.instanceId]);
        }
      }}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}
