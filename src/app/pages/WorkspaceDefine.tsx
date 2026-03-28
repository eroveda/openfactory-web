import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { motion, AnimatePresence } from "motion/react";
import {
  Box,
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  X,
  Pencil,
  RotateCcw,
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
  useAttachments,
  useCreateAttachment,
  useDeleteAttachment,
} from "../../hooks/useWorkpacks";
import { useChat } from "../../hooks/useChat";
import { InboxBell } from "../components/InboxBell";
import { InfoTooltip } from "../components/InfoTooltip";
import { DropZone } from "../components/DropZone";
import { Skeleton } from "../components/ui/skeleton";
import { StagePills } from "../components/StagePills";
import { toast } from "sonner";

// -----------------------------------------------------------------------
// Generate Shape button
// -----------------------------------------------------------------------
function GenerateShapeButton({
  onClick,
  isPending,
  isReshape,
}: {
  onClick: () => void;
  isPending: boolean;
  isReshape?: boolean;
}) {
  return (
    <div className="space-y-2">
      {isReshape && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Re-running will overwrite existing boxes and plan.
        </p>
      )}
      <Button onClick={onClick} disabled={isPending} className="w-full gap-2" size="lg">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Generating…
          </>
        ) : isReshape ? (
          <>Re-generate Shape <ArrowRight className="size-4" /></>
        ) : (
          <>Generate Shape <ArrowRight className="size-4" /></>
        )}
      </Button>
    </div>
  );
}

// -----------------------------------------------------------------------
// Chat message bubble
// -----------------------------------------------------------------------
function ChatBubble({ role, content }: { role: "user" | "assistant" | "system"; content: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="size-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-slate-800 text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
        }`}
      >
        {content}
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

  const { data: workpack } = useWorkpack(id!);
  const { data: members = [] } = useMembers(id!);
  const inviteMember = useInviteMember(id!);
  const removeMember = useRemoveMember(id!);
  const updateTitle = useUpdateTitle(id!);
  const { data: brief } = useBrief(id!);
  const shape = useShape(id!);
  const { data: attachments = [] } = useAttachments(id!);
  const createAttachment = useCreateAttachment(id!);
  const deleteAttachment = useDeleteAttachment(id!);

  const { messages, send, reset, isPending } = useChat(id!);

  const [input, setInput] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReshape = workpack?.stage === "SHAPE" || workpack?.stage === "BOX";

  // Signals from last pipeline run
  const signals = brief?.readinessSignals;
  const allSignalsClear = signals
    ? Object.values(signals).every(Boolean)
    : false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isPending]);

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    send(input.trim());
    setInput("");
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

  const handleShape = async () => {
    try {
      await shape.mutateAsync();
      navigate(`/workspace/${id}/shape`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate shape");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" /> Back
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <Box className="size-5 text-blue-600" />
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
                    className="h-7 text-sm font-semibold w-48"
                  />
                ) : (
                  <span
                    className="font-semibold cursor-pointer hover:text-blue-600 flex items-center gap-1 group"
                    onClick={() => {
                      setTitleValue(workpack?.title ?? "");
                      setEditingTitle(true);
                    }}
                  >
                    {workpack?.title ?? "Workspace"}
                    <Pencil className="size-3 opacity-0 group-hover:opacity-40" />
                  </span>
                )}
              </div>
            </div>

            <StagePills workpackId={id!} current="define" />

            <div className="flex items-center gap-3">
              <InboxBell />
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="size-4" /> Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share this workspace</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Invite by email</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
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
                          {members.map((m) => (
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

      {/* Generating banner */}
      {shape.isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 text-amber-800 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Generating shape — this may take a moment…
        </div>
      )}

      {/* Main */}
      <div className="flex h-[calc(100vh-73px)]">

        {/* Center — Chat */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* Messages */}
          <div className="flex-1 overflow-auto px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <AnimatePresence initial={false}>
                {messages
                  .filter((m) => m.role !== "system")
                  .map((m, i) => (
                    <ChatBubble key={i} role={m.role} content={m.content} />
                  ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="size-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t bg-white px-6 py-4">
            <div className="max-w-2xl mx-auto flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                placeholder="Escribí tu mensaje…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="resize-none min-h-[44px] max-h-[160px] text-sm"
                rows={1}
                disabled={isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isPending}
                size="icon"
                className="flex-shrink-0 size-10"
              >
                {isPending
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Send className="size-4" />
                }
              </Button>
            </div>
            <div className="max-w-2xl mx-auto mt-2 flex justify-between items-center">
              <p className="text-xs text-slate-400">Enter para enviar · Shift+Enter para nueva línea</p>
              <button
                onClick={reset}
                className="text-xs text-slate-300 hover:text-slate-500 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="size-3" /> Reiniciar chat
              </button>
            </div>
          </div>
        </div>

        {/* Right — Readiness */}
        <div className="w-80 bg-white border-l p-6 overflow-auto flex flex-col">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold">Readiness</h2>
              <InfoTooltip
                title="What is readiness?"
                body="Readiness signals show whether the work is clear enough to move forward. They do not judge the business idea — they indicate whether the project is defined well enough for shaping and handoff."
                footer="Readiness helps you move with less guesswork."
              />
            </div>

            {/* LLM signals from last pipeline run */}
            {signals ? (
              <div className="space-y-2 mb-6">
                {[
                  { label: "Intent clear",      ok: signals.intentClear },
                  { label: "Actor defined",     ok: signals.actorDefined },
                  { label: "Scope defined",     ok: signals.scopeDefined },
                  { label: "Constraints",       ok: signals.constraintsDefined },
                  { label: "Success criteria",  ok: signals.successCriteriaDefined },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {s.ok
                      ? <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
                      : <AlertCircle className="size-4 text-slate-300 flex-shrink-0" />
                    }
                    <span className={`text-sm ${s.ok ? "text-green-900 font-medium" : "text-slate-500"}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-slate-300 mt-1">From last shape run</p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {["Intent clear", "Actor defined", "Scope defined", "Constraints", "Success criteria"].map(
                  (label) => (
                    <div key={label} className="flex items-center gap-2">
                      <AlertCircle className="size-4 text-slate-200 flex-shrink-0" />
                      <span className="text-sm text-slate-400">{label}</span>
                    </div>
                  )
                )}
                <p className="text-[10px] text-slate-300 mt-1">Run shape to analyze</p>
              </div>
            )}

            {allSignalsClear && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                <Check className="size-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-800 font-medium">All signals clear — ready to shape.</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-slate-700">Files</h3>
              <InfoTooltip
                title="Attached files"
                body="Text files (.txt, .md, .csv) are fed directly into the pipeline as context. Images are stored but not yet processed by the AI."
                footer="Images will be processed in a future release."
              />
            </div>
            <DropZone
              attachments={attachments}
              workpackId={id!}
              onUpload={(data) => createAttachment.mutateAsync(data)}
              onDelete={(attachmentId) => deleteAttachment.mutate(attachmentId)}
            />
          </div>

          <div className="pt-4 border-t">
            <GenerateShapeButton
              onClick={handleShape}
              isPending={shape.isPending}
              isReshape={isReshape}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
