"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatTime } from "@/lib/utils";

interface ThroughputChartProps {
  data: Array<{
    timestamp: string;
    computationsPerMin?: number;
    activeNodes?: number;
  }>;
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-text-muted">
        No throughput data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    cpm: d.computationsPerMin || 0,
    nodes: d.activeNodes || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="cpmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6D45FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6D45FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-primary)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "var(--text-primary)",
          }}
        />
        <Area
          type="monotone"
          dataKey="cpm"
          stroke="#6D45FF"
          fill="url(#cpmGrad)"
          strokeWidth={2}
          name="Comp/min"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
