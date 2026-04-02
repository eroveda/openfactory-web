import { useQuery } from "@tanstack/react-query";
import { usageApi } from "../../lib/api";

/**
 * Small badge showing chat capacity for the current hour.
 * Shown in workspace headers so users know how many messages they have left.
 */
export function UsageCapacityBadge() {
  const { data } = useQuery({
    queryKey: ["usage", "my-today"],
    queryFn: () => usageApi.myToday(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!data) return null;

  const { remaining, limit } = data;
  const pct = remaining / limit;

  const color =
    pct > 0.5
      ? "text-white/40"
      : pct > 0.2
      ? "text-yellow-400/70"
      : "text-red-400/80";

  return (
    <span className={`text-xs font-mono tabular-nums ${color}`} title="Mensajes disponibles esta hora">
      {remaining}/{limit}
    </span>
  );
}
