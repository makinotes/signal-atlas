"use client";
import { useEffect, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { ArticleNode, Edge } from "@/lib/types";

interface SimNode extends SimulationNodeDatum {
  id: string;
  channel: string;
  topic_id: number | null;
}

export function useForceLayout(
  nodes: ArticleNode[],
  edges: Edge[]
): Map<string, [number, number, number]> {
  const [positions, setPositions] = useState<Map<string, [number, number, number]>>(
    new Map()
  );

  useEffect(() => {
    if (nodes.length === 0) return;

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      channel: n.channel,
      topic_id: n.topic_id,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimulationLinkDatum<SimNode>[] = edges
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        weight: e.weight,
      }))
      .filter((l) => l.source && l.target);

    const sim = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
          .id((d) => d.id)
          .distance(20)
          .strength((d: any) => Math.min(d.weight * 0.15, 0.8))
      )
      .force("charge", forceManyBody().strength(-8))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(2))
      .alphaDecay(0.03);

    // Run 300 ticks
    sim.stop();
    for (let i = 0; i < 300; i++) sim.tick();

    const finalPos = new Map<string, [number, number, number]>();
    simNodes.forEach((n) => {
      const z =
        (n.channel === "overseas" ? 12 : -12) + (Math.random() - 0.5) * 15;
      finalPos.set(n.id, [n.x ?? 0, n.y ?? 0, z]);
    });
    setPositions(finalPos);

    return () => { sim.stop(); };
  }, [nodes, edges]);

  return positions;
}
