import { Link } from "react-router";
import { CheckCircle2, Lock } from "lucide-react";

interface StagePillsProps {
  workpackId: string;
  current: "define" | "shape" | "box";
  /** Workpack's reached stage: "DEFINE" | "SHAPE" | "BOX". Gates forward navigation. */
  workpackStage?: string;
}

const STAGES = [
  { key: "define", label: "Definir",  path: (id: string) => `/workspace/${id}/define` },
  { key: "shape",  label: "Forma",    path: (id: string) => `/workspace/${id}/shape` },
  { key: "box",    label: "Paquete",  path: (id: string) => `/workspace/${id}/box` },
] as const;

const STAGE_ORDER: Record<string, number> = { RAW: 0, DEFINE: 0, SHAPE: 1, BOX: 2 };

export function StagePills({ workpackId, current, workpackStage }: StagePillsProps) {
  const currentIdx = STAGES.findIndex(s => s.key === current);
  const reachedIdx = workpackStage ? (STAGE_ORDER[workpackStage] ?? currentIdx) : currentIdx;

  return (
    <div className="flex items-center gap-2">
      {STAGES.map((stage, i) => {
        const isDone    = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isLocked  = i > reachedIdx;

        const pill = (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
            isCurrent
              ? "bg-slate-100 border-slate-300 text-slate-800"
              : isLocked
              ? "border-slate-100 text-slate-300 cursor-not-allowed"
              : isDone
              ? "border-green-200 text-green-700 hover:bg-green-50"
              : "border-slate-200 text-slate-400 hover:bg-slate-50"
          }`}>
            {isLocked
              ? <Lock className="size-2.5" />
              : isDone
              ? <CheckCircle2 className="size-3 text-green-600" />
              : <div className={`size-2 rounded-full ${isCurrent ? "bg-slate-600" : "bg-slate-300"}`} />
            }
            {stage.label}
          </span>
        );

        return isLocked
          ? <span key={stage.key}>{pill}</span>
          : <Link key={stage.key} to={stage.path(workpackId)}>{pill}</Link>;
      })}
    </div>
  );
}
