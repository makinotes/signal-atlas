"use client";
import type { ArticleNode } from "@/lib/types";
import { CHANNEL_COLORS } from "@/lib/constants";

interface TooltipProps {
  node: ArticleNode | null;
  mousePos: { x: number; y: number };
}

export function Tooltip({ node, mousePos }: TooltipProps) {
  if (!node) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none"
      style={{ left: mousePos.x + 16, top: mousePos.y - 8 }}
    >
      <div className="bg-[#0a0f1e]/95 border border-white/10 backdrop-blur-xl rounded-lg px-4 py-3 max-w-xs">
        <div
          className="text-[9px] tracking-[2px] uppercase mb-1"
          style={{ color: CHANNEL_COLORS[node.channel] || "#fff" }}
        >
          {node.channel === "overseas" ? "OVERSEAS" : "WECHAT AI"}
        </div>
        <div className="text-white/90 text-sm font-light leading-snug mb-2">
          {node.title}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span>{node.source}</span>
          <span className="text-cyan-400 font-medium">
            {node.score}
          </span>
        </div>
        {node.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {node.keywords.slice(0, 5).map((kw) => (
              <span
                key={kw}
                className="px-1.5 py-0.5 text-[9px] rounded border border-white/10 text-white/30"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
