import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import {
  Box,
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { useWorkpack, usePins, useCreatePin, useDeletePin, useMembers, useInviteMember, useShape } from "../../hooks/useWorkpacks";
import { InboxBell } from "../components/InboxBell";
import { toast } from "sonner";

// -----------------------------------------------------------------------
// Wizard questions — cada respuesta se convierte en un pin tipado
// -----------------------------------------------------------------------
const QUESTIONS = [
  {
    step: 1,
    label: "Main intent",
    pinType: "INTENT",
    question: "What is the main goal of this workpack?",
    hint: "Describe the outcome you want to achieve.",
    color: "bg-blue-50 border-blue-200 text-blue-900",
    dot: "bg-blue-500",
  },
  {
    step: 2,
    label: "Actor",
    pinType: "ACTOR",
    question: "Who will execute this? Who is it for?",
    hint: "A person, a team, an AI agent, a system...",
    color: "bg-green-50 border-green-200 text-green-900",
    dot: "bg-green-500",
  },
  {
    step: 3,
    label: "Out of scope",
    pinType: "OUT_OF_SCOPE",
    question: "What is explicitly out of scope?",
    hint: "What should NOT be included or solved here.",
    color: "bg-amber-50 border-amber-200 text-amber-900",
    dot: "bg-amber-500",
  },
  {
    step: 4,
    label: "Constraints",
    pinType: "SCOPE_CONSTRAINT",
    question: "Any important constraints? (time, tech, budget...)",
    hint: "Boundaries the executor must respect.",
    color: "bg-purple-50 border-purple-200 text-purple-900",
    dot: "bg-purple-500",
  },
  {
    step: 5,
    label: "Domain context",
    pinType: "DOMAIN_FACT",
    question: "Any key domain context the executor should know?",
    hint: "Background facts, existing systems, prior art...",
    color: "bg-rose-50 border-rose-200 text-rose-900",
    dot: "bg-rose-500",
  },
] as const;

const MIN_TO_SHAPE = 3;

// -----------------------------------------------------------------------
// Helper: Generate Shape button (shared)
// -----------------------------------------------------------------------
function GenerateShapeButton({ onClick, isPending }: { onClick: () => void; isPending: boolean }) {
  return (
    <Button onClick={onClick} disabled={isPending} className="w-full gap-2" size="lg">
      {isPending
        ? <><Loader2 className="size-4 animate-spin" /> Generating…</>
        : <>Generate Shape <ArrowRight className="size-4" /></>
      }
    </Button>
  );
}

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------
export function WorkspaceDefine() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: workpack } = useWorkpack(id!);
  const { data: pins = [] } = usePins(id!);
  const createPin = useCreatePin(id!);
  const deletePin = useDeletePin(id!);
  const { data: members = [] } = useMembers(id!);
  const inviteMember = useInviteMember(id!);
  const shape = useShape(id!);

  const [answer, setAnswer] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraText, setExtraText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Current step = number of pins already answered (capped at questions length)
  const answeredCount = Math.min(pins.length, QUESTIONS.length);
  const currentQ = answeredCount < QUESTIONS.length ? QUESTIONS[answeredCount] : null;
  const isComplete = answeredCount >= QUESTIONS.length;
  const canShape = answeredCount >= MIN_TO_SHAPE;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pins.length]);

  const handleAnswer = async () => {
    if (!answer.trim() || !currentQ) return;
    try {
      await createPin.mutateAsync({ content: answer.trim(), type: currentQ.pinType });
      setAnswer("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save answer");
    }
  };

  const handleAddExtra = async () => {
    if (!extraText.trim()) return;
    try {
      await createPin.mutateAsync({ content: extraText.trim(), type: "DOMAIN_FACT" });
      setExtraText("");
      setExtraOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add context");
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

  const handleShape = async () => {
    try {
      await shape.mutateAsync();
      navigate(`/workspace/${id}/shape`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate shape");
    }
  };

  const readinessSignals = QUESTIONS.map((q, i) => ({
    label: q.label,
    status: i < answeredCount ? "complete" : "incomplete",
  }));

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
                <span className="font-semibold">{workpack?.title ?? "Workspace"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-amber-500" /> Raw / Define
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-gray-300" /> Shape
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-gray-300" /> Box
              </Badge>
            </div>

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
                              <span className="text-slate-500 text-xs">{m.role}</span>
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

        {/* Center — Conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-2xl mx-auto">

              {/* Intro */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold mb-1">Raw / Define</h1>
                <p className="text-slate-500 text-sm">
                  Answer a few questions to define your idea. Each answer becomes a context signal for the AI.
                </p>
              </div>

              {/* Answered Q&A thread */}
              <div className="space-y-4 mb-6">
                <AnimatePresence>
                  {pins.slice(0, QUESTIONS.length).map((pin, i) => {
                    const q = QUESTIONS[i];
                    if (!q) return null;
                    return (
                      <motion.div
                        key={pin.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        {/* Question bubble */}
                        <div className="flex items-start gap-3">
                          <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 ${q.dot}`}>
                            {i + 1}
                          </div>
                          <p className="text-sm text-slate-500 pt-0.5">{q.question}</p>
                        </div>
                        {/* Answer bubble */}
                        <div className={`ml-9 rounded-lg border p-3 flex items-start justify-between gap-2 ${q.color}`}>
                          <p className="text-sm flex-1">{pin.content}</p>
                          <button
                            onClick={() => deletePin.mutate(pin.id)}
                            className="opacity-40 hover:opacity-100 flex-shrink-0"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Current question input */}
              {!isComplete && currentQ && !shape.isPending && (
                <motion.div
                  key={currentQ.step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 ${currentQ.dot}`}>
                      {currentQ.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{currentQ.question}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{currentQ.hint}</p>
                    </div>
                  </div>
                  <div className="ml-9 flex gap-2">
                    <Textarea
                      autoFocus
                      placeholder="Type your answer…"
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnswer(); } }}
                      className="min-h-[80px] resize-none"
                    />
                    <Button
                      onClick={handleAnswer}
                      disabled={!answer.trim() || createPin.isPending}
                      className="self-end"
                    >
                      {createPin.isPending
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Send className="size-4" />
                      }
                    </Button>
                  </div>
                  {answeredCount >= MIN_TO_SHAPE && (
                    <p className="ml-9 text-xs text-slate-400">
                      You can skip the remaining questions and generate the shape now.
                    </p>
                  )}
                </motion.div>
              )}

              {/* All done — extra context */}
              {(isComplete || (canShape && !currentQ)) && !shape.isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <Check className="size-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800 font-medium">
                      Context complete — ready to generate the shape.
                    </p>
                  </div>

                  {/* Extra free-form pins */}
                  {pins.length > QUESTIONS.length && (
                    <div className="space-y-2 mb-4">
                      {pins.slice(QUESTIONS.length).map(pin => (
                        <div key={pin.id} className="flex items-start justify-between gap-2 bg-slate-100 rounded-lg p-3 text-sm text-slate-700">
                          <p className="flex-1">{pin.content}</p>
                          <button onClick={() => deletePin.mutate(pin.id)} className="opacity-40 hover:opacity-100">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {extraOpen ? (
                    <div className="flex gap-2">
                      <Textarea
                        autoFocus
                        placeholder="Add more context…"
                        value={extraText}
                        onChange={e => setExtraText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddExtra(); } }}
                        className="min-h-[70px] resize-none"
                      />
                      <Button onClick={handleAddExtra} disabled={!extraText.trim()} className="self-end">
                        <Send className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExtraOpen(true)}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Plus className="size-4" /> Add extra context
                    </button>
                  )}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Right — Readiness */}
        <div className="w-80 bg-white border-l p-6 overflow-auto flex flex-col">
          <div className="flex-1">
            <h2 className="font-semibold mb-4">Readiness</h2>

            <div className="space-y-3 mb-6">
              {readinessSignals.map((signal, i) => (
                <div key={i} className="flex items-center gap-3">
                  {signal.status === "complete"
                    ? <Check className="size-4 text-green-600 flex-shrink-0" />
                    : <AlertCircle className="size-4 text-slate-300 flex-shrink-0" />
                  }
                  <span className={`text-sm ${signal.status === "complete" ? "text-green-900 font-medium" : "text-slate-500"}`}>
                    {signal.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-xs text-slate-500 mb-2">{answeredCount} of {QUESTIONS.length} answered</div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {pins.length > QUESTIONS.length && (
              <div className="text-xs text-slate-400 mb-4">
                + {pins.length - QUESTIONS.length} extra context signal{pins.length - QUESTIONS.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            {canShape ? (
              <GenerateShapeButton onClick={handleShape} isPending={shape.isPending} />
            ) : (
              <div className="text-center text-sm text-slate-400 py-2">
                Answer {MIN_TO_SHAPE - answeredCount} more question{MIN_TO_SHAPE - answeredCount > 1 ? "s" : ""} to unlock
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
