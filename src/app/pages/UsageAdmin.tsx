import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usageApi, type UsageSummaryRow, type UsageLog } from "../../lib/api";

export function UsageAdmin() {
  const [tab, setTab] = useState<"summary" | "recent">("summary");
  const [recentLimit, setRecentLimit] = useState(50);

  const { data: summary = [], isLoading: loadingSummary } = useQuery({
    queryKey: ["usage", "summary"],
    queryFn: () => usageApi.summary(),
    refetchInterval: 30_000,
  });

  const { data: recent = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["usage", "recent", recentLimit],
    queryFn: () => usageApi.recent(recentLimit),
    enabled: tab === "recent",
    refetchInterval: 30_000,
  });

  const totalTokens = summary.reduce((acc, r) => acc + r.totalTokens, 0);
  const totalCalls  = summary.reduce((acc, r) => acc + r.calls, 0);
  const totalFails  = summary.reduce((acc, r) => acc + r.failures, 0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-8 py-5 flex items-center gap-4">
        <span className="text-xl font-semibold">Uso de LLM</span>
        <span className="text-xs text-white/40 ml-auto">actualiza cada 30 s</span>
      </div>

      {/* KPI strip */}
      <div className="px-8 pt-6 grid grid-cols-3 gap-4">
        {[
          { label: "Tokens totales", value: totalTokens.toLocaleString() },
          { label: "Llamadas",        value: totalCalls.toLocaleString() },
          { label: "Fallos",          value: totalFails.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-5 py-4">
            <p className="text-xs text-white/50 mb-1">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-8 mt-6 flex gap-1 border-b border-white/10 pb-0">
        {(["summary", "recent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              tab === t
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t === "summary" ? "Resumen por acción" : "Logs recientes"}
          </button>
        ))}
      </div>

      <div className="px-8 py-6">
        {tab === "summary" && (
          loadingSummary ? (
            <p className="text-white/40 text-sm">Cargando...</p>
          ) : (
            <SummaryTable rows={summary} />
          )
        )}

        {tab === "recent" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-white/50">Mostrar últimos</span>
              {[50, 100, 200].map((n) => (
                <button
                  key={n}
                  onClick={() => setRecentLimit(n)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    recentLimit === n
                      ? "border-blue-500 text-blue-400"
                      : "border-white/20 text-white/40 hover:text-white/70"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {loadingRecent ? (
              <p className="text-white/40 text-sm">Cargando...</p>
            ) : (
              <RecentTable logs={recent} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryTable({ rows }: { rows: UsageSummaryRow[] }) {
  if (rows.length === 0) return <p className="text-white/40 text-sm">Sin datos aún.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/40 border-b border-white/10">
            <th className="pb-2 pr-6 font-medium">Acción</th>
            <th className="pb-2 pr-6 font-medium text-right">Llamadas</th>
            <th className="pb-2 pr-6 font-medium text-right">Tokens entrada</th>
            <th className="pb-2 pr-6 font-medium text-right">Tokens salida</th>
            <th className="pb-2 pr-6 font-medium text-right">Total tokens</th>
            <th className="pb-2 pr-6 font-medium text-right">Fallos</th>
            <th className="pb-2 font-medium text-right">Latencia media</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.actionType} className="border-b border-white/5 hover:bg-white/3 transition-colors">
              <td className="py-3 pr-6">
                <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded">{r.actionType}</span>
              </td>
              <td className="py-3 pr-6 text-right">{r.calls.toLocaleString()}</td>
              <td className="py-3 pr-6 text-right text-white/70">{r.inputTokens.toLocaleString()}</td>
              <td className="py-3 pr-6 text-right text-white/70">{r.outputTokens.toLocaleString()}</td>
              <td className="py-3 pr-6 text-right font-semibold">{r.totalTokens.toLocaleString()}</td>
              <td className="py-3 pr-6 text-right">
                {r.failures > 0
                  ? <span className="text-red-400">{r.failures}</span>
                  : <span className="text-white/30">0</span>
                }
              </td>
              <td className="py-3 text-right text-white/60">{r.avgLatencyMs} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentTable({ logs }: { logs: UsageLog[] }) {
  if (logs.length === 0) return <p className="text-white/40 text-sm">Sin logs aún.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/40 border-b border-white/10">
            <th className="pb-2 pr-4 font-medium">Fecha</th>
            <th className="pb-2 pr-4 font-medium">Proveedor</th>
            <th className="pb-2 pr-4 font-medium">Modelo</th>
            <th className="pb-2 pr-4 font-medium">Acción</th>
            <th className="pb-2 pr-4 font-medium text-right">Entrada</th>
            <th className="pb-2 pr-4 font-medium text-right">Salida</th>
            <th className="pb-2 pr-4 font-medium text-right">Latencia</th>
            <th className="pb-2 font-medium text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
              <td className="py-2 pr-4 text-white/50 text-xs whitespace-nowrap">
                {new Date(l.createdAt).toLocaleString("es-ES", {
                  month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
              </td>
              <td className="py-2 pr-4 text-white/70">{l.provider}</td>
              <td className="py-2 pr-4 font-mono text-xs text-white/60 max-w-[180px] truncate">{l.model}</td>
              <td className="py-2 pr-4">
                <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded">{l.actionType}</span>
              </td>
              <td className="py-2 pr-4 text-right text-white/60">{l.inputTokens ?? "—"}</td>
              <td className="py-2 pr-4 text-right text-white/60">{l.outputTokens ?? "—"}</td>
              <td className="py-2 pr-4 text-right text-white/60">
                {l.latencyMs != null ? `${l.latencyMs} ms` : "—"}
              </td>
              <td className="py-2 text-center">
                {l.success
                  ? <span className="text-green-400 text-xs">OK</span>
                  : <span className="text-red-400 text-xs">ERR</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
