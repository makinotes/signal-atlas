"use client";
import { useState, useEffect } from "react";
import type { GraphData } from "@/lib/types";
import { basePath } from "@/lib/basePath";

export function useGraphData() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${basePath}/data/graph.json`)
      .then((r) => r.json())
      .then((d: GraphData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load graph data:", err);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
