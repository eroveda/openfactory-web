import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { BoxEditDialog } from "../components/BoxEditDialog";
import { ShapeChatPanel } from "../components/ShapeChatPanel";
import { AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Settings,
  CheckCircle2,
  AlertCircle,
  Users,
  Loader2,
  Pencil,
  X,
  Download,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { useWorkpack, useBoxes, usePlan, useBrief, useShape, useUpdateBox, useMembers, useInviteMember, useRemoveMember, useUpdateTitle } from "../../hooks/useWorkpacks";
import { StagePills } from "../components/StagePills";
import { InboxBell } from "../components/InboxBell";
import { WorkMapCanvas } from "../components/WorkMapCanvas";
import type { Box } from "../../lib/api";
import { toast } from "sonner";

export function WorkspaceShape() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: workpack } = useWorkpack(id!);
  const { data: boxes = [], isLoading: loadingBoxes } = useBoxes(id!);
  const { data: plan } = usePlan(id!);
  const { data: brief } = useBrief(id!);
  const shape = useShape(id!);
  const updateBox = useUpdateBox(id!);

  const { data: members = [] } = useMembers(id!);
  const inviteMember = useInviteMember(id!);
  const removeMember = useRemoveMember(id!);
  const updateTitle = useUpdateTitle(id!);

  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reshapeDialogOpen, setReshapeDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  // Invalidate boxes/plan/brief when pipeline transitions PROCESSING → DONE
  const prevStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevStatusRef.current === "PROCESSING" && workpack?.processingStatus === "DONE") {
      qc.invalidateQueries({ queryKey: ["boxes", id] });
      qc.invalidateQueries({ queryKey: ["plan", id] });
      qc.invalidateQueries({ queryKey: ["brief", id] });
    }
    prevStatusRef.current = workpack?.processingStatus;
  }, [workpack?.processingStatus]);

  // Elapsed timer while processing
  const alreadyStuckRef = useRef(false);
  const initialElapsedRef = useRef(0);
  useEffect(() => {
    if (isProcessing && workpack?.updatedAt) {
      const secondsAgo = Math.floor((Date.now() - new Date(workpack.updatedAt).getTime()) / 1000);
      if (secondsAgo > 30) {
        alreadyStuckRef.current = true;
        initialElapsedRef.current = secondsAgo;
      }
    }
  }, [workpack?.id]);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessing = workpack?.processingStatus === "PROCESSING" || workpack?.processingStatus === "PENDING";

  useEffect(() => {
    if (isProcessing) {
      const start = initialElapsedRef.current;
      setElapsed(start);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
      alreadyStuckRef.current = false;
      initialElapsedRef.current = 0;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isProcessing]);

  const elapsedLabel = elapsed > 0
    ? `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`
    : null;

  const handleReshape = async () => {
    try {
      await shape.mutateAsync();
      setReshapeDialogOpen(false);
      toast.success("Reshaping in progress…");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to reshape");
    }
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

  const readyCount = boxes.filter(b => b.status === "READY").length;
  const briefIncomplete = brief?.status === "INCOMPLETE";
  const isReady = boxes.length > 0 && !isProcessing && !briefIncomplete;

  // Progress steps for pipeline overlay
  const STEPS = [
    { key: "Analyzing content…",          label: "Reading your idea",              detail: "Parsing sources into context" },
    { key: "Evaluating brief…",            label: "Understanding what you want",    detail: "Extracting goals, actors and scope" },
    { key: "Generating outline…",          label: "Mapping the work structure",     detail: "Building a topic tree" },
    { key: "Creating work boxes…",         label: "Breaking work into clear tasks", detail: "Each topic becomes an actionable box" },
    { key: "Planning execution sequence…", label: "Sequencing the work",            detail: "Detecting dependencies and parallelism" },
    { key: "Packaging handoff…",           label: "Preparing the handoff",          detail: "Wrapping into a deliverable package" },
  ];
  const currentStepIdx = STEPS.findIndex(s => s.key === workpack?.pipelineStep);
  const currentStep = STEPS[currentStepIdx];

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={`/workspace/${id}/define`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" /> Back to Define
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
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
              className="font-semibold text-sm cursor-pointer hover:text-blue-600 flex items-center gap-1 group"
              onClick={() => { setTitleValue(workpack?.title ?? ""); setEditingTitle(true); }}
            >
              {workpack?.title ?? "Workspace"}
              <Pencil className="size-3 opacity-0 group-hover:opacity-40" />
            </span>
          )}
        </div>

        <StagePills workpackId={id!} current="shape" />

        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          {!isProcessing && boxes.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Progress:</span>
              <span className="font-medium text-slate-700">{readyCount}/{boxes.length} boxes ready</span>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${boxes.length > 0 ? (readyCount / boxes.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Reshape */}
          <Dialog open={reshapeDialogOpen} onOpenChange={setReshapeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="size-4" /> Reshape
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Reshape work structure</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Re-run the AI pipeline to generate a new structure from the original content.</p>
                <Button className="w-full" onClick={handleReshape} disabled={shape.isPending}>
                  {shape.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Generate new structure
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Share */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="size-4" /> Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Share this workspace</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Invite by email</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleInvite(); }}
                    />
                    <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                      {inviteMember.isPending && <Loader2 className="size-4 mr-1 animate-spin" />}
                      Invite
                    </Button>
                  </div>
                </div>
                {members.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Members</label>
                    <div className="space-y-2">
                      {members.map(m => (
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

          <InboxBell />

          <Button
            onClick={() => navigate(`/workspace/${id}/box`)}
            disabled={!isReady}
            className="gap-2"
          >
            Continue to Box <ArrowRight className="size-4" />
          </Button>
        </div>
      </header>

      {/* Canvas area — full height */}
      <div className="flex-1 relative overflow-hidden">

        {/* React Flow canvas */}
        {!isProcessing && boxes.length > 0 && (
          <WorkMapCanvas
            boxes={boxes}
            planSteps={plan?.steps ?? null}
            onBoxClick={box => { setSelectedBox(box); setChatPanelOpen(true); }}
          />
        )}

        {/* Shape AI copilot panel */}
        <AnimatePresence>
          {chatPanelOpen && selectedBox && (
            <ShapeChatPanel
              workpackId={id!}
              box={selectedBox}
              onClose={() => setChatPanelOpen(false)}
              onEditManually={() => { setChatPanelOpen(false); setEditDialogOpen(true); }}
            />
          )}
        </AnimatePresence>

        {/* Pipeline running overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 z-10">
            <div className="max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="size-5 animate-spin text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">Running pipeline…</p>
                  {elapsedLabel && <p className="text-xs font-mono text-slate-400">{elapsedLabel}</p>}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-1 mb-5">
                {STEPS.map((s, i) => (
                  <div key={s.key} className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                    i < currentStepIdx ? "bg-green-500" :
                    i === currentStepIdx ? "bg-blue-500 animate-pulse" :
                    "bg-slate-200"
                  }`} />
                ))}
              </div>

              {/* Step label */}
              {currentStep && (
                <div className="mb-5 text-center">
                  <p className="font-medium text-slate-800">{currentStep.label}</p>
                  <p className="text-xs text-slate-400">{currentStep.detail}</p>
                </div>
              )}

              {/* Live log */}
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1 min-h-[100px] max-h-48 overflow-auto">
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
                <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 space-y-2">
                  <p className="font-medium">Taking too long — the pipeline may be stuck.</p>
                  <Button size="sm" variant="outline" className="gap-2 text-red-700 border-red-300" onClick={handleReshape} disabled={shape.isPending}>
                    {shape.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Settings className="size-3.5" />}
                    Try reshaping
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Failed state */}
        {!isProcessing && workpack?.processingStatus === "FAILED" && boxes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <AlertCircle className="size-10 mx-auto mb-3 text-red-400" />
              <p className="font-medium text-slate-800 mb-1">Pipeline failed</p>
              <p className="text-sm text-slate-500 mb-4">
                {workpack.failureReason ?? "Something went wrong generating the boxes."}
              </p>
              <div className="flex gap-2 justify-center">
                <Link to={`/workspace/${id}/define`}>
                  <Button variant="outline" size="sm">Back to Define</Button>
                </Link>
                <Button size="sm" onClick={handleReshape} disabled={shape.isPending}>
                  {shape.isPending && <Loader2 className="size-3.5 mr-1 animate-spin" />}
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state (no boxes, not processing, not failed) */}
        {!isProcessing && workpack?.processingStatus !== "FAILED" && boxes.length === 0 && !loadingBoxes && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-400 text-sm">No boxes yet — go to Define and generate a shape.</p>
          </div>
        )}

        {/* Brief quality warnings panel — bottom left */}
        {!isProcessing && brief && brief.status !== "READY" && (
          <div className="absolute bottom-4 left-4 bg-white border border-amber-200 rounded-xl shadow-sm p-3 text-xs max-w-xs z-10">
            <p className="font-medium text-amber-700 mb-2">Brief needs attention</p>
            <div className="space-y-1">
              {[
                { label: "Intent clear",       ok: brief.readinessSignals?.intentClear },
                { label: "Actor defined",       ok: brief.readinessSignals?.actorDefined },
                { label: "Scope defined",       ok: brief.readinessSignals?.scopeDefined },
                { label: "Constraints",         ok: brief.readinessSignals?.constraintsDefined },
                { label: "Success criteria",    ok: brief.readinessSignals?.successCriteriaDefined },
              ].filter(s => !s.ok).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="size-3 flex-shrink-0" />
                  <span>{s.label} not defined</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan status — bottom center */}
        {!isProcessing && plan && plan.status !== "VALID" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border border-amber-200 rounded-xl shadow-sm px-4 py-2 text-xs z-10">
            <span className="text-amber-700 font-medium">Review recommended</span>
            <span className="text-slate-400 ml-1">· Some sequencing details need attention before packaging.</span>
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
