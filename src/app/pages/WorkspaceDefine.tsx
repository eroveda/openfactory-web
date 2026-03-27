import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { PinCard } from "../components/PinCard";
import { motion, AnimatePresence } from "motion/react";
import {
  Box,
  Plus,
  FileText,
  Users,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { useWorkpack, usePins, useCreatePin, useDeletePin, useBrief, useMembers, useInviteMember, useShape } from "../../hooks/useWorkpacks";
import { InboxBell } from "../components/InboxBell";
import { toast } from "sonner";

const COLORS = ["yellow", "green", "blue", "purple"] as const;
type PinColor = typeof COLORS[number];

const COLOR_CLASSES: Record<PinColor, string> = {
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-900",
  green:  "bg-green-100 border-green-300 text-green-900",
  blue:   "bg-blue-100 border-blue-300 text-blue-900",
  purple: "bg-purple-100 border-purple-300 text-purple-900",
};

export function WorkspaceDefine() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: workpack } = useWorkpack(id!);
  const { data: pins = [] } = usePins(id!);
  const { data: brief } = useBrief(id!);
  const createPin = useCreatePin(id!);
  const deletePin = useDeletePin(id!);
  const { data: members = [] } = useMembers(id!);
  const inviteMember = useInviteMember(id!);
  const shape = useShape(id!);

  const [newPinText, setNewPinText] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const isProcessing = workpack?.processingStatus === "PROCESSING" || workpack?.processingStatus === "PENDING";

  const addPin = async () => {
    if (!newPinText.trim()) return;
    try {
      await createPin.mutateAsync({ content: newPinText });
      setNewPinText("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add pin");
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

  const removePin = async (pinId: string) => {
    try {
      await deletePin.mutateAsync(pinId);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to remove pin");
    }
  };

  const readinessSignals = [
    { label: "Main intent",      status: pins.length >= 1 ? "complete" : "incomplete" },
    { label: "Actor defined",    status: pins.length >= 2 ? "complete" : "incomplete" },
    { label: "Out of scope",     status: pins.length >= 3 ? "complete" : "incomplete" },
    { label: "Constraints",      status: pins.length >= 4 ? "complete" : "incomplete" },
    { label: "Success criteria", status: pins.length >= 5 ? "complete" : "incomplete" },
  ];

  const completeCount = readinessSignals.filter(s => s.status === "complete").length;
  const isReady = completeCount >= 3 && !isProcessing;

  return (
    <DndProvider backend={HTML5Backend}>
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

        {/* Processing banner — solo visible si el usuario ya disparó el pipeline desde esta página */}
        {shape.isPending && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 text-amber-800 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Generating shape — this may take a moment…
          </div>
        )}

        {/* Main Content */}
        <div className="flex h-[calc(100vh-73px)]">
          {/* Left Column - Pin Board */}
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-4xl">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold mb-2">Raw / Define</h1>
                <p className="text-slate-600">Pin your ideas to the board — anything goes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <AnimatePresence>
                  {pins.map((pin, i) => (
                    <PinCard
                      key={pin.id}
                      id={pin.id}
                      text={pin.content}
                      type={`#${String(i + 1).padStart(2, "0")}`}
                      color={COLORS[i % COLORS.length]}
                      author={pin.author?.name?.slice(0, 2).toUpperCase() ?? "?"}
                      onRemove={removePin}
                    />
                  ))}
                </AnimatePresence>

                <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 flex items-center justify-center min-h-[160px]">
                  <button
                    onClick={() => document.getElementById("new-pin-input")?.focus()}
                    className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600"
                  >
                    <Plus className="size-8" />
                    <span className="text-sm">Add another...</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4 mb-4">
                <Textarea
                  id="new-pin-input"
                  placeholder="Type your idea here..."
                  value={newPinText}
                  onChange={(e) => setNewPinText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) addPin(); }}
                  className="mb-3 min-h-[80px]"
                />
                <Button onClick={addPin} disabled={createPin.isPending} className="w-full">
                  {createPin.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Add Pin
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="ml-auto text-slate-500">{pins.length} ideas pinned</div>
              </div>
            </div>
          </div>

          {/* Right Column - Live Brief */}
          <div className="w-96 bg-white border-l p-6 overflow-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-600">LIVE BRIEF</span>
                {shape.isPending && <span className="text-xs text-slate-500">· generating…</span>}
              </div>

              {shape.isPending ? (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 className="size-12 mx-auto mb-3 opacity-30 animate-spin" />
                  <p className="text-sm">Generating shape…</p>
                </div>
              ) : brief ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Main Idea</h3>
                    <p className="text-lg font-semibold leading-snug">{brief.mainIdea}</p>
                    <p className="text-sm text-slate-500 mt-2">{pins.length} signals · live</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Objective</h3>
                    <p className="text-sm text-slate-700">{brief.objective}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Readiness</h3>
                    <div className="space-y-2">
                      {readinessSignals.map((signal, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {signal.status === "complete"
                            ? <Check className="size-4 text-green-600" />
                            : <AlertCircle className="size-4 text-slate-300" />
                          }
                          <span className={signal.status === "complete" ? "text-green-900" : "text-slate-500"}>
                            {signal.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={async () => {
                      try {
                        await shape.mutateAsync();
                        navigate(`/workspace/${id}/shape`);
                      } catch (e: any) {
                        toast.error(e.message ?? "Failed to generate shape");
                      }
                    }}
                    disabled={shape.isPending}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {shape.isPending
                      ? <><Loader2 className="size-4 animate-spin" /> Generating…</>
                      : <>Generate Shape <ArrowRight className="size-4" /></>
                    }
                  </Button>
                </>
              ) : pins.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="size-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Start adding pins to see the live brief</p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">Brief not yet generated. Create the workpack to run the pipeline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
