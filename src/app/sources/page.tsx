"use client";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { basePath } from "@/lib/basePath";

interface Source {
  name: string;
  channel: string;
  total_articles: number;
  avg_score: number;
  max_score: number;
  tier1_count: number;
  top_keywords: string[];
}

type SortKey = "avg_score" | "total_articles" | "max_score" | "tier1_count";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("avg_score");
  const [channelFilter, setChannelFilter] = useState("all");

  useEffect(() => {
    fetch(`${basePath}/data/sources.json`)
      .then((r) => r.json())
      .then(setSources);
  }, []);

  const filtered = sources
    .filter((s) => channelFilter === "all" || s.channel === channelFilter)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-light mb-2">Source Rankings</h1>
        <p className="text-white/30 text-sm">
          {sources.length} sources ranked by quality metrics
        </p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex gap-1">
          {["all", "overseas", "wechat-ai"].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1 text-[10px] tracking-[1px] uppercase rounded-full border transition-all ${
                channelFilter === ch
                  ? "border-cyan-400/60 text-cyan-400 bg-cyan-400/10"
                  : "border-white/10 text-white/30 hover:text-white/50"
              }`}
            >
              {ch === "all" ? "ALL" : ch === "overseas" ? "OVERSEAS" : "WECHAT AI"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {([
            ["avg_score", "AVG SCORE"],
            ["total_articles", "ARTICLES"],
            ["max_score", "MAX SCORE"],
            ["tier1_count", "TIER 1"],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1 text-[10px] tracking-[1px] uppercase rounded-full border transition-all ${
                sortBy === key
                  ? "border-white/40 text-white/80"
                  : "border-white/10 text-white/30 hover:text-white/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {filtered.map((source, i) => (
          <div
            key={source.name}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-white/20 text-xs w-8 text-right tabular-nums">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm truncate">
                  {source.name}
                </span>
                <span
                  className={`text-[9px] tracking-[1px] uppercase ${
                    source.channel === "overseas"
                      ? "text-cyan-400/60"
                      : "text-purple-400/60"
                  }`}
                >
                  {source.channel === "overseas" ? "OS" : "WX"}
                </span>
              </div>
              <div className="flex gap-1 mt-1">
                {source.top_keywords.slice(0, 4).map((kw) => (
                  <span
                    key={kw}
                    className="text-[9px] text-white/20 px-1.5 py-0.5 rounded border border-white/5"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-cyan-400 text-lg font-light tabular-nums">
                {source.avg_score.toFixed(1)}
              </div>
              <div className="text-[9px] text-white/20">
                {source.total_articles} articles
              </div>
            </div>
            <div className="w-24">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400/40 rounded-full"
                  style={{ width: `${source.avg_score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
