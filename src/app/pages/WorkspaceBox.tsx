import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useWorkpack, useBoxes, useBrief, useHandoff, useUpdateHandoff, useRequestApproval, useSimulate } from "../../hooks/useWorkpacks";
import { downloadWorkpackZip } from "../../lib/api";
import type { SimulationResult, BoxSimulation } from "../../lib/api";
import { InboxBell } from "../components/InboxBell";
import { InfoTooltip } from "../components/InfoTooltip";
import { Skeleton } from "../components/ui/skeleton";

// -----------------------------------------------------------------------
// Execution Preview visual
// -----------------------------------------------------------------------
function ExecutionPreview({ result }: { result: SimulationResult }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const statusColor = {
    READY: "bg-green-50 border-green-200",
    NEEDS_FIXES: "bg-amber-50 border-amber-200",
    BLOCKED: "bg-red-50 border-red-200",
  }[result.status];

  const statusLabel = {
    READY: "Package valid — ready to export",
    NEEDS_FIXES: "Some boxes need refinement",
    BLOCKED: "Critical issues block export",
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
      {/* Overall status */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${statusColor}`}>
        {statusIcon}
        <span className="text-sm font-medium">{statusLabel}</span>
      </div>

      {/* Package completeness */}
      <div className="bg-white border rounded-lg p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Package contents</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Brief",   ok: result.completeness.briefPresent },
            { label: "Boxes",   ok: result.completeness.boxesPresent },
            { label: "Plan",    ok: result.completeness.planPresent },
            { label: "Handoff", ok: result.completeness.handoffPresent },
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

      {/* Execution sequence */}
      <div className="bg-white border rounded-lg p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Execution sequence</p>
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

      {/* Plan findings */}
      {result.planFindings.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Plan findings</p>
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
        {/* connector + dot */}
        <div className="flex flex-col items-center flex-shrink-0 w-4">
          <div className={`size-2.5 rounded-full ${dotColor}`} />
          {!isLast && <div className="w-px h-5 bg-slate-200 mt-0.5" />}
        </div>

        <span className="flex-1 text-sm font-medium text-slate-800 truncate">{box.title}</span>

        {/* badges */}
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

  const [handoffNotes, setHandoffNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    if (handoff?.handoffNotes && !notesDirty) {
      setHandoffNotes(handoff.handoffNotes);
    }
  }, [handoff?.handoffNotes]);

  const saveNotes = async () => {
    try {
      await updateHandoff.mutateAsync({ handoffNotes });
      setNotesDirty(false);
      toast.success("Handoff notes saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save notes");
    }
  };

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
    } catch (e: any) {
      toast.error(e.message ?? "Simulation failed");
    }
  };

  const isLoading = loadingBoxes || loadingBrief || loadingHandoff;
  const canExport = !simulationResult || simulationResult.status !== "BLOCKED";

  const packageSignals = [
    { label: "Brief included",        ok: !!brief },
    { label: "Boxes packaged",        ok: boxes.length > 0 },
    { label: "Plan present",          ok: true },  // if we got here, plan exists
    { label: "Handoff notes present", ok: handoffNotes.trim().length > 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/workspace/${id}/shape`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" /> Back to Shape
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <BoxIcon className="size-5 text-blue-600" />
                <span className="font-semibold">{workpack?.title ?? "Workspace"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3 text-green-600" /> Raw / Define
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3 text-green-600" /> Shape
              </Badge>
              <Badge variant="outline" className="gap-1 bg-blue-100">
                <div className="size-2 rounded-full bg-blue-600" /> Box
              </Badge>
            </div>

            <InboxBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">

        {/* Center Column */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">

            {/* Title */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Package className="size-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-semibold">Box</h1>
                  <p className="text-slate-600">Your production package — simulate, verify, then export.</p>
                </div>
              </div>
            </div>

            {/* Loading skeleton */}
            {isLoading ? (
              <div className="bg-white border rounded-lg p-6 mb-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ) : null}

            {/* Package Card */}
            {!isLoading && (
            <div className="bg-white border rounded-lg mb-6">
              <div className="border-b p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{workpack?.title ?? "—"}</h2>
                  <Badge variant="outline">{boxes.length} boxes</Badge>
                </div>
              </div>

              {/* Included */}
              <div className="p-6 border-b">
                <h3 className="font-semibold mb-4">Included</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-5 text-green-700" />
                      <span className="font-medium text-sm">brief.md</span>
                    </div>
                    <p className="text-xs text-green-700">Idea · scope · constraints</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BoxIcon className="size-5 text-amber-700" />
                      <span className="font-medium text-sm">boxes/</span>
                    </div>
                    <p className="text-xs text-amber-700">{boxes.length} execution units</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="size-5 text-blue-700" />
                      <span className="font-medium text-sm">plan.json</span>
                    </div>
                    <p className="text-xs text-blue-700">Run order · dependencies</p>
                  </div>
                </div>
              </div>

              {/* Handoff notes */}
              <div className="p-6">
                <h3 className="font-semibold mb-4">Handoff Notes</h3>
                <div className="flex items-start gap-2 text-slate-600 mb-2 text-sm">
                  <Settings className="size-4 mt-0.5" />
                  <span>Add context for the executor</span>
                </div>
                <Textarea
                  placeholder="Any context the executor needs to start..."
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
                    Save notes
                  </Button>
                )}
              </div>
            </div>
            )}

            {/* Simulate button */}
            <div className="mb-4">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleSimulate}
                disabled={simulate.isPending}
              >
                {simulate.isPending
                  ? <><Loader2 className="size-4 animate-spin" /> Running simulation…</>
                  : <><Play className="size-4" /> Simulate handoff</>
                }
              </Button>
            </div>

            {/* Simulation result */}
            {simulationResult && (
              <div className="mb-6">
                <ExecutionPreview result={simulationResult} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                disabled={downloading || !canExport}
                className="gap-2 flex-1"
                title={!canExport ? "Fix critical issues before exporting" : undefined}
              >
                {downloading
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Download className="size-4" />
                }
                Export package
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                disabled={requestApproval.isPending}
                onClick={async () => {
                  try {
                    await requestApproval.mutateAsync();
                    toast.success("Approval requested — collaborators notified");
                  } catch (e: any) {
                    toast.error(e.message ?? "Failed to request approval");
                  }
                }}
              >
                {requestApproval.isPending && <Loader2 className="size-4 animate-spin" />}
                Request approval
              </Button>
            </div>

            {simulationResult?.status === "BLOCKED" && (
              <p className="mt-2 text-xs text-center text-red-500">
                Export disabled — resolve critical issues first
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="w-80 bg-white border-l p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold">Readiness</h2>
              <InfoTooltip
                title="What's inside a package?"
                body={["A package bundles: a brief, a set of boxes, a work sequence, and optional handoff notes.", "This is what gets handed to another person, agent or external runtime."]}
                footer="Simulate handoff to get a full preflight check."
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

            {/* Brief summary */}
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
              Export Format
              <InfoTooltip
                title="What is in the package?"
                body="brief.md · boxes/ · plan.json · README.md — everything the executor needs to start without asking questions."
              />
            </h3>
            <div className="bg-slate-50 rounded-lg p-3">
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Markdown brief</li>
                <li>• Box definitions (.md)</li>
                <li>• JSON execution plan</li>
                <li>• README summary</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
