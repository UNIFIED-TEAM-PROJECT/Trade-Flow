"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

type TrendPoint = {
  capturedAt: string | Date;
  value: number;
  metric?: string;
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const normalized = data.map((item) => ({
    date: format(new Date(item.capturedAt), "dd MMM"),
    value: Number(item.value),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={normalized}>
          <defs>
            <linearGradient id="tfBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#0EA5E9" fillOpacity={1} fill="url(#tfBlue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
