import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import {
  Box,
  Users,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  X,
  Pencil,
  Check,
  Sparkles,
  FileText,
  RotateCcw,
  Pin,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  useWorkpack,
  useMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateTitle,
  useShape,
  useBrief,
  useUpdateBrief,
  useAttachments,
  useCreateAttachment,
  useDeleteAttachment,
  usePins,
  useCreatePin,
  useDeletePin,
} from "../../hooks/useWorkpacks";
import { useChat } from "../../hooks/useChat";
import { useIsMobile } from "../../hooks/useIsMobile";
import { InboxBell } from "../components/InboxBell";
import { UsageCapacityBadge } from "../components/UsageCapacityBadge";
import { BottomSheet } from "../components/BottomSheet";
import { DropZone } from "../components/DropZone";
import { StagePills } from "../components/StagePills";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
function hasContent(val?: string | null) {
  if (!val) return false;
  const t = val.trim();
  return t !== "" && t !== "[]" && t !== "null";
}

function displayValue(val?: string | null): string | undefined {
  if (!hasContent(val)) return undefined;
  const t = val!.trim();
  if (t.startsWith("[")) {
    try {
      const arr: string[] = JSON.parse(t);
      return arr.join(" · ");
    } catch { /* fall through */ }
  }
  return t;
}

// -----------------------------------------------------------------------
// Signal state — 4 levels
// -----------------------------------------------------------------------
type SignalState = "missing" | "detected" | "shaping" | "ready";

function getSignalState(value: string | undefined | null, signalOk: boolean): SignalState {
  if (!hasContent(value)) return "missing";

  const text = displayValue(value) ?? "";
  const normalized = text.replace(/\s+/g, " ").trim();
  const wordCount = normalized ? normalized.split(" ").length : 0;
  const charCount = normalized.length;

  // Honest readiness: backend signal alone is not enough.
  // Keep fields in "shaping" longer so the brief feels alive, not prematurely closed.
  if (signalOk && (charCount >= 140 || wordCount >= 22)) return "ready";
  if (charCount >= 45 || wordCount >= 8) return "shaping";
  return "detected";
}

const STATE_CONFIG: Record<SignalState, { label: string; dot: string; badge: string; text: string; border: string; bg: string }> = {
  missing:  { label: "Sin definir", dot: "bg-slate-200",  badge: "text-slate-400 bg-slate-100",          text: "text-slate-300 italic", border: "border-slate-100", bg: "bg-white" },
  detected: { label: "Detectado",   dot: "bg-amber-300",  badge: "text-amber-700 bg-amber-50",           text: "text-slate-500",        border: "border-amber-100", bg: "bg-amber-50/30" },
  shaping:  { label: "Perfilando",  dot: "bg-blue-400",   badge: "text-blue-700 bg-blue-50",             text: "text-slate-600",        border: "border-blue-100",  bg: "bg-blue-50/30" },
  ready:    { label: "Listo",       dot: "bg-green-500",  badge: "text-green-700 bg-green-100",          text: "text-slate-800",        border: "border-green-200", bg: "bg-green-50/40" },
};

type ProjectType = "Software" | "Marketing" | "Architecture" | "Mixed" | "General";

function inferProjectType(raw: string): { label: ProjectType; confidence: "low" | "medium" | "high"; reason: string } {
  const source = (raw || "").toLowerCase();

  const countMatches = (hints: string[]) =>
    hints.reduce((acc, hint) => acc + (source.includes(hint) ? 1 : 0), 0);

  const softwareScore = countMatches([
    "api", "backend", "frontend", "react", "java", "spring", "auth", "database",
    "deployment", "aws", "integration", "service", "module", "software",
    "repository", "github", "endpoint", "platform", "saas"
  ]);

  const marketingScore = countMatches([
    "campaign", "landing", "brand", "behance", "ads", "copy", "cta", "audience",
    "instagram", "email", "lead", "funnel", "creative", "visual", "messaging",
    "marketing"
  ]);

  const architectureScore = countMatches([
    "facade", "render", "material", "site", "floor plan", "circulation", "column",
    "stair", "climate", "municipal", "building", "architecture", "concept board",
    "palette", "lot"
  ]);

  const sorted = [
    { label: "Software" as ProjectType, score: softwareScore, reason: "Detected software/product language" },
    { label: "Marketing" as ProjectType, score: marketingScore, reason: "Detected campaign/brand language" },
    { label: "Architecture" as ProjectType, score: architectureScore, reason: "Detected spatial/building language" },
  ].sort((a, b) => b.score - a.score);

  const top = sorted[0];
  const second = sorted[1];

  if (top.score === 0) {
    return { label: "General", confidence: "low", reason: "Not enough domain-specific signals yet" };
  }

  if (top.score > 0 && second.score > 0 && Math.abs(top.score - second.score) <= 1) {
    return { label: "Mixed", confidence: "medium", reason: "Multiple disciplines are strongly present" };
  }

  return {
    label: top.label,
    confidence: top.score >= 4 ? "high" : top.score >= 2 ? "medium" : "low",
    reason: top.reason,
  };
}

// -----------------------------------------------------------------------
// Signal card (non-edit view + inline edit on click)
// -----------------------------------------------------------------------
function SignalCard({
  label,
  value,
  placeholder,
  state,
  onSave,
  readOnly = false,
}: {
  label: string;
  value?: string | null;
  placeholder: string;
  state: SignalState;
  onSave: (val: string) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cfg = STATE_CONFIG[state];

  useEffect(() => { setDraft(value ?? ""); }, [value]);
  useEffect(() => { if (editing) textareaRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== (value ?? "").trim()) onSave(draft.trim());
  };

  return (
    <div className={`rounded-xl border transition-all group ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        <div className={`size-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="text-xs font-semibold text-slate-600 flex-1">{label}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
        {!readOnly && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-slate-500 transition-all"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        {!readOnly && editing ? (
          <div>
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
                if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
              }}
              className="text-sm resize-none min-h-[56px] border-0 p-0 focus-visible:ring-0 bg-transparent"
              rows={2}
            />
            <div className="flex gap-2 mt-1.5">
              <button onClick={commit} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Check className="size-3" /> Save
              </button>
              <button onClick={() => { setDraft(value ?? ""); setEditing(false); }} className="text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm leading-relaxed ${readOnly ? "cursor-default" : "cursor-text"} ${cfg.text}`}
            onClick={() => !readOnly && setEditing(true)}
          >
            {displayValue(value) ?? placeholder}
          </p>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Inline Yes/No confirmation card
// -----------------------------------------------------------------------
function ConfirmationCard({ message, onYes, onNo }: { message: string; onYes: () => void; onNo: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-xl p-3 mx-4">
      <p className="text-sm text-slate-800 mb-3">{message}</p>
      <div className="flex gap-2">
        <button onClick={onYes}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
          Yes
        </button>
        <button onClick={onNo}
          className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors">
          No
        </button>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------
export function WorkspaceDefine() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: workpack } = useWorkpack(id!);
  const { data: members = [] } = useMembers(id!);
  const inviteMember = useInviteMember(id!);
  const removeMember = useRemoveMember(id!);
  const updateTitle = useUpdateTitle(id!);
  const { data: brief } = useBrief(id!);
  const updateBrief = useUpdateBrief(id!);
  const shape = useShape(id!);
  const { data: attachments = [] } = useAttachments(id!);
  const createAttachment = useCreateAttachment(id!);
  const deleteAttachment = useDeleteAttachment(id!);
  const { data: pins = [] } = usePins(id!);
  const createPin = useCreatePin(id!);
  const deletePin = useDeletePin(id!);

  const { messages, send, reset, isPending, proceedSuggested, clearProceed } = useChat(id!);

  const [chatInput, setChatInput] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinExpandedId, setPinExpandedId] = useState<string | null>(null);
  const [chatHeight, setChatHeight] = useState(172);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [materialSheetOpen, setMaterialSheetOpen] = useState(false);
  const [pinsSheetOpen, setPinsSheetOpen] = useState(false);
  const autoSentRef = useRef(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const isResizingChat = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  const handleChatResizeStart = (e: React.MouseEvent) => {
    isResizingChat.current = true;
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = chatHeight;
    const onMove = (ev: MouseEvent) => {
      if (!isResizingChat.current) return;
      const delta = resizeStartY.current - ev.clientY;
      setChatHeight(Math.max(120, Math.min(500, resizeStartHeight.current + delta)));
    };
    const onUp = () => {
      isResizingChat.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const isReshape = workpack?.stage === "SHAPE" || workpack?.stage === "BOX";

  const projectTypeInput = [
    workpack?.sourceContent ?? "",
    brief?.title ?? "",
    brief?.mainIdea ?? "",
    brief?.objective ?? "",
    brief?.actors ?? "",
    brief?.scopeIncludes ?? "",
    brief?.constraints ?? "",
    brief?.successCriteria ?? "",
    ...pins.map((p) => p.content ?? ""),
    ...attachments.map((a) => [a.fileName, a.contentText, a.visualContext].filter(Boolean).join(" ")),
  ].join(" ");

  const projectType = inferProjectType(projectTypeInput);

  // Readiness signals
  const rs = brief?.readinessSignals;
  const signalItems = [
    {
      key: "objective",
      label: "Intención",
      placeholder: "Qué se debe construir y por qué",
      value: brief?.objective || brief?.mainIdea,
      signalOk: !!(rs?.intentClear),
    },
    {
      key: "actors",
      label: "Actores",
      placeholder: "Quién usará o se beneficiará de esto",
      value: brief?.actors,
      signalOk: !!(rs?.actorDefined || rs?.actorInferred),
    },
    {
      key: "scopeIncludes",
      label: "Alcance",
      placeholder: "Qué está incluido",
      value: brief?.scopeIncludes,
      signalOk: !!(rs?.scopeDefined),
    },
    {
      key: "constraints",
      label: "Restricciones",
      placeholder: "Límites técnicos o de negocio",
      value: brief?.constraints,
      signalOk: !!(rs?.constraintsDefined),
    },
    {
      key: "successCriteria",
      label: "Criterios de éxito",
      placeholder: "Cómo sabemos que está listo",
      value: brief?.successCriteria,
      signalOk: !!(rs?.successCriteriaDefined),
    },
  ].map((s) => ({ ...s, state: getSignalState(s.value, s.signalOk) }));

  const readyCount   = signalItems.filter((s) => s.state === "ready").length;
  const shapingCount = signalItems.filter((s) => s.state === "shaping").length;
  const overallReady = readyCount === 5;
  const canShape     = overallReady;  // hard gate — all signals must be ready

  // Visible chat messages
  const visibleMessages = messages.filter((m) => m.role !== "system");
  const lastAssistant   = [...visibleMessages].reverse().find((m) => m.role === "assistant");

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length, isPending]);

  // Auto-send initial message
  useEffect(() => {
    const initialMessage = (location.state as any)?.initialMessage as string | undefined;
    if (!initialMessage || autoSentRef.current || isPending) return;
    autoSentRef.current = true;
    send(initialMessage);
  }, [location.state, send, isPending]);

  const handleChatSubmit = () => {
    if (!chatInput.trim() || isPending) return;
    send(chatInput.trim());
    setChatInput("");
    chatInputRef.current?.focus();
  };

  const handleProceedYes = async () => {
    clearProceed();
    try {
      await shape.mutateAsync();
    } catch { /* handled in shape */ }
    navigate(`/workspace/${id}/shape`);
  };

  const handleShape = async () => {
    try {
      await shape.mutateAsync();
      navigate(`/workspace/${id}/shape`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate shape");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim() });
      setInviteEmail("");
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
    } catch (e: any) { toast.error(e.message ?? "Failed to invite"); }
  };

  const saveTitle = async () => {
    if (!titleValue.trim() || titleValue.trim() === workpack?.title) { setEditingTitle(false); return; }
    try { await updateTitle.mutateAsync(titleValue.trim()); setEditingTitle(false); }
    catch (e: any) { toast.error(e.message ?? "Failed to update title"); }
  };

  const saveBriefField = async (field: string, value: string) => {
    try { await updateBrief.mutateAsync({ [field]: value } as any); }
    catch (e: any) { toast.error(e.message ?? "Failed to save"); }
  };

  const handleAddPin = async () => {
    if (!newPin.trim()) return;
    const content = newPin.trim();
    try {
      await createPin.mutateAsync({ content });
      setNewPin("");
      send(`I pinned a note: "${content}"`);
    } catch (e: any) { toast.error(e.message ?? "Failed to add pin"); }
  };

  const handlePinToBrief = async (pinContent: string, field: string) => {
    try {
      await updateBrief.mutateAsync({ [field]: pinContent } as any);
      toast.success("Added to brief");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  // ── Mobile layout ──────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

      {/* Compact mobile header */}
      <header className="bg-white border-b flex-shrink-0 px-3 py-2.5 flex items-center gap-2">
        <Link to="/dashboard">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="size-4 text-slate-600" />
          </button>
        </Link>
        <Box className="size-4 text-blue-600 flex-shrink-0" />
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
          <button
            onClick={() => setMaterialSheetOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors relative"
          >
            <FileText className="size-4 text-slate-500" />
            {attachments.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setPinsSheetOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors relative"
          >
            <Pin className="size-4 text-slate-500" />
            {pins.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400" />
            )}
          </button>
          <UsageCapacityBadge />
          <InboxBell />
        </div>
      </header>

      {/* Stage pills */}
      <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
        <StagePills workpackId={id!} current="define" workpackStage={workpack?.stage} />
      </div>

      {/* Generating banner */}
      {shape.isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-800 text-xs flex-shrink-0">
          <Loader2 className="size-3.5 animate-spin" /> Generando forma…
        </div>
      )}

      {/* Scrollable main — pb-20 for fixed chat bar */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="px-4 pt-4">

          {/* Brief header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <FileText className="size-3.5 text-blue-600" />
                <h2 className="font-semibold text-slate-900 text-base">Brief en vivo</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                {readyCount === 0 && shapingCount === 0
                  ? "Agrega contexto para dar forma al brief"
                  : overallReady
                  ? "Todas las señales completas"
                  : `${readyCount} listos · ${shapingCount} perfilando · ${5 - readyCount - shapingCount} incompletos`}
              </p>
            </div>
            {(() => {
              if (overallReady) return (
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg px-2.5 py-1 flex-shrink-0">
                  <Check className="size-3" /> Listo
                </div>
              );
              if (readyCount > 0 || shapingCount > 0) {
                const pct = Math.round(((readyCount * 2 + shapingCount) / 10) * 100);
                return (
                  <div className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 flex-shrink-0">
                    <Circle className="size-3" /> {pct}%
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 flex-shrink-0">
                  <Circle className="size-3" /> Sin iniciar
                </div>
              );
            })()}
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mb-4">
            {signalItems.map((s) => (
              <div
                key={s.key}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  s.state === "ready"    ? "bg-green-500" :
                  s.state === "shaping"  ? "bg-blue-400" :
                  s.state === "detected" ? "bg-amber-300" :
                  "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Signal cards */}
          <div className="space-y-3">
            {signalItems.map((s) => (
              <SignalCard
                key={s.key}
                label={s.label}
                value={s.value}
                placeholder={s.placeholder}
                state={s.state}
                onSave={(val) => saveBriefField(s.key, val)}
                readOnly={isReshape}
              />
            ))}
          </div>

          {/* Last assistant message */}
          {lastAssistant && (
            <motion.div
              key={lastAssistant.content.slice(0, 20)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="size-3 text-blue-500" />
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Asistente</span>
              </div>
              <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-0.5 prose-p:text-sm">
                <ReactMarkdown>{lastAssistant.content}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {isPending && (
            <div className="mt-4 flex items-center gap-1 px-1">
              <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          {proceedSuggested && !isPending && (
            <div className="mt-4">
              <ConfirmationCard
                message="¿Listo para generar la forma?"
                onYes={handleProceedYes}
                onNo={() => send("I want to refine a bit more before generating")}
              />
            </div>
          )}

          {/* Generate shape */}
          <div className="mt-6 pb-2">
            {isReshape ? (
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-400">Brief bloqueado — workpack en etapa Forma.</p>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/workspace/${id}/shape`)}>
                  Ir a Forma <ArrowRight className="size-3.5" />
                </Button>
              </div>
            ) : (
              <>
                {!canShape && (
                  <p className="text-xs text-slate-400 text-center mb-3">
                    Completa las 5 señales antes de generar la forma
                  </p>
                )}
                <Button
                  onClick={handleShape}
                  disabled={shape.isPending || !canShape}
                  className="w-full gap-2"
                  size="lg"
                  variant={overallReady ? "default" : "outline"}
                >
                  {shape.isPending
                    ? <><Loader2 className="size-4 animate-spin" /> Generando…</>
                    : <>{overallReady ? "Generar forma" : `Generar forma (${readyCount}/5)`} <ArrowRight className="size-4" /></>
                  }
                </Button>
              </>
            )}
          </div>

          <div ref={chatBottomRef} />
        </div>
      </div>

      {/* Fixed bottom chat input */}
      {!isReshape && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-3 py-2.5 flex gap-2 items-end z-30 shadow-lg">
          <Textarea
            ref={chatInputRef}
            placeholder="Agrega contexto o responde…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); }
            }}
            className="resize-none min-h-[36px] max-h-[96px] text-sm flex-1"
            rows={1}
            disabled={isPending}
          />
          <Button
            onClick={handleChatSubmit}
            disabled={!chatInput.trim() || isPending}
            size="icon"
            className="size-9 flex-shrink-0"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </Button>
        </div>
      )}

      {/* Material bottom sheet */}
      <BottomSheet open={materialSheetOpen} onClose={() => setMaterialSheetOpen(false)} title="Material capturado">
        <div className="p-4 space-y-4">
          {workpack?.sourceContent && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Idea original</p>
              <p className="text-xs text-slate-600 leading-relaxed">{workpack.sourceContent}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Archivos</p>
            <DropZone
              attachments={attachments}
              workpackId={id!}
              onUpload={(data) => createAttachment.mutateAsync(data)}
              onDelete={(attachmentId) => deleteAttachment.mutate(attachmentId)}
            />
          </div>
        </div>
      </BottomSheet>

      {/* Pins bottom sheet */}
      <BottomSheet open={pinsSheetOpen} onClose={() => setPinsSheetOpen(false)} title="Pins">
        <div className="p-3 space-y-3">
          <div className="flex gap-1.5">
            <Input
              placeholder="Agregar nota…"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddPin(); }}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="ghost" onClick={handleAddPin} disabled={!newPin.trim() || createPin.isPending} className="h-8 px-2 flex-shrink-0">
              <Check className="size-3" />
            </Button>
          </div>
          {pins.length === 0 && (
            <p className="text-xs text-slate-300 text-center py-4">Sin notas — agrega ideas o apuntes sueltos aquí</p>
          )}
          {pins.map((pin) => (
            <div key={pin.id} className="group bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-start gap-2 px-2.5 py-2">
                <div className="size-1.5 rounded-full bg-amber-300 flex-shrink-0 mt-1.5" />
                <p
                  className="text-xs text-slate-600 flex-1 leading-relaxed cursor-pointer"
                  onClick={() => setPinExpandedId(pin.id === pinExpandedId ? null : pin.id)}
                >
                  {pin.content}
                </p>
                <button onClick={() => deletePin.mutate(pin.id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="size-3" />
                </button>
              </div>
              <AnimatePresence>
                {pin.id === pinExpandedId && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-2.5 pb-2 flex flex-wrap gap-1">
                      <p className="text-[10px] text-slate-400 w-full mb-0.5">Usar como:</p>
                      {[
                        { label: "restricción", field: "constraints" },
                        { label: "alcance",     field: "scopeIncludes" },
                        { label: "éxito",       field: "successCriteria" },
                      ].map((action) => (
                        <button
                          key={action.field}
                          onClick={() => { handlePinToBrief(pin.content, action.field); setPinExpandedId(null); setPinsSheetOpen(false); }}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );

  // ── Desktop layout ──────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b flex-shrink-0 z-10">
        <div className="px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" /> Volver
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Box className="size-4 text-blue-600" />
              {editingTitle ? (
                <Input autoFocus value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                  className="h-7 text-sm font-semibold w-48" />
              ) : (
                <span className="font-semibold cursor-pointer hover:text-blue-600 flex items-center gap-1 group text-sm"
                  onClick={() => { setTitleValue(workpack?.title ?? ""); setEditingTitle(true); }}>
                  {workpack?.title ?? "Workspace"}
                  <Pencil className="size-3 opacity-0 group-hover:opacity-40" />
                </span>
              )}
            </div>
          </div>

          <StagePills workpackId={id!} current="define" workpackStage={workpack?.stage} />

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
                      <Input placeholder="colega@ejemplo.com" value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }} />
                      <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                        {inviteMember.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Invitar
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
                                <button onClick={() => removeMember.mutate(m.userId)}
                                  className="text-slate-300 hover:text-red-500 transition-colors">
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
      </header>

      {/* Generating banner */}
      {shape.isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm flex-shrink-0">
          <Loader2 className="size-4 animate-spin" /> Generando forma — esto puede tardar un momento…
        </div>
      )}

      {/* Main — 3 columns, chat inside center */}
      <div className="flex-1 flex overflow-hidden min-h-0">

          {/* LEFT — Captured material */}
          <div className="w-56 bg-white border-r flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b flex-shrink-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="size-3.5" /> Material capturado
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Archivos, imágenes y referencias</p>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-3">
              {workpack?.sourceContent && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Idea original</p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-6">{workpack.sourceContent}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Archivos</p>
                <DropZone
                  attachments={attachments}
                  workpackId={id!}
                  onUpload={(data) => createAttachment.mutateAsync(data)}
                  onDelete={(attachmentId) => deleteAttachment.mutate(attachmentId)}
                />
              </div>
            </div>
          </div>

          {/* CENTER — Live Brief + Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="max-w-2xl mx-auto px-6 py-6">

              {/* Brief header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <FileText className="size-4 text-blue-600" />
                    <h2 className="font-semibold text-slate-900 text-lg">Brief en vivo</h2>
                  </div>
                  <p className="text-xs text-slate-400 ml-6">
                    {readyCount === 0 && shapingCount === 0
                      ? "Agrega material, notas o contexto para empezar a dar forma al brief"
                      : overallReady
                      ? "Todas las señales están completas — listo para dar forma"
                      : `${readyCount} listos · ${shapingCount} perfilando · ${5 - readyCount - shapingCount} incompletos`}
                  </p>
                </div>
                {/* Overall status badge — always visible, honest */}
                {(() => {
                  if (overallReady) return (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex-shrink-0">
                      <Check className="size-3.5" /> Listo
                    </div>
                  );
                  if (readyCount > 0 || shapingCount > 0) {
                    const pct = Math.round(((readyCount * 2 + shapingCount) / 10) * 100);
                    const isShaping = shapingCount > 0 || readyCount > 0;
                    return (
                      <div className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 flex-shrink-0 ${
                        isShaping ? "text-blue-600 bg-blue-50 border border-blue-200" : "text-amber-600 bg-amber-50 border border-amber-200"
                      }`}>
                        <Circle className="size-3" />
                        {pct}% shaped
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex-shrink-0">
                      <Circle className="size-3" /> Sin iniciar
                    </div>
                  );
                })()}
              </div>

              {/* Project type */}
              <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Project type</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{projectType.label}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        projectType.confidence === "high"
                          ? "bg-green-100 text-green-700"
                          : projectType.confidence === "medium"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {projectType.confidence}
                      </span>
                    </div>
                  </div>
                  <div className="max-w-[220px] text-right">
                    <p className="text-[11px] text-slate-500 leading-relaxed">{projectType.reason}</p>
                  </div>
                </div>
              </div>

              {/* Progress bar — segmented with 4 color zones */}
              <div className="flex gap-1 mb-5">
                {signalItems.map((s) => (
                  <div
                    key={s.key}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      s.state === "ready"    ? "bg-green-500" :
                      s.state === "shaping"  ? "bg-blue-400" :
                      s.state === "detected" ? "bg-amber-300" :
                      "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              {/* Signal cards */}
              <div className="space-y-3">
                {signalItems.map((s) => (
                  <SignalCard
                    key={s.key}
                    label={s.label}
                    value={s.value}
                    placeholder={s.placeholder}
                    state={s.state}
                    onSave={(val) => saveBriefField(s.key, val)}
                    readOnly={isReshape}
                  />
                ))}
              </div>

              {/* Generate Shape / locked notice */}
              <div className="mt-8 pt-6 border-t">
                {isReshape ? (
                  <div className="text-center space-y-3">
                    <p className="text-xs text-slate-400">
                      Este brief está bloqueado — el workpack está en la etapa Forma.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/workspace/${id}/shape`)}
                    >
                      Ir a Forma <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    {!canShape && (
                      <p className="text-xs text-slate-400 text-center mb-3">
                        Completa las 5 señales antes de generar la forma
                      </p>
                    )}
                    <Button
                      onClick={handleShape}
                      disabled={shape.isPending || !canShape}
                      className="w-full gap-2"
                      size="lg"
                      variant={overallReady ? "default" : "outline"}
                    >
                      {shape.isPending
                        ? <><Loader2 className="size-4 animate-spin" /> Generando…</>
                        : <>{overallReady ? "Generar forma" : `Generar forma (${readyCount}/5)`} <ArrowRight className="size-4" /></>
                      }
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* END brief scroll */}

          {/* BOTTOM — Assistant guide strip (hidden in read-only mode) */}
          {!isReshape && (<>
          <div
            onMouseDown={handleChatResizeStart}
            className="h-1.5 border-t cursor-row-resize hover:bg-blue-100 active:bg-blue-200 transition-colors flex-shrink-0 group"
            title="Drag to resize"
          >
            <div className="mx-auto w-8 h-0.5 rounded-full bg-slate-200 group-hover:bg-blue-300 mt-0.5 transition-colors" />
          </div>
          <div className="bg-slate-50/80 flex flex-col flex-shrink-0 border-t border-slate-100" style={{ height: chatHeight }}>

            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-blue-500" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Asistente</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showHistory ? "ocultar historial" : "historial"}
                </button>
                <button onClick={() => reset()} className="p-1 text-slate-300 hover:text-slate-500 transition-colors" title="Reset">
                  <RotateCcw className="size-3" />
                </button>
              </div>
            </div>

            {/* Assistant content */}
            <div className="flex-1 overflow-auto px-4 py-2.5 space-y-2.5">

              {showHistory && visibleMessages.slice(0, -2).map((m, i) => (
                <div key={i} className={`text-xs leading-relaxed ${m.role === "user" ? "text-slate-400 text-right" : "text-slate-500"}`}>
                  {m.content}
                </div>
              ))}

              {lastAssistant && (
                <motion.div
                  key={lastAssistant.content.slice(0, 20)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-100 rounded-xl p-3 max-w-2xl"
                >
                  <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-0.5 prose-p:text-sm">
                    <ReactMarkdown>{lastAssistant.content}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {overallReady && !isPending && (
                <ConfirmationCard
                  message="¿Listo para generar la forma?"
                  onYes={handleProceedYes}
                  onNo={() => send("I want to refine a bit more before generating")}
                />
              )}

              {isPending && (
                <div className="flex items-center gap-1 px-1">
                  <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              )}

              {visibleMessages.length === 0 && !isPending && (
                <p className="text-xs text-slate-400 pt-2">
                  Agrega archivos, notas o una respuesta breve. El brief se consolidará a medida que las señales se fortalezcan.
                </p>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="border-t px-4 py-2.5 flex-shrink-0 flex gap-2 items-end">
              <Textarea
                ref={chatInputRef}
                placeholder="Agrega contexto o responde la siguiente pregunta…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); }
                }}
                className="resize-none min-h-[36px] max-h-[72px] text-sm flex-1"
                rows={1}
                disabled={isPending}
              />
              <Button onClick={handleChatSubmit} disabled={!chatInput.trim() || isPending}
                size="icon" className="size-9 flex-shrink-0">
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              </Button>
            </div>
          </div>
          </>)}
          {/* END center column */}
          </div>

          {/* RIGHT — Pins */}
          <div className="w-60 bg-white border-l flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b flex-shrink-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Pin className="size-3.5" /> Pins
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Ideas, recordatorios, notas sueltas</p>
            </div>

            {/* Pin input */}
            <div className="px-3 py-2.5 border-b flex-shrink-0">
              <div className="flex gap-1.5">
                <Input
                  placeholder="Agregar nota…"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddPin(); }}
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddPin}
                  disabled={!newPin.trim() || createPin.isPending}
                  className="h-7 px-2 flex-shrink-0"
                >
                  <Check className="size-3" />
                </Button>
              </div>
            </div>

            {/* Pin list */}
            <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
              {pins.length === 0 && (
                <p className="text-[11px] text-slate-300 text-center pt-4">
                  Sin notas — agrega ideas o apuntes sueltos aquí
                </p>
              )}
              {pins.map((pin) => (
                <div key={pin.id} className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-lg transition-all">
                  <div className="flex items-start gap-2 px-2.5 py-2">
                    <div className="size-1.5 rounded-full bg-amber-300 flex-shrink-0 mt-1.5" />
                    <p
                      className="text-xs text-slate-600 flex-1 leading-relaxed cursor-pointer"
                      onClick={() => setPinExpandedId(pin.id === pinExpandedId ? null : pin.id)}
                    >
                      {pin.content}
                    </p>
                    <button
                      onClick={() => deletePin.mutate(pin.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <X className="size-3" />
                    </button>
                  </div>

                  {/* Expanded: convert actions */}
                  <AnimatePresence>
                    {pin.id === pinExpandedId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-2.5 pb-2 flex flex-wrap gap-1">
                          <p className="text-[10px] text-slate-400 w-full mb-0.5">Use as:</p>
                          {[
                            { label: "constraint", field: "constraints" },
                            { label: "scope",      field: "scopeIncludes" },
                            { label: "success",    field: "successCriteria" },
                          ].map((action) => (
                            <button
                              key={action.field}
                              onClick={() => { handlePinToBrief(pin.content, action.field); setPinExpandedId(null); }}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

        </div>

    </div>
  );
}
