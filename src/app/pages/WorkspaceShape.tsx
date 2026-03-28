import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BoxEditDialog } from "../components/BoxEditDialog";
import {
  Box as BoxIcon,
  ArrowLeft,
  ArrowRight,
  Plus,
  Settings,
  Zap,
  CheckCircle2,
  AlertCircle,
  Package,
  Users,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { useWorkpack, useBoxes, usePlan, useBrief, useShape, useUpdateBox, useMembers, useInviteMember, useRemoveMember, useUpdateTitle } from "../../hooks/useWorkpacks";
import { Skeleton } from "../components/ui/skeleton";
import { StagePills } from "../components/StagePills";
import { InboxBell } from "../components/InboxBell";
import { InfoTooltip } from "../components/InfoTooltip";
import type { Box } from "../../lib/api";
import { toast } from "sonner";

export function WorkspaceShape() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  const [reshapeDialogOpen, setReshapeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

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

  const isProcessing = workpack?.processingStatus === "PROCESSING" || workpack?.processingStatus === "PENDING";
  const activeBox = selectedBox ?? boxes[0] ?? null;

  // Elapsed timer while processing.
  // If the workpack was already PROCESSING when the page loaded, estimate elapsed
  // time from updatedAt so we don't make the user wait 2 min for the retry option.
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
  }, [workpack?.id]); // only on first load

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const readyCount = boxes.filter(b => b.status === "READY").length;
  const briefIncomplete = brief?.status === "INCOMPLETE";
  const isReady = boxes.length > 0 && !isProcessing && !briefIncomplete;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/workspace/${id}/define`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" /> Back to Define
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-300" />
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

            <StagePills workpackId={id!} current="shape" />

            <div className="flex items-center gap-3">
              <InboxBell />
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

      {/* Processing banner */}
      {isProcessing && (
        <div className={`border-b px-6 py-3 flex items-center gap-2 text-sm ${
          elapsed >= 120
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <Loader2 className="size-4 animate-spin flex-shrink-0" />
          <span>Pipeline running — boxes will appear once complete…</span>
          {elapsedLabel && (
            <span className="ml-auto font-mono text-xs opacity-60">{elapsedLabel}</span>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column - Work Map */}
        <div className="w-80 bg-white border-r p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Work Map</h2>
                <InfoTooltip
                  title="Why split work into boxes?"
                  body="A single broad instruction is often too vague to execute well. Boxes break the work into smaller, clearer units so each step can be refined, validated and handed off with less ambiguity."
                  footer="Better boxes usually lead to better execution."
                />
              </div>
              <Dialog open={reshapeDialogOpen} onOpenChange={setReshapeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Settings className="size-4" /> Reshape
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Reshape work structure</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Re-run the AI pipeline to generate a new structure from the original content.
                    </p>
                    <Button className="w-full" onClick={handleReshape} disabled={shape.isPending}>
                      {shape.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                      Generate new structure
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingBoxes ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {boxes.map((box, i) => (
                  <button
                    key={box.id}
                    onClick={() => setSelectedBox(box)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      activeBox?.id === box.id
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm text-slate-500">
                        B{String(i + 1).padStart(2, "0")}
                      </span>
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                        {box.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{box.title}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Work Sequence */}
          {plan && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold">Execution Plan</h3>
              <InfoTooltip
                title="Why sequence matters"
                body={["Good execution is not only about defining the work. It is also about knowing: what comes first, what depends on what, what can run in parallel, and what is still blocked."]}
                footer="The work sequence turns separate boxes into a coherent handoff."
              />
            </div>
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700">
                v{plan.version} · {plan.status}
              </div>
            </div>
          )}
        </div>

        {/* Center Column - Box Detail */}
        <div className="flex-1 p-8 overflow-auto">
          {activeBox ? (
            <div className="max-w-3xl">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-500">{activeBox.nodeId}</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {activeBox.status}
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-semibold">{activeBox.title}</h1>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Zap className="size-4 text-amber-500" /> Purpose
                  </label>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-slate-900">{activeBox.purpose || "—"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <ArrowRight className="size-4 text-blue-500" /> Input Context
                  </label>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-slate-900">{activeBox.inputContext || "—"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Package className="size-4 text-green-500" /> Expected Output
                  </label>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-slate-900">{activeBox.expectedOutput || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              {isProcessing ? (
                <div className="text-center max-w-sm">
                  <Loader2 className="size-12 mx-auto mb-4 animate-spin text-blue-400 opacity-60" />
                  <p className="font-medium text-slate-800 mb-1">Generating boxes…</p>
                  {elapsedLabel && (
                    <p className="text-sm font-mono text-slate-400 mb-3">{elapsedLabel}</p>
                  )}
                  {elapsed < 60 && (
                    <p className="text-sm text-slate-500">This takes about 30–60 seconds.</p>
                  )}
                  {elapsed >= 60 && elapsed < 120 && (
                    <div className="mt-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      Still working — the pipeline can take up to 2 minutes with complex content.
                    </div>
                  )}
                  {elapsed >= 120 && (
                    <div className="mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 space-y-2">
                      <p className="font-medium">Taking too long — the pipeline may be stuck.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-red-700 border-red-300 hover:bg-red-50"
                        onClick={handleReshape}
                        disabled={shape.isPending}
                      >
                        {shape.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Settings className="size-3.5" />}
                        Try reshaping
                      </Button>
                    </div>
                  )}
                </div>
              ) : workpack?.processingStatus === "FAILED" ? (
                <div className="text-center max-w-sm">
                  <AlertCircle className="size-10 mx-auto mb-3 text-red-400" />
                  <p className="font-medium text-slate-800 mb-1">Pipeline failed</p>
                  <p className="text-sm text-slate-500 mb-4">
                    {workpack.failureReason ?? "Something went wrong generating the boxes."}
                  </p>
                  <Link to={`/workspace/${id}/define`}>
                    <Button variant="outline" size="sm">Back to Define</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Select a box to see details</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Readiness */}
        <div className="w-80 bg-white border-l p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold">Readiness</h2>
              <InfoTooltip
                title="What is a box?"
                body={["A box is one clear unit of work for execution.", "Each box defines: what needs to be done, what goes in, what should come out, and what it depends on."]}
                footer="Boxes reduce ambiguity and make work easier to hand off."
              />
            </div>

            {/* Brief quality signals from LLM */}
            {brief?.readinessSignals && (
              <div className="mb-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Brief quality</p>
                <div className="space-y-2">
                  {[
                    { label: "Intent clear",        ok: brief.readinessSignals.intentClear },
                    { label: "Actor defined",        ok: brief.readinessSignals.actorDefined },
                    { label: "Scope defined",        ok: brief.readinessSignals.scopeDefined },
                    { label: "Constraints defined",  ok: brief.readinessSignals.constraintsDefined },
                    { label: "Success criteria",     ok: brief.readinessSignals.successCriteriaDefined },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {s.ok
                        ? <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
                        : <AlertCircle className="size-4 text-amber-400 flex-shrink-0" />
                      }
                      <span className={`text-sm ${s.ok ? "text-green-900" : "text-slate-500"}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {briefIncomplete && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    Brief is incomplete — go back to Define and add more context before packaging.
                  </div>
                )}
              </div>
            )}

            {/* Shape readiness */}
            <div className="space-y-3 mb-6">
              {[
                { label: "Boxes generated", ok: boxes.length > 0 },
                { label: "All boxes ready", ok: readyCount === boxes.length && boxes.length > 0 },
                { label: "Plan available",  ok: !!plan },
              ].map((signal, i) => (
                <div key={i} className="flex items-start gap-3">
                  {signal.ok
                    ? <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                    : <div className="size-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                  }
                  <p className={`text-sm font-medium ${signal.ok ? "text-green-900" : "text-slate-600"}`}>
                    {signal.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-sm text-slate-500 mb-2">{boxes.length} boxes total</div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: boxes.length > 0 ? `${(readyCount / boxes.length) * 100}%` : "0%" }}
                />
              </div>
            </div>

            <Button
              onClick={() => navigate(`/workspace/${id}/box`)}
              disabled={!isReady}
              className="w-full gap-2"
              size="lg"
            >
              Package <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <BoxEditDialog
        box={activeBox}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={async (data) => {
          if (!activeBox) return;
          try {
            await updateBox.mutateAsync({ boxId: activeBox.id, data });
            toast.success("Box updated");
          } catch (e: any) {
            toast.error(e.message ?? "Failed to update box");
          }
        }}
      />
    </div>
  );
}
