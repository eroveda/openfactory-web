import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Box as BoxIcon,
  ArrowLeft,
  Download,
  CheckCircle2,
  Package,
  FileText,
  Zap,
  Settings,
  AlertCircle,
  Lightbulb,
  Loader2,
  Play,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Flag,
  Users,
  Pencil,
  X,
  Map,
  LayoutGrid,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { useWorkpack, useBoxes, useBrief, useHandoff, useUpdateHandoff, useRequestApproval, useSimulate, useMembers, useInviteMember, useRemoveMember, useUpdateTitle } from "../../hooks/useWorkpacks";
import { downloadWorkpackZip } from "../../lib/api";
import type { SimulationResult, BoxSimulation } from "../../lib/api";
import { InboxBell } from "../components/InboxBell";
import { UsageCapacityBadge } from "../components/UsageCapacityBadge";
import { InfoTooltip } from "../components/InfoTooltip";
import { Skeleton } from "../components/ui/skeleton";
import { StagePills } from "../components/StagePills";
import { useIsMobile } from "../../hooks/useIsMobile";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
type BoxTab = "overview" | "map" | "package";

// -----------------------------------------------------------------------
// Box readiness helper (single source of truth for this page)
// -----------------------------------------------------------------------
function evaluateBoxReadiness(box: {
  title?: string | null;
  purpose?: string | null;
  instructions?: string | null;
  constraints?: string | null;
  acceptanceCriteria?: string | null;
  expectedOutput?: string | null;
}) {
  const fields = [
    { key: "title",             value: box.title },
    { key: "purpose",           value: box.purpose },
    { key: "instructions",      value: box.instructions },
    { key: "constraints",       value: box.constraints },
    { key: "acceptanceCriteria",value: box.acceptanceCriteria },
    { key: "expectedOutput",    value: box.expectedOutput },
  ];
  const isEmpty = (v?: string | null) =>
    !v || v.trim() === "" || v === "[]" || v === "null";

  const filled   = fields.filter(f => !isEmpty(f.value));
  const missing  = fields.filter(f => isEmpty(f.value)).map(f => f.key);
  const score    = Math.round((filled.length / fields.length) * 100);
  const status   = score >= 75 ? "ready" : score >= 40 ? "shaping" : "needs_work";
  return { score, missing, status, filledCount: filled.length, totalCount: fields.length };
}

// -----------------------------------------------------------------------
// Execution Preview (used in Package tab)
// -----------------------------------------------------------------------
function ExecutionPreview({ result }: { result: SimulationResult }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const statusColor = {
    READY: "bg-green-50 border-green-200",
    NEEDS_FIXES: "bg-amber-50 border-amber-200",
    BLOCKED: "bg-red-50 border-red-200",
  }[result.status];

  const statusLabel = {
    READY: "Paquete válido — listo para exportar",
    NEEDS_FIXES: "Algunas piezas requieren refinamiento",
    BLOCKED: "Hay problemas críticos que bloquean la exportación",
  }[result.status];

  const statusIcon = {
    READY: <CheckCircle2 className="size-4 text-green-600" />,
    NEEDS_FIXES: <AlertCircle className="size-4 text-amber-500" />,
    BLOCKED: <AlertCircle className="size-4 text-red-500" />,
  }[result.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${statusColor}`}>
        {statusIcon}
        <span className="text-sm font-medium">{statusLabel}</span>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Contenido del paquete</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Brief",    ok: result.completeness.briefPresent },
            { label: "Piezas",   ok: result.completeness.boxesPresent },
            { label: "Plan",     ok: result.completeness.planPresent },
            { label: "Entrega",  ok: result.completeness.handoffPresent },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {item.ok
                ? <CheckCircle2 className="size-3.5 text-green-600 flex-shrink-0" />
                : <div className="size-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
              }
              <span className={item.ok ? "text-green-900" : "text-slate-400"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Secuencia de ejecución</p>
        <div className="space-y-1">
          {result.sequence.map((box, i) => (
            <BoxSequenceItem
              key={box.boxId}
              box={box}
              isLast={i === result.sequence.length - 1}
              expanded={expanded === box.boxId}
              onToggle={() => setExpanded(expanded === box.boxId ? null : box.boxId)}
            />
          ))}
        </div>
      </div>

      {result.planFindings.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Observaciones del plan</p>
          <div className="space-y-1.5">
            {result.planFindings.map((f, i) => (
              <p key={i} className="text-xs text-slate-600">{f}</p>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function BoxSequenceItem({
  box,
  isLast,
  expanded,
  onToggle,
}: {
  box: BoxSimulation;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const scoreColor =
    box.readinessScore >= 75 ? "text-green-700 bg-green-50"
    : box.readinessScore >= 50 ? "text-amber-700 bg-amber-50"
    : "text-red-700 bg-red-50";

  const dotColor =
    box.ready ? "bg-green-500"
    : box.readinessScore >= 50 ? "bg-amber-400"
    : "bg-red-400";

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-2 px-1 rounded hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex flex-col items-center flex-shrink-0 w-4">
          <div className={`size-2.5 rounded-full ${dotColor}`} />
          {!isLast && <div className="w-px h-5 bg-slate-200 mt-0.5" />}
        </div>

        <span className="flex-1 text-sm font-medium text-slate-800 truncate">{box.title}</span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {box.parallel && (
            <span title="Parallel">
              <GitBranch className="size-3 text-blue-500" />
            </span>
          )}
          {box.checkpoint && (
            <span title="Checkpoint">
              <Flag className="size-3 text-purple-500" />
            </span>
          )}
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${scoreColor}`}>
            {box.readinessScore}%
          </span>
          {box.gaps.length > 0
            ? <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
            : <ChevronRight className="size-3.5 text-slate-200" />
          }
        </div>
      </button>

      <AnimatePresence>
        {expanded && box.gaps.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-7 mb-2 space-y-1">
              {box.gaps.map((gap, i) => (
                <p key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                  <AlertCircle className="size-3 text-amber-400 flex-shrink-0 mt-0.5" />
                  {gap}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -----------------------------------------------------------------------
// Project Overview Tab
// -----------------------------------------------------------------------
function ProjectOverviewTab({
  workpackTitle,
  brief,
  boxes,
  handoffNotes,
  simulationResult,
  onGoToMap,
}: {
  workpackTitle?: string;
  brief: any;
  boxes: any[];
  handoffNotes: string;
  simulationResult: SimulationResult | null;
  onGoToMap: () => void;
}) {
  const overallReadiness = useMemo(() => {
    if (simulationResult) {
      return {
        READY: "listo para entregar",
        NEEDS_FIXES: "requiere refinamiento",
        BLOCKED: "bloqueado — resolver problemas críticos",
      }[simulationResult.status];
    }
    const readyCount = boxes.filter(b => evaluateBoxReadiness(b).status === "ready").length;
    if (boxes.length === 0) return "sin piezas aún";
    if (readyCount === boxes.length) return "listo para entregar";
    if (readyCount >= boxes.length / 2) return "requiere refinamiento";
    return "en progreso";
  }, [simulationResult, boxes]);

  const readinessColor =
    overallReadiness === "listo para entregar"   ? "text-green-700 bg-green-50 border-green-200"
    : overallReadiness === "requiere refinamiento"  ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-slate-600 bg-slate-50 border-slate-200";

  const deliverables = useMemo(() => {
    const items = [];
    if (brief) items.push({ label: "Brief del proyecto", desc: "Idea, alcance y restricciones" });
    if (boxes.length > 0) items.push({ label: `${boxes.length} unidad${boxes.length !== 1 ? "es" : ""} de ejecución`, desc: "Paquetes de trabajo definidos" });
    items.push({ label: "Plan de ejecución", desc: "Secuencia y dependencias" });
    if (handoffNotes.trim()) items.push({ label: "Notas de entrega", desc: "Contexto para el ejecutor" });
    return items;
  }, [brief, boxes, handoffNotes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Project summary */}
      <div className="bg-white border rounded-xl p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Resumen del proyecto</p>
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">
          {brief?.mainIdea ?? workpackTitle ?? "—"}
        </h2>
        {brief?.objective && (
          <p className="text-slate-500 text-sm mb-4">{brief.objective}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${readinessColor}`}>
            <span className="size-1.5 rounded-full bg-current opacity-70" />
            {overallReadiness}
          </span>
          {boxes.length > 0 && (
            <span className="text-xs text-slate-400">{boxes.length} unidad{boxes.length !== 1 ? "es" : ""} de trabajo</span>
          )}
        </div>
      </div>

      {/* Key work units */}
      {boxes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Piezas principales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boxes.map((box) => {
              const r = evaluateBoxReadiness(box);
              const statusLabel = r.status === "ready" ? "Listo" : r.status === "shaping" ? "Perfilando" : "Requiere refinamiento";
              const statusStyle =
                r.status === "ready"      ? "text-green-700 bg-green-50"
                : r.status === "shaping" ? "text-amber-700 bg-amber-50"
                :                          "text-slate-500 bg-slate-100";
              return (
                <div key={box.id} className="bg-white border rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <p className="font-medium text-sm text-slate-800 mb-1 line-clamp-2">{box.title}</p>
                  {box.purpose && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{box.purpose}</p>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Entregables</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {deliverables.map((d, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{d.label}</p>
                <p className="text-xs text-slate-400">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View map CTA */}
      <div className="flex justify-center pb-4">
        <Button variant="outline" onClick={onGoToMap} className="gap-2">
          <Map className="size-4" />
          Ver mapa del proyecto
        </Button>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------
// Project Map Tab
// -----------------------------------------------------------------------
function ProjectMapTab({
  workpackTitle,
  brief,
  boxes,
  handoffNotes,
}: {
  workpackTitle?: string;
  brief: any;
  boxes: any[];
  handoffNotes: string;
}) {
  const goalText = brief?.mainIdea ?? workpackTitle ?? "Project goal";

  const deliverables = useMemo(() => {
    const items: string[] = [];
    if (brief) items.push("Brief del proyecto");
    if (boxes.length > 0) items.push("Paquete de ejecución");
    items.push("Secuencia de trabajo");
    if (handoffNotes.trim()) items.push("Notas de entrega");
    return items;
  }, [brief, boxes, handoffNotes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <p className="text-xs text-slate-400 text-center mb-6">
        Mira cómo el proyecto se convierte en trabajo concreto y entregables.
      </p>

      {/* Goal node */}
      <div className="flex justify-center">
        <div className="bg-slate-900 text-white rounded-xl px-6 py-4 text-center max-w-xs shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Objetivo del proyecto</p>
          <p className="text-sm font-medium leading-snug">{goalText}</p>
        </div>
      </div>

      {/* Connector down */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-slate-200" />
      </div>

      {/* Work units row */}
      {boxes.length > 0 ? (
        <>
          {/* Horizontal line */}
          <div className="relative flex justify-center">
            <div
              className="absolute top-0 h-px bg-slate-200"
              style={{
                left: `${100 / (boxes.length * 2)}%`,
                right: `${100 / (boxes.length * 2)}%`,
              }}
            />
            <div className="grid gap-3 w-full"
              style={{ gridTemplateColumns: `repeat(${Math.min(boxes.length, 4)}, minmax(0, 1fr))` }}
            >
              {boxes.map((box) => {
                const r = evaluateBoxReadiness(box);
                const dotColor =
                  r.status === "ready"      ? "bg-green-500"
                  : r.status === "shaping" ? "bg-amber-400"
                  :                          "bg-slate-300";
                const statusLabel =
                  r.status === "ready"      ? "Listo"
                  : r.status === "shaping" ? "Perfilando"
                  :                          "Requiere trabajo";
                return (
                  <div key={box.id} className="flex flex-col items-center">
                    {/* Connector down from goal line */}
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="bg-white border-2 border-slate-200 rounded-lg p-3 w-full text-center hover:border-slate-300 transition-colors">
                      <p className="text-xs font-medium text-slate-800 line-clamp-2 mb-2">{box.title}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`size-1.5 rounded-full ${dotColor}`} />
                        <span className="text-xs text-slate-400">{statusLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connectors down from work units */}
          <div className="grid gap-3 w-full"
            style={{ gridTemplateColumns: `repeat(${Math.min(boxes.length, 4)}, minmax(0, 1fr))` }}
          >
            {boxes.map((box) => (
              <div key={box.id} className="flex justify-center">
                <div className="w-px h-6 bg-slate-200" />
              </div>
            ))}
          </div>

          {/* Deliverables row */}
          <div className="grid gap-3 w-full"
            style={{ gridTemplateColumns: `repeat(${Math.min(boxes.length, 4)}, minmax(0, 1fr))` }}
          >
            {boxes.map((box, i) => {
              const deliverable = deliverables[i % deliverables.length];
              return (
                <div key={box.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-700 font-medium">{deliverable}</p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-slate-400 text-sm">
          Sin unidades de trabajo aún — ve a Forma para agregar piezas.
        </div>
      )}

      {/* Connector to handoff */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-slate-200" />
      </div>

      {/* Handoff Package node */}
      <div className="flex justify-center">
        <div className="bg-white border-2 border-blue-200 rounded-xl px-6 py-4 text-center max-w-xs">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Paquete de entrega</p>
          <p className="text-xs text-slate-500">Brief · Piezas · Secuencia · Contexto</p>
        </div>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------
// Package Tab (existing content)
// -----------------------------------------------------------------------
function PackageTab({
  workpackId,
  workpackTitle,
  brief,
  boxes,
  handoff,
  handoffNotes,
  setHandoffNotes,
  notesDirty,
  setNotesDirty,
  simulationResult,
  simulationOutdated,
  simulate,
  handleSimulate,
  handleDownload,
  downloading,
  canExport,
  requestApproval,
  updateHandoff,
  packageSignals,
}: {
  workpackId: string;
  workpackTitle?: string;
  brief: any;
  boxes: any[];
  handoff: any;
  handoffNotes: string;
  setHandoffNotes: (v: string) => void;
  notesDirty: boolean;
  setNotesDirty: (v: boolean) => void;
  simulationResult: SimulationResult | null;
  simulationOutdated: boolean;
  simulate: any;
  handleSimulate: () => void;
  handleDownload: () => void;
  downloading: boolean;
  canExport: boolean;
  requestApproval: any;
  updateHandoff: any;
  packageSignals: { label: string; ok: boolean }[];
}) {
  const saveNotes = async () => {
    try {
      await updateHandoff.mutateAsync({ handoffNotes });
      setNotesDirty(false);
      toast.success("Handoff notes saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save notes");
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Center content */}
      <div className="flex-1 space-y-4">
        {/* Package Card */}
        <div className="bg-white border rounded-lg">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{workpackTitle ?? "—"}</h2>
              <Badge variant="outline">{boxes.length} pieza{boxes.length !== 1 ? "s" : ""}</Badge>
            </div>
          </div>

          {/* Included */}
          <div className="p-6 border-b">
            <h3 className="font-semibold mb-4">Incluido</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="size-5 text-green-700" />
                  <span className="font-medium text-sm">brief.md</span>
                </div>
                <p className="text-xs text-green-700">Idea · alcance · restricciones</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BoxIcon className="size-5 text-amber-700" />
                  <span className="font-medium text-sm">boxes/</span>
                </div>
                <p className="text-xs text-amber-700">{boxes.length} unidad{boxes.length !== 1 ? "es" : ""} de ejecución</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="size-5 text-blue-700" />
                  <span className="font-medium text-sm">plan.json</span>
                </div>
                <p className="text-xs text-blue-700">Orden de ejecución · dependencias</p>
              </div>
            </div>
          </div>

          {/* Handoff notes */}
          <div className="p-6">
            <h3 className="font-semibold mb-4">Notas de entrega</h3>
            <div className="flex items-start gap-2 text-slate-600 mb-2 text-sm">
              <Settings className="size-4 mt-0.5" />
              <span>Agrega contexto para el ejecutor</span>
            </div>
            <Textarea
              placeholder="Cualquier contexto que el ejecutor necesite para comenzar..."
              value={handoffNotes}
              onChange={(e) => { setHandoffNotes(e.target.value); setNotesDirty(true); }}
              className="min-h-[80px] mb-2"
            />
            {notesDirty && (
              <Button
                size="sm"
                variant="outline"
                onClick={saveNotes}
                disabled={updateHandoff.isPending}
              >
                {updateHandoff.isPending && <Loader2 className="size-3 mr-1 animate-spin" />}
                Guardar notas
              </Button>
            )}
          </div>
        </div>

        {simulationOutdated && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">Simulación desactualizada</p>
                <p className="text-xs text-amber-700 mt-1">
                  Se detectaron cambios después de la última simulación. Vuelve a simular antes de exportar este paquete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Simulate button */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleSimulate}
          disabled={simulate.isPending}
        >
          {simulate.isPending
            ? <><Loader2 className="size-4 animate-spin" /> Simulando…</>
            : simulationOutdated
            ? <><Play className="size-4" /> Simular de nuevo</>
            : <><Play className="size-4" /> Simular entrega</>
          }
        </Button>

        {/* Simulation result */}
        {simulationResult && (
          <ExecutionPreview result={simulationResult} />
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleDownload}
            disabled={downloading || !canExport}
            className="gap-2 flex-1"
            title={
              simulationOutdated
                ? "Vuelve a simular antes de exportar"
                : !canExport
                ? "Resuelve los problemas críticos antes de exportar"
                : undefined
            }
          >
            {downloading
              ? <Loader2 className="size-4 animate-spin" />
              : <Download className="size-4" />
            }
            Exportar paquete
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            disabled={requestApproval.isPending}
            onClick={async () => {
              try {
                await requestApproval.mutateAsync();
                toast.success("Aprobación solicitada — colaboradores notificados");
              } catch (e: any) {
                toast.error(e.message ?? "Failed to request approval");
              }
            }}
          >
            {requestApproval.isPending && <Loader2 className="size-4 animate-spin" />}
            Solicitar aprobación
          </Button>
        </div>

        {simulationOutdated ? (
          <p className="text-xs text-center text-amber-600">
            Exportación deshabilitada — la simulación está desactualizada
          </p>
        ) : simulationResult?.status === "BLOCKED" ? (
          <p className="text-xs text-center text-red-500">
            Exportación deshabilitada — resuelve los problemas críticos primero
          </p>
        ) : null}
      </div>

      {/* Right sidebar */}
      <div className="w-72 flex-shrink-0 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold">Preparación</h2>
            <InfoTooltip
              title="¿Qué contiene un paquete?"
              body={["Un paquete incluye: un brief, un conjunto de piezas, una secuencia de trabajo y notas de entrega opcionales.", "Esto es lo que se entrega a otra persona, agente o runtime externo."]}
              footer="Simula la entrega para obtener una verificación completa."
            />
          </div>

          <div className="space-y-3 mb-6">
            {packageSignals.map((signal, i) => (
              <div key={i} className="flex items-center gap-3">
                {signal.ok
                  ? <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
                  : <AlertCircle className="size-4 text-amber-400 flex-shrink-0" />
                }
                <span className={`text-sm ${signal.ok ? "text-green-900 font-medium" : "text-slate-500"}`}>
                  {signal.label}
                </span>
              </div>
            ))}
          </div>

          {brief && (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Lightbulb className="size-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-600">{brief.mainIdea}</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Formato de exportación
            <InfoTooltip
              title="¿Qué hay en el paquete?"
              body="brief.md · boxes/ · plan.json · README.md — todo lo que el ejecutor necesita para comenzar sin hacer preguntas."
            />
          </h3>
          <div className="bg-slate-50 rounded-lg p-3">
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Brief en Markdown</li>
              <li>• Definiciones de piezas (.md)</li>
              <li>• Plan de ejecución JSON</li>
              <li>• Resumen README</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------
export function WorkspaceBox() {
  const { id } = useParams<{ id: string }>();

  const { data: workpack } = useWorkpack(id!);
  const { data: boxes = [], isLoading: loadingBoxes } = useBoxes(id!);
  const { data: brief, isLoading: loadingBrief } = useBrief(id!);
  const { data: handoff, isLoading: loadingHandoff } = useHandoff(id!);
  const updateHandoff = useUpdateHandoff(id!);
  const requestApproval = useRequestApproval(id!);
  const simulate = useSimulate(id!);
  const { data: members = [] } = useMembers(id!);
  const inviteMember = useInviteMember(id!);
  const removeMember = useRemoveMember(id!);
  const updateTitle = useUpdateTitle(id!);

  const [activeTab, setActiveTab] = useState<BoxTab>("overview");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulatedSignature, setSimulatedSignature] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const isMobile = useIsMobile();

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

  useEffect(() => {
    if (handoff?.handoffNotes && !notesDirty) {
      setHandoffNotes(handoff.handoffNotes);
    }
  }, [handoff?.handoffNotes]);

  const packageSignature = useMemo(() => {
    const boxFingerprint = [...boxes]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((b) => ({
        id: b.id,
        title: b.title,
        purpose: b.purpose,
        instructions: b.instructions,
        constraints: b.constraints,
        acceptanceCriteria: b.acceptanceCriteria,
        expectedOutput: b.expectedOutput,
        order: b.order,
        dependsOnBoxId: b.dependsOnBoxId,
        checkpoint: b.checkpoint,
        parallelizable: b.parallelizable,
        executionContext: b.executionContext,
      }));

    return JSON.stringify({
      brief: brief ? {
        title: brief.title,
        mainIdea: brief.mainIdea,
        objective: brief.objective,
        actors: brief.actors,
        scopeIncludes: brief.scopeIncludes,
        constraints: brief.constraints,
        successCriteria: brief.successCriteria,
      } : null,
      handoffNotes: handoffNotes.trim(),
      boxes: boxFingerprint,
    });
  }, [brief, boxes, handoffNotes]);

  const simulationOutdated =
    !!simulationResult &&
    !!simulatedSignature &&
    simulatedSignature !== packageSignature;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadWorkpackZip(id!);
      toast.success("Package downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleSimulate = async () => {
    try {
      const result = await simulate.mutateAsync();
      setSimulationResult(result);
      setSimulatedSignature(packageSignature);
    } catch (e: any) {
      toast.error(e.message ?? "Simulation failed");
    }
  };

  const isLoading = loadingBoxes || loadingBrief || loadingHandoff;
  const canExport =
    !simulationOutdated &&
    (!simulationResult || simulationResult.status !== "BLOCKED");

  const packageSignals = [
    { label: "Brief incluido",          ok: !!brief },
    { label: "Piezas empaquetadas",     ok: boxes.length > 0 },
    { label: "Plan presente",           ok: true },
    { label: "Notas de entrega presentes", ok: handoffNotes.trim().length > 0 },
  ];

  const tabs: { id: BoxTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Resumen del proyecto", icon: <LayoutGrid className="size-4" /> },
    { id: "map",      label: "Mapa del proyecto",    icon: <Map className="size-4" /> },
    { id: "package",  label: "Paquete",              icon: <Package className="size-4" /> },
  ];

  // ── Mobile layout ──────────────────────────────────────────────────────
  if (isMobile) {
    const mobileTabs: { id: BoxTab; label: string; icon: React.ReactNode }[] = [
      { id: "overview", label: "Resumen", icon: <LayoutGrid className="size-4" /> },
      { id: "map",      label: "Mapa",    icon: <Map className="size-4" /> },
      { id: "package",  label: "Paquete", icon: <Package className="size-4" /> },
    ];

    return (
      <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

        {/* Compact header */}
        <header className="bg-white border-b flex-shrink-0 px-3 py-2.5 flex items-center gap-2 sticky top-0 z-10">
          <Link to={`/workspace/${id}/shape`}>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="size-4 text-slate-600" />
            </button>
          </Link>
          <BoxIcon className="size-4 text-blue-600 flex-shrink-0" />
          {editingTitle ? (
            <Input
              autoFocus
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
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
          <UsageCapacityBadge />
          <InboxBell />
        </header>

        {/* Stage pills */}
        <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
          <StagePills workpackId={id!} current="box" workpackStage={workpack?.stage} />
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b flex-shrink-0">
          <div className="flex">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "package" && simulationOutdated && (
                  <span className="size-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : (
            <div className="px-4 py-4">
              {activeTab === "overview" && (
                <ProjectOverviewTab
                  workpackTitle={workpack?.title}
                  brief={brief}
                  boxes={boxes}
                  handoffNotes={handoffNotes}
                  simulationResult={simulationResult}
                  onGoToMap={() => setActiveTab("map")}
                />
              )}
              {activeTab === "map" && (
                <ProjectMapTab
                  workpackTitle={workpack?.title}
                  brief={brief}
                  boxes={boxes}
                  handoffNotes={handoffNotes}
                />
              )}
              {activeTab === "package" && (
                <PackageTab
                  workpackId={id!}
                  workpackTitle={workpack?.title}
                  brief={brief}
                  boxes={boxes}
                  handoff={handoff}
                  handoffNotes={handoffNotes}
                  setHandoffNotes={setHandoffNotes}
                  notesDirty={notesDirty}
                  setNotesDirty={setNotesDirty}
                  simulationResult={simulationResult}
                  simulationOutdated={simulationOutdated}
                  simulate={simulate}
                  handleSimulate={handleSimulate}
                  handleDownload={handleDownload}
                  downloading={downloading}
                  canExport={canExport}
                  requestApproval={requestApproval}
                  updateHandoff={updateHandoff}
                  packageSignals={packageSignals}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex items-center gap-3">
              <Link to={`/workspace/${id}/shape`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" /> Volver
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <BoxIcon className="size-5 text-blue-600" />
                {editingTitle ? (
                  <Input
                    autoFocus
                    value={titleValue}
                    onChange={e => setTitleValue(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                    className="h-7 text-sm font-semibold w-48"
                  />
                ) : (
                  <span
                    className="font-semibold cursor-pointer hover:text-blue-600 flex items-center gap-1 group"
                    onClick={() => { setTitleValue(workpack?.title ?? ""); setEditingTitle(true); }}
                  >
                    {workpack?.title ?? "Workspace"}
                    <Pencil className="size-3 opacity-0 group-hover:opacity-40" />
                  </span>
                )}
              </div>
            </div>

            <StagePills workpackId={id!} current="box" workpackStage={workpack?.stage} />

            <div className="flex items-center gap-3 justify-end">
              <UsageCapacityBadge />
          <InboxBell />
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
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
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleInvite(); }}
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
                          {members.map(m => (
                            <div key={m.userId} className="flex items-center justify-between text-sm">
                              <span>{m.user?.name ?? m.user?.email ?? m.userId}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs">{m.role}</span>
                                {m.role !== "OWNER" && (
                                  <button
                                    onClick={() => removeMember.mutate(m.userId)}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                  >
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
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-col h-[calc(100vh-73px)]">

        {/* Tab bar */}
        <div className="bg-white border-b px-8">
          <div className="max-w-4xl mx-auto flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "package" && simulationOutdated && (
                  <span className="size-1.5 rounded-full bg-amber-400 ml-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="max-w-4xl mx-auto p-8">
              <div className="space-y-4">
                <Skeleton className="h-40 rounded-xl" />
                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                </div>
              </div>
            </div>
          ) : (
            <div className={activeTab === "package" ? "p-8 max-w-5xl mx-auto" : "p-8 max-w-4xl mx-auto"}>
              {activeTab === "overview" && (
                <ProjectOverviewTab
                  workpackTitle={workpack?.title}
                  brief={brief}
                  boxes={boxes}
                  handoffNotes={handoffNotes}
                  simulationResult={simulationResult}
                  onGoToMap={() => setActiveTab("map")}
                />
              )}
              {activeTab === "map" && (
                <ProjectMapTab
                  workpackTitle={workpack?.title}
                  brief={brief}
                  boxes={boxes}
                  handoffNotes={handoffNotes}
                />
              )}
              {activeTab === "package" && (
                <PackageTab
                  workpackId={id!}
                  workpackTitle={workpack?.title}
                  brief={brief}
                  boxes={boxes}
                  handoff={handoff}
                  handoffNotes={handoffNotes}
                  setHandoffNotes={setHandoffNotes}
                  notesDirty={notesDirty}
                  setNotesDirty={setNotesDirty}
                  simulationResult={simulationResult}
                  simulationOutdated={simulationOutdated}
                  simulate={simulate}
                  handleSimulate={handleSimulate}
                  handleDownload={handleDownload}
                  downloading={downloading}
                  canExport={canExport}
                  requestApproval={requestApproval}
                  updateHandoff={updateHandoff}
                  packageSignals={packageSignals}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
