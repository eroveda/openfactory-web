import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box, CheckCircle2, Circle, Sparkles, Code2 } from "lucide-react";

export type BoxNodeData = {
  label: string;
  description: string;
  inputCount: number;
  outputCount: number;
  status: "draft" | "refining" | "ready";
  refinementProgress: number;
  fieldsReady: number;
  fieldsTotal: number;
  [key: string]: unknown;
};

export const BoxNode = memo(({ data, selected }: NodeProps) => {
  const d = data as BoxNodeData;

  const statusColor = {
    ready:    "border-green-400 bg-green-50",
    refining: "border-amber-400 bg-amber-50",
    draft:    "border-slate-300 bg-slate-50",
  }[d.status] ?? "border-slate-300 bg-white";

  const StatusIcon = () => {
    if (d.status === "ready")    return <CheckCircle2 className="size-4 text-green-600" />;
    if (d.status === "refining") return <Sparkles className="size-4 text-amber-500" />;
    return <Circle className="size-4 text-slate-400" />;
  };

  return (
    <>
      <Handle type="target" position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full" />

      <div className={`
        px-4 py-3 rounded-xl border-2 shadow-sm min-w-[240px] max-w-[280px]
        transition-all cursor-pointer select-none
        ${statusColor}
        ${selected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-slate-500 flex-shrink-0" />
            <h3 className="font-semibold text-sm text-slate-800">{d.label}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Code2 className="size-3.5 text-blue-500" />
            <StatusIcon />
          </div>
        </div>

        {/* Description */}
        {d.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-snug">{d.description}</p>
        )}

        {/* Refinement status */}
        <div className="flex items-center justify-between text-xs">
          {d.status === "ready" ? (
            <span className="text-green-600 font-medium">Refined ✓</span>
          ) : (
            <span className="text-slate-400">{d.fieldsReady}/{d.fieldsTotal} fields defined</span>
          )}
          {d.status === "draft" && (
            <span className="text-blue-500 font-medium flex items-center gap-1">
              <Sparkles className="size-3" /> Click to refine
            </span>
          )}
        </div>

        {/* Progress bar */}
        {d.status !== "draft" && (
          <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${d.status === "ready" ? "bg-green-500" : "bg-amber-400"}`}
              style={{ width: `${d.refinementProgress}%` }}
            />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !rounded-full" />
    </>
  );
});

BoxNode.displayName = "BoxNode";
