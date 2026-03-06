"use client";
import { useMemo } from "react";
import { Text } from "@react-three/drei";
import type { ArticleNode, Topic } from "@/lib/types";

interface Props {
  topics: Topic[];
  nodes: ArticleNode[];
  positions: Map<string, [number, number, number]>;
}

export function ConstellationLabels({ topics, nodes, positions }: Props) {
  const centroids = useMemo(() => {
    return topics
      .map((topic) => {
        const topicNodes = nodes.filter((n) => n.topic_id === topic.id);
        const posArr = topicNodes
          .map((n) => positions.get(n.id))
          .filter(Boolean) as [number, number, number][];
        if (posArr.length === 0) return null;

        const cx = posArr.reduce((s, p) => s + p[0], 0) / posArr.length;
        const cy = posArr.reduce((s, p) => s + p[1], 0) / posArr.length;
        const cz = posArr.reduce((s, p) => s + p[2], 0) / posArr.length;

        return { ...topic, cx, cy: cy + 6, cz };
      })
      .filter(Boolean) as (Topic & { cx: number; cy: number; cz: number })[];
  }, [topics, nodes, positions]);

  return (
    <>
      {centroids.map((topic) => (
        <Text
          key={topic.id}
          position={[topic.cx, topic.cy, topic.cz]}
          fontSize={2.5}
          color="#ffffff"
          fillOpacity={0.12}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          {topic.label.toUpperCase()}
        </Text>
      ))}
    </>
  );
}
