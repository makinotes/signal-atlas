"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageShell } from "@/components/PageShell";
import { basePath } from "@/lib/basePath";

interface TrendsData {
  dates: string[];
  topics: Record<string, number[]>;
}

const COLORS = [
  "#4fc3f7",
  "#ab47bc",
  "#66bb6a",
  "#ffa726",
  "#ef5350",
  "#42a5f5",
  "#ec407a",
  "#26c6da",
];

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [active, setActive] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${basePath}/data/trends.json`)
      .then((r) => r.json())
      .then((d: TrendsData) => {
        setData(d);
        setActive(new Set(Object.keys(d.topics).slice(0, 8)));
      });
  }, []);

  if (!data) return <PageShell><div className="pt-8 text-white/30">Loading...</div></PageShell>;

  const topics = Object.keys(data.topics);
  const chartData = data.dates.map((date, i) => {
    const row: Record<string, string | number> = { date: date.slice(5) };
    topics.forEach((t) => {
      row[t] = data.topics[t][i] || 0;
    });
    return row;
  });

  const toggleTopic = (t: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-light mb-2">Topic Trends</h1>
        <p className="text-white/30 text-sm">
          Keyword frequency over the past 30 days
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {topics.map((t, i) => (
          <button
            key={t}
            onClick={() => toggleTopic(t)}
            className={`px-3 py-1 text-[10px] tracking-[1px] uppercase rounded-full border transition-all flex items-center gap-1.5 ${
              active.has(t)
                ? "border-white/30 text-white/80"
                : "border-white/10 text-white/20"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: active.has(t) ? COLORS[i % COLORS.length] : "transparent",
                border: active.has(t) ? "none" : "1px solid rgba(255,255,255,0.2)",
              }}
            />
            {t}
          </button>
        ))}
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.15)"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.15)"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "#0a0f1e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
            />
            {topics.map(
              (t, i) =>
                active.has(t) && (
                  <Line
                    key={t}
                    type="monotone"
                    dataKey={t}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    animationDuration={800}
                  />
                )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </PageShell>
  );
}
