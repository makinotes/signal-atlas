"use client";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { basePath } from "@/lib/basePath";
import type { GraphData } from "@/lib/types";

interface TopicComparison {
  label: string;
  overseas: number;
  wechat: number;
  overseasAvg: number;
  wechatAvg: number;
}

export default function ComparePage() {
  const [data, setData] = useState<GraphData | null>(null);

  useEffect(() => {
    fetch(`${basePath}/data/graph.json`)
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <PageShell><div className="pt-8 text-white/30">Loading...</div></PageShell>;

  const comparisons: TopicComparison[] = data.topics.map((topic) => {
    const topicNodes = data.nodes.filter((n) => n.topic_id === topic.id);
    const os = topicNodes.filter((n) => n.channel === "overseas");
    const wx = topicNodes.filter((n) => n.channel === "wechat-ai");
    return {
      label: topic.label,
      overseas: os.length,
      wechat: wx.length,
      overseasAvg: os.length ? os.reduce((s, n) => s + n.score, 0) / os.length : 0,
      wechatAvg: wx.length ? wx.reduce((s, n) => s + n.score, 0) / wx.length : 0,
    };
  });

  const totalOs = data.nodes.filter((n) => n.channel === "overseas").length;
  const totalWx = data.nodes.filter((n) => n.channel === "wechat-ai").length;
  const avgOs = data.nodes.filter((n) => n.channel === "overseas").reduce((s, n) => s + n.score, 0) / (totalOs || 1);
  const avgWx = data.nodes.filter((n) => n.channel === "wechat-ai").reduce((s, n) => s + n.score, 0) / (totalWx || 1);

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-light mb-2">Cross-Channel Comparison</h1>
        <p className="text-white/30 text-sm">
          Overseas vs WeChat AI coverage by topic
        </p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.02]">
          <div className="text-[10px] tracking-[2px] text-cyan-400/60 uppercase mb-1">
            Overseas
          </div>
          <div className="text-3xl font-light text-white/80 tabular-nums">{totalOs}</div>
          <div className="text-xs text-white/30">
            avg score {avgOs.toFixed(1)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-purple-400/10 bg-purple-400/[0.02]">
          <div className="text-[10px] tracking-[2px] text-purple-400/60 uppercase mb-1">
            WeChat AI
          </div>
          <div className="text-3xl font-light text-white/80 tabular-nums">{totalWx}</div>
          <div className="text-xs text-white/30">
            avg score {avgWx.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Topic comparison bars */}
      <div className="space-y-4">
        {comparisons.map((c) => {
          const max = Math.max(c.overseas, c.wechat, 1);
          return (
            <div key={c.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 uppercase tracking-wider">
                  {c.label}
                </span>
                <span className="text-[10px] text-white/20">
                  {c.overseas + c.wechat} articles
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex justify-end">
                  <div
                    className="h-5 bg-cyan-400/30 rounded-l-full flex items-center justify-end px-2"
                    style={{ width: `${(c.overseas / max) * 100}%`, minWidth: c.overseas ? 24 : 0 }}
                  >
                    {c.overseas > 0 && (
                      <span className="text-[9px] text-cyan-400">{c.overseas}</span>
                    )}
                  </div>
                </div>
                <div className="w-px h-5 bg-white/10" />
                <div className="flex-1">
                  <div
                    className="h-5 bg-purple-400/30 rounded-r-full flex items-center px-2"
                    style={{ width: `${(c.wechat / max) * 100}%`, minWidth: c.wechat ? 24 : 0 }}
                  >
                    {c.wechat > 0 && (
                      <span className="text-[9px] text-purple-400">{c.wechat}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-white/20">
                <span>{c.overseasAvg > 0 ? `avg ${c.overseasAvg.toFixed(0)}` : ""}</span>
                <span>{c.wechatAvg > 0 ? `avg ${c.wechatAvg.toFixed(0)}` : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
