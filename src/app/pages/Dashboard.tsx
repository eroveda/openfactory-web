import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { motion } from "motion/react";
import {
  Box,
  Settings,
  LogOut,
  HelpCircle,
  Plus,
  Send,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useAuthStore } from "../../store/authStore";
import { useWorkpacks, useIngest, useDeleteWorkpack } from "../../hooks/useWorkpacks";
import { OnboardingModal, useOnboarding } from "../components/OnboardingModal";
import { InboxBell } from "../components/InboxBell";
import type { Workpack } from "../../lib/api";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

function stagePath(w: Workpack) {
  switch (w.stage) {
    case "RAW":
    case "DEFINE": return `/workspace/${w.id}/define`;
    case "SHAPE":  return `/workspace/${w.id}/shape`;
    case "BOX":    return `/workspace/${w.id}/box`;
    default:       return `/workspace/${w.id}/define`;
  }
}

function userInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function autoTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 60) return trimmed;
  const cut = trimmed.slice(0, 60);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + "…";
}

export function Dashboard() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user, signOut } = useAuthStore();
  const { data: workpacks = [] } = useWorkpacks();
  const ingest = useIngest();
  const deleteWorkpack = useDeleteWorkpack();
  const onboarding = useOnboarding();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const recent = workpacks.slice(0, 10);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteWorkpack.mutateAsync(id);
    } catch {
      toast.error("Failed to delete workspace");
    }
  };

  const handleStart = async () => {
    const msg = input.trim();
    if (!msg || ingest.isPending) return;
    try {
      const w = await ingest.mutateAsync({ title: autoTitle(msg), content: msg });
      navigate(`/workspace/${w.id}/define`, { state: { initialMessage: msg } });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create workspace");
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Box className="size-6 text-blue-600" />
            <span className="font-semibold text-lg">openFactory</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link to="/dashboard">
            <Button variant="default" className="w-full justify-start gap-2 mb-2">
              <Plus className="size-4" /> New workspace
            </Button>
          </Link>
          <Link to="/workspaces">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Box className="size-4" /> My workspaces
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="size-4" /> Profile
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2 text-slate-500" onClick={onboarding.show}>
            <HelpCircle className="size-4" /> How it works
          </Button>

          {recent.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-2 mb-2">Recent</p>
              <div className="space-y-0.5">
                {recent.map((w) => (
                  <Link key={w.id} to={stagePath(w)}>
                    <div className="group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                      <span className="flex-1 text-sm text-slate-700 truncate">{w.title}</span>
                      <button
                        onClick={(e) => handleDelete(e, w.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </Link>
                ))}
                {workpacks.length > 10 && (
                  <Link to="/workspaces">
                    <div className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                      View all ({workpacks.length}) →
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1 -m-1">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {userInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <Settings className="size-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="size-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 flex flex-col items-center justify-center min-h-screen px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                Hey, {(user?.user_metadata?.full_name ?? user?.email ?? "").split(" ")[0] || "there"} 👋
              </h1>
              <p className="text-slate-500 mt-1">What do you want to build today?</p>
            </div>
            <InboxBell />
          </div>

          {/* Chat input */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleStart();
                }
              }}
              placeholder="Describe your idea freely — we'll refine it together…"
              className="w-full px-5 pt-4 pb-2 text-sm text-slate-800 placeholder:text-slate-400 resize-none outline-none min-h-[80px]"
              rows={3}
              disabled={ingest.isPending}
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <p className="text-xs text-slate-400">Enter to start · Shift+Enter for new line</p>
              <Button
                onClick={handleStart}
                disabled={!input.trim() || ingest.isPending}
                size="sm"
                className="gap-1.5"
              >
                {ingest.isPending ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Creando…</>
                ) : (
                  <><Send className="size-3.5" /> Empezar</>
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            A workspace is created and we start refining the idea together.
          </p>
        </motion.div>
      </main>

      <OnboardingModal open={onboarding.open} onClose={onboarding.hide} />
    </div>
  );
}
