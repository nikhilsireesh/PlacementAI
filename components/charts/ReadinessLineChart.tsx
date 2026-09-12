"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatDate } from "@/lib/utils";

export function ReadinessLineChart({ data }: { data: { date: string; score: number }[] }) {
  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted)" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted)" />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
          formatter={(value) => [`${value}`, "Readiness"]}
        />
        <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
