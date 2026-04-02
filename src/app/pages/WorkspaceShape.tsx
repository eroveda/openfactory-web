import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { BoxEditDialog } from "../components/BoxEditDialog";
import { Textarea } from "../components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  Box as BoxIcon,
  Settings,
  AlertCircle,
  Users,
  Loader2,
  Pencil,
  X,
  Check,
  Send,
  RotateCcw,
  Sparkles,
  Network,
  Target,
  Zap,
  ImageIcon,
  PaperclipIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  useWorkpack,
  useBoxes,
  usePlan,
  useBrief,
  useShape,
  useUpdateBox,
  useMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateTitle,
  useAttachments,
  useBoxAttachments,
  useAttachToBox,
  useDetachFromBox,
  useBoxScores,
} from "../../hooks/useWorkpacks";
import { useChat } from "../../hooks/useChat";
import { useIsMobile } from "../../hooks/useIsMobile";
import { BottomSheet } from "../components/BottomSheet";
import { chatApi } from "../../lib/api";
import { StagePills } from "../components/StagePills";
import { InboxBell } from "../components/InboxBell";
import { UsageCapacityBadge } from "../components/UsageCapacityBadge";
import { WorkMapCanvas } from "../components/WorkMapCanvas";
import type { Box, Brief, ExecutionPlan, BoxSimulation, BoxAttachment } from "../../lib/api";
import { toast } from "sonner";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function tryParseList(value: string | null | undefined): string[] {
  if (!value?.trim() || value.trim() === "[]") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [value];
    return parsed
      .filter(Boolean)
      .map((item) =>
        typeof item === "string"
          ? item
          : typeof item === "object"
          ? String(item.description ?? item.name ?? item.type ?? JSON.stringify(item))
          : String(item)
      );
  } catch {
    return value.trim() ? [value.trim()] : [];
  }
}

function countDefinedFields(box: Box): number {
  let n = 0;
  if (box.purpose?.trim()) n++;
  if (tryParseList(box.instructions).length > 0) n++;
  if (tryParseList(box.constraints).length > 0) n++;
  if (tryParseList(box.acceptanceCriteria).length > 0) n++;
  if (box.executionContext?.trim()) n++;
  return n;
}

// -----------------------------------------------------------------------
// LEFT — Box list
// -----------------------------------------------------------------------

function scoreColor(score: number) {
  if (score >= 90) return { text: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
  if (score >= 60) return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
  return { text: "text-red-500", bg: "bg-red-50", border: "border-red-200" };
}

function BoxListPanel({
  boxes,
  selectedId,
  onSelect,
  boxScores,
}: {
  boxes: Box[];
  selectedId: string | null;
  onSelect: (box: Box) => void;
  boxScores?: Record<string, BoxSimulation>;
}) {
  const avgScore = boxScores
    ? Math.round(Object.values(boxScores).reduce((s, b) => s + b.readinessScore, 0) / Math.max(Object.values(boxScores).length, 1))
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b flex-shrink-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Piezas de trabajo
        </p>
        {boxes.length > 0 && avgScore !== null && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  avgScore >= 90 ? "bg-green-500" : avgScore >= 60 ? "bg-amber-400" : "bg-red-400"
                }`}
                style={{ width: `${avgScore}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${scoreColor(avgScore).text}`}>{avgScore}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto py-1">
        {boxes.map((box) => {
          const sim = boxScores?.[box.id];
          const selected = box.id === selectedId;
          const score = sim?.readinessScore ?? null;
          const gaps = sim?.gaps ?? [];
          const fields = countDefinedFields(box);
          const col = score !== null ? scoreColor(score) : null;

          return (
            <button
              key={box.id}
              onClick={() => onSelect(box)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors border-l-2 ${
                selected
                  ? "bg-blue-50 border-blue-500"
                  : "hover:bg-slate-50 border-transparent"
              }`}
            >
              <div
                className={`size-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center border text-[10px] font-bold ${
                  score !== null && score >= 90
                    ? "bg-green-100 border-green-300 text-green-600"
                    : score !== null && score >= 60
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : score !== null
                    ? "bg-red-50 border-red-300 text-red-500"
                    : fields > 0
                    ? "bg-blue-50 border-blue-200 text-blue-500"
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              >
                {score !== null && score >= 90 ? <Check className="size-3" /> : box.orderIndex + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-sm font-medium truncate ${
                      selected ? "text-blue-700" : "text-slate-800"
                    }`}
                  >
                    {box.title}
                  </p>
                  {score !== null && (
                    <span className={`text-[10px] font-semibold px-1 py-0.5 rounded flex-shrink-0 ${col!.text} ${col!.bg}`}>
                      {score}%
                    </span>
                  )}
                </div>
                {gaps.length > 0 ? (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-snug">
                    {gaps[0]}
                  </p>
                ) : box.purpose ? (
                  <p className="text-xs text-slate-400 truncate mt-0.5 leading-snug">
                    {box.purpose}
                  </p>
                ) : null}
                {score !== null && gaps.length > 1 && (
                  <p className="text-[10px] text-slate-300 mt-0.5">+{gaps.length - 1} more</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// CENTER TOP — Project overview (no box selected)
// -----------------------------------------------------------------------

function ProjectOverview({
  brief,
  plan,
  boxes,
  onViewStructure,
  boxScores,
}: {
  brief: Brief | undefined;
  plan: ExecutionPlan | undefined;
  boxes: Box[];
  onViewStructure: () => void;
  boxScores?: Record<string, BoxSimulation>;
}) {
  const actors = tryParseList(brief?.actors);
  const scope = tryParseList(brief?.scopeIncludes);

  // Parse plan steps to get execution order
  let planSteps: { boxId: string; order: number; parallel: boolean }[] = [];
  try {
    if (plan?.steps) planSteps = JSON.parse(plan.steps);
  } catch { /* ignore */ }

  // Map boxId → box for plan display
  const boxMap = Object.fromEntries(boxes.map((b) => [b.id, b]));
  const orderedBoxes =
    planSteps.length > 0
      ? planSteps
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ ...s, box: boxMap[s.boxId] }))
          .filter((s) => s.box)
      : boxes.map((b, i) => ({ boxId: b.id, order: i + 1, parallel: false, box: b }));

  return (
    <div className="h-full overflow-auto px-8 py-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Main idea */}
        {brief?.mainIdea && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Idea principal
            </p>
            <p className="text-slate-800 text-base leading-relaxed">{brief.mainIdea}</p>
          </div>
        )}

        {/* Objective */}
        {brief?.objective && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Objetivo
            </p>
            <p className="text-slate-700 text-sm leading-relaxed">{brief.objective}</p>
          </div>
        )}

        {/* Actors + scope pills */}
        {(actors.length > 0 || scope.length > 0) && (
          <div className="flex flex-wrap gap-4">
            {actors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Actores
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {actors.map((a, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {scope.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Alcance
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {scope.slice(0, 4).map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Work breakdown */}
        {orderedBoxes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {orderedBoxes.length} pieza{orderedBoxes.length !== 1 ? "s" : ""} de trabajo
              </p>
              <button
                onClick={onViewStructure}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Network className="size-3.5" /> Ver estructura
              </button>
            </div>
            <div className="space-y-2">
              {orderedBoxes.map(({ box, order, parallel }) => {
                const ready = box.status === "READY";
                const fields = countDefinedFields(box);
                return (
                  <div
                    key={box.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      {parallel && order > 1 && (
                        <div className="w-px h-4 bg-slate-200 -mr-1" />
                      )}
                      {(() => {
                        const sim = boxScores?.[box.id];
                        const score = sim?.readinessScore;
                        const isHigh = score !== undefined && score >= 90;
                        return (
                          <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                            isHigh ? "bg-green-100 border-green-300 text-green-600"
                            : score !== undefined && score >= 60 ? "bg-amber-50 border-amber-300 text-amber-600"
                            : score !== undefined ? "bg-red-50 border-red-300 text-red-500"
                            : ready ? "bg-green-100 border-green-300 text-green-600"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                            {isHigh ? <Check className="size-3" /> : order}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{box.title}</p>
                      {box.purpose && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{box.purpose}</p>
                      )}
                      {(() => {
                        const gaps = boxScores?.[box.id]?.gaps ?? [];
                        return gaps.length > 0 ? (
                          <p className="text-[11px] text-amber-600 mt-0.5">{gaps[0]}{gaps.length > 1 ? ` +${gaps.length - 1}` : ""}</p>
                        ) : null;
                      })()}
                    </div>
                    {(() => {
                      const score = boxScores?.[box.id]?.readinessScore;
                      if (score === undefined) return (
                        <div className="flex gap-0.5 flex-shrink-0 mt-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={`w-3 h-1 rounded-full ${i < fields ? "bg-blue-400" : "bg-slate-200"}`} />
                          ))}
                        </div>
                      );
                      const col = scoreColor(score);
                      return (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${col.text} ${col.bg}`}>
                          {score}%
                        </span>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!brief && boxes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">
              Sin contenido — completa la etapa Definir primero.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// CENTER TOP — Box detail (box selected)
// -----------------------------------------------------------------------

function BoxDetailView({
  box,
  onClose,
  onEdit,
  boxScore,
  boxAttachments = [],
}: {
  box: Box;
  onClose: () => void;
  onEdit: () => void;
  boxScore?: BoxSimulation;
  boxAttachments?: BoxAttachment[];
}) {
  const instructions = tryParseList(box.instructions);
  const constraints = tryParseList(box.constraints);
  const criteria = tryParseList(box.acceptanceCriteria);

  // Single source of truth: server score when available, local count as fallback
  const score = boxScore?.readinessScore ?? null;
  const gaps  = boxScore?.gaps ?? [];
  const fields = countDefinedFields(box); // fallback only

  const dotColor =
    score !== null
      ? score >= 90 ? "bg-green-500" : score >= 60 ? "bg-amber-400" : "bg-red-400"
      : fields > 0 ? "bg-blue-400" : "bg-slate-300";

  const scoreLabel =
    score !== null
      ? `${score}% ready`
      : `${fields}/5 fields`;

  return (
    <div className="h-full overflow-auto">
      {/* Box header */}
      <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-start justify-between gap-3 z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`size-2 rounded-full ${dotColor}`} />
            <span className="text-xs text-slate-400">{scoreLabel} · Agent context</span>
          </div>
          {gaps.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 mb-0.5">
              {gaps.map((gap, i) => (
                <span key={i} className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  {gap}
                </span>
              ))}
            </div>
          )}
          <p className="text-base font-semibold text-slate-900">{box.title}</p>
          {box.purpose && (
            <p className="text-sm text-slate-500 mt-0.5 leading-snug">{box.purpose}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Edit manually"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="px-6 py-4 space-y-5 text-sm">
        <FieldSection
          label="Instrucciones"
          icon={<Zap className="size-3.5" />}
          empty="Sin definir — pide a la IA que ayude a clarificar esto"
          content={
            instructions.length > 0 ? (
              <ul className="space-y-1.5">
                {instructions.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-slate-700">
                    <span className="text-slate-300 flex-shrink-0 mt-0.5">·</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : null
          }
        />
        <FieldSection
          label="Restricciones"
          icon={<Target className="size-3.5" />}
          empty="Ninguna definida"
          content={
            constraints.length > 0 ? (
              <ul className="space-y-1.5">
                {constraints.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-slate-700">
                    <span className="text-slate-300 flex-shrink-0 mt-0.5">·</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : null
          }
        />
        <FieldSection
          label="Criterios de aceptación"
          icon={<Check className="size-3.5" />}
          empty="Sin definir — es necesario antes de marcar el bloque como listo"
          content={
            criteria.length > 0 ? (
              <ul className="space-y-1.5">
                {criteria.map((item, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className="size-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : null
          }
        />
        {box.inputContext?.trim() && (
          <FieldSection
            label="Contexto de entrada"
            content={<p className="text-slate-700 leading-relaxed">{box.inputContext}</p>}
          />
        )}
        {box.expectedOutput?.trim() && (
          <FieldSection
            label="Resultado esperado"
            content={<p className="text-slate-700 leading-relaxed">{box.expectedOutput}</p>}
          />
        )}
        {box.dependencies?.trim() && box.dependencies !== "[]" && (
          <FieldSection
            label="Dependencias"
            content={
              <div className="flex flex-wrap gap-1.5">
                {tryParseList(box.dependencies).map((d, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {d}
                  </span>
                ))}
              </div>
            }
          />
        )}
        <FieldSection
          label="Contexto de ejecución"
          icon={<Settings className="size-3.5" />}
          empty="Sin definir — menciona la tecnología, equipo o enfoque en el chat"
          content={
            box.executionContext?.trim() ? (
              <p className="text-slate-700 leading-relaxed">{box.executionContext}</p>
            ) : null
          }
        />

        {/* Attached references */}
        {boxAttachments.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <ImageIcon className="size-3.5" />
              Referencias
            </p>
            <div className="flex flex-wrap gap-2">
              {boxAttachments.map((ba) => (
                <div key={ba.id} className="relative group">
                  <img
                    src={ba.attachment.storageUrl}
                    alt={ba.attachment.fileName}
                    className="h-16 w-24 object-cover rounded-lg border border-slate-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-end">
                    <p className="text-[9px] text-white font-medium px-1.5 pb-1 opacity-0 group-hover:opacity-100 truncate w-full">
                      {ba.attachment.fileName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldSection({
  label,
  icon,
  content,
  empty,
}: {
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  empty?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {icon}
        {label}
      </p>
      {content ?? (
        <p className="text-xs text-slate-300 italic">{empty ?? "—"}</p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// RIGHT — Refinement guide
// -----------------------------------------------------------------------

function RefinementGuide({
  box,
  boxScore,
}: {
  box: Box | null;
  boxScore?: BoxSimulation;
}) {
  if (!box) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-2">
        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center">
          <Target className="size-4 text-slate-300" />
        </div>
        <p className="text-xs text-slate-400 font-medium">Selecciona un bloque</p>
        <p className="text-xs text-slate-300">para ver su guía de refinamiento</p>
      </div>
    );
  }

  const instructions = tryParseList(box.instructions);
  const constraints  = tryParseList(box.constraints);
  const criteria     = tryParseList(box.acceptanceCriteria);

  // Server gaps as a Set for fast lookup
  const gapSet = new Set((boxScore?.gaps ?? []).map(g => g.toLowerCase()));

  const hasGapFor = (keywords: string[]) =>
    keywords.some(k => [...gapSet].some(g => g.includes(k)));

  type FieldState = "ready" | "thin" | "missing";

  const fieldState = (present: boolean, gapKeywords: string[]): FieldState => {
    if (!present) return "missing";
    if (hasGapFor(gapKeywords)) return "thin";
    return "ready";
  };

  const fields: {
    label: string;
    state: FieldState;
    preview?: string;
    hint: string;
    ask: string;
  }[] = [
    {
      label: "Propósito",
      state: fieldState(!!box.purpose?.trim(), ["purpose", "why", "value"]),
      preview: box.purpose?.trim(),
      hint: "Por qué existe este bloque y qué valor entrega",
      ask: "Can you explain the purpose of this box more specifically?",
    },
    {
      label: "Instrucciones",
      state: fieldState(instructions.length > 0, ["instruction", "step", "how", "task"]),
      preview: instructions.length > 0
        ? `${instructions.length} paso${instructions.length !== 1 ? "s" : ""} · ${instructions[0]}`
        : undefined,
      hint: "Pasos concretos — no solo 'construirlo'",
      ask: "What are the key steps needed to complete this box?",
    },
    {
      label: "Criterios de aceptación",
      state: fieldState(criteria.length > 0, ["acceptance", "criteria", "done", "success"]),
      preview: criteria.length > 0 ? criteria[0] : undefined,
      hint: "Observable y binario — no 'funciona correctamente'",
      ask: "How do we know this box is done? What's the observable outcome?",
    },
    {
      label: "Restricciones",
      state: fieldState(constraints.length > 0, ["constraint", "limit", "restriction"]),
      preview: constraints.length > 0 ? constraints[0] : undefined,
      hint: "Límites específicos — tecnología, alcance, tiempo, presupuesto",
      ask: "Are there specific constraints for this box?",
    },
    {
      label: "Contexto de ejecución",
      state: fieldState(!!box.executionContext?.trim(), ["execution", "context", "stack", "tech"]),
      preview: box.executionContext?.trim(),
      hint: "Stack, herramientas, entorno, configuración del equipo",
      ask: "What stack or environment does this box run in?",
    },
  ];

  const score = boxScore?.readinessScore ?? null;
  const readyCount = fields.filter(f => f.state === "ready").length;
  const thinCount  = fields.filter(f => f.state === "thin").length;

  const scoreColor =
    score !== null && score >= 90 ? "text-green-600"
    : score !== null && score >= 60 ? "text-amber-600"
    : "text-red-500";

  const dotColor = (state: FieldState) =>
    state === "ready"   ? "bg-green-500"
    : state === "thin"  ? "bg-amber-400"
    :                     "bg-slate-200";

  const labelColor = (state: FieldState) =>
    state === "ready"  ? "text-slate-700"
    : state === "thin" ? "text-amber-700"
    :                    "text-slate-400";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Refinamiento</p>
          {score !== null && (
            <span className={`text-xs font-bold ${scoreColor}`}>{score}%</span>
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium truncate">{box.title}</p>
        <p className="text-[10px] text-slate-300 mt-0.5">
          {score !== null
            ? `${readyCount} listo${readyCount !== 1 ? "s" : ""} · ${thinCount} básico${thinCount !== 1 ? "s" : ""} · ${fields.length - readyCount - thinCount} faltante${(fields.length - readyCount - thinCount) !== 1 ? "s" : ""}`
            : `${readyCount}/5 campos presentes`}
        </p>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`size-1.5 rounded-full flex-shrink-0 ${dotColor(f.state)}`} />
              <p className={`text-xs font-semibold ${labelColor(f.state)}`}>{f.label}</p>
            </div>
            <p className="text-[11px] ml-3.5 leading-snug text-slate-400 line-clamp-2">
              {f.state !== "missing" && f.preview
                ? f.preview
                : <span className="italic text-slate-300">{f.hint}</span>
              }
            </p>
            {f.state !== "ready" && (
              <p className="text-[10px] ml-3.5 mt-1 text-blue-500 leading-snug opacity-60">
                → {f.ask}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Overall gaps from server */}
      {boxScore && boxScore.gaps.length > 0 && (
        <div className="border-t px-4 py-3 flex-shrink-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Brechas detectadas:
          </p>
          <div className="space-y-1.5">
            {boxScore.gaps.map((gap, i) => (
              <p key={i} className="text-[11px] text-amber-700 leading-snug flex gap-1.5">
                <AlertCircle className="size-3 flex-shrink-0 mt-0.5 text-amber-400" />
                {gap}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Inline confirmation card (Yes / No)
// -----------------------------------------------------------------------
function ConfirmationCard({
  message,
  onYes,
  onNo,
}: {
  message: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
        <Sparkles className="size-3 text-white" />
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-bl-sm px-3.5 py-3 shadow-sm max-w-[85%]">
        <p className="text-sm text-slate-800 mb-3">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onYes}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------
// LEFT BOTTOM — Project Assets panel
// -----------------------------------------------------------------------

function ProjectAssetsPanel({
  attachments,
  selectedBox,
  boxAttachments,
  attachToBox,
  detachFromBox,
}: {
  attachments: import("../../lib/api").Attachment[];
  selectedBox: import("../../lib/api").Box | null;
  boxAttachments: BoxAttachment[];
  attachToBox: ReturnType<typeof useAttachToBox>;
  detachFromBox: ReturnType<typeof useDetachFromBox>;
}) {
  const [open, setOpen] = useState(false);
  const images = attachments.filter((a) => a.fileType.startsWith("image/"));

  const attachedIds = new Set(boxAttachments.map((ba) => ba.attachment.id));

  if (images.length === 0) return null;

  return (
    <div className="border-t flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="size-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Activos del proyecto
          </span>
          <span className="text-[10px] text-slate-300">{images.length}</span>
          {attachedIds.size > 0 && (
            <span className="text-[10px] text-blue-400 font-medium">{attachedIds.size} adjunto{attachedIds.size !== 1 ? "s" : ""}</span>
          )}
        </div>
        {open
          ? <ChevronDown className="size-3 text-slate-300" />
          : <ChevronRight className="size-3 text-slate-300" />
        }
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 max-h-64 overflow-auto">
          {images.map((img) => {
            const isAttached = attachedIds.has(img.id);
            const pending = attachToBox.isPending || detachFromBox.isPending;
            return (
              <div key={img.id} className="group bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                <img
                  src={img.storageUrl}
                  alt={img.fileName}
                  className="w-full h-24 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-500 truncate flex-1">{img.fileName}</p>
                  {img.visualContext && (
                    <span className="text-[9px] text-blue-400 flex-shrink-0">analizado</span>
                  )}
                  {selectedBox && (
                    <button
                      disabled={pending}
                      onClick={() => {
                        if (isAttached) {
                          detachFromBox.mutate(img.id);
                        } else {
                          attachToBox.mutate(img.id);
                        }
                      }}
                      className={`text-[10px] font-medium flex items-center gap-1 flex-shrink-0 transition-colors ${
                        isAttached
                          ? "text-blue-600 hover:text-red-500"
                          : "text-slate-400 hover:text-blue-600"
                      }`}
                      title={isAttached ? "Quitar del bloque" : "Adjuntar al bloque"}
                    >
                      <PaperclipIcon className="size-2.5" />
                      {isAttached ? "adjunto" : "adjuntar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------

export function WorkspaceShape() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: workpack } = useWorkpack(id!);
  const { data: boxes = [], isLoading: loadingBoxes } = useBoxes(id!);
  const { data: plan } = usePlan(id!);
  const { data: brief } = useBrief(id!);
  const { data: attachments = [] } = useAttachments(id!);
  const { data: simResult } = useBoxScores(id!);
  const shape = useShape(id!);
  const updateBox = useUpdateBox(id!);

  const { data: members = [] } = useMembers(id!);
  const inviteMember = useInviteMember(id!);
  const removeMember = useRemoveMember(id!);
  const updateTitle = useUpdateTitle(id!);

  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  const { data: boxAttachments = [] } = useBoxAttachments(id!, selectedBox?.id ?? null);
  const attachToBox = useAttachToBox(id!, selectedBox?.id ?? "");
  const detachFromBox = useDetachFromBox(id!, selectedBox?.id ?? "");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reshapeDialogOpen, setReshapeDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [chatInput, setChatInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const kickoffPendingRef = useRef(false);
  const isMobile = useIsMobile();
  const [guideSheetOpen, setGuideSheetOpen] = useState(false);
  const [assetsSheetOpen, setAssetsSheetOpen] = useState(false);

  // Single flowing chat — no reset when switching boxes
  const {
    messages,
    send,
    reset: resetChat,
    isPending: chatPending,
    reshapeSuggestion,
    clearReshape,
  } = useChat(
    id!,
    selectedBox
      ? { id: selectedBox.id, title: selectedBox.title, purpose: selectedBox.purpose }
      : undefined,
    undefined,
    { resetOnBoxChange: false }
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, chatPending]);

  // Auto-send kickoff once boxes load after pipeline
  useEffect(() => {
    if (kickoffPendingRef.current && boxes.length > 0 && !chatPending) {
      kickoffPendingRef.current = false;
      send("__kickoff__");
    }
  }, [boxes.length, chatPending]);

  // When a box is selected, inject a local AI intro into the chat
  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedBox && selectedBox.id !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedBox.id;
    } else if (!selectedBox) {
      prevSelectedIdRef.current = null;
    }
  }, [selectedBox?.id]);

  // Sync selectedBox when boxes reload after reshape
  useEffect(() => {
    if (selectedBox && boxes.length > 0) {
      const refreshed = boxes.find((b) => b.id === selectedBox.id);
      if (refreshed) setSelectedBox(refreshed);
    }
  }, [boxes]);

  // -----------------------------------------------------------------------
  // Pipeline state
  // -----------------------------------------------------------------------

  const [forceProcessing, setForceProcessing] = useState(false);
  const isProcessing =
    forceProcessing ||
    workpack?.processingStatus === "PROCESSING" ||
    workpack?.processingStatus === "PENDING";

  const prevStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = workpack?.processingStatus;
    if (
      (prev === "PROCESSING" || prev === "PENDING") &&
      (curr === "DONE" || curr === "FAILED")
    ) {
      setForceProcessing(false);
      qc.invalidateQueries({ queryKey: ["boxes", id] });
      qc.invalidateQueries({ queryKey: ["plan", id] });
      qc.invalidateQueries({ queryKey: ["brief", id] });
      if (curr === "DONE") {
        setSelectedBox(null);
        chatApi.clear(id!).catch(() => {});
        resetChat();
        kickoffPendingRef.current = true;
      }
    }
    prevStatusRef.current = curr;
  }, [workpack?.processingStatus]);

  const initialElapsedRef = useRef(0);
  useEffect(() => {
    if (isProcessing && workpack?.updatedAt) {
      const s = Math.floor((Date.now() - new Date(workpack.updatedAt).getTime()) / 1000);
      if (s > 30) initialElapsedRef.current = s;
    }
  }, [workpack?.id]);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isProcessing) {
      setElapsed(initialElapsedRef.current);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
      initialElapsedRef.current = 0;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isProcessing]);

  const elapsedLabel =
    elapsed > 0
      ? `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`
      : null;

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleReshape = async () => {
    setForceProcessing(true);
    try {
      await shape.mutateAsync();
      setReshapeDialogOpen(false);
    } catch (e: any) {
      setForceProcessing(false);
      toast.error(e.message ?? "Failed to reshape");
    }
  };

  const handleSend = () => {
    if (!chatInput.trim() || chatPending) return;
    send(chatInput.trim());
    setChatInput("");
    textareaRef.current?.focus();
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim() });
      setInviteEmail("");
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to invite");
    }
  };

  const saveTitle = async () => {
    if (!titleValue.trim() || titleValue.trim() === workpack?.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateTitle.mutateAsync(titleValue.trim());
      setEditingTitle(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update title");
    }
  };

  const readyCount = boxes.filter((b) => b.status === "READY").length;
  const isReady = boxes.length > 0 && !isProcessing;

  const boxScoreMap: Record<string, BoxSimulation> | undefined = simResult
    ? Object.fromEntries(simResult.sequence.map((s) => [s.boxId, s]))
    : undefined;

  const STEPS = [
    { key: "Analyzing content…",          label: "Reading your idea" },
    { key: "Evaluating brief…",            label: "Understanding the goal" },
    { key: "Generating outline…",          label: "Mapping the work structure" },
    { key: "Creating work boxes…",         label: "Breaking work into tasks" },
    { key: "Planning execution sequence…", label: "Sequencing the work" },
    { key: "Packaging handoff…",           label: "Preparing the handoff" },
  ];
  const currentStepIdx = STEPS.findIndex((s) => s.key === workpack?.pipelineStep);

  // Visible messages (filter system + kickoff trigger)
  const visibleMessages = messages.filter(
    (m) => m.role !== "system" && m.content !== "__kickoff__"
  );

  // Last assistant message for prominent display
  const lastGuideMsg = [...visibleMessages].reverse().find((m) => m.role === "assistant");

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  // ── Mobile layout ──────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* Compact header */}
      <header className="bg-white border-b flex-shrink-0 px-3 py-2.5 flex items-center gap-2 z-10">
        <Link to={`/workspace/${id}/define`}>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="size-4 text-slate-600" />
          </button>
        </Link>
        <BoxIcon className="size-4 text-blue-600 flex-shrink-0" />
        {editingTitle ? (
          <Input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
            className="h-7 text-sm font-semibold flex-1"
          />
        ) : (
          <span
            className="font-semibold text-sm flex-1 truncate cursor-pointer"
            onClick={() => { setTitleValue(workpack?.title ?? ""); setEditingTitle(true); }}
          >
            {workpack?.title ?? "Workspace"}
          </span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          <UsageCapacityBadge />
          <InboxBell />
          <Button
            onClick={() => navigate(`/workspace/${id}/box`)}
            disabled={!isReady}
            size="sm"
            className="gap-1 text-xs h-7 px-2.5"
          >
            Continuar <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </header>

      {/* Stage pills */}
      <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
        <StagePills workpackId={id!} current="shape" workpackStage={workpack?.stage} />
      </div>

      {/* Chip nav — horizontal box selector */}
      {boxes.length > 0 && (
        <div className="bg-white border-b flex-shrink-0">
          <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedBox(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                !selectedBox
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              Resumen
            </button>
            {boxes.map((box) => {
              const score = boxScoreMap?.[box.id]?.readinessScore;
              const dotColor =
                score === undefined ? "bg-slate-300"
                : score >= 90 ? "bg-green-500"
                : score >= 60 ? "bg-amber-400"
                : "bg-red-400";
              const isSelected = selectedBox?.id === box.id;
              return (
                <button
                  key={box.id}
                  onClick={() => setSelectedBox((prev) => prev?.id === box.id ? null : box)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 max-w-[160px] ${
                    isSelected
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  <div className={`size-1.5 rounded-full flex-shrink-0 ${isSelected ? "bg-white/70" : dotColor}`} />
                  <span className="truncate">{box.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrollable main — pb-28 for fixed bottom bar */}
      <div className="flex-1 overflow-auto pb-28 bg-slate-50">
        <AnimatePresence mode="wait">
          {selectedBox ? (
            <motion.div
              key={selectedBox.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white min-h-full"
            >
              <BoxDetailView
                box={selectedBox}
                onClose={() => setSelectedBox(null)}
                onEdit={() => setEditDialogOpen(true)}
                boxScore={boxScoreMap?.[selectedBox.id]}
                boxAttachments={boxAttachments}
              />
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ProjectOverview
                brief={brief}
                plan={plan}
                boxes={boxes}
                onViewStructure={() => setShowStructure(true)}
                boxScores={boxScoreMap}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom: last AI message + chat input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-30 shadow-lg">
        {/* Last guide message — collapsible strip */}
        {lastGuideMsg && !chatPending && (
          <div className="px-3 py-2 border-b bg-blue-50/80">
            <div className="flex items-start gap-2">
              <Sparkles className="size-3 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 flex-1">
                {lastGuideMsg.content.replace(/[#*`]/g, "").trim()}
              </p>
              <button
                onClick={() => setGuideSheetOpen(true)}
                className="text-[10px] text-blue-500 font-medium flex-shrink-0 mt-0.5"
              >
                ver más
              </button>
            </div>
          </div>
        )}
        {chatPending && (
          <div className="px-4 py-2 border-b flex items-center gap-1">
            <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        {/* Chat input */}
        <div className="px-3 py-2.5 flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder={selectedBox ? `Refinar "${selectedBox.title}"…` : "Pregunta sobre la estructura…"}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            className="resize-none min-h-[36px] max-h-[80px] text-sm flex-1"
            rows={1}
            disabled={chatPending}
          />
          <Button
            onClick={handleSend}
            disabled={!chatInput.trim() || chatPending}
            size="icon"
            className="size-9 flex-shrink-0"
          >
            {chatPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Guide bottom sheet */}
      <BottomSheet open={guideSheetOpen} onClose={() => setGuideSheetOpen(false)} title="Guía de refinamiento">
        <div className="p-4 space-y-3">
          <RefinementGuide
            box={selectedBox}
            boxScore={selectedBox ? boxScoreMap?.[selectedBox.id] : undefined}
          />
          {lastGuideMsg && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-0.5 prose-p:text-sm">
                <ReactMarkdown>{lastGuideMsg.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Assets bottom sheet */}
      {attachments.filter(a => a.fileType.startsWith("image/")).length > 0 && (
        <BottomSheet open={assetsSheetOpen} onClose={() => setAssetsSheetOpen(false)} title="Activos del proyecto">
          <div className="p-3 space-y-2">
            <ProjectAssetsPanel
              attachments={attachments}
              selectedBox={selectedBox}
              boxAttachments={boxAttachments}
              attachToBox={attachToBox}
              detachFromBox={detachFromBox}
            />
          </div>
        </BottomSheet>
      )}

      {/* Edit dialog (shared) */}
      <BoxEditDialog
        box={selectedBox}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={async (data) => { if (selectedBox) await updateBox.mutateAsync({ boxId: selectedBox.id, data }); }}
      />

      {/* Pipeline overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/95 z-30">
          <div className="max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-800">Ejecutando pipeline…</p>
                {elapsedLabel && <p className="text-xs font-mono text-slate-400">{elapsedLabel}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s.key} className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                  i < currentStepIdx ? "bg-green-500" :
                  i === currentStepIdx ? "bg-blue-500 animate-pulse" :
                  "bg-slate-200"
                }`} />
              ))}
            </div>
            {STEPS[currentStepIdx] && (
              <p className="text-center font-medium text-slate-800">{STEPS[currentStepIdx].label}</p>
            )}
          </div>
        </div>
      )}

      {/* Structure overlay */}
      <AnimatePresence>
        {showStructure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col bg-white"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Network className="size-4 text-slate-400" /> Vista de estructura
              </p>
              <button onClick={() => setShowStructure(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {boxes.length > 0 && (
                <WorkMapCanvas
                  boxes={boxes}
                  planSteps={plan?.steps ?? null}
                  onBoxClick={(box) => { setSelectedBox(box); setShowStructure(false); }}
                  projectTitle={workpack?.title}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Desktop layout ──────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header ── */}
      <header className="bg-white border-b px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link to={`/workspace/${id}/define`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" /> Volver
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <BoxIcon className="size-4 text-blue-600" />
          {editingTitle ? (
            <Input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              className="h-7 text-sm font-semibold w-52"
            />
          ) : (
            <span
              className="font-semibold text-sm cursor-pointer hover:text-blue-600 flex items-center gap-1 group max-w-xs truncate"
              onClick={() => { setTitleValue(workpack?.title ?? ""); setEditingTitle(true); }}
            >
              {workpack?.title ?? "Workspace"}
              <Pencil className="size-3 opacity-0 group-hover:opacity-40 flex-shrink-0" />
            </span>
          )}
        </div>

        <StagePills workpackId={id!} current="shape" workpackStage={workpack?.stage} />

        <div className="flex items-center gap-2 justify-end">
          <UsageCapacityBadge />
          <InboxBell />

          {/* Share */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Users className="size-4" /> Compartir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Compartir este workspace</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Invitar por email</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="colega@ejemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                    />
                    <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                      {inviteMember.isPending && <Loader2 className="size-4 mr-1 animate-spin" />}
                      Invitar
                    </Button>
                  </div>
                </div>
                {members.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Miembros</label>
                    <div className="space-y-2">
                      {members.map((m) => (
                        <div key={m.userId} className="flex items-center justify-between text-sm">
                          <span>{m.user?.name ?? m.user?.email ?? m.userId}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">{m.role}</span>
                            {m.role !== "OWNER" && (
                              <button onClick={() => removeMember.mutate(m.userId)} className="text-slate-300 hover:text-red-500">
                                <X className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => navigate(`/workspace/${id}/box`)}
            disabled={!isReady}
            size="sm"
            className="gap-1.5"
          >
            Continuar <ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      {/* ── Main body ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT — box list + project assets */}
        <div className="w-60 flex-shrink-0 bg-white border-r overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {boxes.length > 0 ? (
              <BoxListPanel
                boxes={boxes}
                selectedId={selectedBox?.id ?? null}
                onSelect={(box) => setSelectedBox((prev) => prev?.id === box.id ? null : box)}
                boxScores={boxScoreMap}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-slate-400 text-center px-4">
                  {isProcessing ? "Generando piezas…" : "Sin piezas aún"}
                </p>
              </div>
            )}
          </div>
          <ProjectAssetsPanel
            attachments={attachments}
            selectedBox={selectedBox}
            boxAttachments={boxAttachments}
            attachToBox={attachToBox}
            detachFromBox={detachFromBox}
          />
        </div>

        {/* CENTER — overview/detail + chat */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* TOP — project overview or box detail */}
          <div className="flex-1 overflow-hidden bg-slate-50">
            <AnimatePresence mode="wait">
              {selectedBox ? (
                <motion.div
                  key={selectedBox.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="h-full bg-white"
                >
                  <BoxDetailView
                    box={selectedBox}
                    onClose={() => setSelectedBox(null)}
                    onEdit={() => setEditDialogOpen(true)}
                    boxScore={boxScoreMap?.[selectedBox.id]}
                    boxAttachments={boxAttachments}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <ProjectOverview
                    brief={brief}
                    plan={plan}
                    boxes={boxes}
                    onViewStructure={() => setShowStructure(true)}
                    boxScores={boxScoreMap}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BOTTOM — Refinement Guide strip */}
          <div className="h-64 border-t bg-white flex flex-col flex-shrink-0">

            {/* Guide header */}
            <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="size-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-700 truncate">
                  Guía de refinamiento
                  {selectedBox && (
                    <span className="font-normal text-slate-400 ml-1">· {selectedBox.title}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setShowChatHistory((v) => !v)}
                  className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showChatHistory ? "ocultar historial" : "historial"}
                </button>
                <button
                  onClick={() => { resetChat(); chatApi.clear(id!).catch(() => {}); }}
                  className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="size-3" />
                </button>
              </div>
            </div>

            {/* Guide content */}
            <div className="flex-1 overflow-auto px-4 py-3 space-y-3">

              {/* History (collapsed by default) */}
              {showChatHistory && visibleMessages.slice(0, -2).map((m, i) => (
                <div
                  key={i}
                  className={`text-xs leading-relaxed ${m.role === "user" ? "text-slate-400 text-right" : "text-slate-500"}`}
                >
                  {m.content}
                </div>
              ))}

              {/* Last assistant message — prominent */}
              {lastGuideMsg && (
                <motion.div
                  key={lastGuideMsg.content.slice(0, 20)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-100 rounded-xl p-3"
                >
                  <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-0.5 prose-p:text-sm">
                    <ReactMarkdown>{lastGuideMsg.content}</ReactMarkdown>
                  </div>
                </motion.div>
              )}



              {/* Typing indicator */}
              {chatPending && (
                <div className="flex items-center gap-1 px-1">
                  <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              )}

              {/* Empty state */}
              {visibleMessages.length === 0 && !chatPending && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  {selectedBox
                    ? `Pregunta algo sobre "${selectedBox.title}" para comenzar a refinar`
                    : "Selecciona un bloque de la lista para refinarlo, o pregúntame lo que quieras"}
                </p>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-2.5 border-t flex-shrink-0 flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                placeholder={
                  selectedBox
                    ? `Refinar "${selectedBox.title}"…`
                    : "Pregunta sobre la estructura o refina un bloque…"
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="resize-none min-h-[36px] max-h-[80px] text-sm flex-1"
                rows={1}
                disabled={chatPending}
              />
              <Button
                onClick={handleSend}
                disabled={!chatInput.trim() || chatPending}
                size="icon"
                className="size-9 flex-shrink-0"
              >
                {chatPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT — refinement guide */}
        <div className="w-56 flex-shrink-0 bg-white border-l overflow-hidden flex flex-col">
          <RefinementGuide
            box={selectedBox}
            boxScore={selectedBox ? boxScoreMap?.[selectedBox.id] : undefined}
          />
        </div>

        {/* ── Structure overlay ── */}
        <AnimatePresence>
          {showStructure && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col bg-white"
            >
              <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Network className="size-4 text-slate-400" /> Vista de estructura
                </p>
                <button
                  onClick={() => setShowStructure(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {boxes.length > 0 && (
                  <WorkMapCanvas
                    boxes={boxes}
                    planSteps={plan?.steps ?? null}
                    onBoxClick={(box) => { setSelectedBox(box); setShowStructure(false); }}
                    projectTitle={workpack?.title}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pipeline overlay ── */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/95 z-30">
            <div className="max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="size-5 animate-spin text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">Ejecutando pipeline…</p>
                  {elapsedLabel && <p className="text-xs font-mono text-slate-400">{elapsedLabel}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 mb-5">
                {STEPS.map((s, i) => (
                  <div
                    key={s.key}
                    className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                      i < currentStepIdx ? "bg-green-500" :
                      i === currentStepIdx ? "bg-blue-500 animate-pulse" :
                      "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              {STEPS[currentStepIdx] && (
                <p className="text-center font-medium text-slate-800 mb-5">
                  {STEPS[currentStepIdx].label}
                </p>
              )}
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1 max-h-40 overflow-auto">
                {(workpack?.pipelineLog
                  ? (() => { try { return JSON.parse(workpack.pipelineLog) as string[]; } catch { return []; } })()
                  : []
                ).map((entry, i) => (
                  <div key={i} className={
                    entry.startsWith("✔") ? "text-green-400" :
                    entry.startsWith("📥") ? "text-blue-400" :
                    entry.startsWith("  ·") ? "text-slate-400 pl-2" :
                    "text-slate-300"
                  }>{entry}</div>
                ))}
                <div className="flex items-center gap-1 text-blue-400">
                  <Loader2 className="size-3 animate-spin" />
                  <span>{workpack?.pipelineStep ?? "Starting…"}</span>
                </div>
              </div>
              {elapsed >= 120 && (
                <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <p className="font-medium mb-2">Está tardando demasiado — el pipeline puede estar atascado.</p>
                  <Button size="sm" variant="outline" className="gap-2 text-red-700 border-red-300" onClick={handleReshape} disabled={shape.isPending}>
                    {shape.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Settings className="size-3.5" />}
                    Intentar nueva forma
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Failed state */}
        {!isProcessing && workpack?.processingStatus === "FAILED" && boxes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center max-w-sm">
              <AlertCircle className="size-10 mx-auto mb-3 text-red-400" />
              <p className="font-medium text-slate-800 mb-1">Pipeline fallido</p>
              <p className="text-sm text-slate-500 mb-4">
                {workpack.failureReason ?? "Algo salió mal al generar los bloques."}
              </p>
              <div className="flex gap-2 justify-center">
                <Link to={`/workspace/${id}/define`}>
                  <Button variant="outline" size="sm">Volver a Definir</Button>
                </Link>
                <Button size="sm" onClick={handleReshape} disabled={shape.isPending}>
                  {shape.isPending && <Loader2 className="size-3.5 mr-1 animate-spin" />}
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Box edit dialog */}
      <BoxEditDialog
        box={selectedBox}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={async (data) => {
          if (!selectedBox) return;
          try {
            await updateBox.mutateAsync({ boxId: selectedBox.id, data });
            toast.success("Box updated");
          } catch (e: any) {
            toast.error(e.message ?? "Failed to update box");
          }
        }}
      />
    </div>
  );
}
