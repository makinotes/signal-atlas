"use client";
import { useEffect, useState, useMemo } from "react";
import { PageShell } from "@/components/PageShell";
import { basePath } from "@/lib/basePath";
import type { ArticleNode, GraphData } from "@/lib/types";
import { CHANNEL_COLORS } from "@/lib/constants";

export default function ArchivePage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "pub_date">("score");

  useEffect(() => {
    fetch(`${basePath}/data/graph.json`)
      .then((r) => r.json())
      .then(setData);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let nodes = data.nodes;
    if (channelFilter !== "all") {
      nodes = nodes.filter((n) => n.channel === channelFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.source.toLowerCase().includes(q) ||
          n.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return [...nodes].sort((a, b) =>
      sortBy === "score"
        ? b.score - a.score
        : b.pub_date.localeCompare(a.pub_date)
    );
  }, [data, search, channelFilter, sortBy]);

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-light mb-2">Article Archive</h1>
        <p className="text-white/30 text-sm">
          {data ? data.nodes.length : "..."} articles from the past 7 days
        </p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search title, source, keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/30 w-72"
        />
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
              {ch === "all" ? "ALL" : ch === "overseas" ? "OS" : "WX"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {([
            ["score", "BY SCORE"],
            ["pub_date", "BY DATE"],
          ] as ["score" | "pub_date", string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1 text-[10px] tracking-[1px] uppercase rounded-full border transition-all ${
                sortBy === key
                  ? "border-white/40 text-white/80"
                  : "border-white/10 text-white/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-white/20">
          {filtered.length} results
        </span>
      </div>

      <div className="space-y-1">
        {filtered.map((node) => (
          <ArticleRow key={node.id} node={node} />
        ))}
      </div>
    </PageShell>
  );
}

function ArticleRow({ node }: { node: ArticleNode }) {
  return (
    <a
      href={node.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.02] transition-colors group"
    >
      <div
        className="text-lg font-light tabular-nums mt-0.5 w-10 text-right"
        style={{ color: CHANNEL_COLORS[node.channel] || "#fff" }}
      >
        {node.score}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white/80 text-sm leading-snug group-hover:text-white transition-colors">
          {node.title}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/30">
          <span>{node.source}</span>
          <span>·</span>
          <span>{node.pub_date}</span>
          <span
            className={`tracking-[1px] uppercase ${
              node.channel === "overseas" ? "text-cyan-400/50" : "text-purple-400/50"
            }`}
          >
            {node.channel === "overseas" ? "OS" : "WX"}
          </span>
        </div>
        {node.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {node.keywords.slice(0, 6).map((kw) => (
              <span
                key={kw}
                className="px-1.5 py-0.5 text-[9px] rounded border border-white/5 text-white/20"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
