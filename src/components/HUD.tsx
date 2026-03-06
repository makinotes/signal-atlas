"use client";
import type { GraphData } from "@/lib/types";

interface HUDProps {
  stats: GraphData["stats"] | null;
  activeChannel: string;
  onChannelChange: (channel: string) => void;
}

const channels = [
  { key: "all", label: "ALL" },
  { key: "overseas", label: "OVERSEAS" },
  { key: "wechat-ai", label: "WECHAT AI" },
];

export function HUD({ stats, activeChannel, onChannelChange }: HUDProps) {
  return (
    <>
      {/* Top-left title */}
      <div className="fixed top-6 left-6 z-10 select-none">
        <div className="text-[10px] tracking-[3px] uppercase text-white/30 mb-1">
          Signal Atlas
        </div>
        <div className="text-white/80 text-sm font-light">
          AI Content Universe
        </div>
      </div>

      {/* Top-left stats */}
      {stats && (
        <div className="fixed top-20 left-6 z-10 space-y-2 select-none">
          <StatBlock label="ARTICLES" value={stats.total_articles} />
          <StatBlock label="TOPICS" value={stats.total_topics} />
          <StatBlock label="CONNECTIONS" value={stats.total_edges} />
          <StatBlock label="SOURCES" value={stats.total_sources} />
        </div>
      )}

      {/* Bottom channel filter */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1 select-none">
        {channels.map((ch) => (
          <button
            key={ch.key}
            onClick={() => onChannelChange(ch.key)}
            className={`px-4 py-1.5 text-[10px] tracking-[2px] uppercase border rounded-full transition-all ${
              activeChannel === ch.key
                ? "border-cyan-400/60 text-cyan-400 bg-cyan-400/10"
                : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
            }`}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* Bottom-right date */}
      <div className="fixed bottom-6 right-6 z-10 text-right select-none">
        <div className="text-[10px] tracking-[2px] text-white/20">
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[9px] tracking-[2px] text-white/20">{label}</div>
      <div className="text-white/70 text-lg font-light tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
