import type { ReceivableDto, RevenuePointDto, RevenueReportDto } from "@/lib/types";
import { apiGet, getTokens, API_BASE, qs } from "./client";

export function getRevenue(period = "month", date?: string) {
  return apiGet<RevenueReportDto>(
    "/reports/revenue" +
      qs({
        period,
        date,
      }),
  );
}

export function getRevenueChart(range = "7d") {
  return apiGet<RevenuePointDto[]>("/reports/revenue/chart" + qs({ range }));
}

export function getReceivables() {
  return apiGet<ReceivableDto[]>("/reports/receivables");
}

export async function exportReport(type = "excel", period = "month", date?: string) {
  const t = getTokens();
  const url = API_BASE + "/reports/export" + qs({ type, period, date });
  const res = await fetch(url, {
    headers: t?.accessToken ? { Authorization: "Bearer " + t.accessToken, "X-Client-App": "admin-web" } : { "X-Client-App": "admin-web" },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const match = cd.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `revenue-report.${type === "pdf" ? "pdf" : "xlsx"}`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}
