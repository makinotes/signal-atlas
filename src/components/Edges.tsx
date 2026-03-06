"use client";
import { useMemo } from "react";
import * as THREE from "three";
import type { Edge } from "@/lib/types";

interface EdgesProps {
  edges: Edge[];
  positions: Map<string, [number, number, number]>;
}

export function Edges({ edges, positions }: EdgesProps) {
  const geometry = useMemo(() => {
    const points: number[] = [];
    edges.forEach((edge) => {
      const s = positions.get(edge.source);
      const t = positions.get(edge.target);
      if (s && t) {
        points.push(s[0], s[1], s[2], t[0], t[1], t[2]);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geo;
  }, [edges, positions]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.04}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
