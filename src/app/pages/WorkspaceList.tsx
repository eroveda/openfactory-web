import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { CommandPalette, useCommandPalette } from "../components/CommandPalette";
import { motion } from "motion/react";
import {
  Box,
  Search,
  Settings,
  LogOut,
  Loader2,
  AlertCircle,
  Trash2,
  HelpCircle,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { useAuthStore } from "../../store/authStore";
import { useWorkpacks, useShape, useDeleteWorkpack } from "../../hooks/useWorkpacks";
import { InboxBell } from "../components/InboxBell";
import { OnboardingModal, useOnboarding } from "../components/OnboardingModal";
import type { Workpack } from "../../lib/api";
import { toast } from "sonner";

function RetryButton({ workpackId }: { workpackId: string }) {
  const shape = useShape(workpackId);
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await shape.mutateAsync();
          toast.success("Pipeline restarted");
        } catch (err: any) {
          toast.error(err.message ?? "Failed to retry");
        }
      }}
      disabled={shape.isPending}
      className="text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
    >
      {shape.isPending ? "Retrying…" : "Retry"}
    </button>
  );
}

function stageLabel(w: Workpack) {
  if (w.processingStatus === "PROCESSING" || w.processingStatus === "PENDING") return "Processing…";
  if (w.processingStatus === "FAILED") return "Failed";
  switch (w.stage) {
    case "RAW":
    case "DEFINE": return "Raw / Define";
    case "SHAPE":  return "Shape";
    case "BOX":    return "Box";
    default:       return w.stage;
  }
}

function stagePath(w: Workpack) {
  switch (w.stage) {
    case "RAW":
    case "DEFINE": return `/workspace/${w.id}/define`;
    case "SHAPE":  return `/workspace/${w.id}/shape`;
    case "BOX":    return `/workspace/${w.id}/box`;
    default:       return `/workspace/${w.id}/define`;
  }
}

function stageColor(w: Workpack) {
  if (w.processingStatus === "PROCESSING" || w.processingStatus === "PENDING")
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (w.processingStatus === "FAILED") return "bg-red-50 text-red-700 border-red-200";
  switch (w.stage) {
    case "RAW":
    case "DEFINE": return "bg-amber-100 text-amber-800 border-amber-200";
    case "SHAPE":  return "bg-slate-100 text-slate-800 border-slate-200";
    case "BOX":    return "bg-blue-100 text-blue-800 border-blue-200";
    default:       return "bg-slate-100 text-slate-800";
  }
}

function userInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function WorkspaceList() {
  const navigate = useNavigate();
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { user, signOut } = useAuthStore();
  const { data: workpacks = [], isLoading, error } = useWorkpacks();
  const deleteWp = useDeleteWorkpack();
  const onboarding = useOnboarding();

  const filtered = workpacks.filter((w) =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteWp.mutateAsync(id);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    }
  };

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Box className="size-6 text-blue-600" />
            <span className="font-semibold text-lg">openFactory</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Button variant="default" className="w-full justify-start gap-2 mb-2" onClick={() => navigate("/dashboard")}>
            <Plus className="size-4" /> New workspace
          </Button>
          <Link to="/workspaces">
            <Button variant="secondary" className="w-full justify-start gap-2">
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
        </nav>
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1 -m-1">
                <Avatar className="size-10">
                  {avatarUrl && <AvatarFallback className="bg-blue-600 text-white">{userInitials(displayName)}</AvatarFallback>}
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
      <main className="ml-64 p-8">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">My workspaces</h1>
            <div className="flex items-center gap-2">
              <InboxBell />
              <button
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-sm text-slate-600"
              >
                <Search className="size-4" />
                <span>Search</span>
                <kbd className="ml-2 px-2 py-0.5 text-xs bg-slate-100 rounded border">⌘K</kbd>
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border rounded-lg p-5">
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="size-5" /> Failed to load workspaces.
            </div>
          )}

          {!isLoading && !error && workpacks.length > 3 && (
            <div className="mb-4">
              <Input
                placeholder="Filter workspaces…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              <Box className="size-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-1">No workspaces yet</p>
              <Button onClick={() => navigate("/dashboard")} className="mt-4">Start your first workspace</Button>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="grid gap-4">
              {filtered.map((w) => (
                <motion.div key={w.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Link to={stagePath(w)} className="block group">
                    <div className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg flex-1 group-hover:text-blue-600 transition-colors">
                          {w.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-3">
                          <Badge className={stageColor(w)}>
                            {w.processingStatus === "PROCESSING" || w.processingStatus === "PENDING"
                              ? <><Loader2 className="size-3 mr-1 animate-spin inline" />{stageLabel(w)}</>
                              : stageLabel(w)}
                          </Badge>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(w.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-slate-500 gap-4">
                        <span>Updated {new Date(w.updatedAt).toLocaleDateString()}</span>
                        {(w.processingStatus === "PROCESSING" || w.processingStatus === "PENDING") && (
                          <span className="text-amber-600 flex items-center gap-2">
                            <AlertCircle className="size-3" /> Stuck? <RetryButton workpackId={w.id} />
                          </span>
                        )}
                        {w.processingStatus === "FAILED" && (
                          <span className="text-red-500 flex items-center gap-2">
                            <AlertCircle className="size-3" /> {w.failureReason ?? "Processing failed"}
                            <RetryButton workpackId={w.id} />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <OnboardingModal open={onboarding.open} onClose={onboarding.hide} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete workspace</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            This will permanently delete the workspace and all its boxes, brief, and plan. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleteWp.isPending}
            >
              {deleteWp.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
