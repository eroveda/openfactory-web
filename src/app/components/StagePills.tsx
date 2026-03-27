import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";

interface StagePillsProps {
  workpackId: string;
  current: "define" | "shape" | "box";
}

const STAGES = [
  { key: "define", label: "Raw / Define", path: (id: string) => `/workspace/${id}/define` },
  { key: "shape",  label: "Shape",        path: (id: string) => `/workspace/${id}/shape` },
  { key: "box",    label: "Box",          path: (id: string) => `/workspace/${id}/box` },
] as const;

export function StagePills({ workpackId, current }: StagePillsProps) {
  const currentIdx = STAGES.findIndex(s => s.key === current);

  return (
    <div className="flex items-center gap-2">
      {STAGES.map((stage, i) => {
        const isDone    = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <Link key={stage.key} to={stage.path(workpackId)}>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
              isCurrent
                ? "bg-slate-100 border-slate-300 text-slate-800"
                : isDone
                ? "border-green-200 text-green-700 hover:bg-green-50"
                : "border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}>
              {isDone
                ? <CheckCircle2 className="size-3 text-green-600" />
                : <div className={`size-2 rounded-full ${isCurrent ? "bg-slate-600" : "bg-slate-300"}`} />
              }
              {stage.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
