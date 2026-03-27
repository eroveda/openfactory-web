import { useState } from "react";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { useWorkpack, useBoxes, usePlan, useShape, useUpdateBox } from "../../hooks/useWorkpacks";
import { InboxBell } from "../components/InboxBell";
import type { Box } from "../../lib/api";
import { toast } from "sonner";

export function WorkspaceShape() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: workpack } = useWorkpack(id!);
  const { data: boxes = [], isLoading: loadingBoxes } = useBoxes(id!);
  const { data: plan } = usePlan(id!);
  const shape = useShape(id!);
  const updateBox = useUpdateBox(id!);

  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [reshapeDialogOpen, setReshapeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isProcessing = workpack?.processingStatus === "PROCESSING" || workpack?.processingStatus === "PENDING";
  const activeBox = selectedBox ?? boxes[0] ?? null;

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
  const isReady = boxes.length > 0 && !isProcessing;

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
                <span className="font-semibold">{workpack?.title ?? "Workspace"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3 text-green-600" /> Raw / Define
              </Badge>
              <Badge variant="outline" className="gap-1 bg-slate-100">
                <div className="size-2 rounded-full bg-slate-600" /> Shape
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-gray-300" /> Box
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <InboxBell />
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="size-4" /> Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Processing banner */}
      {isProcessing && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 text-amber-800 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Pipeline running — boxes will appear once complete…
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column - Work Map */}
        <div className="w-80 bg-white border-r p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Work Map</h2>
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
              <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                <Loader2 className="size-4 animate-spin" /> Loading boxes…
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
              <h3 className="text-sm font-semibold mb-3">Execution Plan</h3>
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
            <div className="h-full flex items-center justify-center text-slate-500">
              {isProcessing
                ? <div className="text-center"><Loader2 className="size-12 mx-auto mb-3 animate-spin opacity-30" /><p>Generating boxes…</p></div>
                : <p>Select a box to see details</p>
              }
            </div>
          )}
        </div>

        {/* Right Column - Readiness */}
        <div className="w-80 bg-white border-l p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="font-semibold mb-4">Readiness</h2>

            <div className="space-y-3 mb-6">
              {[
                { label: "Boxes generated", status: boxes.length > 0 ? "complete" : "incomplete" },
                { label: "All boxes ready", status: readyCount === boxes.length && boxes.length > 0 ? "complete" : "incomplete" },
                { label: "Plan available",  status: plan ? "complete" : "incomplete" },
              ].map((signal, i) => (
                <div key={i} className="flex items-start gap-3">
                  {signal.status === "complete"
                    ? <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                    : <div className="size-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                  }
                  <p className={`text-sm font-medium ${signal.status === "complete" ? "text-green-900" : "text-slate-600"}`}>
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
